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

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    history: Optional[List[Dict[str, str]]] = None
    user_context: Optional[Dict[str, Any]] = None

# ------------------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------------------
@app.get("/api/ai/health")
def health_check():
    return {
        "status": "healthy",
        "service": "JanSahayak AI Microservice",
        "model": classifier.model_name,
        "version": classifier.model_version,
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
    lang_info = detect_language(combined)
    pred = classifier.predict(combined)
    pred["detected_language"] = lang_info.get("language_code", "en") if isinstance(lang_info, dict) else lang_info
    pred["language_details"] = lang_info if isinstance(lang_info, dict) else {"language_code": lang_info}
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

@app.post("/api/ai/chat")
def chat_assistant(req: ChatRequest):
    msg = req.message.strip()
    lang_info = detect_language(msg)
    lang_code = lang_info.get("language_code", "en") if isinstance(lang_info, dict) else "en"
    is_hindi = lang_code in ["hi", "hi-Latn"] or any('\u0900' <= c <= '\u097f' for c in msg)

    lower = msg.lower()
    greetings = ["hi", "hello", "hey", "namaste", "pranam", "kaise ho", "help", "नमस्ते", "प्रणाम", "हेलो", "हाय"]

    # Check for simple greeting
    if any(lower == g or lower.startswith(g + " ") for g in greetings) and len(msg.split()) <= 3:
        if is_hindi:
            reply = (
                "नमस्ते! मैं जनसहायक AI सहायक हूँ। 🏛️\n"
                "आप किसी भी सरकारी नागरिक समस्या (सड़क, सीवर, बिजली, पानी, सफाई, पुलिस, राशन, आदि) के बारे में यहाँ सीधे लिख सकते हैं। "
                "आपको कोई बड़ा फॉर्म भरने की आवश्यकता नहीं है—मैं आपकी समस्या समझकर सीधे शिकायत दर्ज करवा दूंगा!"
            )
        else:
            reply = (
                "Hello! I am your JanSahayak AI Assistant. 🏛️\n"
                "You can tell me about any civic problem (roads, water, electricity, sanitation, police, ration, etc.) directly in plain English or Hindi. "
                "No need to fill out long forms—I will automatically detect the department, classify your grievance, and file it for you with one click!"
            )
        return {
            "reply": reply,
            "detected_language": "hi" if is_hindi else "en",
            "grievance_draft": None
        }

    # Grievance / Civic issue detection & classification
    pred = classifier.predict(msg)
    dept_name = pred.get("predicted_department_name", pred.get("predicted_department"))
    dept_code = pred.get("predicted_department")
    cat_name = pred.get("predicted_category")
    priority = pred.get("predicted_priority", "medium")
    confidence = pred.get("confidence_score", 0.90)

    # Clean title formulation
    title = msg.split(".")[0].split("\n")[0][:80].strip()
    if len(title) < 15:
        title = f"{cat_name} - {dept_name}"

    grievance_draft = {
        "title": title,
        "description": msg,
        "department_code": dept_code,
        "department_name": dept_name,
        "category_name": cat_name,
        "priority": priority,
        "confidence_score": confidence,
        "ready_to_file": True
    }

    if is_hindi:
        reply = (
            f"मैंने आपकी नागरिक समस्या को **{dept_name}** के लिए चिन्हित कर लिया है। 🏛️\n\n"
            f"• **लक्षित विभाग:** {dept_name} ({dept_code})\n"
            f"• **शिकायत श्रेणी:** {cat_name}\n"
            f"• **प्राथमिकता:** {priority.upper()}\n\n"
            f"📍 **आवश्यक जानकारी:** कृपया नीचे कार्ड में अपना **घटना स्थल / GPS लोकेशन** दर्ज करें और यदि संभव हो तो **फोटो** जोड़ें।\n"
            f"इसके बाद 'शिकायत दर्ज करें' पर क्लिक करते ही आपका **यूनिक ट्रैकिंग ID** तुरंत जारी हो जाएगा!"
        )
    else:
        reply = (
            f"I have identified your civic issue for **{dept_name}**. 🏛️\n\n"
            f"• **Target Department:** {dept_name} ({dept_code})\n"
            f"• **Category:** {cat_name}\n"
            f"• **Assessed Priority:** {priority.upper()}\n\n"
            f"📍 **Required Next Steps:** Please confirm your **Incident Location / GPS**, attach a site **Photo** if available, and submit below to instantly generate your **Unique Tracking ID**!"
        )

    return {
        "reply": reply,
        "detected_language": "hi" if is_hindi else "en",
        "grievance_draft": grievance_draft
    }

if __name__ == "__main__":
    port = int(os.getenv("AI_PORT", 8000))
    host = os.getenv("AI_HOST", "0.0.0.0")
    print(f"Starting JanSahayak AI Service on {host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=False)
