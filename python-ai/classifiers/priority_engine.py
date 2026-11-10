"""
JanSahayak AI - Enhanced Explainable Priority Recommendation Engine
Multi-criteria civic risk scoring considering:
1. Physical / Life Safety Hazard (Electrocution, gas leaks, open manholes, structural collapse)
2. Public Health & Contamination (Sewage contamination, disease outbreaks)
3. Infrastructure & Transport Disruption (Blackouts, arterial main bursts, intersection signal failures)
4. Vulnerable Infrastructure (Hospitals, schools, senior citizen zones, high-density public areas)
5. Multilingual Civic Lexicon (English, Hindi, Punjabi)

All recommendations provide transparent scoring breakdown, confidence, and human review disclaimer.
"""

import re
from typing import Dict, List, Any

# Multi-lingual Risk Lexicons
CRITICAL_LEXICON = [
    # English
    "sparking", "fire", "electrocution", "electric shock", "live wire", "open manhole",
    "uncovered manhole", "deep crater", "toxic", "poisonous", "sewage in drinking water",
    "drinking water contaminated", "hospital emergency", "ambulance blocked",
    "collapse", "collapsed", "gas leak", "fatal", "death", "cholera", "hospitalized",
    "blast", "explosion", "submerged highway",
    # Hindi
    "चिंगारी", "आग", "करंट", "खुला मैनहोल", "तार टूट", "जहरीला", "मौत", "धमाका",
    "गैस लीक", "अस्पताल में भर्ती", "हैजा", "आग लग गई", "खतरनाक",
    # Punjabi
    "ਮੈਨਹੋਲ", "ਅੱਗ", "ਤਾਰ", "ਖ਼ਤਰਨਾਕ", "ਕਰੰਟ", "ਧਮਾਕਾ", "ਜ਼ਹਿਰੀਲੀ", "ਮੌਤ"
]

HIGH_PRIORITY_LEXICON = [
    # English
    "accident", "pothole", "main burst", "pipeline burst", "pipeline leak", "feeder pipeline",
    "blackout", "power blackout", "dengue", "malaria", "overflowing sewage",
    "intersection signal down", "traffic signal dead", "broken stairs", "senior citizen",
    "school zone", "children playground", "cave-in", "traffic jams", "submerged",
    "refusing admission", "oxygen supply", "flooding", "waterlogging",
    # Hindi
    "गड्ढा", "एक्सीडेंट", "हादसा", "डेंगू", "मलेरिया", "ब्लैकआउट", "जाम",
    "पानी भर गया", "टूटी", "सड़क धंस", "अस्पताल", "पाइप फट",
    # Punjabi
    "ਟੋਇਆ", "ਹਾਦਸਾ", "ਨੁਕਸਾਨ", "ਬਲੈਕਆਊਟ", "ਡੇਂਗੂ", "ਪਾਣੀ ਭਰਿਆ", "ਵਾਹਨਾਂ"
]

MEDIUM_PRIORITY_LEXICON = [
    # English
    "garbage", "trash", "waste", "rubbish", "dump", "overflowing", "container overflowing",
    "streetlight", "street light", "dark street", "non-functional streetlights",
    "encroachment", "hawkers", "sidewalk", "parking", "illegal parking",
    "odor", "stink", "smell", "drain blockage", "water pressure", "low water pressure",
    "stray dog", "stray cattle", "broken bench",
    # Hindi
    "कचरा", "कूड़ा", "बदबू", "स्ट्रीट लाइट", "अतिक्रमण", "पार्किंग", "कुत्ते",
    "नाली बंद", "धीमा पानी", "कचरे का ढेर",
    # Punjabi
    "ਕੂੜਾ", "ਗੰਦਗੀ", "ਬਦਬੂ", "ਸਟਰੀਟ ਲਾਈਟ", "ਕੁੱਤੇ", "ਗਲੀ ਵਿੱਚ ਕੂੜਾ", "ਪਾਰਕਿੰਗ"
]

LOW_PRIORITY_LEXICON = [
    # English
    "faded", "repainting", "lane markings", "rusted", "board rusted", "tree pruning",
    "pruning", "inquiry", "tax receipt", "receipt issuance", "status inquiry",
    "dry tree branches", "fallen branches", "loose wooden plank", "bench", "grass cutting",
    "lawn mowing", "cosmetic", "name board", "signboard",
    # Hindi
    "बोर्ड", "मिट गया", "नाम", "पेंट", "पेड़ की छंटाई", "रसीद", "पूछताछ",
    "घास", "लकड़ी",
    # Punjabi
    "ਘਾਹ ਕੱਟਣ", "ਬੋਰਡ", "ਰਸੀਦ", "ਦਰਖ਼ਤ", "ਬੇਨਤੀ", "ਲੱਕੜ"
]

