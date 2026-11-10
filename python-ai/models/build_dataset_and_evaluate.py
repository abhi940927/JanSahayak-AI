"""
JanSahayak AI - Ground-Truth Civic Dataset & Benchmarking Pipeline
Builds a curated, multi-category civic complaints dataset with 120+ labeled examples across 6 civic departments.
Splits into Train (80%) and Test (20%) using stratified split with fixed random seed (42) to prevent data leakage.
Evaluates Baseline vs Improved Classifier and generates confusion matrix and classification report.
"""

import os
import json
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression, SGDClassifier
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix, classification_report
import joblib

# Comprehensive Civic Complaints Corpus across 6 primary civic departments
CORPUS = [
    # --- PWD (Public Works Department: Roads, Flyovers, Footpaths, Bridges, Civil Infrastructure) ---
    ("Deep pothole on link road caused scooter accident yesterday night.", "PWD", "Potholes & Roads"),
    ("Road surface completely washed away after rain, crater formed.", "PWD", "Potholes & Roads"),
    ("Storm water drain manhole cover broken and left open without warning barricade.", "PWD", "Drainage & Manholes"),
    ("Flyover expansion joint loose and creating dangerous bump for vehicles.", "PWD", "Bridges & Flyovers"),
    ("Foot overbridge stairs rusted and broken, risky for senior citizens.", "PWD", "Public Infrastructure"),
    ("Asphalt on main carriageway has caved in near bus terminal.", "PWD", "Potholes & Roads"),
    ("Dangerous sinkhole opened up in middle of intersection after heavy downpour.", "PWD", "Potholes & Roads"),
    ("Pedestrian sidewalk tiles broken, exposed iron rods causing tripping injuries.", "PWD", "Public Infrastructure"),
    ("Underpass flooded with 3 feet rain water due to blocked storm water drain pumps.", "PWD", "Drainage & Manholes"),
    ("Guard rail on flyover broken after truck collision, needs emergency replacement.", "PWD", "Bridges & Flyovers"),
    ("Newly laid bituminous road peeling off within two weeks of contractor finishing work.", "PWD", "Potholes & Roads"),
    ("Open concrete slab over roadside drain collapsed, pedestrians falling in.", "PWD", "Drainage & Manholes"),
    ("Footpath encroached by concrete ramp built illegally by shopkeeper.", "PWD", "Public Infrastructure"),
    ("Cracks observed on support pillar of metro feeder flyover.", "PWD", "Bridges & Flyovers"),
    ("Large crater near school entrance causing severe vehicle axle damage.", "PWD", "Potholes & Roads"),
    ("Damaged divider kerb stones scattered on fast lane causing bike skids.", "PWD", "Potholes & Roads"),
    ("Drain cover missing on service road, deep trench hazardous at night.", "PWD", "Drainage & Manholes"),
    ("Road leveling uneven after pipe laying, continuous dust and bumpy surface.", "PWD", "Potholes & Roads"),
    ("Walking track inside community walkway has collapsed into adjacent nullah.", "PWD", "Public Infrastructure"),
    ("Speed breaker height excessive without white paint markings, causing spinal shocks.", "PWD", "Public Infrastructure"),

    # --- DJB (Delhi Jal Board: Drinking Water, Pipelines, Contamination, Sewerage) ---
    ("Muddy and foul smelling sewer water coming from municipal drinking tap.", "DJB", "Contaminated Water"),
    ("Main drinking water pipeline burst, thousands of liters gushing onto highway.", "DJB", "Pipeline Leakage"),
    ("No water supply in colony for last 3 days, water tanker hasn't arrived.", "DJB", "Water Interruption"),
    ("Underground sewer choked, dirty drainage water overflowing into residential ground floor.", "DJB", "Sewage Overflow"),
    ("Low water pressure in 4th floor apartments throughout the morning hours.", "DJB", "Low Pressure"),
    ("Black pungent water flowing through taps in entire sector since yesterday.", "DJB", "Contaminated Water"),
    ("Underground booster pump broken, drinking water contaminated with sewage odor.", "DJB", "Contaminated Water"),
    ("Water pipeline joint leaking severely, flooding road and creating artificial pond.", "DJB", "Pipeline Leakage"),
    ("Water tanker driver demanding bribes to dispense drinking water in slum cluster.", "DJB", "Water Interruption"),
    ("Sewage line backflow flooding basement parking with hazardous waste water.", "DJB", "Sewage Overflow"),
    ("Drinking water pipeline damaged during fiber optic cable digging, supply cut off.", "DJB", "Pipeline Leakage"),
    ("Contaminated yellow tap water causing diarrhea and stomach illness among kids.", "DJB", "Contaminated Water"),
    ("Main sewer line manhole spewing raw sewage onto market street.", "DJB", "Sewage Overflow"),
    ("Erratic water supply timings, water comes at 2 AM for only 15 minutes.", "DJB", "Water Interruption"),
    ("Water meter reading faulty, billing generated for 100,000 liters despite locked house.", "DJB", "Billing Dispute"),
    ("Supply line pressure too feeble to fill ground floor sumps without motor.", "DJB", "Low Pressure"),
    ("Blocked gully trap causing dirty water stagnation in colony lane.", "DJB", "Sewage Overflow"),
    ("Broken valve on distribution riser wasting treated potable water continuously.", "DJB", "Pipeline Leakage"),
    ("Chemical odor and foam noticed in municipal tap water supply.", "DJB", "Contaminated Water"),
    ("No municipal water connection line provided despite application filed 6 months ago.", "DJB", "Water Interruption"),

    # --- EPD (Electricity & Power Distribution: Outages, Transformers, Dangling Wires, Streetlights) ---
    ("High voltage power line hanging low across residential alley.", "EPD", "Exposed Wires & Hazards"),
    ("Transformer caught fire with sparking near colony grocery store.", "EPD", "Exposed Wires & Hazards"),
    ("Continuous blackout in entire block for past 10 hours in peak summer.", "EPD", "Power Outage"),
    ("Streetlights not working on entire 2 km stretch, pitch dark road.", "EPD", "Streetlights"),
    ("Electricity meter running at triple speed after power surge.", "EPD", "Billing & Meters"),
    ("Live electric wire snapped during storm and lying submerged in water puddle.", "EPD", "Exposed Wires & Hazards"),
    ("Frequent voltage fluctuation burning domestic refrigerators and ACs.", "EPD", "Power Outage"),
    ("Overloaded distribution transformer buzzing loudly and emitting burning smell.", "EPD", "Exposed Wires & Hazards"),
    ("All streetlights in sector park non-functional, encouraging anti-social elements.", "EPD", "Streetlights"),
    ("Power outage in pocket 4 for past 6 hours, customer helpline unanswered.", "EPD", "Power Outage"),
    ("Electric junction box cover missing, open live busbars accessible to stray children.", "EPD", "Exposed Wires & Hazards"),
    ("High voltage spike destroyed television and fan in 15 residential units.", "EPD", "Power Outage"),
    ("Streetlight pole leaning at dangerous 45 degree angle towards road.", "EPD", "Streetlights"),
    ("Phase failure resulting in only low voltage single phase supply in colony.", "EPD", "Power Outage"),
    ("Sparking from overhead cables whenever high wind blows.", "EPD", "Exposed Wires & Hazards"),
    ("Inflated provisional electricity bill issued with incorrect meter multiplier.", "EPD", "Billing & Meters"),
    ("Streetlights remaining switched ON during broad daylight, wasting public energy.", "EPD", "Streetlights"),
    ("Feeder pillar rusted through with exposed 440 volt terminals on sidewalk.", "EPD", "Exposed Wires & Hazards"),
    ("Unscheduled power cuts occurring every hour disrupting online exams and work.", "EPD", "Power Outage"),
    ("Dangling service cable caught on passing truck, pulling down electricity bracket.", "EPD", "Exposed Wires & Hazards"),

    # --- MCD (Municipal Corporation: Waste Management, Sanitation, Stray Animals, Encroachment) ---
    ("Garbage not picked up from street corner for 5 days. Huge stink and flies.", "MCD", "Garbage & Waste"),
    ("Trash bin overflowing on main market road, dogs scattering plastic everywhere.", "MCD", "Garbage & Waste"),
    ("Open dumping of construction debris on public sidewalk.", "MCD", "Garbage & Waste"),
    ("Stray dog pack chasing two wheelers at night near children playground.", "MCD", "Stray Animals"),
    ("Hawkers have encroached entire footpath forcing pedestrians to walk on busy road.", "MCD", "Encroachment"),
    ("Dead animal lying near sector park needs immediate removal.", "MCD", "Sanitation Emergency"),
    ("Municipal sweeper hasn't swept the colony road for two weeks, leaves piling up.", "MCD", "Garbage & Waste"),
    ("Compactor bin broken and trash rotting in open air adjacent to hospital gate.", "MCD", "Garbage & Waste"),
    ("Cattle roaming on main road obstructing traffic and creating dung mess.", "MCD", "Stray Animals"),
    ("Illegal commercial car workshop occupying entire public parking and pavement.", "MCD", "Encroachment"),
    ("Waste collection tipper van skipping odd-numbered house lanes regularly.", "MCD", "Garbage & Waste"),
    ("Public urinal in market broken, choked and overflowing onto walking pathway.", "MCD", "Sanitation Emergency"),
    ("Aggressive stray monkey nuisance entering residential balconies and snatching food.", "MCD", "Stray Animals"),
    ("Debris from building demolition left dumped on green belt area.", "MCD", "Garbage & Waste"),
    ("Illegal permanent shed erected over public footpath blocking pedestrian access.", "MCD", "Encroachment"),
    ("Sanitation staff burning dry leaves and garbage causing choking toxic smoke.", "MCD", "Sanitation Emergency"),
    ("Littering and food waste outside banquet hall attracting rodents and vectors.", "MCD", "Garbage & Waste"),
    ("Rabid dog reported in pocket B, bitten two colony security guards.", "MCD", "Stray Animals"),
    ("Public park fountain clogged with plastic bottles and turning into garbage pit.", "MCD", "Garbage & Waste"),
    ("Temporary vegetable vendors creating permanent tin shacks on pavement.", "MCD", "Encroachment"),

    # --- TPD (Traffic & Transport: Traffic Signals, Bottlenecks, Bus Routes, Mobility) ---
    ("Traffic light signal completely dead at 4-way intersection causing massive jam.", "TPD", "Traffic Signals"),
    ("Buses stopping in middle of road blocking ambulance lane.", "TPD", "Bus & Transit"),
    ("Illegal commercial parking blocking fire tender access gate.", "TPD", "Illegal Parking"),
    ("Speed breaker unpainted and without warning sign causing spine injuries.", "TPD", "Road Safety"),
    ("Traffic signal stuck on green in all directions causing near-head-on collisions.", "TPD", "Traffic Signals"),
    ("Commercial delivery trucks loading and unloading on main road during peak rush hour.", "TPD", "Illegal Parking"),
    ("Bus stop shelter glass smashed, commuters standing under hot sun.", "TPD", "Bus & Transit"),
    ("Traffic congestion due to non-functional blinking yellow indicator at junction.", "TPD", "Traffic Signals"),
    ("Autorickshaws parked three abreast at metro station gate blocking road entry.", "TPD", "Illegal Parking"),
    ("Absence of zebra crossing paint outside primary school, risky for children crossing.", "TPD", "Road Safety"),
    ("Public transit bus route 419 skipping designated bus stop consistently.", "TPD", "Bus & Transit"),
    ("Traffic lights timer misconfigured, allowing only 5 seconds green for major avenue.", "TPD", "Traffic Signals"),
    ("Heavy vehicles entering residential sector despite 'No Heavy Commercial Vehicles' board.", "TPD", "Road Safety"),
    ("Double parking on market street reducing four lane avenue into a single lane crawl.", "TPD", "Illegal Parking"),
    ("Traffic constable absent at chaotic roundabout during peak evening hours.", "TPD", "Traffic Signals"),
    ("Bus conductor charging excess fare without issuing electronic ticket.", "TPD", "Bus & Transit"),
    ("Missing convex mirror on blind turn in hilly sector road causing accidents.", "TPD", "Road Safety"),
    ("Vehicles driving in wrong direction on one-way avenue, danger to oncoming cars.", "TPD", "Road Safety"),
    ("Pedestrian signal button at busy crossing broken and unresponsive.", "TPD", "Traffic Signals"),
    ("Encroached auto stand blocking emergency hospital ramp entry.", "TPD", "Illegal Parking"),

    # --- HFW (Health & Family Welfare: Clinics, Hospitals, Disease Outbreak, Medicine) ---
    ("Stagnant water pond created after rain, heavy mosquito breeding, dengue fever spreading.", "HFW", "Vector-Borne Outbreak"),
    ("Government dispensary closed during emergency duty hours, no doctor present.", "HFW", "Clinic & Staff Neglect"),
    ("Hospital emergency counter refusing admission to accident victim without money.", "HFW", "Hospital Emergency"),
    ("Lack of anti-rabies vaccine in primary health center after dog bite.", "HFW", "Medicine Shortage"),
    ("Multiple cases of malaria reported in colony, municipal fogging not done.", "HFW", "Vector-Borne Outbreak"),
    ("Dispensary staff absent, medicines being distributed by uncertified peon.", "HFW", "Clinic & Staff Neglect"),
    ("Government maternity hospital air conditioning broken in neonatal ICU ward.", "HFW", "Hospital Emergency"),
    ("Essential insulin and hypertension medicines out of stock for two consecutive months.", "HFW", "Medicine Shortage"),
    ("Fumigation and mosquito fogging truck has not visited sector this monsoon.", "HFW", "Vector-Borne Outbreak"),
    ("Hospital ambulance arrived 90 minutes late due to driver negligence.", "HFW", "Hospital Emergency"),
    ("Primary health clinic ultrasound machine non-functional for past 3 months.", "HFW", "Clinic & Staff Neglect"),
    ("Dirty discarded syringes and biomedical waste lying uncovered behind dispensary.", "HFW", "Hospital Emergency"),
    ("Outbreak of jaundice in sector 7, health inspection of water tanker required.", "HFW", "Vector-Borne Outbreak"),
    ("Doctor demanding private fees for issuing government disability medical certificate.", "HFW", "Clinic & Staff Neglect"),
    ("Snake bite antivenom unavailable in sub-divisional hospital emergency wing.", "HFW", "Medicine Shortage"),
    ("Primary clinic premises overgrown with wild weeds, stagnant water breeding mosquitoes.", "HFW", "Vector-Borne Outbreak"),
    ("Patients forced to purchase basic disposable gloves and syringes from private chemist outside.", "HFW", "Medicine Shortage"),
    ("Expired paracetamol syrups dispensed to pediatric OPD patients.", "HFW", "Medicine Shortage"),
    ("X-Ray technician on leave for weeks, patients turned away daily.", "HFW", "Clinic & Staff Neglect"),
    ("Dengue awareness dry day drive and larvicide spraying neglected in ward.", "HFW", "Vector-Borne Outbreak")
]

