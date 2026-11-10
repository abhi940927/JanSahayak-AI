"""
JanSahayak AI - Priority Recommendation Engine
Analyzes safety hazards, scale of impact, vulnerable facilities, and urgency indicators.
"""

CRITICAL_INDICATORS = [
    "sparking", "fire", "electrocution", "live wire", "open manhole", "deep crater",
    "toxic", "poisonous", "sewage in drinking water", "hospital emergency",
    "ambulance blocked", "collapse", "gas leak", "fatal", "death"
]

HIGH_PRIORITY_INDICATORS = [
    "accident", "pothole", "main burst", "pipeline leak", "blackout",
    "dengue", "malaria", "overflowing sewage", "intersection signal down",
    "broken stairs", "senior citizen", "school zone", "children playground"
]

MEDIUM_PRIORITY_INDICATORS = [
    "garbage", "trash", "waste", "streetlight", "encroachment",
    "parking", "odor", "stink", "drain blockage", "water pressure"
]

def assess_priority(title: str, description: str, context: dict = None) -> dict:
    full_text = f"{title} {description}".lower()
    
    # Check critical indicators
    matched_critical = [w for w in CRITICAL_INDICATORS if w in full_text]
    if matched_critical:
        return {
            "recommended_priority": "critical",
            "sla_recommended_hours": 12,
            "confidence_score": 0.95,
            "risk_factors": matched_critical,
            "rationale": f"Identified immediate civic or physical safety threats: {', '.join(matched_critical)}"
        }

    # Check high priority indicators
    matched_high = [w for w in HIGH_PRIORITY_INDICATORS if w in full_text]
    if matched_high:
        return {
            "recommended_priority": "high",
            "sla_recommended_hours": 24,
            "confidence_score": 0.88,
            "risk_factors": matched_high,
            "rationale": f"Substantial public disruption or hazard indicators detected: {', '.join(matched_high)}"
        }

    # Check medium priority indicators
    matched_medium = [w for w in MEDIUM_PRIORITY_INDICATORS if w in full_text]
    if matched_medium:
        return {
            "recommended_priority": "medium",
            "sla_recommended_hours": 48,
            "confidence_score": 0.82,
            "risk_factors": matched_medium,
            "rationale": "Standard civic grievance affecting municipal quality of service."
        }

    # Default to low priority
    return {
        "recommended_priority": "low",
        "sla_recommended_hours": 72,
        "confidence_score": 0.75,
        "risk_factors": [],
        "rationale": "Non-urgent routine maintenance or administrative inquiry."
    }
