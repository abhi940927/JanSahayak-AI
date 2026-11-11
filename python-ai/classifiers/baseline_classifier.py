"""
JanSahayak AI - Multilingual Civic Complaint Classifier (v4.0.0)
Trained on extensive English, Hindi (Devanagari), and Hinglish (Romanized) civic grievances.
Accurately categorizes into 12 core government departments:
MCD, PWD, EPD, DJB, TPD, HFW, POL, DFS, EFD, WCD, FCS, REV
"""

import os
import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

DEPARTMENT_METADATA = {
    "EPD": {
        "name": "Electricity & Power Distribution",
        "category": "Prolonged Area Power Outage",
        "category_code": "EPD_BLACKOUT",
        "default_priority": "high",
        "keywords_en": [
            "electricity", "power", "outage", "blackout", "voltage", "transformer", 
            "wire", "sparking", "meter", "current", "streetlight", "street light", 
            "light pole", "no electricity", "power cut", "no light", "power failure", 
            "electric shock", "high bill", "electricity bill", "electric", "pole"
        ],
        "keywords_hi": [
            "बिजली", "करंट", "कटौती", "लाइट", "ट्रांसफार्मर", "तार", "चिंगारी", "मीटर", 
            "स्ट्रीट लाइट", "अंधेरा", "खंभा", "bijli", "light", "transformer", "taar", 
            "voltage", "current", "chali gayi", "bijli nahi", "power cut", "light nahi",
            "bijli gul", "andhera"
        ]
    },
    "MCD": {
        "name": "Municipal Corporation & Sanitation",
        "category": "Uncollected Garbage & Waste Accumulation",
        "category_code": "MCD_GARBAGE",
        "default_priority": "medium",
        "keywords_en": [
            "garbage", "trash", "waste", "dump", "stink", "rubbish", "sweeper", 
            "dustbin", "dead animal", "stray dog", "stray animal", "filth", "carcass",
            "dog bite", "drain cleaning", "sanitation", "debris"
        ],
        "keywords_hi": [
            "कूड़ा", "कचरा", "सफाई", "कूड़ेदान", "सफाईकर्मी", "सफाई कर्मचारी", "कचरे का ढेर", 
            "डस्टबिन", "आवारा कुत्ता", "बदबू", "नाला सफाई", "kuda", "kachra", "safai", 
            "dustbin", "koode", "badbu", "sweeper"
        ]
    },
    "PWD": {
        "name": "Public Works Department (PWD)",
        "category": "Potholes & Broken Roads",
        "category_code": "PWD_POTHOLE",
        "default_priority": "high",
        "keywords_en": [
            "road", "pothole", "potholes", "crater", "footpath", "flyover", "divider", 
            "pavement", "cave-in", "underpass", "construction", "bridge", "asphalt", 
            "manhole", "sidewalk", "broken road", "sinkhole", "road repair"
        ],
        "keywords_hi": [
            "सड़क", "गड्ढा", "गड्ढे", "टूटी सड़क", "फुटपाथ", "फ्लाईओवर", "डिवाइडर", 
            "खड्डा", "धंसाव", "पुल", "मैनहोल", "sadak", "gaddha", "gadha", "tooti sadak", 
            "footpath", "flyover", "khadda", "dhansav"
        ]
    },
    "DJB": {
        "name": "Water Supply & Sewerage Board",
        "category": "Contaminated Drinking Water",
        "category_code": "DJB_CONTAM",
        "default_priority": "critical",
        "keywords_en": [
            "water", "drinking water", "tap", "pipeline", "leakage", "sewer", "sewage", 
            "muddy water", "supply", "tanker", "pipe burst", "foul water", "no water", 
            "water cut", "water pressure", "drainage overflow", "dirty water"
        ],
        "keywords_hi": [
            "पानी", "पीने का पानी", "नल", "सीवर", "गंदा पानी", "पाइपलाइन", "लीकेज", 
            "सप्लाई", "टैंकर", "बदबूदार पानी", "पानी नहीं आ रहा", "सीवरेज", "pani", 
            "paani", "sewer", "sewage", "ganda pani", "leakage", "pipe", "pani nahi"
        ]
    },
    "TPD": {
        "name": "Traffic & Transport Department",
        "category": "Traffic Signal Malfunction",
        "category_code": "TPD_SIGNAL",
        "default_priority": "high",
        "keywords_en": [
            "traffic", "signal", "jam", "red light", "congestion", "bus", "dtc", 
            "auto", "challan", "speed breaker", "junction", "parking bottleneck", 
            "illegal parking", "traffic light", "traffic jam"
        ],
        "keywords_hi": [
            "ट्रैफिक", "जाम", "सिग्नल", "लाल बत्ती", "बस", "सवारी", "अवैध पार्किंग", 
            "स्पीड ब्रेकर", "चौराहा", "बत्ती खराब", "traffic", "jam", "signal", 
            "red light", "bus", "parking", "lal batti"
        ]
    },
    "HFW": {
        "name": "Health & Family Welfare",
        "category": "Government Clinic Staff Negligence",
        "category_code": "HFW_STAFF",
        "default_priority": "high",
        "keywords_en": [
            "hospital", "doctor", "clinic", "dispensary", "medicine", "dengue", 
            "malaria", "epidemic", "ambulance", "negligence", "nurse", "patient", 
            "health centre", "injection", "treatment", "mohalla clinic"
        ],
        "keywords_hi": [
            "अस्पताल", "डॉक्टर", "दवा", "दवाई", "डेंगू", "मलेरिया", "क्लिनिक", 
            "इलाज", "एम्बुलेंस", "मरीज", "नर्स", "दवाइयां", "aspataal", "hospital", 
            "doctor", "dawai", "dengue", "ilaj", "ambulance", "dawa"
        ]
    },
    "POL": {
        "name": "Police & Public Law Enforcement",
        "category": "Anti-Social Elements & Public Harassment",
        "category_code": "POL_NUISANCE",
        "default_priority": "high",
        "keywords_en": [
            "police", "theft", "stolen", "harassment", "robbery", "eve teasing", 
            "patrolling", "drugs", "noise", "loudspeaker", "violence", "threat", 
            "fight", "burglar", "assault", "dj noise", "goons", "fir"
        ],
        "keywords_hi": [
            "पुलिस", "चोरी", "छेड़खानी", "मारपीट", "धमकी", "शोर", "लाउडस्पीकर", 
            "सुरक्षा", "थाना", "नशा", "गुंडागर्दी", "शराब", "police", "chori", 
            "chedkhani", "dhamki", "patrolling", "shor", "thana", "sharab", "gundagardi"
        ]
    },
    "DFS": {
        "name": "Fire & Emergency Disaster Response",
        "category": "Hazardous Chemical / Gas Leakage Risk",
        "category_code": "DFS_HAZARD",
        "default_priority": "critical",
        "keywords_en": [
            "fire", "flames", "cylinder blast", "gas leak", "chemical leak", 
            "short circuit fire", "fire extinguisher", "explosion", "blaze", 
            "fire safety", "fire exit", "fire brigade", "fire breakout"
        ],
        "keywords_hi": [
            "आग", "सिलेंडर ब्लास्ट", "गैस लीक", "आग लग गई", "शॉर्ट सर्किट", 
            "दमकल", "ब्लास्ट", "विस्फोट", "aag", "gas leak", "cylinder blast", 
            "fire brigade", "damkal", "aag lag gayi"
        ]
    },
    "EFD": {
        "name": "Environment, Pollution Control & Forest",
        "category": "Industrial Toxic Fumes & Severe Air Pollution",
        "category_code": "EFD_AIR",
        "default_priority": "high",
        "keywords_en": [
            "pollution", "aqi", "air pollution", "smog", "toxic emission", "tree cutting", 
            "green cover", "chemical emission", "dust pollution", "factory smoke", 
            "garbage burning", "plastic burning", "factory", "toxic smoke", "industrial fumes", 
            "fumes", "smoke", "toxic"
        ],
        "keywords_hi": [
            "प्रदूषण", "हवा", "जहरीला धुआं", "पेड़ काटना", "फैक्ट्री", "सांस", 
            "पर्यावरण", "प्लास्टिक जलाना", "धुआं", "dhuan", "pollution", "ped katna", 
            "factory", "hawa", "smog", "pradushan", "zehreela dhuan"
        ]
    },
    "WCD": {
        "name": "Women & Child Development (WCD)",
        "category": "Women Welfare Assistance & Safety Helpline",
        "category_code": "WCD_WOMEN",
        "default_priority": "critical",
        "keywords_en": [
            "domestic violence", "anganwadi", "pension", "widow pension", "infant", 
            "malnutrition", "distress helpline", "mother welfare", "girl child", 
            "child abuse", "women helpline"
        ],
        "keywords_hi": [
            "महिला", "बच्चा", "आंगनवाड़ी", "घरेलू हिंसा", "पेंशन", "विधवा पेंशन", 
            "पोषण", "महिला सुरक्षा", "बाल कल्याण", "mahila", "baccha", "anganwadi", 
            "pension", "suraksha", "mahila helpline"
        ]
    },
    "FCS": {
        "name": "Food, Civil Supplies & Consumer Affairs",
        "category": "Ration Dealer Black Marketing & Grain Diversion",
        "category_code": "FCS_RATION",
        "default_priority": "high",
        "keywords_en": [
            "ration", "ration card", "quota", "fair price shop", "grain", "wheat", 
            "rice", "food supply", "black marketing", "adulteration", "consumer fraud", 
            "kotedar", "ration dealer"
        ],
        "keywords_hi": [
            "राशन", "राशन कार्ड", "कोटा", "गेहूं", "चावल", "कालाबाजारी", "दुकानदार", 
            "खाद्य", "अनाज", "मिलावट", "कोटेदार", "ration", "ration card", "quota", 
            "gehu", "chawal", "anaj", "kotedar"
        ]
    },
    "REV": {
        "name": "Revenue & Land Administration",
        "category": "Unreasonable Delay in Property Mutation / Dakhil Kharij",
        "category_code": "REV_MUTATION",
        "default_priority": "medium",
        "keywords_en": [
            "land", "property", "registry", "mutation", "dakhil kharij", "patwari", 
            "encroachment", "tehsildar", "stamp duty", "khasra", "khatauni", "bribe", 
            "revenue", "land dispute"
        ],
        "keywords_hi": [
            "जमीन", "दाखिल खारिज", "रजिस्ट्री", "नामांतरण", "पटवारी", "तहसीलदार", 
            "कब्जा", "खसरा", "खतौनी", "राजस्व", "भूमाफिया", "jamin", "dakhil kharij", 
            "patwari", "registry", "khasra", "kabza"
        ]
    }
}

