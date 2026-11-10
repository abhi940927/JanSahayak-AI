"""
JanSahayak AI - Complaint Summarizer & NLP Engine
Generates executive briefings for reviewing officers.
"""

import os
import requests
import json

def generate_summary(title: str, description: str) -> dict:
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()

    # Rule-based NLP extraction fallback (robust, deterministic, zero-cost)
    sentences = [s.strip() for s in description.replace('\n', '. ').split('.') if len(s.strip()) > 5]
    first_sentence = sentences[0] if sentences else title
    
    # Analyze sentiment / urgency tone
    lower_desc = description.lower()
    has_urgency = any(w in lower_desc for w in ['emergency', 'danger', 'hazard', 'immediately', 'critical', 'accident'])
    
    # Heuristic next action based on content keywords
    if 'water' in lower_desc or 'drain' in lower_desc or 'pipeline' in lower_desc:
        action = "Dispatch field inspection unit for pipeline pressure test and contamination sampling."
    elif 'electric' in lower_desc or 'wire' in lower_desc or 'transformer' in lower_desc:
        action = "Issue immediate shutdown alert to substation and deploy line technician."
    elif 'pothole' in lower_desc or 'road' in lower_desc:
        action = "Schedule asphalt repair crew and place safety barricades with reflectors."
    elif 'garbage' in lower_desc or 'waste' in lower_desc:
        action = "Reroute nearest municipal dumper truck and notify sanitation inspector."
    else:
        action = "Assign field inspection officer for physical on-site verification within SLA window."

    fallback_summary = {
        "summary": f"{title}. {first_sentence}",
        "main_issue": title,
        "reported_impact": "Disruption to local residents and potential safety risk to daily commuters." if has_urgency else "Public civic inconvenience requiring municipal attention.",
        "suggested_next_action": action,
        "generator": "JanSahayak-Rule-NLP-Summarizer",
        "is_llm_generated": False
    }

    # If Gemini API key is configured, use Gemini API
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            prompt = f"""
            Analyze this citizen grievance and return a JSON object with keys:
            summary, main_issue, reported_impact, suggested_next_action.
            
            Title: {title}
            Description: {description}
            """
            res = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=4)
            if res.status_code == 200:
                text_res = res.json()['candidates'][0]['content']['parts'][0]['text']
                # parse JSON block
                clean_json = text_res.replace('```json', '').replace('```', '').strip()
                parsed = json.loads(clean_json)
                parsed["generator"] = "Google-Gemini-1.5-Flash"
                parsed["is_llm_generated"] = True
                return parsed
        except Exception as e:
            fallback_summary["llm_error"] = str(e)

    return fallback_summary
