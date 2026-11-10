"""
JanSahayak AI - Benchmark Suite for Priority Recommendation Engine
Tests 32 ground-truth civic scenarios (English, Hindi, Punjabi, Edge Cases) across 4 priority levels:
Critical, High, Medium, Low.
Calculates Accuracy, Precision, Recall, Confusion Matrix, and identifies False High/Low predictions.
"""

PRIORITY_BENCHMARK = [
    # --- CRITICAL (Life safety hazard, electrocution, open manholes, contaminated drinking water, fire) ---
    ("Live 11kV electrical wire snapped on wet road sparking fire", "critical"),
    ("Open storm drain manhole on dark street without barricade", "critical"),
    ("Muddy sewage water coming from tap, multiple children hospitalized with cholera", "critical"),
    ("Transformer burst and caught fire outside petrol pump", "critical"),
    ("Overhead footbridge collapsed into traffic carriageway", "critical"),
    ("तार से चिंगारी निकल रही है और आग लग गई है", "critical"), # Hindi: Wire sparking and caught fire
    ("ਖੁੱਲਾ ਮੈਨਹੋਲ ਬੱਚਿਆਂ ਲਈ ਬਹੁਤ ਖ਼ਤਰਨਾਕ ਹੈ", "critical"), # Punjabi: Open manhole dangerous for kids
    ("Toxic chemical foam and gas leak from industrial drainage line", "critical"),

    # --- HIGH (Major public infrastructure breakdown, large road crater, area blackout, epidemic outbreak) ---
    ("Deep pothole and road cave-in causing vehicle axle damage and accidents", "high"),
    ("Main 12-inch drinking water feeder pipeline burst, highway submerged", "high"),
    ("Complete power blackout in entire residential block for past 14 hours", "high"),
    ("Severe dengue and malaria outbreak, stagnant water pools in colony", "high"),
    ("Traffic signal dead at 4-way intersection causing massive traffic jams", "high"),
    ("सड़क पर बहुत बड़ा गड्ढा हो गया है और एक्सीडेंट हो रहे हैं", "high"), # Hindi: Huge pothole causing accidents
    ("ਸੜਕ ਤੇ ਵੱਡਾ ਟੋਇਆ ਵਾਹਨਾਂ ਦਾ ਨੁਕਸਾਨ ਕਰ ਰਿਹਾ ਹੈ", "high"), # Punjabi: Big pothole damaging vehicles
    ("Hospital emergency wing refusing admission due to non-functional oxygen supply", "high"),

    # --- MEDIUM (Standard municipal service degradation, garbage, streetlights, encroachment) ---
    ("Municipal garbage container overflowing onto street for 4 days", "medium"),
    ("Non-functional streetlights on residential colony road for a week", "medium"),
    ("Street hawkers encroaching public sidewalk forcing pedestrians onto road", "medium"),
    ("Stray dog pack roaming near community park barking at passersby", "medium"),
    ("Low water pressure during morning supply hours in residential block", "medium"),
    ("कचरे का ढेर सड़क पर लगा हुआ है और बदबू आ रही है", "medium"), # Hindi: Garbage pile on road with foul odor
    ("ਗਲੀ ਵਿੱਚ ਕੂੜਾ ਇਕੱਠਾ ਹੋ ਗਿਆ ਹੈ", "medium"), # Punjabi: Garbage accumulated in alley
    ("Illegal commercial parking blocking colony entrance gate", "medium"),

    # --- LOW (Routine maintenance, administrative inquiries, cosmetic defects) ---
    ("Faded road lane markings on link avenue need repainting", "low"),
    ("Street name board rusted and difficult to read at night", "low"),
    ("Request for tree pruning along sidewalk for upcoming monsoon", "low"),
    ("Inquiry regarding municipal property tax receipt issuance delay", "low"),
    ("Dry tree branches fallen inside colony green park", "low"),
    ("बोर्ड पर लिखा हुआ नाम मिट गया है नया लगवाना है", "low"), # Hindi: Board name faded need new one
    ("ਗਾਰਡਨ ਦੀ ਘਾਹ ਕੱਟਣ ਦੀ ਬੇਨਤੀ", "low"), # Punjabi: Request for park lawn mowing
    ("Public bench in community park has loose wooden plank", "low")
]

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from classifiers.priority_engine import assess_priority
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

def run_priority_benchmark():
    y_true = [item[1] for item in PRIORITY_BENCHMARK]
    y_pred = []
    explanations = []

    for text, expected in PRIORITY_BENCHMARK:
        pred_res = assess_priority(text, text)
        y_pred.append(pred_res["recommended_priority"])
        explanations.append(pred_res.get("rationale", ""))

    labels = ["critical", "high", "medium", "low"]
    acc = accuracy_score(y_true, y_pred)
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    rep = classification_report(y_true, y_pred, labels=labels, output_dict=True, zero_division=0)

    print("=== PRIORITY ENGINE BENCHMARK EVALUATION ===")
    print(f"Total Test Cases: {len(PRIORITY_BENCHMARK)} (8 per priority level)")
    print(f"Overall Accuracy: {acc:.4f} ({acc*100:.1f}%)\n")

    print(f"{'Priority':10s} | {'Precision':10s} | {'Recall':10s} | {'F1-Score':10s} | {'Support':7s}")
    print("-" * 55)
    for lbl in labels:
        m = rep[lbl]
        print(f"{lbl:10s} | {m['precision']:.4f}     | {m['recall']:.4f}  | {m['f1-score']:.4f}    | {int(m['support'])}")

    print("\nConfusion Matrix (Row=Actual, Col=Predicted):")
    print("Labels:", labels)
    print(cm)

    # False High vs False Low analysis
    false_critical = 0
    false_low = 0
    for true_lbl, pred_lbl, (txt, _) in zip(y_true, y_pred, PRIORITY_BENCHMARK):
        if pred_lbl == "critical" and true_lbl != "critical":
            false_critical += 1
            print(f"⚠️ False Critical: '{txt[:40]}...' (Expected {true_lbl})")
        if pred_lbl == "low" and true_lbl in ["critical", "high"]:
            false_low += 1
            print(f"🚨 False Low: '{txt[:40]}...' (Expected {true_lbl})")

    print(f"\nFalse Critical Predictions: {false_critical}")
    print(f"False Low Predictions:      {false_low}")

    return {
        "accuracy": float(acc),
        "classification_report": rep,
        "confusion_matrix": cm.tolist(),
        "false_critical": false_critical,
        "false_low": false_low
    }

if __name__ == "__main__":
    run_priority_benchmark()