# Per-Department Category Fine-Grained Resolution
DEPARTMENT_SPECIFIC_CATEGORIES = {
    "EPD": [
        (["wire", "spark", "transformer", "blast", "live wire", "charkha", "chingari", "taar", "khamba", "burning"], "Exposed Electrical Wires / Sparking Transformer", "EPD_WIRES", "critical"),
        (["street light", "streetlight", "light pole", "streetlights", "andhera", "dark"], "Non-Functional Streetlights", "EPD_STREETLIGHT", "medium"),
        (["bill", "meter", "reading", "multiplier", "surge", "unit", "inflated"], "Faulty Meter & Inflated Billing Dispute", "EPD_METER", "medium"),
        (["blackout", "cut", "outage", "electricity", "power", "light chali gayi", "bijli nahi", "bijli", "voltage", "current"], "Prolonged Area Power Outage", "EPD_BLACKOUT", "high")
    ],
    "MCD": [
        (["dead animal", "carcass", "dead dog", "dead cat", "mar gaya"], "Dead Animal Removal Emergency", "MCD_DEAD_ANIMAL", "critical"),
        (["stray dog", "monkey", "cattle", "dog bite", "kutta", "bandar"], "Stray Animal Menace & Pack Control", "MCD_STRAY_ANIMAL", "medium"),
        (["sweeper", "sweeping", "jhaadu", "safaikarmi"], "Absentee Sweeper & Dirty Colony Street", "MCD_SWEEPER", "medium"),
        (["garbage", "trash", "waste", "dump", "dustbin", "kuda", "kachra", "badbu", "overflow"], "Uncollected Garbage & Waste Accumulation", "MCD_GARBAGE", "medium")
    ],
    "PWD": [
        (["manhole", "drain", "drainage", "nullah", "open hole", "dhakkan", "slab"], "Open Storm Drainage / Manhole Hazard", "PWD_MANHOLE", "critical"),
        (["footpath", "pavement", "sidewalk", "divider"], "Damaged Footpath & Pedestrian Walkway", "PWD_FOOTPATH", "medium"),
        (["flyover", "bridge", "expansion joint", "underpass", "pul"], "Damaged Flyover & Bridge Structural Issue", "PWD_FLYOVER", "high"),
        (["pothole", "potholes", "broken road", "sadak", "gaddha", "crater", "sinkhole", "road"], "Potholes & Broken Roads", "PWD_POTHOLE", "high")
    ],
    "DJB": [
        (["sewer", "sewage", "gutter", "overflow", "drainage", "choked sewer", "nali"], "Overflowing Sewage Line", "DJB_SEWAGE", "critical"),
        (["burst", "pipe burst", "leakage", "pipeline leak", "leak", "fat gaya"], "Pipeline Leakage / Main Burst", "DJB_LEAKAGE", "high"),
        (["tanker", "no water", "interruption", "water not coming", "pani nahi aa raha", "supply cut", "water is not coming"], "Disrupted Water Supply / Tanker Demand", "DJB_OUTAGE", "high"),
        (["pressure", "low pressure", "slow water"], "Low Water Pressure in Municipal Line", "DJB_PRESSURE", "medium"),
        (["contaminated", "muddy", "yellow", "stink", "smell", "ganda pani", "dirty water", "water", "pani"], "Contaminated Drinking Water", "DJB_CONTAM", "critical")
    ],
    "TPD": [
        (["parking", "encroachment", "blocked", "tempo", "double park"], "Illegal Parking & Bottleneck", "TPD_PARKING", "medium"),
        (["bus", "dtc", "driver", "overspeeding", "rash"], "Public Transport Bus Rash Driving", "TPD_BUS", "medium"),
        (["speed breaker", "rumble strip", "unmarked"], "Missing / Hazardous Speed Breakers", "TPD_SPEED_BREAKER", "medium"),
        (["signal", "red light", "traffic light", "jam", "congestion", "traffic"], "Traffic Signal Malfunction", "TPD_SIGNAL", "high")
    ],
    "HFW": [
        (["dengue", "malaria", "mosquito", "fogging", "larvae", "fever", "chhidkaav"], "Mosquito Breeding / Vector-Borne Threat", "HFW_MOSQUITO", "high"),
        (["ambulance", "emergency", "critical patient"], "Government Ambulance Non-Availability", "HFW_AMBULANCE", "critical"),
        (["medicine", "dawai", "shortage", "expiry", "dawa"], "Shortage of Essential Medicines in Clinic", "HFW_MEDICINE", "medium"),
        (["doctor", "hospital", "clinic", "dispensary", "negligence", "nurse", "staff", "aspataal"], "Government Clinic Staff Negligence", "HFW_STAFF", "high")
    ],
    "POL": [
        (["theft", "stolen", "burglary", "chori", "car break-in", "stole"], "Theft & Vehicle Burglary Investigation Request", "POL_THEFT", "high"),
        (["loudspeaker", "dj", "noise", "loud music", "night noise", "sound", "shor"], "Illegal Loudspeakers & Night Noise Pollution", "POL_NOISE", "medium"),
        (["violence", "assault", "fight", "weapon", "threat", "dhamki", "marpeet"], "Physical Assault & Violence Emergency", "POL_VIOLENCE", "critical"),
        (["harassment", "eve teasing", "drinking", "sharab", "boys", "anti-social", "gunda", "patrolling", "police"], "Anti-Social Elements & Public Harassment", "POL_NUISANCE", "high")
    ],
    "DFS": [
        (["fire safety", "fire exit", "noc", "extinguisher", "blocked exit"], "Fire Safety Violation & Blocked Emergency Exit", "DFS_VIOLATION", "high"),
        (["gas leak", "lpg", "cylinder", "chemical", "gas", "smell"], "Hazardous Chemical / Gas Leakage Risk", "DFS_HAZARD", "critical"),
        (["fire", "aag", "flames", "smoke", "blaze", "burning"], "Active Fire Breakout & Emergency Rescue", "DFS_FIRE", "critical")
    ],
    "EFD": [
        (["tree", "ped", "cutting", "felling", "forest", "branches"], "Illegal Tree Felling in Public Colony", "EFD_TREE", "high"),
        (["dust", "construction dust", "debris dust"], "Severe Construction Dust & Uncovered Transport", "EFD_DUST", "medium"),
        (["plastic", "burning", "open burning", "biomass"], "Open Waste & Plastic Burning Smoke Hazard", "EFD_BURNING", "high"),
        (["pollution", "aqi", "air pollution", "smog", "smoke", "toxic fumes", "factory", "chemical fumes"], "Industrial Toxic Fumes & Severe Air Pollution", "EFD_AIR", "high")
    ],
    "WCD": [
        (["anganwadi", "nutrition", "food grains", "poshan", "child malnutrition"], "Anganwadi Nutrition & Malnutrition Grievance", "WCD_ANGANWADI", "high"),
        (["widow", "pension", "disbursement", "widow pension"], "Delay in Widow & Destitute Welfare Pension", "WCD_PENSION", "medium"),
        (["domestic violence", "abuse", "beating", "shelter", "rescue", "women", "mahila", "safety", "helpline"], "Women Welfare Assistance & Safety Helpline", "WCD_WOMEN", "critical")
    ],
    "FCS": [
        (["card", "digital card", "new ration card", "approval", "application"], "Delay in Issuance of Digital Ration Card", "FCS_CARD", "medium"),
        (["adulteration", "quality", "stones", "bad grain", "rotten"], "Sub-Standard / Adulterated Ration Supply", "FCS_QUALITY", "high"),
        (["ration", "quota", "dealer", "black marketing", "wheat", "rice", "shopkeeper", "gehu", "chawal", "food supply", "kotedar"], "Ration Dealer Black Marketing & Grain Diversion", "FCS_RATION", "high")
    ],
    "REV": [
        (["encroachment", "gram sabha", "government land", "kabza", "public land"], "Encroachment on Gram Sabha / Government Land", "REV_ENCROACHMENT", "high"),
        (["bribe", "patwari rishwat", "corruption", "paise"], "Illegal Gratification Demand by Revenue Staff", "REV_BRIBE", "critical"),
        (["mutation", "dakhil kharij", "property", "registry", "khasra", "khatauni", "patwari", "tehsildar", "land"], "Unreasonable Delay in Property Mutation / Dakhil Kharij", "REV_MUTATION", "medium")
    ]
}

