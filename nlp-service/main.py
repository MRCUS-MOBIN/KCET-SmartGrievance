"""
KCET 360° SmartGrievance — NLP FastAPI Service
TF-IDF + Logistic Regression classifier with Tamil/Tanglish support.

Endpoints:
  GET  /health           — service status
  POST /predict          — classify complaint text → category + department
  POST /similar          — find top-N similar complaints (duplicate detection)
  POST /preprocess       — debug: inspect preprocessed tokens

Tamil/Tanglish support:
  - Transliteration normalisation for common Tanglish patterns
  - Tamil Unicode passthrough (character n-grams in TF-IDF handle this)
  - 'lang' hint accepted but preprocessing auto-detects script

Run: uvicorn main:app --reload --port 8001
Train first: python train.py
"""

import json
import os
import re
import unicodedata
import warnings
from pathlib import Path
from typing import List, Optional

import joblib
import nltk
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

warnings.filterwarnings("ignore")

# ── NLTK ──────────────────────────────────────────────────────────────────────
nltk.download("stopwords", quiet=True)
nltk.download("punkt", quiet=True)
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer

STOP_WORDS = set(stopwords.words("english"))
stemmer = PorterStemmer()

# ── Department routing table (all 20 categories) ──────────────────────────────
DEPARTMENT_MAP = {
    "Hostel & Residential Facilities":              "Hostel Maintenance Office",
    "All Academic Departments":                     "Relevant Department HOD",
    "Laboratories & Workshops":                     "Lab In-charge / Department HOD",
    "Canteen & Food Services":                      "Canteen Management",
    "Campus Infrastructure & Maintenance":          "Facilities & Maintenance Department",
    "Toilets & Sanitation":                         "Facilities & Maintenance Department",
    "Transport & College Buses":                    "Transport Office",
    "Physical Education (PT) & Sports":             "Physical Education Department",
    "Library & Learning Resources":                 "Librarian",
    "Xerox, Stationery & Campus Shops":             "Campus Administration",
    "IT, Wi-Fi & Digital Services":                 "IT Department",
    "Examinations & Academic Administration":       "Examinations Cell / COE",
    "Fees, Scholarships & Finance":                 "Accounts & Finance Office",
    "Student Welfare & Health":                     "Student Welfare Officer",
    "Safety, Respect & Student Protection":         "Safety Review Committee (RESTRICTED)",
    "Faculty, Staff & Department Administration":   "Relevant Department HOD / Principal",
    "Placement, Internship & Career Services":      "Placement Cell",
    "Campus Environment & Sustainability":          "Facilities & Administration",
    "Events, Clubs & Student Activities":           "Student Affairs / Dean of Students",
    "Administration & General Services":            "College Administration Office",
}

SENSITIVE_CATEGORIES = {"Safety, Respect & Student Protection"}

# ── Load Model ─────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / "models"
PIPELINE_PATH = MODELS_DIR / "pipeline.joblib"

pipeline = None
label_list: List[str] = []

def load_model():
    global pipeline, label_list
    if PIPELINE_PATH.exists():
        pipeline = joblib.load(PIPELINE_PATH)
        labels_path = MODELS_DIR / "labels.json"
        if labels_path.exists():
            with open(labels_path, encoding="utf-8") as f:
                label_list = json.load(f)
        print(f"[OK] Model loaded from {PIPELINE_PATH} ({len(label_list)} categories)")
    else:
        print("[!] No trained model found. Run `python train.py` first.")
        print("    Falling back to keyword-based classification.")

load_model()

# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="KCET 360° SmartGrievance NLP Service",
    description="TF-IDF + Logistic Regression complaint classifier with Tamil/Tanglish support.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Tamil/Tanglish Preprocessing ──────────────────────────────────────────────
