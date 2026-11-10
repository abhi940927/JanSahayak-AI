"""
JanSahayak AI - Duplicate Detection Benchmark Suite
Evaluates the 4 essential governance deduplication scenarios:
Scenario 1: Semantically identical complaints in the same location (True Duplicates)
Scenario 2: Different complaints in the same location (False Positive Risk - e.g., Pothole vs Streetlight in same block)
Scenario 3: Similar complaints in completely different locations (Disparate incidents - e.g., Water burst in Rohini vs Saket)
Scenario 4: Completely unrelated complaints in different locations (True Negatives)

Evaluates varying similarity thresholds (0.50, 0.60, 0.65, 0.70, 0.80) and proximity radii (500m, 800m, 1200m).
Calculates Precision, Recall, False Positive Rate, and F1-score.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from embeddings.duplicate_detector import find_duplicates, haversine_distance

BENCHMARK_CASES = [
    # --- SCENARIO 1: True Duplicates (Same issue, same / close location) -> Expected Duplicate: True
    {
        "target": {
            "title": "Massive crater and deep pothole on MG Road near Metro Pillar 42",
            "description": "Two cars damaged tires on the deep pothole outside metro pillar 42 MG road.",
            "latitude": 28.5355,
            "longitude": 77.3910
        },
        "candidate": {
            "id": "dup-1",
            "tracking_number": "JS-DUP-01",
            "title": "Broken road and huge pothole outside pillar 42 MG Road",
            "description": "Very dangerous crater on MG road right in front of metro pillar 42. Scooter fell down.",
            "latitude": 28.5358,
            "longitude": 77.3912
        },
        "expected_duplicate": True,
        "scenario": "Scenario 1: Same issue, same location"
    },
    {
        "target": {
            "title": "Garbage dump overflowing outside community park gate sector 14",
            "description": "Foul smelling uncollected trash overflowing from large bin onto pedestrian walkway sector 14.",
            "latitude": 28.6139,
            "longitude": 77.2090
        },
        "candidate": {
            "id": "dup-2",
            "tracking_number": "JS-DUP-02",
            "title": "Overflowing waste bin near sector 14 park",
            "description": "Trash not cleared for 4 days outside sector 14 park gate, huge stench and stray dogs.",
            "latitude": 28.6141,
            "longitude": 77.2093
        },
        "expected_duplicate": True,
        "scenario": "Scenario 1: Same issue, same location"
    },

    # --- SCENARIO 2: Different complaints in the same location -> Expected Duplicate: False
    {
        "target": {
            "title": "Streetlight pole non-functional and dark at night",
            "description": "Streetlight number 14 on 3rd main road is completely dead, creating safety risk for women.",
            "latitude": 28.5355,
            "longitude": 77.3910
        },
        "candidate": {
            "id": "nondup-1",
            "tracking_number": "JS-NON-01",
            "title": "Water pipeline burst gushing drinking water onto 3rd main road",
            "description": "Potable water pipeline cracked open near 3rd main road, wasting clean water.",
            "latitude": 28.5356,
            "longitude": 77.3911
        },
        "expected_duplicate": False,
        "scenario": "Scenario 2: Different issue, same location"
    },
    {
        "target": {
            "title": "Stray dog pack aggressive towards schoolchildren",
            "description": "Group of 6 stray dogs barking and biting at schoolchildren near sector 14 park.",
            "latitude": 28.6139,
            "longitude": 77.2090
        },
        "candidate": {
            "id": "nondup-2",
            "tracking_number": "JS-NON-02",
            "title": "Garbage bin overflowing outside sector 14 park gate",
            "description": "Foul smelling uncollected trash overflowing from large bin onto pedestrian walkway sector 14.",
            "latitude": 28.6141,
            "longitude": 77.2093
        },
        "expected_duplicate": False,
        "scenario": "Scenario 2: Different issue, same location"
    },

    # --- SCENARIO 3: Similar complaints in completely different locations -> Expected Duplicate: False
    {
        "target": {
            "title": "Deep pothole and broken asphalt on arterial road",
            "description": "Severe road damage and deep potholes causing traffic jam near Rohini Sector 9.",
            "latitude": 28.7150,
            "longitude": 77.1180
        },
        "candidate": {
            "id": "nondup-3",
            "tracking_number": "JS-NON-03",
            "title": "Deep pothole and broken asphalt on arterial road",
            "description": "Severe road damage and deep potholes causing traffic jam near Saket Metro Station.",
            "latitude": 28.5200,
            "longitude": 77.2100
        },
        "expected_duplicate": False,
        "scenario": "Scenario 3: Similar issue, disparate locations"
    },
    {
        "target": {
            "title": "Transformer sparking fire hazard in residential alley",
            "description": "Electricity transformer sparks continuously near colony market block A Noida.",
            "latitude": 28.5700,
            "longitude": 77.3200
        },
        "candidate": {
            "id": "nondup-4",
            "tracking_number": "JS-NON-04",
            "title": "Transformer sparking fire hazard in residential alley",
            "description": "Electricity transformer sparks continuously near market block B Gurgaon.",
            "latitude": 28.4595,
            "longitude": 77.0266
        },
        "expected_duplicate": False,
        "scenario": "Scenario 3: Similar issue, disparate locations"
    },

    # --- SCENARIO 4: Completely unrelated complaints in different locations -> Expected Duplicate: False
    {
        "target": {
            "title": "Public park bench broken and grass overgrown",
            "description": "Lawn in municipal park has not been mowed and concrete benches are broken in Dwarka.",
            "latitude": 28.5800,
            "longitude": 77.0500
        },
        "candidate": {
            "id": "nondup-5",
            "tracking_number": "JS-NON-05",
            "title": "Contaminated yellow water from kitchen tap with sewage odor",
            "description": "Tap water is discolored and stinks like drain water in Mayur Vihar Phase 1.",
            "latitude": 28.6050,
            "longitude": 77.2950
        },
        "expected_duplicate": False,
        "scenario": "Scenario 4: Unrelated issues, different locations"
    },
    {
        "target": {
            "title": "Illegal loud music and commercial loudspeakers after 11 PM",
            "description": "Banquet hall playing DJ music past midnight violating noise pollution rules in Punjabi Bagh.",
            "latitude": 28.6700,
            "longitude": 77.1300
        },
        "candidate": {
            "id": "nondup-6",
            "tracking_number": "JS-NON-06",
            "title": "Fallen tree branch blocking two-wheeler path after rainstorm",
            "description": "Heavy neem tree branch broke off and fell onto service lane in Vasant Kunj.",
            "latitude": 28.5250,
            "longitude": 77.1550
        },
        "expected_duplicate": False,
        "scenario": "Scenario 4: Unrelated issues, different locations"
    }
]

def evaluate_thresholds():
    print("=== JANSAHAYAK AI - DUPLICATE DETECTION BENCHMARK ===")
    print(f"Total Test Cases: {len(BENCHMARK_CASES)}")
    print("Evaluating Scenarios 1-4 across similarity and distance thresholds...\n")

    threshold_configs = [
        {"sim": 0.50, "dist": 1000.0, "label": "Permissive (Sim 0.50, Dist 1000m)"},
        {"sim": 0.65, "dist": 800.0,  "label": "Standard (Sim 0.65, Dist 800m)"},
        {"sim": 0.70, "dist": 500.0,  "label": "Strict (Sim 0.70, Dist 500m)"},
        {"sim": 0.80, "dist": 400.0,  "label": "Very Strict (Sim 0.80, Dist 400m)"}
    ]

    results = []

    for cfg in threshold_configs:
        tp = fp = tn = fn = 0
        scenario_results = {}

        for case in BENCHMARK_CASES:
            target = case["target"]
            candidate = case["candidate"]
            expected = case["expected_duplicate"]
            scenario = case["scenario"]

            matches = find_duplicates(
                target_complaint=target,
                candidate_complaints=[candidate],
                similarity_threshold=cfg["sim"],
                distance_threshold_meters=cfg["dist"]
            )
            predicted = len(matches) > 0

            if predicted and expected:
                tp += 1
            elif predicted and not expected:
                fp += 1
            elif not predicted and not expected:
                tn += 1
            elif not predicted and expected:
                fn += 1

        precision = tp / (tp + fp) if (tp + fp) > 0 else 1.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

        print(f"--- Config: {cfg['label']} ---")
        print(f"TP: {tp}, FP: {fp}, TN: {tn}, FN: {fn}")
        print(f"Precision: {precision:.4f} ({precision*100:.1f}%)")
        print(f"Recall:    {recall:.4f} ({recall*100:.1f}%)")
        print(f"FPR:       {fpr:.4f} ({fpr*100:.1f}%)")
        print(f"F1-Score:  {f1:.4f}\n")

        results.append({
            "config": cfg["label"],
            "sim_threshold": cfg["sim"],
            "dist_threshold": cfg["dist"],
            "tp": tp, "fp": fp, "tn": tn, "fn": fn,
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "fpr": round(fpr, 4),
            "f1": round(f1, 4)
        })

    # Detailed inspection of standard config
    print("Detailed Analysis on Standard Config (Sim 0.65, Dist 800m):")
    for case in BENCHMARK_CASES:
        matches = find_duplicates(
            case["target"], [case["candidate"]],
            similarity_threshold=0.65, distance_threshold_meters=800.0
        )
        is_dup = len(matches) > 0
        expected = case["expected_duplicate"]
        status = "✅ PASS" if is_dup == expected else "❌ FAIL"
        dist = haversine_distance(
            case["target"]["latitude"], case["target"]["longitude"],
            case["candidate"]["latitude"], case["candidate"]["longitude"]
        )
        print(f"{status} | {case['scenario']:42s} | Pred={is_dup} Exp={expected} | Dist={dist:.1f}m")

    return results

if __name__ == "__main__":
    evaluate_thresholds()
