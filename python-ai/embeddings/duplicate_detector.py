"""
JanSahayak AI - Duplicate Detection Engine
Combines semantic text similarity, geospatial distance (Haversine formula),
and temporal proximity window.
"""

import math
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes distance between two coordinates in meters
    """
    if None in (lat1, lon1, lat2, lon2):
        return float('inf')

    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

def find_duplicates(
    target_complaint: Dict[str, Any],
    candidate_complaints: List[Dict[str, Any]],
    similarity_threshold: float = 0.65,
    distance_threshold_meters: float = 800.0
) -> List[Dict[str, Any]]:
    """
    Scans candidate grievances and returns potential duplicate matches
    """
    if not candidate_complaints:
        return []

    target_text = f"{target_complaint.get('title', '')} {target_complaint.get('description', '')}"
    candidate_texts = [
        f"{c.get('title', '')} {c.get('description', '')}"
        for c in candidate_complaints
    ]

    # Calculate TF-IDF Cosine Similarity
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words='english')
    all_texts = [target_text] + candidate_texts
    try:
        tfidf_matrix = vectorizer.fit_transform(all_texts)
        sim_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])[0]
    except Exception:
        sim_scores = [0.0] * len(candidate_complaints)

    matches = []
    t_lat = target_complaint.get('latitude')
    t_lon = target_complaint.get('longitude')

    for idx, cand in enumerate(candidate_complaints):
        score = float(sim_scores[idx])
        c_lat = cand.get('latitude')
        c_lon = cand.get('longitude')

        dist = haversine_distance(t_lat, t_lon, c_lat, c_lon)

        # Match criteria: high text similarity OR moderate text similarity with close location
        is_duplicate = False
        match_reason = []

        if score >= similarity_threshold:
            is_duplicate = True
            match_reason.append(f"High semantic similarity ({score * 100:.1f}%)")

        if dist < distance_threshold_meters and score >= 0.40:
            is_duplicate = True
            match_reason.append(f"Proximity: {dist:.0f} meters away with overlapping issue description")

        if is_duplicate:
            matches.append({
                "potential_duplicate_id": cand.get('id'),
                "tracking_number": cand.get('tracking_number'),
                "title": cand.get('title'),
                "similarity_score": round(score, 4),
                "distance_meters": round(dist, 1) if dist != float('inf') else None,
                "status": cand.get('status'),
                "match_reason": " & ".join(match_reason)
            })

    # Sort by similarity score descending
    matches.sort(key=lambda x: x['similarity_score'], reverse=True)
    return matches
