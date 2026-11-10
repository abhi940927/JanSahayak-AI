"""
JanSahayak AI - Baseline Complaint Classifier
Uses Scikit-learn Pipeline (TfidfVectorizer + MultinomialNB / LogisticRegression)
Trained on representative civic complaints dataset.
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import numpy as np

# Ground-truth training dataset with Indian civic governance domain samples
TRAINING_DATA = [
    # MCD - Municipal Corporation & Sanitation
    ("Garbage not picked up from street corner for 5 days. Huge stink and flies.", "MCD", "Uncollected Garbage"),
    ("Trash bin overflowing on main market road, dogs scattering plastic everywhere.", "MCD", "Uncollected Garbage"),
    ("Open dumping of construction debris on public sidewalk.", "MCD", "Uncollected Garbage"),
    ("Stray dog pack chasing two wheelers at night near children playground.", "MCD", "Stray Animals"),
    ("Hawkers have encroached entire footpath forcing pedestrians to walk on busy road.", "MCD", "Illegal Encroachment"),
    ("Dead animal lying near sector park needs immediate removal.", "MCD", "Sanitation Emergency"),

    # PWD - Public Works Department
    ("Deep pothole on link road caused scooter accident yesterday night.", "PWD", "Potholes & Broken Roads"),
    ("Road surface completely washed away after rain, crater formed.", "PWD", "Potholes & Broken Roads"),
    ("Storm water drain manhole cover broken and left open without warning barricade.", "PWD", "Open Manhole Hazard"),
    ("Flyover expansion joint loose and creating dangerous bump for vehicles.", "PWD", "Bridge & Flyover"),
    ("Foot overbridge stairs rusted and broken, risky for senior citizens.", "PWD", "Public Infrastructure"),

    # EPD - Electricity & Power
    ("High voltage power line hanging low across residential alley.", "EPD", "Exposed Electrical Wires"),
    ("Transformer caught fire with sparking near colony grocery store.", "EPD", "Exposed Electrical Wires"),
    ("Continuous blackout in entire block for past 10 hours in peak summer.", "EPD", "Prolonged Power Outage"),
    ("Streetlights not working on entire 2 km stretch, pitch dark road.", "EPD", "Non-Functional Streetlights"),
    ("Electricity meter running at triple speed after power surge.", "EPD", "Billing & Meter Dispute"),

    # DJB - Water Supply & Sewerage
    ("Muddy and foul smelling sewer water coming from municipal drinking tap.", "DJB", "Contaminated Water"),
    ("Main drinking water pipeline burst, thousands of liters gushing onto highway.", "DJB", "Pipeline Leakage"),
    ("No water supply in colony for last 3 days, water tanker hasn't arrived.", "DJB", "Water Supply Interruption"),
    ("Underground sewer choked, dirty drainage water overflowing into residential ground floor.", "DJB", "Overflowing Sewage"),
    ("Low water pressure in 4th floor apartments throughout the morning hours.", "DJB", "Low Pressure"),

    # TPD - Traffic & Transport
    ("Traffic light signal completely dead at 4-way intersection causing massive jam.", "TPD", "Traffic Signal Breakdown"),
    ("Buses stopping in middle of road blocking ambulance lane.", "TPD", "Bus Route Congestion"),
    ("Illegal commercial parking blocking fire tender access gate.", "TPD", "Illegal Parking"),
    ("Speed breaker unpainted and without warning sign causing spine injuries.", "TPD", "Road Safety"),

    # HFW - Health & Family Welfare
    ("Stagnant water pond created after rain, heavy mosquito breeding, dengue fever spreading.", "HFW", "Vector-Borne Disease"),
    ("Government dispensary closed during emergency duty hours, no doctor present.", "HFW", "Clinic Staff Negligence"),
    ("Hospital emergency counter refusing admission to accident victim without money.", "HFW", "Hospital Emergency Neglect"),
    ("Lack of anti-rabies vaccine in primary health center after dog bite.", "HFW", "Medicine Shortage")
]

class CivicClassifier:
    def __init__(self):
        self.texts = [item[0] for item in TRAINING_DATA]
        self.departments = [item[1] for item in TRAINING_DATA]
        self.categories = [item[2] for item in TRAINING_DATA]

        self.dept_pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english', min_df=1)),
            ('clf', LogisticRegression(random_state=42, max_iter=200, C=5.0))
        ])

        self.cat_pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english', min_df=1)),
            ('clf', LogisticRegression(random_state=42, max_iter=200, C=5.0))
        ])

        # Train model on initialization
        self.dept_pipeline.fit(self.texts, self.departments)
        self.cat_pipeline.fit(self.texts, self.categories)
        self.classes_ = self.dept_pipeline.named_steps['clf'].classes_

    def predict(self, text: str):
        cleaned = text.strip()
        dept_pred = self.dept_pipeline.predict([cleaned])[0]
        cat_pred = self.cat_pipeline.predict([cleaned])[0]

        probs = self.dept_pipeline.predict_proba([cleaned])[0]
        confidence = float(np.max(probs))

        return {
            "predicted_department": dept_pred,
            "predicted_category": cat_pred,
            "confidence_score": round(confidence, 4),
            "model_name": "JanSahayak-Tfidf-LogReg-v1",
            "model_version": "1.0.0"
        }

# Global singleton
classifier = CivicClassifier()
