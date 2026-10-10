"""
KCET 360° SmartGrievance — NLP Model Training Script
Trains TF-IDF + Logistic Regression on all 20 categories.

Run: python train.py
Outputs:
  models/pipeline.joblib   — trained pipeline
  models/labels.json       — category list
  models/eval_report.txt   — accuracy + confusion matrix summary
"""

import json
import os
import re
import warnings
import nltk
import joblib
import numpy as np
from collections import Counter
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.pipeline import Pipeline

warnings.filterwarnings("ignore")

# ── NLTK data download ─────────────────────────────────────────────────────────
print("Downloading NLTK data...")
nltk.download("stopwords", quiet=True)
nltk.download("punkt", quiet=True)

STOP_WORDS = set(stopwords.words("english"))
stemmer = PorterStemmer()

# ── Text Preprocessing (mirrors main.py) ─────────────────────────────────────
TANGLISH_MAP = {
    "thanni": "water", "varala": "not coming", "illa": "not available",
    "illai": "not available", "vantha": "arrived", "pochu": "broke down",
    "pannala": "not done", "saapidu": "eat food", "late aa": "late",
    "hostel la": "in hostel", "lab la": "in lab", "canteen la": "in canteen",
    "class la": "in class", "bus la": "in bus", "mess la": "in mess",
    "velai": "work", "light": "electricity", "current": "electricity",
    "kedaiyathu": "not available", "seyyala": "not done",
}

def has_tamil_script(text):
    return any('\u0B80' <= c <= '\u0BFF' for c in text)

def preprocess(text: str) -> str:
    """Clean, normalise (Tanglish), lowercase, remove stopwords, stem."""
    if has_tamil_script(text):
        text = re.sub(r'[^\u0B80-\u0BFF\sa-z0-9]', ' ', text.lower())
        return re.sub(r'\s+', ' ', text).strip()
    # Tanglish normalise
    lower = text.lower()
    for tanglish, english in TANGLISH_MAP.items():
        lower = lower.replace(tanglish, english)
    lower = re.sub(r"[^a-z\s]", " ", lower)
    lower = re.sub(r"\s+", " ", lower).strip()
    tokens = lower.split()
    tokens = [stemmer.stem(t) for t in tokens if t not in STOP_WORDS and len(t) > 2]
    return " ".join(tokens)

# ── Load Training Data ─────────────────────────────────────────────────────────
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "training_data.json")
print(f"\nLoading training data from {DATA_PATH} ...")

with open(DATA_PATH, "r", encoding="utf-8") as f:
    raw = json.load(f)

samples = raw["data"]
texts  = [s["text"] for s in samples]
labels = [s["label"] for s in samples]
processed_texts = [preprocess(t) for t in texts]

print(f"\nTotal samples  : {len(texts)}")
print(f"Categories     : {len(set(labels))}")

# Per-category sample count
label_counts = Counter(labels)
print("\n-- Per-Category Sample Count ------------------------------------------")
for cat in sorted(label_counts):
    count = label_counts[cat]
    bar   = "#" * (count // 2)
    flag  = " [!] LOW" if count < 20 else ""
    print(f"  {count:3d}  {bar}  {cat}{flag}")
print()

# ── Train / Test Split ─────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    processed_texts, labels, test_size=0.2, random_state=42, stratify=labels
)

# ── Pipeline: TF-IDF + Logistic Regression ────────────────────────────────────
pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(
        ngram_range=(1, 2),         # unigrams + bigrams
        max_features=8000,          # expanded for 20 categories
        sublinear_tf=True,
        analyzer="word",
        min_df=1,
    )),
    ("clf", LogisticRegression(
        max_iter=2000,
        C=5.0,
        solver="lbfgs",
        random_state=42,
    )),
])

print("Training TF-IDF + Logistic Regression pipeline...")
pipeline.fit(X_train, y_train)

# ── Evaluate ──────────────────────────────────────────────────────────────────
y_pred    = pipeline.predict(X_test)
accuracy  = accuracy_score(y_test, y_pred)
cv_scores = cross_val_score(pipeline, processed_texts, labels, cv=5, scoring="accuracy")

print(f"\n[OK] Test Accuracy       : {accuracy * 100:.1f}%")
print(f"[OK] 5-Fold CV Accuracy  : {np.mean(cv_scores) * 100:.1f}% +/- {np.std(cv_scores) * 100:.1f}%")
print("\n-- Classification Report ------------------------------------------")
report = classification_report(y_test, y_pred)
print(report)

# ── Save Model ────────────────────────────────────────────────────────────────
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

pipeline_path = os.path.join(MODELS_DIR, "pipeline.joblib")
joblib.dump(pipeline, pipeline_path)
print(f"\n[OK] Pipeline saved -> {pipeline_path}")

labels_path = os.path.join(MODELS_DIR, "labels.json")
with open(labels_path, "w", encoding="utf-8") as f:
    json.dump(sorted(set(labels)), f, indent=2, ensure_ascii=False)
print(f"[OK] Labels saved  -> {labels_path}")

# ── Save eval report ──────────────────────────────────────────────────────────
report_path = os.path.join(MODELS_DIR, "eval_report.txt")
with open(report_path, "w", encoding="utf-8") as f:
    f.write("KCET 360° SmartGrievance — NLP Evaluation Report\n")
    f.write("=" * 60 + "\n\n")
    f.write(f"Total samples   : {len(texts)}\n")
    f.write(f"Test accuracy   : {accuracy * 100:.1f}%\n")
    f.write(f"5-Fold CV acc   : {np.mean(cv_scores) * 100:.1f}% ± {np.std(cv_scores) * 100:.1f}%\n\n")
    f.write("Per-Category Sample Count:\n")
    for cat in sorted(label_counts):
        f.write(f"  {label_counts[cat]:3d}  {cat}\n")
    f.write("\nClassification Report:\n")
    f.write(report)
    f.write("\nNote: NLP assists routing — human review is always required for final decisions.\n")

print(f"[OK] Eval report   -> {report_path}")
print("\nTraining complete. Run: uvicorn main:app --reload --port 8001")