VULNERABLE_ZONE_INDICATORS = [
    "hospital", "emergency", "school", "children", "kindergarten", "clinic",
    "nursing home", "senior citizen", "elderly", "playground", "icu", "ambulance"
]

def assess_priority(title: str, description: str, context: dict = None) -> Dict[str, Any]:
    """
    Evaluates grievance priority with explainable multi-factor scoring.
    Returns:
        recommended_priority: 'critical' | 'high' | 'medium' | 'low'
        sla_recommended_hours: int (12, 24, 48, 72)
        confidence_score: float (0.0 to 1.0)
        risk_factors: list of matched indicator phrases
        scoring_breakdown: detailed sub-scores
        rationale: human-readable justification
        disclaimer: governance accountability notice
    """
    full_text = f"{title or ''} {description or ''}".lower()
    
    # 1. Indicator matches across lexicons
    matched_critical = [w for w in CRITICAL_LEXICON if w in full_text]
    matched_high = [w for w in HIGH_PRIORITY_LEXICON if w in full_text]
    matched_medium = [w for w in MEDIUM_PRIORITY_LEXICON if w in full_text]
    matched_low = [w for w in LOW_PRIORITY_LEXICON if w in full_text]
    vulnerable_targets = [w for w in VULNERABLE_ZONE_INDICATORS if w in full_text]
    
    # Compute component scores (0 - 100)
    hazard_score = 0
    impact_score = 0
    urgency_score = 0
    
    if matched_critical:
        hazard_score = min(100, 85 + (len(matched_critical) * 5))
        impact_score = 80
        urgency_score = 95
    elif matched_high:
        hazard_score = min(80, 60 + (len(matched_high) * 5))
        impact_score = 70
        urgency_score = 75
    elif matched_medium:
        hazard_score = min(50, 35 + (len(matched_medium) * 5))
        impact_score = 45
        urgency_score = 40
    else:
        hazard_score = 15
        impact_score = 20
        urgency_score = 20
        
    # Vulnerable facility boost
    if vulnerable_targets:
        impact_score = min(100, impact_score + 15)
        urgency_score = min(100, urgency_score + 15)
        
    composite_risk = (hazard_score * 0.45) + (impact_score * 0.30) + (urgency_score * 0.25)
    
    # Priority decision thresholds
    if matched_critical or composite_risk >= 75:
        priority = "critical"
        sla_hours = 12
        confidence = min(0.98, 0.85 + (len(matched_critical) * 0.03))
        rationale = f"Severe public or life safety hazard identified ({', '.join(matched_critical or ['High composite hazard risk'])}). Requires immediate 12-hour response."
        active_risks = matched_critical + (["vulnerable_facility: " + v for v in vulnerable_targets])
    elif matched_high or composite_risk >= 55:
        priority = "high"
        sla_hours = 24
        confidence = min(0.92, 0.80 + (len(matched_high) * 0.03))
        rationale = f"Significant civic disruption, structural breakdown, or health hazard detected ({', '.join(matched_high or ['Substantial infrastructure impact'])})."
        active_risks = matched_high + (["vulnerable_facility: " + v for v in vulnerable_targets])
    elif matched_medium or (not matched_low and composite_risk >= 30):
        priority = "medium"
        sla_hours = 48
        confidence = min(0.88, 0.75 + (len(matched_medium) * 0.03))
        rationale = f"Standard civic amenity grievance affecting municipal living standards ({', '.join(matched_medium or ['routine grievance'])})."
        active_risks = matched_medium
    else:
        priority = "low"
        sla_hours = 72
        confidence = 0.80 if matched_low else 0.70
        rationale = f"Routine maintenance, general inquiry, or minor aesthetic issue ({', '.join(matched_low or ['routine inquiry'])})."
        active_risks = matched_low

    return {
        "recommended_priority": priority,
        "sla_recommended_hours": sla_hours,
        "confidence_score": round(confidence, 2),
        "risk_factors": active_risks,
        "scoring_breakdown": {
            "hazard_severity_score": hazard_score,
            "public_impact_score": impact_score,
            "urgency_score": urgency_score,
            "composite_risk_score": round(composite_risk, 1)
        },
        "rationale": rationale,
        "governance_disclaimer": "AI-generated recommendation. In accordance with platform governance policy, assigned government officers retain final authority to adjust complaint priority."
    }