# Common Tanglish → English normalisation map
TANGLISH_MAP = {
    "hostel la": "in hostel",
    "hostel le": "in hostel",
    "mess la": "in mess",
    "bathroom la": "in bathroom",
    "toilet la": "in toilet",
    "lab la": "in lab",
    "class la": "in class",
    "bus la": "in bus",
    "canteen la": "in canteen",
    "library la": "in library",
    "vantha": "arrived",
    "varala": "not coming",
    "illai": "not available",
    "illa": "not available",
    "kedaiyadhu": "not available",
    "kedaiyathu": "not available",
    "velaikku": "working",
    "velai": "work",
    "pannala": "not done",
    "pannavillai": "not done",
    "saptitu": "ate",
    "saapidu": "eat food",
    "saaptu": "ate",
    "thanni": "water",
    "thaniye": "water",
    "light": "electricity",
    "current": "electricity",
    "problem": "problem",
    "issue": "issue",
    "complaint": "complaint",
    "damage": "damaged",
    "broken": "broken",
    "work illai": "not working",
    "seyyala": "not done",
    "pochu": "broke down",
    "late aa": "late",
    "late aga": "late",
    "late vudhu": "arriving late",
    "wifi": "wifi internet",
    "net": "internet",
    "fee": "fees",
    "mark": "marks",
    "exam": "examination",
    "result": "result",
}

def normalize_tanglish(text: str) -> str:
    """Apply Tanglish → English normalisation rules."""
    text = text.lower()
    for tanglish, english in TANGLISH_MAP.items():
        text = text.replace(tanglish, english)
    return text

def has_tamil_script(text: str) -> bool:
    """Check if text contains Tamil Unicode characters."""
    return any('\u0B80' <= c <= '\u0BFF' for c in text)