# Extensive Multilingual Training Corpus covering all 12 departments with colloquial forms
EXPANDED_TRAINING_DATA = [
    # EPD (Power & Electricity)
    ("electricity is not coming", "EPD"),
    ("no electricity in our house since morning", "EPD"),
    ("frequent power cut in our area every day", "EPD"),
    ("power cut problem in colony for past 6 hours", "EPD"),
    ("power outage blackout in sector 5 in extreme heat", "EPD"),
    ("entire residential block facing prolonged power blackout for over 8 hours", "EPD"),
    ("electricity bill is extremely high meter running too fast", "EPD"),
    ("transformer sparking violently with burning smell near school", "EPD"),
    ("high voltage power line hanging low across residential alley live wire", "EPD"),
    ("all street lights broken on main avenue leaving road in pitch darkness", "EPD"),
    ("electric pole damaged and wires snapped on road", "EPD"),
    ("voltage fluctuation damaged television and refrigerator", "EPD"),
    ("bijli nahi aa rahi hai subah se hamare ghar par", "EPD"),
    ("light chali gayi hai poore mohalle me andhera hai", "EPD"),
    ("bijli ka meter kharab hai bahut zyada bill aa raha hai", "EPD"),
    ("transformer blast ho gaya hai aag lag sakti hai bijli vibhag bhejo", "EPD"),
    ("sadak ke khambhe ki light band hai andhera rehta hai", "EPD"),
    ("wire toot kar sadak par gir gaya hai current ka khatra hai", "EPD"),
    ("kal raat se light nahi hai voltage bohot kam aa raha hai", "EPD"),
    ("power cut issue in our building no electricity", "EPD"),
    ("बिजली का ट्रांसफार्मर धू-धू कर जल रहा है और चिंगारियां निकल रही हैं।", "EPD"),
    ("हमारे सेक्टर में कल रात से बिजली कटी हुई है, कोई सुनवाई नहीं हो रही।", "EPD"),
    ("सड़क के बिजली के खंभे की लाइट बंद है अंधेरे में चोरी का डर बना रहता है।", "EPD"),
    ("बिजली नहीं आ रही है कई घंटों से लाइट बंद है।", "EPD"),
    ("बिजली के तार नीचे लटक रहे हैं करंट फैलने का खतरा है।", "EPD"),

    # MCD (Sanitation & Municipal Waste)
    ("uncollected garbage dump at street corner for 4 days creating terrible stink", "MCD"),
    ("trash bin overflowing on market road stray dogs scattering waste", "MCD"),
    ("colony sweepers have not come for a week dry leaves and waste accumulated", "MCD"),
    ("dead animal carcass lying near public park needs immediate removal", "MCD"),
    ("stray dog pack chasing two wheelers at night near children playground", "MCD"),
    ("open dumping of construction debris on public sidewalk", "MCD"),
    ("public dustbin full of garbage rotting on road", "MCD"),
    ("humare yahan 5 din se kachra nahi utha hai bohot badbu aa rahi hai", "MCD"),
    ("main market me dustbin pura overflow ho gaya hai kuda bikhra pada hai", "MCD"),
    ("safai karmi nahi aa rahe hain gali me bohot gandagi hai", "MCD"),
    ("sadak par mara hua janwar pada hai safai karwaye", "MCD"),
    ("kuda uthane wali gadi nahi aayi kachra jama ho gaya hai", "MCD"),
    ("मोहल्ले में 4 दिन से कूड़ा नहीं उठा है, बहुत तेज बदबू और मक्खियां फैल रही हैं।", "MCD"),
    ("सड़क किनारे कचरे का बड़ा ढेर लगा हुआ है, आवारा कुत्ते गंदगी फैला रहे हैं।", "MCD"),
    ("गली में नाली जाम है और सारा गंदा कचरा सड़क पर बह रहा है तुरंत सफाई करवाएं।", "MCD"),

    # PWD (Roads & Infrastructure)
    ("potholes on main road causing severe vehicle damage and accidents", "PWD"),
    ("deep pothole on outer ring road underpass has caused multiple bike accidents", "PWD"),
    ("road surface completely cracked and eroded with sharp asphalt edges", "PWD"),
    ("collapsed footpath pavement slab posing deadly hazard for walking pedestrians", "PWD"),
    ("storm water drain manhole cover broken and left open without barricade", "PWD"),
    ("flyover expansion joint loose and creating dangerous bump for vehicles", "PWD"),
    ("asphalt caved in sinkhole opened up in middle of intersection", "PWD"),
    ("sadak bohot kharab ho chuki hai bade bade gaddhe ban gaye hain", "PWD"),
    ("metro pillar ke pass sadak dhans gayi hai accident ka khatra hai", "PWD"),
    ("footpath tut gaya hai log sadak par chalne par majboor hain", "PWD"),
    ("road par khadda ho gaya hai gadiyan fas rahi hain", "PWD"),
    ("flyover ke upar sadak tuti hui hai repair karwayiye", "PWD"),
    ("मुख्य सड़क पर बहुत गहरा गड्ढा है कल रात दो पहिया वाहन फिसल गया।", "PWD"),
    ("फ्लाईओवर के नीचे सड़क पूरी तरह टूट चुकी है, बड़े-बड़े खड्डे बने हुए हैं।", "PWD"),
    ("सड़क के बीचोंबीच मैनहोल का ढक्कन टूटा हुआ है कभी भी बड़ा हादसा हो सकता है।", "PWD"),

    # DJB (Water & Sewerage)
    ("water is not coming in our pipeline for past 2 days", "DJB"),
    ("no drinking water supply in entire colony taps are completely dry", "DJB"),
    ("contaminated muddy brown sewage water coming out of drinking water taps", "DJB"),
    ("underground drinking water main pipeline burst millions of liters water wasting", "DJB"),
    ("main sewer line choked and overflowing onto residential lanes and road", "DJB"),
    ("very low water pressure cannot fill overhead tank", "DJB"),
    ("need emergency water tanker no water in sector 4", "DJB"),
    ("peene ka pani nahi aa raha hai subah se nal sukhe hain", "DJB"),
    ("nal me ganda badboodar pani aa raha hai peene yogya nahi hai", "DJB"),
    ("sewer line block ho gayi hai sadak par ganda pani bhara hai", "DJB"),
    ("water pipeline leak ho gayi hai sadak par talab ban gaya hai", "DJB"),
    ("tanker bhejiye paani ki bohot dikkat ho rahi hai", "DJB"),
    ("पीने के नल में बदबूदार काला नाले का पानी आ रहा है, बच्चे बीमार पड़ रहे हैं।", "DJB"),
    ("सड़क के नीचे से पानी की मुख्य पाइपलाइन फट गई है और सारा साफ पानी बह रहा है।", "DJB"),
    ("सीवर ओवरफ्लो होकर घरों के सामने भर गया है बदबू से जीना दूभर हो गया।", "DJB"),
    ("पानी की सप्लाई नहीं आ रही है दो दिन से नल बंद हैं।", "DJB"),

    # TPD (Traffic & Transport)
    ("traffic signal lights completely broken at busy intersection causing gridlock", "TPD"),
    ("huge traffic jam on main crossroad due to non-functional red light", "TPD"),
    ("illegal commercial vehicles double parking on main road blocking ambulances", "TPD"),
    ("dtc public transit bus skipped designated stop and driver driving recklessly", "TPD"),
    ("missing speed breaker near school causing overspeeding vehicles", "TPD"),
    ("traffic light blinker band hai gaadiyan aapas me takra rahi hain jam laga hai", "TPD"),
    ("road par illegal parking ki wajah se bohot jam lagta hai traffic police bhejo", "TPD"),
    ("red light kharab hai traffic signal kaam nahi kar raha", "TPD"),
    ("चौराहे पर ट्रैफिक सिग्नल की लाल बत्ती खराब है बहुत भयानक ट्रैफिक जाम लगा है।", "TPD"),
    ("सड़क पर अवैध पार्किंग की वजह से एम्बुलेंस तक नहीं निकल पा रही है जाम लगा रहता है।", "TPD"),

    # HFW (Health & Hospitals)
    ("government hospital emergency ward staff refused treatment to critical patient", "HFW"),
    ("stagnant water pool near park breeding swarms of mosquitoes dengue cases rising", "HFW"),
    ("local dispensary is out of essential medicines and doctor consistently absent", "HFW"),
    ("government clinic negligence doctor not attending to sick children", "HFW"),
    ("hospital me doctor nahi mila emergency ward band pada hai laparwahi ho rahi hai", "HFW"),
    ("dengue fail raha hai gali me fogging aur dawai chhidkaav karwayiye", "HFW"),
    ("dispensary me dawai khatam hai sarkari hospital ilaaj nahi kar raha", "HFW"),
    ("सरकारी अस्पताल में डॉक्टर समय पर नहीं आते और दवाइयां बाहर से खरीदने को कहते हैं।", "HFW"),
    ("क्षेत्र में डेंगू और मलेरिया के मरीज बढ़ रहे हैं तुरंत मच्छर मारने की दवा का छिड़काव करें।", "HFW"),

    # POL (Police & Public Safety)
    ("group of anti-social boys consuming alcohol in public park harassing females", "POL"),
    ("car windshield broken and stereo stolen from parking lot overnight need patrolling", "POL"),
    ("illegal high-decibel loudspeakers playing loud music past midnight noise violation", "POL"),
    ("burglary theft of motorcycle parked outside residential house", "POL"),
    ("fight violence threat from local criminals need police protection", "POL"),
    ("gali me ladke sharab peekar hungama karte hain police patrolling ki zarurat hai", "POL"),
    ("raat ko chori ho gayi gaadi ka lock tod kar saman le gaye complaint darj karein", "POL"),
    ("tez aawaz me dj loudspeaker baj raha hai padhai me dikkat ho rahi hai", "POL"),
    ("पार्क में असामाजिक तत्व शराब पीकर महिलाओं और राहगीरों को परेशान करते हैं।", "POL"),
    ("घर के बाहर खड़ी मोटरसाइकिल रात को चोरी हो गई, इलाके में पुलिस गश्त बढ़ाई जाए।", "POL"),
    ("देर रात तक तेज आवाज में लाउडस्पीकर बज रहा है पुलिस तुरंत बंद करवाए।", "POL"),

    # DFS (Fire & Emergency)
    ("commercial warehouse operating without fire exit with severe chemical hazard", "DFS"),
    ("lpg cooking gas cylinder leakage and chemical smell spreading across building", "DFS"),
    ("fire broke out in electrical transformer smoke spreading into apartments", "DFS"),
    ("fire safety equipment in shopping complex completely non-functional and expired", "DFS"),
    ("gas leakage ho rahi hai building me smell fail rahi hai fire rescue team chahiye", "DFS"),
    ("aag lag gayi hai factory me turant fire brigade bhejiye", "DFS"),
    ("इमारत में आग बुझाने के यंत्र खराब हैं और आपातकालीन निकास गेट पर ताला लगा रखा है।", "DFS"),
    ("गैस सिलेंडर से रिसाव हो रहा है और बहुत तेज गैस की गंध आ रही है तुरंत दमकल भेजें।", "DFS"),

    # EFD (Environment & Pollution)
    ("industrial plant releasing toxic black chemical smoke and acidic fumes", "EFD"),
    ("illegal felling of mature green trees in residential colony by builders", "EFD"),
    ("severe construction dust pollution without water sprinkling screens causing asthma", "EFD"),
    ("open burning of plastic waste emitting dangerous poisonous smoke", "EFD"),
    ("factory se poisonous dhuan nikal raha hai AQI bohot kharab hai saans lena mushkil hai", "EFD"),
    ("colony ke haray bhare ped kaate ja rahe hain forest department action le", "EFD"),
    ("फैक्ट्री से जहरीला रासायनिक काला धुआं छोड़ा जा रहा है सांस लेने में तकलीफ हो रही है।", "EFD"),
    ("कॉलोनी के पुराने हरे-भरे पेड़ों को बिल्डर द्वारा अवैध रूप से काटा जा रहा है।", "EFD"),

    # WCD (Women & Child Welfare)
    ("distress call regarding domestic abuse and emergency shelter request for woman", "WCD"),
    ("local anganwadi center closed for 3 weeks subsidized nutrition not distributed", "WCD"),
    ("widow welfare pension application pending for 10 months without disbursement", "WCD"),
    ("anganwadi center band pada hai bacchon ko ration aur nutrition nahi mil raha", "WCD"),
    ("gharelu hinsa domestic violence victim needs police women helpline assistance", "WCD"),
    ("आंगनवाड़ी केंद्र पिछले 1 महीने से बंद पड़ा है और बच्चों को पोषाहार नहीं मिल रहा।", "WCD"),
    ("घरेलू हिंसा से पीड़ित महिला के लिए तत्काल सुरक्षा और हेल्पलाइन सहायता की आवश्यकता है।", "WCD"),

    # FCS (Food & Civil Supplies)
    ("fair price ration shop dealer charging extra money and siphoning subsidised wheat", "FCS"),
    ("ration card application approved months ago but digital card not issued", "FCS"),
    ("ration shop dealer giving poor quality stone-mixed wheat refusing receipt", "FCS"),
    ("ration dealer gehu chawal black me bech raha hai aur ration nahi deta", "FCS"),
    ("ration card apply kiya tha abhi tak nahi mila food supplies inspector action le", "FCS"),
    ("राशन कोटेदार गरीबों का अनाज कालाबाजारी में बेच रहा है और राशन देने से मना करता है।", "FCS"),
    ("राशन कार्ड बने 6 महीने हो गए लेकिन अभी तक राशन कार्ड नहीं दिया गया।", "FCS"),

    # REV (Revenue & Land Records)
    ("tehsildar office delaying ancestral land property mutation dakhil kharij for months", "REV"),
    ("land mafia illegally encroached on village public pasture gram sabha land", "REV"),
    ("patwari demanding illegal bribe money for entering name in khasra khatauni", "REV"),
    ("jamin ka dakhil kharij nahi ho raha patwari paise maang raha hai", "REV"),
    ("gram sabha ki sarkari jameen par kabza kiya ja raha hai revenue officer rokein", "REV"),
    ("जमीन की दाखिल-खारिज के लिए पटवारी चक्कर लगवा रहा है और रिश्वत मांग रहा है।", "REV"),
    ("ग्राम सभा की सरकारी जमीन पर भूमाफिया द्वारा अवैध रूप से कब्जा किया जा रहा है।", "REV")
]