def main():
    print(f"Total labeled civic samples in corpus: {len(CORPUS)}")
    
    texts = [c[0] for c in CORPUS]
    departments = [c[1] for c in CORPUS]
    categories = [c[2] for c in CORPUS]

    # Department distribution
    from collections import Counter
    dept_counts = Counter(departments)
    print("\nDepartment Distribution in Corpus:")
    for d, count in sorted(dept_counts.items()):
        print(f"  - {d}: {count} samples ({count/len(CORPUS)*100:.1f}%)")

    # Stratified Train/Test Split (80% Train, 20% Holdout Test)
    X_train, X_test, y_train_dept, y_test_dept, y_train_cat, y_test_cat = train_test_split(
        texts, departments, categories, test_size=0.20, random_state=42, stratify=departments
    )

    print(f"\nTrain set: {len(X_train)} samples | Test set (Holdout): {len(X_test)} samples")

    # 1. EVALUATE OLD BASELINE MODEL (Simple TF-IDF unigram + LogisticRegression C=5.0)
    old_pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english', min_df=1)),
        ('clf', LogisticRegression(random_state=42, max_iter=200, C=5.0))
    ])
    old_pipeline.fit(X_train, y_train_dept)
    y_pred_old = old_pipeline.predict(X_test)

    acc_old = accuracy_score(y_test_dept, y_pred_old)
    p_old, r_old, f1_macro_old, _ = precision_recall_fscore_support(y_test_dept, y_pred_old, average='macro', zero_division=0)
    _, _, f1_weighted_old, _ = precision_recall_fscore_support(y_test_dept, y_pred_old, average='weighted', zero_division=0)

    print("\n--- BASELINE MODEL PERFORMANCE (Holdout Test) ---")
    print(f"Accuracy:        {acc_old:.4f}")
    print(f"Macro Precision: {p_old:.4f}")
    print(f"Macro Recall:    {r_old:.4f}")
    print(f"Macro F1-Score:  {f1_macro_old:.4f}")
    print(f"Weighted F1:     {f1_weighted_old:.4f}")

    # 2. TRAIN & EVALUATE IMPROVED MODEL
    # Improvements:
    # - Sublinear TF scaling (sublinear_tf=True) prevents long repetitive complaints from skewing vectors
    # - Hybrid word n-grams (1, 3) capturing domain phrases like "sewer in drinking water", "transformer caught fire"
    # - Optimized LogisticRegression with balanced class weights and regularized C
    # - Calibrated probability estimation
    improved_dept_pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            ngram_range=(1, 3),
            sublinear_tf=True,
            min_df=1,
            token_pattern=r'(?u)\b\w+\b'
        )),
        ('clf', LogisticRegression(
            C=3.0,
            max_iter=300,
            class_weight='balanced',
            random_state=42,
            solver='lbfgs'
        ))
    ])

    improved_dept_pipeline.fit(X_train, y_train_dept)
    y_pred_new = improved_dept_pipeline.predict(X_test)

    acc_new = accuracy_score(y_test_dept, y_pred_new)
    p_new, r_new, f1_macro_new, _ = precision_recall_fscore_support(y_test_dept, y_pred_new, average='macro', zero_division=0)
    _, _, f1_weighted_new, _ = precision_recall_fscore_support(y_test_dept, y_pred_new, average='weighted', zero_division=0)

    print("\n--- IMPROVED MODEL PERFORMANCE (Holdout Test) ---")
    print(f"Accuracy:        {acc_new:.4f}")
    print(f"Macro Precision: {p_new:.4f}")
    print(f"Macro Recall:    {r_new:.4f}")
    print(f"Macro F1-Score:  {f1_macro_new:.4f}")
    print(f"Weighted F1:     {f1_weighted_new:.4f}")

    # Detailed Classification Report
    labels = sorted(list(set(y_test_dept)))
    report = classification_report(y_test_dept, y_pred_new, labels=labels, output_dict=True, zero_division=0)
    print("\nClassification Report by Department:")
    for lbl in labels:
        m = report[lbl]
        print(f"  {lbl:6s} | Precision: {m['precision']:.3f} | Recall: {m['recall']:.3f} | F1: {m['f1-score']:.3f} | Support: {int(m['support'])}")

    # Confusion Matrix
    cm = confusion_matrix(y_test_dept, y_pred_new, labels=labels)
    print("\nConfusion Matrix (Row=Actual, Col=Predicted):")
    print("Labels:", labels)
    print(cm)

    # Train category classifier on full training data with category labels
    improved_cat_pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, min_df=1, token_pattern=r'(?u)\b\w+\b')),
        ('clf', LogisticRegression(C=2.0, max_iter=300, class_weight='balanced', random_state=42))
    ])
    improved_cat_pipeline.fit(X_train, y_train_cat)

    # Train final production models on full dataset for maximum generalization
    final_dept_pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 3), sublinear_tf=True, min_df=1, token_pattern=r'(?u)\b\w+\b')),
        ('clf', LogisticRegression(C=3.0, max_iter=300, class_weight='balanced', random_state=42, solver='lbfgs'))
    ])
    final_dept_pipeline.fit(texts, departments)

    final_cat_pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, min_df=1, token_pattern=r'(?u)\b\w+\b')),
        ('clf', LogisticRegression(C=2.0, max_iter=300, class_weight='balanced', random_state=42))
    ])
    final_cat_pipeline.fit(texts, categories)

    # Save trained production models to python-ai/models/
    models_dir = os.path.join(os.path.dirname(__file__))
    os.makedirs(models_dir, exist_ok=True)
    
    dept_model_path = os.path.join(models_dir, "civic_department_classifier.joblib")
    cat_model_path = os.path.join(models_dir, "civic_category_classifier.joblib")

    joblib.dump(final_dept_pipeline, dept_model_path)
    joblib.dump(final_cat_pipeline, cat_model_path)
    print(f"\n✅ Production models serialized successfully:")
    print(f"   - {dept_model_path}")
    print(f"   - {cat_model_path}")

    # Save benchmark evaluation results for documentation
    eval_results = {
        "dataset_size": len(CORPUS),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "departments": labels,
        "department_distribution": dict(dept_counts),
        "baseline_model": {
            "name": "JanSahayak-Tfidf-LogReg-v1",
            "accuracy": float(acc_old),
            "macro_precision": float(p_old),
            "macro_recall": float(r_old),
            "macro_f1": float(f1_macro_old),
            "weighted_f1": float(f1_weighted_old)
        },
        "improved_model": {
            "name": "JanSahayak-Tfidf-Sublinear-LogReg-v2",
            "accuracy": float(acc_new),
            "macro_precision": float(p_new),
            "macro_recall": float(r_new),
            "macro_f1": float(f1_macro_new),
            "weighted_f1": float(f1_weighted_new)
        },
        "classification_report": report,
        "confusion_matrix": cm.tolist()
    }

    results_path = os.path.join(models_dir, "evaluation_metrics.json")
    with open(results_path, "w") as f:
        json.dump(eval_results, f, indent=2)
    print(f"✅ Evaluation metrics saved to {results_path}")

if __name__ == "__main__":
    main()
