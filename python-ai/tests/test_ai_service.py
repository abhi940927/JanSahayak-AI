"""
Automated Integration Tests for JanSahayak AI Microservice
"""

import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000/api/ai"

def test_health():
    req = urllib.request.urlopen(f"{BASE_URL}/health")
    data = json.loads(req.read().decode())
    assert data["status"] == "healthy"
    print("✅ /api/ai/health passed:", data["service"])

def test_classify():
    payload = json.dumps({
        "title": "Severe pothole and road cave-in",
        "description": "Outer ring road near bus stand has broken tarmac and deep craters."
    }).encode()
    req = urllib.request.Request(f"{BASE_URL}/classify", data=payload, headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode())
    assert data["predicted_department"] == "PWD"
    print(f"✅ /api/ai/classify passed: Predicted {data['predicted_department']} with confidence {data['confidence_score']}")

def test_priority():
    payload = json.dumps({
        "title": "Exposed high voltage wire sparking near children park",
        "description": "Live cable is hanging low and giving off sparks, fatal danger to passersby."
    }).encode()
    req = urllib.request.Request(f"{BASE_URL}/priority", data=payload, headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode())
    assert data["recommended_priority"] == "critical"
    print(f"✅ /api/ai/priority passed: Priority {data['recommended_priority']} (SLA {data['sla_recommended_hours']}h)")

def test_duplicates():
    payload = json.dumps({
        "target_complaint": {
            "id": "1",
            "title": "Broken road and huge pothole",
            "description": "Deep crater on sector 14 road",
            "latitude": 28.7159,
            "longitude": 77.1147
        },
        "candidate_complaints": [
            {
                "id": "2",
                "tracking_number": "JS-2026-99999",
                "title": "Huge pothole on road sector 14",
                "description": "Deep crater on sector 14 road causing accidents",
                "latitude": 28.7160,
                "longitude": 77.1148,
                "status": "in_progress"
            },
            {
                "id": "3",
                "tracking_number": "JS-2026-88888",
                "title": "Water meter replacement request",
                "description": "Need new sub-meter installed in basement",
                "latitude": 28.5000,
                "longitude": 77.0000,
                "status": "resolved"
            }
        ]
    }).encode()
    req = urllib.request.Request(f"{BASE_URL}/duplicates", data=payload, headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode())
    assert data["potential_duplicates_found"] >= 1
    print(f"✅ /api/ai/duplicates passed: Identified {data['potential_duplicates_found']} duplicate candidate")

def test_summarize():
    payload = json.dumps({
        "title": "Drinking water contamination",
        "description": "Residents in Block C have reported yellow pungent smelling tap water for two days."
    }).encode()
    req = urllib.request.Request(f"{BASE_URL}/summarize", data=payload, headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode())
    assert "suggested_next_action" in data
    print("✅ /api/ai/summarize passed:", data["suggested_next_action"])

if __name__ == "__main__":
    test_health()
    test_classify()
    test_priority()
    test_duplicates()
    test_summarize()
    print("\n🎉 ALL AI MICROSERVICE TESTS PASSED SUCCESSFULLY!")
