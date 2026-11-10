"""
JanSahayak AI - Enhanced Multilingual Processing Engine
Complies with Indian Digital Governance & RTI Standards:
1. Original citizen text is NEVER altered, overwritten, or corrupted.
2. Supports English, Hindi (Devanagari), Punjabi (Gurmukhi), and Romanized/Code-mixed Hinglish.
3. Provides translation as an advisory aid for officers without altering the official legal record.
"""

import re
from typing import Dict, Any

# Common Romanized Hinglish/Punjabi civic keywords
HINGLISH_CIVIC_KEYWORDS = {
    "sadak": "road", "tuti": "broken", "gadha": "pothole", "gaddha": "pothole",
    "pani": "water", "paani": "water", "ganda": "contaminated", "nahin": "not",
    "nahi": "not", "bijli": "electricity", "chali": "went off", "kuda": "garbage",
    "kachra": "trash", "badbu": "foul smell", "taar": "wire", "choli": "leak",
    "batti": "light", "roshni": "illumination", "nal": "tap", "sewer": "sewage",
    "khulla": "open", "manhole": "manhole", "aspataal": "hospital"
}

# Devanagari Civic Terms dictionary for officer translation aid
HINDI_CIVIC_DICTIONARY = {
    "सड़क": "road", "टूटी": "broken", "गड्ढा": "pothole", "गड्ढे": "potholes",
    "पानी": "water", "गंदा पानी": "contaminated sewage water", "पीने का पानी": "drinking water",
    "बिजली": "electricity", "कटौती": "outage", "आग": "fire", "चिंगारी": "sparking",
    "करंट": "electric current", "तार": "wire", "खुला मैनहोल": "open manhole",
    "कचरा": "garbage", "कूड़ा": "waste/trash", "बदबू": "foul smell", "नाली": "drain",
    "अस्पताल": "hospital", "मरीज": "patient", "डेंगू": "dengue", "मलेरिया": "malaria",
    "स्ट्रीट लाइट": "street light", "अतिक्रमण": "illegal encroachment"
}

# Gurmukhi Civic Terms dictionary
PUNJABI_CIVIC_DICTIONARY = {
    "ਸੜਕ": "road", "ਟੋਇਆ": "pothole", "ਟੋਏ": "potholes", "ਪਾਣੀ": "water",
    "ਗੰਦਾ ਪਾਣੀ": "dirty water", "ਕੂੜਾ": "garbage", "ਬਿਜਲੀ": "electricity",
    "ਮੈਨਹੋਲ": "manhole", "ਖ਼ਤਰਨਾਕ": "dangerous", "ਅੱਗ": "fire",
    "ਦਰਖ਼ਤ": "tree", "ਗਲੀ": "street/alley", "ਨੁਕਸਾਨ": "damage"
}

def detect_language(text: str) -> Dict[str, Any]:
    """
    Detects language code and confidence based on Unicode script analysis and lexicon matching.
    Codes: 'hi' (Hindi), 'pa' (Punjabi), 'en' (English), 'hi-Latn' (Hinglish/Code-mixed)
    """
    if not text or not text.strip():
        return {"language_code": "en", "language_name": "English", "confidence": 1.0, "script": "Latin"}

    gurmukhi_chars = len(re.findall(r'[\u0A00-\u0A7F]', text))
    devanagari_chars = len(re.findall(r'[\u0900-\u097F]', text))
    total_alpha = len(re.findall(r'[a-zA-Z\u0900-\u097F\u0A00-\u0A7F]', text))

    if total_alpha == 0:
        return {"language_code": "en", "language_name": "English", "confidence": 0.5, "script": "Numeric/Symbol"}

    # Script-based detection
    if gurmukhi_chars / total_alpha > 0.20:
        return {"language_code": "pa", "language_name": "Punjabi", "confidence": 0.95, "script": "Gurmukhi"}
    
    if devanagari_chars / total_alpha > 0.20:
        return {"language_code": "hi", "language_name": "Hindi", "confidence": 0.95, "script": "Devanagari"}

    # Check for Romanized Hinglish
    tokens = [t.lower() for t in re.findall(r'\b\w+\b', text)]
    hinglish_matches = [t for t in tokens if t in HINGLISH_CIVIC_KEYWORDS]
    if len(hinglish_matches) >= 2 or (len(tokens) > 0 and len(hinglish_matches) / len(tokens) >= 0.25):
        return {"language_code": "hi-Latn", "language_name": "Hinglish (Romanized Hindi)", "confidence": 0.85, "script": "Latin"}

    return {"language_code": "en", "language_name": "English", "confidence": 0.92, "script": "Latin"}

def process_multilingual_text(text: str, target_lang: str = "en") -> Dict[str, Any]:
    """
    Processes multilingual text, produces officer-friendly gloss translation,
    and certifies original text immutability.
    """
    detection = detect_language(text)
    lang_code = detection["language_code"]
    
    # Generate translated explanation
    translated_explanation = text
    matched_glossary = []

    if lang_code == "hi":
        translated_explanation = text
        for hi_term, en_term in HINDI_CIVIC_DICTIONARY.items():
            if hi_term in text:
                matched_glossary.append(f"{hi_term} -> {en_term}")
        if matched_glossary:
            translated_explanation = f"[Hindi Grievance Summary]: Expressing civic grievance regarding {', '.join([g.split(' -> ')[1] for g in matched_glossary[:4]])}. Original text: '{text}'"

    elif lang_code == "pa":
        for pa_term, en_term in PUNJABI_CIVIC_DICTIONARY.items():
            if pa_term in text:
                matched_glossary.append(f"{pa_term} -> {en_term}")
        if matched_glossary:
            translated_explanation = f"[Punjabi Grievance Summary]: Expressing civic grievance regarding {', '.join([g.split(' -> ')[1] for g in matched_glossary[:4]])}. Original text: '{text}'"

    elif lang_code == "hi-Latn":
        tokens = [t.lower() for t in re.findall(r'\b\w+\b', text)]
        for token in tokens:
            if token in HINGLISH_CIVIC_KEYWORDS:
                matched_glossary.append(f"{token} -> {HINGLISH_CIVIC_KEYWORDS[token]}")
        if matched_glossary:
            translated_explanation = f"[Code-Mixed Hinglish Grievance]: Citizen describes {', '.join([g.split(' -> ')[1] for g in matched_glossary[:4]])} issue. Original text: '{text}'"

    return {
        "original_text": text, # STRICT IMMUTABILITY: Never modified
        "detected_language": lang_code,
        "language_name": detection["language_name"],
        "confidence": detection["confidence"],
        "script": detection["script"],
        "target_language": target_lang,
        "translated_text": translated_explanation,
        "glossary_terms": matched_glossary,
        "is_translated": lang_code != target_lang,
        "disclaimer": "The original citizen submission is immutable and preserved for judicial and RTI record integrity. English translation is an advisory cognitive aid for reviewing officers.",
        "legal_disclaimer": "The original citizen submission is immutable and preserved for judicial and RTI record integrity. English translation is an advisory cognitive aid for reviewing officers."
    }
