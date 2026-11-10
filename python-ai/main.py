"""
JanSahayak AI - FastAPI Microservice
Provides intelligent grievance classification, semantic duplicate detection,
priority recommendation, and multilingual assistance.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import uvicorn
import os
from dotenv import load_dotenv

workspace_env = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(workspace_env):
    load_dotenv(dotenv_path=workspace_env)
else:
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

from classifiers.baseline_classifier import classifier
from classifiers.priority_engine import assess_priority
from embeddings.duplicate_detector import find_duplicates
from services.summarizer import generate_summary
from services.multilingual import process_multilingual_text, detect_language

app = FastAPI(
    title="JanSahayak AI Microservice",
    description="Cognitive civic governance intelligence service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# Request & Response Schemas
# ------------------------------------------------------------------------------
class ClassifyRequest(BaseModel):
    title: str = Field(..., min_length=3)
    description: str = Field(..., min_length=5)

class PriorityRequest(BaseModel):
    title: str = Field(..., min_length=3)
    description: str = Field(..., min_length=5)
    context: Optional[Dict[str, Any]] = None

class DuplicateCheckRequest(BaseModel):
    target_complaint: Dict[str, Any]
    candidate_complaints: List[Dict[str, Any]]
    similarity_threshold: Optional[float] = 0.60
    distance_threshold_meters: Optional[float] = 1000.0

class SummarizeRequest(BaseModel):
    title: str
    description: str

class TranslateRequest(BaseModel):
    text: str
    target_lang: Optional[str] = "en"

# ------------------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------------------
@app.get("/api/ai/health")
def health_check():
    return {
        "status": "healthy",
        "service": "JanSahayak AI Microservice",
        "model": "JanSahayak-Tfidf-LogReg-v1",
        "version": "1.0.0",
        "features": [
            "Civic Complaint Categorization",
            "Urgency & Priority Recommendation",
            "Semantic Duplicate Scan (Text + Geolocation)",
            "Executive Action Summarization",
            "Multilingual Support (EN, HI, PA)"
        ]
    }

@app.post("/api/ai/classify")
def classify_complaint(req: ClassifyRequest):
    combined = f"{req.title} {req.description}"
    lang = detect_language(combined)
    pred = classifier.predict(combined)
    pred["detected_language"] = lang
    return pred

@app.post("/api/ai/priority")
def recommend_priority(req: PriorityRequest):
    return assess_priority(req.title, req.description, req.context)

@app.post("/api/ai/duplicates")
def detect_duplicates(req: DuplicateCheckRequest):
    duplicates = find_duplicates(
        target_complaint=req.target_complaint,
        candidate_complaints=req.candidate_complaints,
        similarity_threshold=req.similarity_threshold,
        distance_threshold_meters=req.distance_threshold_meters
    )
    return {
        "target_id": req.target_complaint.get("id"),
        "total_candidates_scanned": len(req.candidate_complaints),
        "potential_duplicates_found": len(duplicates),
        "duplicates": duplicates
    }

@app.post("/api/ai/summarize")
def summarize_complaint(req: SummarizeRequest):
    return generate_summary(req.title, req.description)

@app.post("/api/ai/translate")
def translate_complaint(req: TranslateRequest):
    return process_multilingual_text(req.text, req.target_lang)

if __name__ == "__main__":
    port = int(os.getenv("AI_PORT", 8000))
    host = os.getenv("AI_HOST", "0.0.0.0")
    print(f"Starting JanSahayak AI Service on {host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=False)
