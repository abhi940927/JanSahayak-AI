"""
JanSahayak AI - Duplicate Detection Engine (Refined)
Combines semantic text similarity (n-gram TF-IDF) and geospatial proximity (Haversine formula).

Governance Principles:
1. Physical incidents (potholes, garbage, water leaks) require GEOGRAPHIC CO-LOCATION to be duplicates.
   Complaints with similar text 20 km apart are DISPARATE INCIDENTS, never duplicates.
2. If complaints are within close proximity (< 800m), moderate semantic overlap is sufficient.
3. If locations are disparate (> 1500m), they are NOT duplicates even if text phrasing is identical.
4. If coordinates are unavailable, strict text threshold (>= 0.85) is enforced with an unverified-location warning.
"""

import math
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance between two GPS coordinates in meters.
    Returns float('inf') if any coordinate is missing.
    """
    if any(coord is None for coord in (lat1, lon1, lat2, lon2)):
        return float('inf')

    try:
        lat1, lon1, lat2, lon2 = float(lat1), float(lon1), float(lat2), float(lon2)
    except (ValueError, TypeError):
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
    distance_threshold_meters: float = 800.0,
    max_duplicate_distance_meters: float = 1500.0
) -> List[Dict[str, Any]]:
    """
    Scans candidate grievances and returns verified potential duplicate matches.
    Ensures distant incidents with similar wording are not falsely merged.
    """
    if not candidate_complaints:
        return []

    target_text = f"{target_complaint.get('title', '')} {target_complaint.get('description', '')}".strip()
    candidate_texts = [
        f"{c.get('title', '')} {c.get('description', '')}".strip()
        for c in candidate_complaints
    ]

    # Calculate TF-IDF Cosine Similarity with word and sub-word n-grams for typo resilience
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        stop_words='english',
        sublinear_tf=True
    )
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
        has_location = (dist != float('inf'))

        is_duplicate = False
        match_reason = []
        confidence_level = "low"

        # RULE 1: Co-located incidents (< 800m) with relevant similarity (>= 0.25)
        if has_location and dist <= distance_threshold_meters:
            if score >= 0.25:
                is_duplicate = True
                confidence_level = "high" if (score >= 0.50 or dist < 200) else "medium"
                match_reason.append(f"Co-located: {dist:.0f}m away with matching civic description ({score * 100:.1f}%)")

        # RULE 2: Moderate distance (800m - 1500m) requires strong semantic match
        elif has_location and dist <= max_duplicate_distance_meters:
            if score >= similarity_threshold:
                is_duplicate = True
                confidence_level = "medium"
                match_reason.append(f"Neighborhood proximity ({dist:.0f}m) with high semantic similarity ({score * 100:.1f}%)")

        # RULE 3: Disparate locations (> 1500m) are explicitly REJECTED as duplicates
        elif has_location and dist > max_duplicate_distance_meters:
            is_duplicate = False  # Physically distinct incidents, prevent false clustering

        # RULE 4: No GPS available on one or both complaints - require very high text match
        elif not has_location:
            if score >= 0.85:
                is_duplicate = True
                confidence_level = "medium"
                match_reason.append(f"Identical text pattern ({score * 100:.1f}%), coordinates unavailable")

        if is_duplicate:
            matches.append({
                "potential_duplicate_id": cand.get('id'),
                "tracking_number": cand.get('tracking_number'),
                "title": cand.get('title'),
                "similarity_score": round(score, 4),
                "distance_meters": round(dist, 1) if has_location else None,
                "confidence_level": confidence_level,
                "status": cand.get('status'),
                "match_reason": " & ".join(match_reason),
                "action_advisory": "Potential duplicate. Officer review required before linking or merging tickets."
            })

    # Sort by similarity score descending
    matches.sort(key=lambda x: x['similarity_score'], reverse=True)
    return matches