def preprocess(text: str, lang: str = "en") -> str:
    """
    Clean and normalise complaint text.
    - Tamil Unicode: kept as-is for character n-gram TF-IDF
    - Tanglish: normalised to English keywords first
    - English: lowercase, remove punctuation, remove stopwords, stem
    """
    if has_tamil_script(text):
        # Tamil: keep Unicode, lowercase ASCII portions, basic cleanup
        text = re.sub(r'[^\u0B80-\u0BFF\sa-z0-9]', ' ', text.lower())
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    if lang == "tanglish" or lang == "ta":
        text = normalize_tanglish(text)

    text = text.lower()
    text = re.sub(r"[^a-z\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    tokens = text.split()
    tokens = [stemmer.stem(t) for t in tokens if t not in STOP_WORDS and len(t) > 2]
    return " ".join(tokens)


# ── Keyword fallback — ALL 20 categories ──────────────────────────────────────
KEYWORD_FALLBACK = {
    "Hostel & Residential Facilities": [
        "hostel", "warden", "mess", "room", "dormitory", "hostel room",
        "hostel water", "hostel bathroom", "hostel wifi", "laundry",
        "boys hostel", "girls hostel", "hostel food", "hostel electricity",
        "thanni", "hostel la", "mess la",
    ],
    "All Academic Departments": [
        "professor", "faculty", "lecture", "class", "teaching", "academic",
        "classroom", "department", "cse", "ece", "eee", "mechanical", "civil",
        "biotech", "timetable", "syllabus", "mentor", "project guidance",
        "class la", "dept", "hod",
    ],
    "Laboratories & Workshops": [
        "lab", "laboratory", "equipment", "experiment", "workshop", "computer lab",
        "system", "software", "hardware", "circuit", "lab computer", "lab equipment",
        "lab assistant", "practical", "lab la", "lab schedule",
    ],
    "Canteen & Food Services": [
        "canteen", "food", "meal", "lunch", "breakfast", "dinner", "snack",
        "eat", "hygiene", "taste", "price", "menu", "serving", "plate",
        "saapidu", "canteen la", "mess food", "canteen food", "water canteen",
    ],
    "Campus Infrastructure & Maintenance": [
        "classroom", "building", "fan", "projector", "bench", "road", "wall",
        "construction", "parking", "drainage", "pest", "infrastructure",
        "furniture", "classroom fan", "ac", "paint", "accessibility",
    ],
    "Toilets & Sanitation": [
        "toilet", "washroom", "bathroom", "sanitation", "hygiene", "clean",
        "soap", "lock", "door", "flush", "water toilet", "ventilation",
        "toilet clean", "toilet water", "toilet lock",
    ],
    "Transport & College Buses": [
        "bus", "route", "driver", "transport", "vehicle", "late bus",
        "bus timing", "conductor", "overcrowd", "bus pass", "bus route",
        "late aa", "bus la", "bus problem", "gps bus", "bus breakdown",
    ],
    "Physical Education (PT) & Sports": [
        "sports", "ground", "gym", "cricket", "football", "basketball",
        "pt", "physical education", "coach", "sports equipment", "athletic",
        "sports event", "indoor sports", "outdoor", "injury",
    ],
    "Library & Learning Resources": [
        "library", "book", "reading", "journal", "periodical", "librarian",
        "ebook", "digital library", "borrow", "return", "fine library",
        "reading room", "library timing", "library computer",
    ],
    "Xerox, Stationery & Campus Shops": [
        "xerox", "photocopy", "print", "stationery", "shop", "pen",
        "notebook", "overcharge", "campus shop", "token", "id card print",
        "billing", "price shop",
    ],
    "IT, Wi-Fi & Digital Services": [
        "wifi", "internet", "portal", "erp", "network", "connectivity",
        "password", "login", "slow internet", "online", "lms",
        "attendance portal", "email", "cybersecurity", "net", "bandwidth",
    ],
    "Examinations & Academic Administration": [
        "exam", "marks", "hall ticket", "result", "revaluation", "internal",
        "external", "arrear", "supplementary", "anna university", "grade",
        "mark sheet", "exam schedule", "malpractice", "coe",
    ],
    "Fees, Scholarships & Finance": [
        "fee", "scholarship", "finance", "payment", "receipt", "refund",
        "caution deposit", "bc scholarship", "mbc", "sc st scholarship",
        "excess fee", "fine penalty", "fee waiver", "financial",
    ],
    "Student Welfare & Health": [
        "health", "medical", "doctor", "nurse", "counseling", "mental health",
        "welfare", "ambulance", "first aid", "insurance", "women cell",
        "disability support", "anti ragging cell",
    ],
    "Safety, Respect & Student Protection": [
        "ragging", "bully", "harass", "threaten", "stalk", "discriminat",
        "assault", "violence", "posh", "sexual harassment", "cyberbully",
        "coercion", "retaliation", "unsafe", "danger",
    ],
    "Faculty, Staff & Department Administration": [
        "faculty conduct", "staff behavior", "bias", "favoritism", "mentor",
        "hod response", "office hours", "department staff", "support staff",
        "faculty absent", "faculty late", "faculty communication",
    ],
    "Placement, Internship & Career Services": [
        "placement", "internship", "career", "job", "recruitment", "resume",
        "interview", "placement cell", "company", "stipend", "off campus",
        "placement portal", "eligibility criteria",
    ],
    "Campus Environment & Sustainability": [
        "clean campus", "litter", "garbage", "waste", "recycle", "green",
        "tree", "stray animal", "noise campus", "dust", "energy waste",
        "solar", "beautification", "environment",
    ],
    "Events, Clubs & Student Activities": [
        "fest", "event", "club", "student council", "cultural", "technical",
        "hackathon", "competition", "permission event", "student activity",
        "budget club", "sports club", "election student",
    ],
    "Administration & General Services": [
        "certificate", "bonafide", "transfer certificate", "noc", "id card",
        "attendance", "leave", "gate pass", "dress code", "admin",
        "office", "general", "suggestion", "feedback",
    ],
}

def keyword_predict(text: str, lang: str = "en") -> dict:
    """Keyword-based fallback when model is not trained yet."""
    if lang in ("ta", "tanglish"):
        text = normalize_tanglish(text)
    lower = text.lower()
    scores = {}
    for cat, words in KEYWORD_FALLBACK.items():
        scores[cat] = sum(1 for w in words if w in lower)
    best = max(scores, key=scores.get)
    top3 = sorted(
        [{"category": k, "score": v} for k, v in scores.items()],
        key=lambda x: -x["score"]
    )[:3]

    if scores[best] == 0:
        return {
            "predictedCategory": "Administration & General Services",
            "confidence": None,
            "isSensitive": False,
            "suggestedDepartment": "College Administration Office",
            "needsHumanReview": True,
            "method": "keyword-fallback",
            "top3": top3,
        }
    return {
        "predictedCategory": best,
        "confidence": None,
        "isSensitive": best in SENSITIVE_CATEGORIES,
        "suggestedDepartment": DEPARTMENT_MAP.get(best, "College Administration Office"),
        "needsHumanReview": True,
        "method": "keyword-fallback",
        "top3": top3,
    }


# ── Request / Response models ──────────────────────────────────────────────────
class PredictRequest(BaseModel):
    text: str = Field(..., min_length=3, max_length=5000,
                      description="Complaint text — English, Tamil, or Tanglish")
    lang: str = Field("en", description="Language hint: 'en', 'ta', or 'tanglish'")

class SimilarRequest(BaseModel):
    text: str = Field(..., min_length=3, max_length=5000)
    corpus: List[str] = Field(..., description="List of existing complaint texts to compare against")
    top_n: int = Field(3, ge=1, le=10)
    lang: str = Field("en")

class PreprocessRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    lang: str = Field("en")


# ── Routes ─────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "KCET 360° SmartGrievance NLP",
        "version": "2.0.0",
        "modelLoaded": pipeline is not None,
        "categories": len(label_list),
        "tamilSupport": True,
        "tanglishSupport": True,
    }


