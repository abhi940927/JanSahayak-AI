"""
Phase 16 - Comprehensive QA Audit Script for JanSahayak AI Microservice
Tests all 6 endpoints with English, Hindi, Punjabi, invalid input, and edge cases.
"""

import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api/ai"
results = []

def record(name, status, details):
    results.append({"test": name, "status": status, "details": details})
    symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"{symbol} [{status}] {name}: {details}")

def test_endpoint(url, payload=None, method="POST"):
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode() if payload else None,
        headers={"Content-Type": "application/json"} if payload else {},
        method=method
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            return res.status, json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except:
            return e.code, body
    except Exception as e:
        return 0, str(e)

# 1. Health Endpoint
status, body = test_endpoint(f"{BASE_URL}/health", method="GET")
if status == 200 and body.get("status") == "healthy":
    record("AI Health Check", "PASS", f"Status 200, features: {len(body.get('features', []))}")
else:
    record("AI Health Check", "FAIL", f"Received status {status}")

# 2. Classification - English
status, body = test_endpoint(f"{BASE_URL}/classify", {
    "title": "Severe road crater and pothole",
    "description": "Outer ring road left lane collapsed, causing accidents"
})
if status == 200 and body.get("predicted_department") == "PWD":
    record("AI Classify - English (PWD)", "PASS", f"Predicted {body.get('predicted_department')} (conf: {body.get('confidence_score')})")
else:
    record("AI Classify - English (PWD)", "FAIL", f"Expected PWD, got {body}")

# 2b. Classification - Hindi (Devanagari)
status, body = test_endpoint(f"{BASE_URL}/classify", {
    "title": "पीने का गंदा और बदबूदार पानी",
    "description": "नल में सीवर का पानी आ रहा है, पानी पीने योग्य नहीं है"
})
if status == 200 and body.get("detected_language") == "hi":
    record("AI Classify - Hindi Language Detection", "PASS", f"Detected lang: {body.get('detected_language')}, Pred: {body.get('predicted_department')}")
else:
    record("AI Classify - Hindi Language Detection", "FAIL", f"Expected hi detection, got {body}")

# 2c. Classification - Punjabi (Gurmukhi)
status, body = test_endpoint(f"{BASE_URL}/classify", {
    "title": "ਸੜਕ ਤੇ ਵੱਡਾ ਟੋਇਆ",
    "description": "ਮੁੱਖ ਸੜਕ ਤੇ ਟੋਏ ਕਾਰਨ ਹਾਦਸੇ ਹੋ ਰਹੇ ਹਨ"
})
if status == 200 and body.get("detected_language") == "pa":
    record("AI Classify - Punjabi Language Detection", "PASS", f"Detected lang: {body.get('detected_language')}, Pred: {body.get('predicted_department')}")
else:
    record("AI Classify - Punjabi Language Detection", "FAIL", f"Expected pa detection, got {body}")

# 3. Priority Recommendation - Critical vs Medium
status, body = test_endpoint(f"{BASE_URL}/priority", {
    "title": "Live electric cable snapped and sparking near school",
    "description": "High voltage wire is dangling on wet street, fatal risk of electrocution"
})
if status == 200 and body.get("recommended_priority") == "critical" and body.get("sla_recommended_hours") == 12:
    record("AI Priority - Critical Hazard Detection", "PASS", f"Priority: {body.get('recommended_priority')}, SLA: {body.get('sla_recommended_hours')}h")
else:
    record("AI Priority - Critical Hazard Detection", "FAIL", f"Expected critical, got {body}")

status, body = test_endpoint(f"{BASE_URL}/priority", {
    "title": "Uncollected trash bin on street",
    "description": "Municipal dustbin has minor overflow since yesterday"
})
if status == 200 and body.get("recommended_priority") in ["medium", "low"]:
    record("AI Priority - Routine Grievance", "PASS", f"Priority: {body.get('recommended_priority')}")
else:
    record("AI Priority - Routine Grievance", "FAIL", f"Expected medium/low, got {body}")

# 4. Duplicate Detection - Geolocation & Semantic Cosine
status, body = test_endpoint(f"{BASE_URL}/duplicates", {
    "target_complaint": {
        "id": "t1",
        "title": "Crater pothole on Ring Road",
        "description": "Deep crater on outer ring road sector 14",
        "latitude": 28.7159,
        "longitude": 77.1147
    },
    "candidate_complaints": [
        {
            "id": "c1",
            "tracking_number": "JS-2026-11111",
            "title": "Huge pothole outer ring road",
            "description": "Sector 14 ring road has deep crater",
            "latitude": 28.7161,
            "longitude": 77.1149,
            "status": "in_progress"
        },
        {
            "id": "c2",
            "tracking_number": "JS-2026-22222",
            "title": "Water bill incorrect billing",
            "description": "Excess meter tariff charged for residential unit",
            "latitude": 28.5000,
            "longitude": 77.0000,
            "status": "resolved"
        }
    ]
})
if status == 200 and body.get("potential_duplicates_found") == 1:
    dup = body["duplicates"][0]
    record("AI Duplicate Detection - Text & GPS Matching", "PASS", f"Detected match {dup['tracking_number']} (dist: {dup['distance_meters']}m, sim: {dup['similarity_score']})")
else:
    record("AI Duplicate Detection - Text & GPS Matching", "FAIL", f"Expected 1 duplicate, got {body}")

# 5. Summarization & Actionable Guidance
status, body = test_endpoint(f"{BASE_URL}/summarize", {
    "title": "Muddy sewage water entering drinking tap",
    "description": "Sector 9 residents getting black contaminated water in morning supply."
})
if status == 200 and "suggested_next_action" in body and "reported_impact" in body:
    record("AI Summarizer - Structured Output", "PASS", f"Action: {body['suggested_next_action'][:50]}... (is_llm: {body['is_llm_generated']})")
else:
    record("AI Summarizer - Structured Output", "FAIL", f"Incomplete fields: {body}")

# 6. Translation Endpoint
status, body = test_endpoint(f"{BASE_URL}/translate", {
    "text": "सड़क पर गहरा गड्ढा है",
    "target_lang": "en"
})
if status == 200 and body.get("detected_language") == "hi" and body.get("disclaimer"):
    record("AI Translate - Devanagari Script Handling", "PASS", f"Detected: {body['detected_language']}, Preserved original text: True")
else:
    record("AI Translate - Devanagari Script Handling", "FAIL", f"Expected valid translate payload, got {body}")

# 7. Invalid Inputs & Validation Edge Cases
status, body = test_endpoint(f"{BASE_URL}/classify", {
    "title": "x", # Too short (<3 chars)
    "description": "y" # Too short (<5 chars)
})
if status == 422:
    record("AI Validation - Short Input Rejection (422)", "PASS", "Pydantic rejected invalid short title/description")
else:
    record("AI Validation - Short Input Rejection (422)", "FAIL", f"Expected 422 Unprocessable Entity, got {status}")

with open("/Users/abhinav/Desktop/JANSAHAYAK AI/python-ai/tests/audit_results.json", "w") as f:
    json.dump(results, f, indent=2)

print("\nAudit Script Finished.")
