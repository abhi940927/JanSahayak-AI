"""
JanSahayak AI - Classifier Model Selection and Hyperparameter Tuning
Evaluates multiple architectures on the stratified train/test split.
"""

from build_dataset_and_evaluate import CORPUS
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression, SGDClassifier
from sklearn.naive_bayes import MultinomialNB, ComplementNB
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix
import joblib
import os
import json

texts = [c[0] for c in CORPUS]
departments = [c[1] for c in CORPUS]
categories = [c[2] for c in CORPUS]

X_train, X_test, y_train, y_test = train_test_split(
    texts, departments, test_size=0.20, random_state=42, stratify=departments
)

candidates = {
    "LogisticRegression_C5": Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english', sublinear_tf=False)),
        ('clf', LogisticRegression(C=5.0, max_iter=300, random_state=42))
    ]),
    "LogisticRegression_C10_sublinear": Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english', sublinear_tf=True)),
        ('clf', LogisticRegression(C=10.0, max_iter=300, random_state=42))
    ]),
    "ComplementNB": Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english')),
        ('clf', ComplementNB(alpha=0.5))
    ]),
    "MultinomialNB": Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english')),
        ('clf', MultinomialNB(alpha=0.3))
    ]),
    "LinearSVC_Calibrated": Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english', sublinear_tf=True)),
        ('clf', CalibratedClassifierCV(LinearSVC(C=1.5, random_state=42), cv=3))
    ]),
    "SGD_ModifiedHuber": Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english', sublinear_tf=True)),
        ('clf', SGDClassifier(loss='modified_huber', alpha=1e-4, max_iter=500, random_state=42))
    ]),
    "RandomForest": Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english')),
        ('clf', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
}

print(f"{'Model Name':35s} | {'Accuracy':8s} | {'Macro F1':8s} | {'Weighted F1':11s}")
print("-" * 70)

best_name = None
best_f1 = -1
best_model = None

for name, pipe in candidates.items():
    pipe.fit(X_train, y_train)
    preds = pipe.predict(X_test)
    acc = accuracy_score(y_test, preds)
    f1_m = f1_score(y_test, preds, average='macro', zero_division=0)
    f1_w = f1_score(y_test, preds, average='weighted', zero_division=0)
    print(f"{name:35s} | {acc:.4f}   | {f1_m:.4f}   | {f1_w:.4f}")

    if f1_m > best_f1:
        best_f1 = f1_m
        best_name = name
        best_model = pipe

print(f"\n🏆 Best Candidate: {best_name} with Macro F1: {best_f1:.4f}")

# Train the best architecture on the full dataset and save to disk
final_pipe = candidates[best_name]
final_pipe.fit(texts, departments)

models_dir = os.path.dirname(__file__)
model_path = os.path.join(models_dir, "civic_department_classifier.joblib")
joblib.dump(final_pipe, model_path)
print(f"✅ Saved optimal model to: {model_path}")

# Run detailed report for the winning model on test split
winning_pipe = candidates[best_name]
winning_pipe.fit(X_train, y_train)
winning_preds = winning_pipe.predict(X_test)
labels = sorted(list(set(y_test)))
cm = confusion_matrix(y_test, winning_preds, labels=labels)
rep = classification_report(y_test, winning_preds, labels=labels, output_dict=True, zero_division=0)

print("\nOptimal Model Confusion Matrix:")
print("Labels:", labels)
print(cm)

tuning_output = {
    "best_model": best_name,
    "best_macro_f1": float(best_f1),
    "accuracy": float(accuracy_score(y_test, winning_preds)),
    "classification_report": rep,
    "confusion_matrix": cm.tolist()
}

with open(os.path.join(models_dir, "model_tuning_results.json"), "w") as f:
    json.dump(tuning_output, f, indent=2)
