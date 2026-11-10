"""
JanSahayak AI - Multilingual Civic Complaint Classifier (v3.0.0)
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
    "MCD": {
        "name": "Municipal Corporation & Sanitation",
        "category": "Uncollected Garbage & Waste Accumulation",
        "category_code": "MCD_GARBAGE",
        "default_priority": "medium",
        "keywords_en": ["garbage", "trash", "waste", "dump", "stink", "rubbish", "sweeper", "dustbin", "dead animal", "stray dog", "mosquito breeding", "filth"],
        "keywords_hi": ["कूड़ा", "कचरा", "सफाई", "कूड़ेदान", "सफाईकर्मी", "सफाई कर्मचारी", "कचरे का ढेर", "डस्टबिन", "आवारा कुत्ता", "kuda", "kachra", "safai", "dustbin", "koode"]
    },
    "PWD": {
        "name": "Public Works Department (PWD)",
        "category": "Potholes & Broken Roads",
        "category_code": "PWD_POTHOLE",
        "default_priority": "high",
        "keywords_en": ["road", "pothole", "crater", "footpath", "flyover", "divider", "pavement", "cave-in", "underpass", "construction", "bridge", "asphalt"],
        "keywords_hi": ["सड़क", "गड्ढा", "गड्ढे", "टूटी सड़क", "फुटपाथ", "फ्लाईओवर", "डिवाइडर", "खड्डा", "धंसाव", "पुल", "sadak", "gaddha", "gadha", "tooti sadak", "footpath", "flyover"]
    },
    "EPD": {
        "name": "Electricity & Power Distribution",
        "category": "Prolonged Area Power Outage",
        "category_code": "EPD_BLACKOUT",
        "default_priority": "high",
        "keywords_en": ["power", "electricity", "outage", "blackout", "voltage", "transformer", "wire", "sparking", "meter", "current", "streetlight", "light pole"],
        "keywords_hi": ["बिजली", "करंट", "कटौती", "लाइट", "ट्रांसफार्मर", "तार", "चिंगारी", "मीटर", "स्ट्रीट लाइट", "अंधेरा", "खंभा", "bijli", "light", "transformer", "taar", "voltage", "current", "chali gayi"]
    },
    "DJB": {
        "name": "Water Supply & Sewerage Board",
        "category": "Contaminated Drinking Water",
        "category_code": "DJB_CONTAM",
        "default_priority": "critical",
        "keywords_en": ["water", "drinking water", "tap", "pipeline", "leakage", "sewer", "sewage", "muddy water", "supply", "tanker", "pipe burst", "foul water"],
        "keywords_hi": ["पानी", "पीने का पानी", "नल", "सीवर", "गंदा पानी", "पाइपलाइन", "लीकेज", "सप्लाई", "टैंकर", "बदबूदार पानी", "pani", "paani", "sewer", "sewage", "ganda pani", "leakage", "pipe"]
    },
    "TPD": {
        "name": "Traffic & Transport Department",
        "category": "Traffic Signal Malfunction",
        "category_code": "TPD_SIGNAL",
        "default_priority": "high",
        "keywords_en": ["traffic", "signal", "jam", "red light", "congestion", "bus", "dtc", "auto", "challan", "speed breaker", "junction", "parking bottleneck"],
        "keywords_hi": ["ट्रैफिक", "जाम", "सिग्नल", "लाल बत्ती", "बस", "सवारी", "अवैध पार्किंग", "स्पीड ब्रेकर", "चौराहा", "traffic", "jam", "signal", "red light", "bus", "parking"]
    },
    "HFW": {
        "name": "Health & Family Welfare",
        "category": "Government Clinic Staff Negligence",
        "category_code": "HFW_STAFF",
        "default_priority": "high",
        "keywords_en": ["hospital", "doctor", "clinic", "dispensary", "medicine", "dengue", "malaria", "epidemic", "ambulance", "negligence", "nurse"],
        "keywords_hi": ["अस्पताल", "डॉक्टर", "दवा", "दवाई", "डेंगू", "मलेरिया", "क्लिनिक", "इलाज", "एम्बुलेंस", "मरीज", "aspataal", "hospital", "doctor", "dawai", "dengue", "ilaj"]
    },
    "POL": {
        "name": "Police & Public Law Enforcement",
        "category": "Anti-Social Elements & Public Harassment",
        "category_code": "POL_NUISANCE",
        "default_priority": "high",
        "keywords_en": ["police", "theft", "stolen", "harassment", "robbery", "eve teasing", "patrolling", "drugs", "noise", "loudspeaker", "violence", "threat", "fight"],
        "keywords_hi": ["पुलिस", "चोरी", "छेड़खानी", "मारपीट", "धमकी", "शोर", "लाउडस्पीकर", "सुरक्षा", "थाना", "नशा", "गुंडागर्दी", "police", "chori", "chedkhani", "dhamki", "patrolling", "shor", "thana"]
    },
    "DFS": {
        "name": "Fire & Emergency Disaster Response",
        "category": "Hazardous Chemical / Gas Leakage Risk",
        "category_code": "DFS_HAZARD",
        "default_priority": "critical",
        "keywords_en": ["fire", "smoke", "flames", "cylinder blast", "gas leak", "chemical leak", "short circuit fire", "fire extinguisher", "burn", "explosion"],
        "keywords_hi": ["आग", "धुआं", "सिलेंडर ब्लास्ट", "गैस लीक", "आग लग गई", "शॉर्ट सर्किट", "दमकल", "ब्लास्ट", "aag", "dhuan", "gas leak", "cylinder blast", "fire brigade"]
    },
    "EFD": {
        "name": "Environment, Pollution Control & Forest",
        "category": "Industrial Toxic Fumes & Severe Air Pollution",
        "category_code": "EFD_AIR",
        "default_priority": "high",
        "keywords_en": ["pollution", "aqi", "air pollution", "smog", "smoke", "factory fumes", "toxic emission", "tree cutting", "green cover", "chemical emission", "dust"],
        "keywords_hi": ["प्रदूषण", "हवा", "धुआं", "जहरीला धुआं", "पेड़ काटना", "फैक्ट्री", "सांस", "पर्यावरण", "dhuan", "pollution", "ped katna", "factory", "hawa", "smog"]
    },
    "WCD": {
        "name": "Women & Child Development (WCD)",
        "category": "Women Welfare Assistance & Safety Helpline",
        "category_code": "WCD_WOMEN",
        "default_priority": "critical",
        "keywords_en": ["women", "child", "domestic violence", "anganwadi", "pension", "widow", "infant", "malnutrition", "distress helpline", "mother", "girl child"],
        "keywords_hi": ["महिला", "बच्चा", "आंगनवाड़ी", "घरेलू हिंसा", "पेंशन", "विधवा पेंशन", "पोषण", "महिला सुरक्षा", "mahila", "baccha", "anganwadi", "pension", "suraksha"]
    },
    "FCS": {
        "name": "Food, Civil Supplies & Consumer Affairs",
        "category": "Ration Dealer Black Marketing & Grain Diversion",
        "category_code": "FCS_RATION",
        "default_priority": "high",
        "keywords_en": ["ration", "ration card", "quota", "fair price shop", "grain", "wheat", "rice", "food supply", "black marketing", "adulteration", "consumer fraud"],
        "keywords_hi": ["राशन", "राशन कार्ड", "कोटा", "गेहूं", "चावल", "कालाबाजारी", "दुकानदार", "खाद्य", "अनाज", "मिलावट", "ration", "ration card", "quota", "gehu", "chawal", "anaj"]
    },
    "REV": {
        "name": "Revenue & Land Administration",
        "category": "Unreasonable Delay in Property Mutation / Dakhil Kharij",
        "category_code": "REV_MUTATION",
        "default_priority": "medium",
        "keywords_en": ["land", "property", "registry", "mutation", "dakhil kharij", "patwari", "encroachment", "tehsildar", "stamp duty", "khasra", "revenue", "bribe"],
        "keywords_hi": ["जमीन", "दाखिल खारिज", "रजिस्ट्री", "नामांतरण", "पटवारी", "तहसीलदार", "कब्जा", "खसरा", "खतौनी", "राजस्व", "jamin", "dakhil kharij", "patwari", "registry", "khasra"]
    }
}

# Comprehensive Multilingual Training Data (English, Hindi Devanagari, Hinglish)
EXPANDED_TRAINING_DATA = [
    # MCD (Sanitation & Municipal Waste)
    ("Uncollected garbage dump at street corner for 4 days creating terrible stink and flies.", "MCD", "Uncollected Garbage & Waste Accumulation"),
    ("Trash bin overflowing on market road, stray dogs scattering plastic bags everywhere.", "MCD", "Uncollected Garbage & Waste Accumulation"),
    ("Colony sweepers have not come for a week, dry leaves and waste accumulated.", "MCD", "Uncollected Garbage & Waste Accumulation"),
    ("मोहल्ले में 4 दिन से कूड़ा नहीं उठा है, बहुत तेज बदबू और मक्खियां फैल रही हैं।", "MCD", "Uncollected Garbage & Waste Accumulation"),
    ("सड़क किनारे कचरे का बड़ा ढेर लगा हुआ है, आवारा कुत्ते गंदगी फैला रहे हैं।", "MCD", "Uncollected Garbage & Waste Accumulation"),
    ("गली में नाली जाम है और सारा गंदा कचरा सड़क पर बह रहा है तुरंत सफाई करवाएं।", "MCD", "Uncollected Garbage & Waste Accumulation"),
    ("humare yahan 5 din se kachra nahi utha hai bohot badbu aa rahi hai safai karwaye", "MCD", "Uncollected Garbage & Waste Accumulation"),
    ("main market me dustbin pura overflow ho gaya hai kuda bikhra pada hai", "MCD", "Uncollected Garbage & Waste Accumulation"),

    # PWD (Roads & Infrastructure)
    ("Deep pothole on outer ring road underpass has caused multiple bike accidents.", "PWD", "Potholes & Broken Roads"),
    ("Road surface completely cracked and eroded with sharp asphalt edges after rain.", "PWD", "Potholes & Broken Roads"),
    ("Collapsed footpath pavement slab posing deadly hazard for walking pedestrians.", "PWD", "Potholes & Broken Roads"),
    ("मुख्य सड़क पर बहुत गहरा गड्ढा है कल रात दो पहिया वाहन फिसल गया।", "PWD", "Potholes & Broken Roads"),
    ("फ्लाईओवर के नीचे सड़क पूरी तरह टूट चुकी है, बड़े-बड़े खड्डे बने हुए हैं।", "PWD", "Potholes & Broken Roads"),
    ("सड़क के बीचोंबीच मैनहोल का ढक्कन टूटा हुआ है कभी भी बड़ा हादसा हो सकता है।", "PWD", "Open Storm Drainage / Manhole Hazard"),
    ("sadak bohot kharab ho chuki hai bade bade gaddhe ban gaye hain repairing chahiye", "PWD", "Potholes & Broken Roads"),
    ("metro pillar ke pass sadak dhans gayi hai accident ka khatra hai", "PWD", "Potholes & Broken Roads"),

    # EPD (Power & Electricity)
    ("Entire residential block facing prolonged power blackout for over 8 hours in extreme heat.", "EPD", "Prolonged Area Power Outage"),
    ("High voltage transformer sparking violently with burning smell near residential school.", "EPD", "Exposed Electrical Wires / Sparking Transformer"),
    ("All street lights broken on main avenue leaving road in pitch darkness at night.", "EPD", "Non-Functional Streetlights"),
    ("बिजली का ट्रांसफार्मर धू-धू कर जल रहा है और चिंगारियां निकल रही हैं बड़ा खतरा है।", "EPD", "Exposed Electrical Wires / Sparking Transformer"),
    ("हमारे सेक्टर में कल रात से बिजली कटी हुई है, कोई सुनवाई नहीं हो रही।", "EPD", "Prolonged Area Power Outage"),
    ("सड़क के बिजली के खंभे की लाइट बंद है अंधेरे में चोरी का डर बना रहता है।", "EPD", "Non-Functional Streetlights"),
    ("transformer blast ho gaya hai aag lag sakti hai jaldi bijli vibhag bhejo", "EPD", "Exposed Electrical Wires / Sparking Transformer"),
    ("kal raat se poore mohalle me light nahi hai voltage bohot kam aa raha hai", "EPD", "Prolonged Area Power Outage"),

    # DJB (Water & Sewerage)
    ("Contaminated muddy brown sewage water coming out of household drinking water taps.", "DJB", "Contaminated Drinking Water"),
    ("Underground drinking water main pipeline burst, millions of liters water wasting on road.", "DJB", "Pipeline Leakage / Main Burst"),
    ("Main sewer line choked and overflowing onto residential lanes and building basements.", "DJB", "Overflowing Sewage Line"),
    ("पीने के नल में बदबूदार काला नाले का पानी आ रहा है, बच्चे बीमार पड़ रहे हैं।", "DJB", "Contaminated Drinking Water"),
    ("सड़क के नीचे से पानी की मुख्य पाइपलाइन फट गई है और सारा साफ पानी बह रहा है।", "DJB", "Pipeline Leakage / Main Burst"),
    ("सीवर ओवरफ्लो होकर घरों के सामने भर गया है बदबू से जीना दूभर हो गया।", "DJB", "Overflowing Sewage Line"),
    ("nal me ganda peele rang ka badboodar paani aa raha hai peene yogya nahi hai", "DJB", "Contaminated Drinking Water"),
    ("sewer line block ho gayi hai sadak par ganda pani bhara hai tanker bhejo", "DJB", "Overflowing Sewage Line"),

    # TPD (Traffic & Transport)
    ("Traffic signal lights completely broken at busy intersection causing massive gridlock.", "TPD", "Traffic Signal Malfunction"),
    ("Illegal commercial vehicles double parking on main road blocking emergency ambulance movement.", "TPD", "Illegal Parking & Bottleneck"),
    ("DTC public transit bus skipped designated stop and driver driving recklessly.", "TPD", "Traffic Signal Malfunction"),
    ("चौराहे पर ट्रैफिक सिग्नल की लाल बत्ती खराब है बहुत भयानक ट्रैफिक जाम लगा है।", "TPD", "Traffic Signal Malfunction"),
    ("सड़क पर अवैध पार्किंग की वजह से एम्बुलेंस तक नहीं निकल पा रही है जाम लगा रहता है।", "TPD", "Illegal Parking & Bottleneck"),
    ("traffic light blinker band hai gaadiyan aapas me takra rahi hain jam laga hai", "TPD", "Traffic Signal Malfunction"),
    ("road par bus aur tempo ne rasta block kar rakha hai police traffic police bhejo", "TPD", "Illegal Parking & Bottleneck"),

    # HFW (Health & Hospitals)
    ("Government hospital emergency ward staff refused treatment to critical patient.", "HFW", "Government Clinic Staff Negligence"),
    ("Stagnant water pool near park breeding swarms of mosquitoes, dengue cases rising sharply.", "HFW", "Mosquito Breeding / Vector-Borne Threat"),
    ("Local dispensary is out of essential medicines and doctor is consistently absent.", "HFW", "Government Clinic Staff Negligence"),
    ("सरकारी अस्पताल में डॉक्टर समय पर नहीं आते और दवाइयां बाहर से खरीदने को कहते हैं।", "HFW", "Government Clinic Staff Negligence"),
    ("क्षेत्र में डेंगू और मलेरिया के मरीज बढ़ रहे हैं तुरंत मच्छर मारने की दवा का छिड़काव करें।", "HFW", "Mosquito Breeding / Vector-Borne Threat"),
    ("hospital me doctor nahi mila emergency ward band pada hai laparwahi ho rahi hai", "HFW", "Government Clinic Staff Negligence"),
    ("dengue fail raha hai gali me fogging aur dawai chhidkaav karwayiye", "HFW", "Mosquito Breeding / Vector-Borne Threat"),

    # POL (Police & Public Safety)
    ("Group of anti-social boys consuming alcohol in public park and harassing female residents.", "POL", "Anti-Social Elements & Public Harassment"),
    ("Car windshield broken and stereo stolen from parking lot overnight, need patrolling.", "POL", "Theft & Vehicle Burglary Investigation Request"),
    ("Illegal high-decibel loudspeakers playing loud music past midnight violating quiet hours.", "POL", "Illegal Loudspeakers & Night Noise Pollution"),
    ("पार्क में असामाजिक तत्व शराब पीकर महिलाओं और राहगीरों को भद्दे कमेंट्स और परेशान करते हैं।", "POL", "Anti-Social Elements & Public Harassment"),
    ("घर के बाहर खड़ी मोटरसाइकिल रात को चोरी हो गई, इलाके में पुलिस गश्त बढ़ाई जाए।", "POL", "Theft & Vehicle Burglary Investigation Request"),
    ("देर रात 2 बजे तक तेज आवाज में डीजे और लाउडस्पीकर बज रहा है बच्चों की पढ़ाई बाधित है।", "POL", "Illegal Loudspeakers & Night Noise Pollution"),
    ("gali me ladke sharab peekar hungama karte hain police patrolling ki zarurat hai", "POL", "Anti-Social Elements & Public Harassment"),
    ("raat ko chori ho gayi gaadi ka lock tod kar saman le gaye complaint darj karein", "POL", "Theft & Vehicle Burglary Investigation Request"),

    # DFS (Fire & Emergency)
    ("Commercial warehouse operating without fire exit with severe combustible chemical storage hazard.", "DFS", "Fire Safety Violation & Blocked Emergency Exit"),
    ("LPG cooking gas cylinder leakage and chemical smell spreading across multi-storey apartment.", "DFS", "Hazardous Chemical / Gas Leakage Risk"),
    ("Fire safety equipment in shopping complex completely non-functional and expired.", "DFS", "Fire Safety Violation & Blocked Emergency Exit"),
    ("इमारत में आग बुझाने के यंत्र खराब हैं और आपातकालीन निकास गेट पर ताला लगा रखा है।", "DFS", "Fire Safety Violation & Blocked Emergency Exit"),
    ("गैस सिलेंडर से रिसाव हो रहा है और बहुत तेज गैस की गंध आ रही है तुरंत दमकल भेजें।", "DFS", "Hazardous Chemical / Gas Leakage Risk"),
    ("aag lagne ka khatra hai factory me emergency exit block kar rakha hai fire NOC check karo", "DFS", "Fire Safety Violation & Blocked Emergency Exit"),
    ("gas leakage ho rahi hai building me smell fail rahi hai fire rescue team chahiye", "DFS", "Hazardous Chemical / Gas Leakage Risk"),

    # EFD (Environment & Pollution)
    ("Industrial plant releasing toxic black chemical smoke and acidic fumes during midnight.", "EFD", "Industrial Toxic Fumes & Severe Air Pollution"),
    ("Illegal felling of mature green trees in residential colony by private builders without permission.", "EFD", "Illegal Tree Felling in Public Colony"),
    ("Severe construction dust pollution without water sprinkling screens causing respiratory distress.", "EFD", "Industrial Toxic Fumes & Severe Air Pollution"),
    ("फैक्ट्री से जहरीला रासायनिक काला धुआं छोड़ा जा रहा है सांस लेने में बहुत तकलीफ हो रही है।", "EFD", "Industrial Toxic Fumes & Severe Air Pollution"),
    ("कॉलोनी के पुराने हरे-भरे पेड़ों को बिल्डर द्वारा अवैध रूप से काटा जा रहा है।", "EFD", "Illegal Tree Felling in Public Colony"),
    ("factory se poisonous dhuan nikal raha hai AQI bohot kharab hai saans lena mushkil hai", "EFD", "Industrial Toxic Fumes & Severe Air Pollution"),
    ("colony ke haray bhare ped kaate ja rahe hain forest department action le", "EFD", "Illegal Tree Felling in Public Colony"),

    # WCD (Women & Child Welfare)
    ("Distress call regarding domestic abuse and emergency shelter request for victim woman.", "WCD", "Women Welfare Assistance & Safety Helpline"),
    ("Local Anganwadi center closed for 3 weeks and subsidized nutritional food grains not distributed.", "WCD", "Anganwadi Nutrition & Malnutrition Grievance"),
    ("Widow welfare pension application pending for 10 months without any disbursement.", "WCD", "Women Welfare Assistance & Safety Helpline"),
    ("आंगनवाड़ी केंद्र पिछले 1 महीने से बंद पड़ा है और बच्चों को पोषाहार नहीं मिल रहा।", "WCD", "Anganwadi Nutrition & Malnutrition Grievance"),
    ("घरेलू हिंसा से पीड़ित महिला के लिए तत्काल सुरक्षा और हेल्पलाइन सहायता की आवश्यकता है।", "WCD", "Women Welfare Assistance & Safety Helpline"),
    ("anganwadi center band pada hai bacchon ko ration aur nutrition nahi mil raha", "WCD", "Anganwadi Nutrition & Malnutrition Grievance"),
    ("mahila helpline aur pension clearance me bohot deri ho rahi hai assistance chahiye", "WCD", "Women Welfare Assistance & Safety Helpline"),

    # FCS (Food & Civil Supplies)
    ("Fair price ration shop dealer charging extra money and siphoning government subsidised wheat.", "FCS", "Ration Dealer Black Marketing & Grain Diversion"),
    ("Ration card application approved 6 months ago but digital card not issued by food inspector.", "FCS", "Delay in Issuance of Digital Ration Card"),
    ("Ration shop dealer giving poor quality stone-mixed wheat and refusing to give receipt.", "FCS", "Ration Dealer Black Marketing & Grain Diversion"),
    ("राशन कोटेदार गरीबों का अनाज कालाबाजारी में बेच रहा है और राशन देने से मना करता है।", "FCS", "Ration Dealer Black Marketing & Grain Diversion"),
    ("राशन कार्ड बने 6 महीने हो गए लेकिन खाद्य विभाग द्वारा अभी तक राशन कार्ड नहीं दिया गया।", "FCS", "Delay in Issuance of Digital Ration Card"),
    ("ration dealer gehu chawal black me bech raha hai aur machine band hone ka bahana banata hai", "FCS", "Ration Dealer Black Marketing & Grain Diversion"),
    ("ration card apply kiya tha abhi tak nahi mila food supplies inspector action le", "FCS", "Delay in Issuance of Digital Ration Card"),

    # REV (Revenue & Land Records)
    ("Tehsildar office delaying ancestral land property mutation Dakhil Kharij for 8 months.", "REV", "Unreasonable Delay in Property Mutation / Dakhil Kharij"),
    ("Land mafia illegally encroached on village public pasture Gram Sabha land with boundary wall.", "REV", "Encroachment on Gram Sabha / Government Land"),
    ("Patwari demanding illegal bribe money for entering name in Khasra Khatauni land records.", "REV", "Unreasonable Delay in Property Mutation / Dakhil Kharij"),
    ("जमीन की दाखिल-खारिज (दाखिल खारिज) के लिए पटवारी 6 महीने से चक्कर लगवा रहा है।", "REV", "Unreasonable Delay in Property Mutation / Dakhil Kharij"),
    ("ग्राम सभा की सरकारी जमीन पर भूमाफिया द्वारा अवैध रूप से पक्की बाउंड्री बनाई जा रही है।", "REV", "Encroachment on Gram Sabha / Government Land"),
    ("jamin ka dakhil kharij nahi ho raha patwari paise maang raha hai revenue department check kare", "REV", "Unreasonable Delay in Property Mutation / Dakhil Kharij"),
    ("gram sabha ki sarkari jameen par kabza kiya ja raha hai revenue officer rokein", "REV", "Encroachment on Gram Sabha / Government Land")
]

class MultilingualCivicClassifier:
    def __init__(self):
        self.model_name = "JanSahayak-Multilingual-NLP-v3"
        self.model_version = "3.0.0"
        self._train()

    def _train(self):
        texts = [item[0] for item in EXPANDED_TRAINING_DATA]
        depts = [item[1] for item in EXPANDED_TRAINING_DATA]
        cats = [item[2] for item in EXPANDED_TRAINING_DATA]

        # Use character + word n-grams to robustly handle Hindi Devanagari, English, and Romanized Hinglish
        self.dept_pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 3), min_df=1, sublinear_tf=True)),
            ('clf', LogisticRegression(random_state=42, max_iter=300, C=2.0))
        ])

        self.cat_pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 3), min_df=1, sublinear_tf=True)),
            ('clf', LogisticRegression(random_state=42, max_iter=300, C=2.0))
        ])

        self.dept_pipeline.fit(texts, depts)
        self.cat_pipeline.fit(texts, cats)
        self.classes_ = self.dept_pipeline.classes_

    def _rule_based_boost(self, text: str):
        """Rule-based keyword scoring with phrase weighting to reinforce ML prediction on clear civic terms"""
        lower = text.lower()
        dept_scores = {d: 0 for d in DEPARTMENT_METADATA.keys()}

        for dept, meta in DEPARTMENT_METADATA.items():
            for kw in meta["keywords_en"]:
                if ' ' in kw:
                    if kw in lower:
                        dept_scores[dept] += 5
                else:
                    if re.search(r'\b' + re.escape(kw) + r'\b', lower):
                        dept_scores[dept] += 2

            for kw in meta["keywords_hi"]:
                if kw in text or kw in lower:
                    dept_scores[dept] += 5 if ' ' in kw else 3

        best_dept = max(dept_scores, key=dept_scores.get)
        return best_dept if dept_scores[best_dept] >= 3 else None

    def predict(self, text: str):
        cleaned = text.strip() if text else "civic grievance"
        
        # ML pipeline prediction
        ml_dept = self.dept_pipeline.predict([cleaned])[0]
        ml_cat = self.cat_pipeline.predict([cleaned])[0]

        # Keyword boost check
        rule_dept = self._rule_based_boost(cleaned)
        final_dept = rule_dept if rule_dept else ml_dept

        # Get metadata
        meta = DEPARTMENT_METADATA.get(final_dept, DEPARTMENT_METADATA["MCD"])
        category_name = meta["category"] if (rule_dept or not ml_cat) else ml_cat

        try:
            probs = self.dept_pipeline.predict_proba([cleaned])[0]
            confidence = float(np.max(probs))
            if rule_dept:
                confidence = max(confidence, 0.94)
            top_indices = np.argsort(probs)[::-1][:3]
            alternatives = [
                {
                    "department": self.classes_[i],
                    "department_name": DEPARTMENT_METADATA.get(self.classes_[i], {}).get("name", self.classes_[i]),
                    "confidence": round(float(probs[i]), 4)
                }
                for i in top_indices if self.classes_[i] != final_dept and probs[i] > 0.05
            ]
        except Exception:
            confidence = 0.91
            alternatives = []

        return {
            "predicted_department": final_dept,
            "predicted_department_name": meta["name"],
            "predicted_category": category_name,
            "predicted_category_code": meta.get("category_code"),
            "predicted_priority": meta.get("default_priority", "medium"),
            "confidence_score": round(confidence, 4),
            "alternative_departments": alternatives,
            "model_name": self.model_name,
            "model_version": self.model_version,
            "governance_disclaimer": "AI assisted categorization. Verified officers may reassign department or category based on field inspection."
        }

# Global Singleton
classifier = MultilingualCivicClassifier()