@app.post("/predict")
def predict(payload: PredictRequest):
    """
    Classify a complaint text.
    Returns: predictedCategory, confidence, suggestedDepartment, needsHumanReview, top3
    Accepts 'lang' hint: 'en' (default), 'ta' (Tamil), 'tanglish'.
    NLP assists routing — final decision rests with authorized staff.
    Sensitive complaints are flagged and routed to restricted safety queue.
    """
    lang = payload.lang.lower() if payload.lang else "en"

    if pipeline is None:
        return keyword_predict(payload.text, lang)

    cleaned = preprocess(payload.text, lang)
    if not cleaned.strip():
        return keyword_predict(payload.text, lang)

    try:
        proba = pipeline.predict_proba([cleaned])[0]
        classes = pipeline.classes_
    except Exception:
        return keyword_predict(payload.text, lang)

    top_idx = int(np.argmax(proba))
    predicted = classes[top_idx]
    confidence = float(proba[top_idx])

    # Build top-3 scores for transparency
    top3_idx = np.argsort(proba)[::-1][:3]
    top3 = [{"category": classes[i], "score": round(float(proba[i]), 3)} for i in top3_idx]

    is_sensitive = predicted in SENSITIVE_CATEGORIES
    needs_review = confidence < 0.60 or is_sensitive  # always review sensitive

    return {
        "predictedCategory": predicted,
        "confidence": round(confidence, 3),
        "isSensitive": is_sensitive,
        "suggestedDepartment": DEPARTMENT_MAP.get(predicted, "College Administration Office"),
        "needsHumanReview": needs_review,
        "method": f"tfidf-logreg-v2-{lang}",
        "top3": top3,
    }


@app.post("/similar")
def similar(payload: SimilarRequest):
    """
    Compute cosine similarity between input text and a corpus of complaint texts.
    Returns top-N most similar entries — used to detect potential duplicates.
    """
    from sklearn.metrics.pairwise import cosine_similarity

    if pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Run python train.py first.")

    lang = payload.lang.lower() if payload.lang else "en"
    vectorizer = pipeline.named_steps["tfidf"]
    all_texts = [preprocess(payload.text, lang)] + [preprocess(t, lang) for t in payload.corpus]

    try:
        vectors = vectorizer.transform(all_texts)
    except Exception:
        raise HTTPException(status_code=422, detail="Could not vectorize input.")

    query_vec = vectors[0]
    corpus_vecs = vectors[1:]
    scores = cosine_similarity(query_vec, corpus_vecs)[0]

    top_n = min(payload.top_n, len(payload.corpus))
    top_idx = np.argsort(scores)[::-1][:top_n]
    results = [
        {"index": int(i), "score": round(float(scores[i]), 3), "text": payload.corpus[i]}
        for i in top_idx if scores[i] > 0.10
    ]
    return {"matches": results, "total": len(results)}


@app.post("/preprocess")
def debug_preprocess(payload: PreprocessRequest):
    """Debug endpoint: see how text is preprocessed before classification."""
    lang = payload.lang.lower() if payload.lang else "en"
    cleaned = preprocess(payload.text, lang)
    return {
        "original": payload.text,
        "processed": cleaned,
        "tokens": cleaned.split(),
        "lang": lang,
        "hasTamilScript": has_tamil_script(payload.text),
    }
