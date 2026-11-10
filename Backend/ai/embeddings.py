"""
Semantic similarity using Ollama embeddings for job matching.
Falls back to keyword matching if Ollama is unavailable.
"""
import httpx
import os
import math

OLLAMA_BASE = os.getenv("OLLAMA_BASE", "http://localhost:11434")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")  # small, fast embedding model

async def get_embedding(text: str) -> list:
    """Get text embedding from Ollama"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{OLLAMA_BASE}/api/embeddings",
                json={"model": EMBED_MODEL, "prompt": text[:2000]}
            )
            if resp.status_code == 200:
                return resp.json().get("embedding", [])
    except Exception as e:
        print(f"Embedding error: {e}")
    return []

def cosine_similarity(vec_a: list, vec_b: list) -> float:
    """Calculate cosine similarity between two vectors"""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    mag_a = math.sqrt(sum(a * a for a in vec_a))
    mag_b = math.sqrt(sum(b * b for b in vec_b))
    
    if mag_a == 0 or mag_b == 0:
        return 0.0
    
    return dot / (mag_a * mag_b)

async def semantic_match_score(resume_text: str, job_description: str) -> float:
    """Get semantic similarity score between resume and job description (0-100)"""
    try:
        resume_emb = await get_embedding(resume_text[:2000])
        job_emb = await get_embedding(job_description[:1000])
        
        if resume_emb and job_emb:
            similarity = cosine_similarity(resume_emb, job_emb)
            return round(similarity * 100, 1)
    except Exception as e:
        print(f"Semantic match error: {e}")
    return 0.0

def keyword_match_score(text1: str, text2: str) -> float:
    """Fast keyword-based match score as fallback"""
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    # Filter common stop words
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did'}
    words1 = words1 - stop_words
    words2 = words2 - stop_words
    
    if not words1 or not words2:
        return 0.0
    
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    
    # Jaccard similarity
    jaccard = len(intersection) / len(union)
    
    # Also weight by how many job words appear in resume
    coverage = len(intersection) / len(words2) if words2 else 0
    
    combined = (jaccard * 0.4 + coverage * 0.6) * 100
    return round(min(combined, 100), 1)