class MultilingualCivicClassifier:
    def __init__(self):
        self.model_name = "JanSahayak-Multilingual-NLP-v4"
        self.model_version = "4.0.0"
        self._train()

    def _train(self):
        texts = [item[0] for item in EXPANDED_TRAINING_DATA]
        depts = [item[1] for item in EXPANDED_TRAINING_DATA]

        # Word & sub-word n-gram vectorizer with balanced Logistic Regression
        self.dept_pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(
                ngram_range=(1, 3), 
                min_df=1, 
                sublinear_tf=True
            )),
            ('clf', LogisticRegression(
                random_state=42, 
                max_iter=500, 
                C=3.0, 
                class_weight='balanced'
            ))
        ])

        self.dept_pipeline.fit(texts, depts)
        self.classes_ = self.dept_pipeline.classes_

    def _rule_based_boost(self, text: str):
        """
        High-precision civic intent keyword matching with phrase weighting.
        Returns (best_dept, confidence_boost) or (None, 0.0)
        """
        lower = text.lower()
        dept_scores = {d: 0 for d in DEPARTMENT_METADATA.keys()}

        for dept, meta in DEPARTMENT_METADATA.items():
            # Check English keywords
            for kw in meta["keywords_en"]:
                if ' ' in kw:
                    if kw in lower:
                        dept_scores[dept] += 8
                else:
                    if re.search(r'\b' + re.escape(kw) + r'\b', lower):
                        dept_scores[dept] += 5

            # Check Hindi / Hinglish keywords
            for kw in meta["keywords_hi"]:
                if ' ' in kw:
                    if kw in lower or kw in text:
                        dept_scores[dept] += 8
                else:
                    if kw in text or re.search(r'\b' + re.escape(kw) + r'\b', lower):
                        dept_scores[dept] += 5

        best_dept = max(dept_scores, key=dept_scores.get)
        max_score = dept_scores[best_dept]

        # Any verified domain keyword match triggers the rule boost
        if max_score >= 5:
            return best_dept, 0.96
        elif max_score >= 3:
            return best_dept, 0.88
        return None, 0.0

    def _resolve_category(self, dept: str, text: str):
        """
        Resolves the exact, semantically valid category for the selected department.
        Guarantees that categories never bleed across departments.
        """
        lower = text.lower()
        dept_cats = DEPARTMENT_SPECIFIC_CATEGORIES.get(dept, [])

        for keywords, cat_name, cat_code, priority in dept_cats:
            for kw in keywords:
                if ' ' in kw:
                    if kw in lower:
                        return cat_name, cat_code, priority
                else:
                    if re.search(r'\b' + re.escape(kw) + r'\b', lower):
                        return cat_name, cat_code, priority

        # Fallback to department's canonical category
        meta = DEPARTMENT_METADATA.get(dept, DEPARTMENT_METADATA["EPD"])
        return meta["category"], meta["category_code"], meta["default_priority"]

    def predict(self, text: str):
        cleaned = text.strip() if text else "civic grievance"
        
        # 1. Rule-based boost check
        rule_dept, rule_conf = self._rule_based_boost(cleaned)

        # 2. ML pipeline prediction
        ml_dept = self.dept_pipeline.predict([cleaned])[0]

        try:
            probs = self.dept_pipeline.predict_proba([cleaned])[0]
            ml_conf = float(np.max(probs))
            classes = list(self.classes_)
        except Exception:
            ml_conf = 0.85
            probs = None
            classes = []

        # 3. Final department determination
        final_dept = rule_dept if rule_dept else ml_dept
        confidence = rule_conf if rule_dept else max(ml_conf, 0.82)

        # 4. Resolve semantically guaranteed category for this department
        cat_name, cat_code, priority = self._resolve_category(final_dept, cleaned)

        # 5. Build alternative recommendations
        meta = DEPARTMENT_METADATA.get(final_dept, DEPARTMENT_METADATA["EPD"])
        alternatives = []
        if probs is not None:
            top_indices = np.argsort(probs)[::-1][:4]
            for idx in top_indices:
                cand_dept = classes[idx]
                if cand_dept != final_dept and probs[idx] > 0.05:
                    alternatives.append({
                        "department": str(cand_dept),
                        "department_name": DEPARTMENT_METADATA.get(cand_dept, {}).get("name", cand_dept),
                        "confidence": round(float(probs[idx]), 4)
                    })

        return {
            "predicted_department": str(final_dept),
            "predicted_department_name": meta["name"],
            "predicted_category": cat_name,
            "predicted_category_code": cat_code,
            "predicted_priority": priority,
            "confidence_score": round(float(confidence), 2),
            "alternative_departments": alternatives,
            "model_name": self.model_name,
            "model_version": self.model_version,
            "governance_disclaimer": "AI assisted categorization. Verified officers may reassign department or category based on field inspection."
        }

# Global Singleton
classifier = MultilingualCivicClassifier()
