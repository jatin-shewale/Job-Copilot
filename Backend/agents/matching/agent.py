from ai.base import call_ai_json
from datetime import datetime
import re

MATCHING_SYSTEM = """You are a Job Matching AI that calculates precise compatibility scores between a candidate's profile and job listings.
You analyze skills overlap, experience level match, keywords density, and overall fit.
Be precise and data-driven in your scoring."""

async def calculate_job_match(resume_text: str, job: dict) -> dict:
    """Calculate match score between resume and a single job"""
    job_text = f"""
Title: {job.get('title', '')}
Company: {job.get('company', '')}
Description: {job.get('description', '')[:1000]}
Required Skills: {', '.join(job.get('skills', []))}
"""
    prompt = f"""
Calculate match score between this candidate and job.

CANDIDATE RESUME:
{resume_text[:2000]}

JOB:
{job_text}

Return JSON:
{{
  "overall_match": <0-100>,
  "skill_match": <0-100>,
  "experience_match": <0-100>,
  "keyword_match": <0-100>,
  "match_label": "<EXCELLENT/STRONG/GOOD/PARTIAL/WEAK>",
  "matching_skills": ["<skill>"],
  "missing_skills": ["<skill>"],
  "apply_recommendation": "<APPLY NOW/WORTH TRYING/STRETCH GOAL/SKIP>",
  "reason": "<one sentence why>"
}}"""
    
    result = await call_ai_json(prompt, MATCHING_SYSTEM)
    if not result:
        # Fallback: basic keyword matching
        resume_lower = resume_text.lower()
        skills = job.get('skills', [])
        title_words = job.get('title', '').lower().split()
        
        matched = sum(1 for s in skills if s.lower() in resume_lower)
        title_matched = sum(1 for w in title_words if w in resume_lower and len(w) > 3)
        
        score = min(100, int((matched / max(len(skills), 1)) * 60 + (title_matched / max(len(title_words), 1)) * 40))
        
        result = {
            "overall_match": score,
            "skill_match": score,
            "experience_match": 50,
            "keyword_match": score,
            "match_label": "GOOD" if score >= 60 else "PARTIAL",
            "matching_skills": [s for s in skills if s.lower() in resume_lower],
            "missing_skills": [s for s in skills if s.lower() not in resume_lower],
            "apply_recommendation": "WORTH TRYING",
            "reason": "Based on skill keyword overlap"
        }
    
    return result

async def rank_jobs_by_match(resume_text: str, jobs: list) -> list:
    """Rank a list of jobs by match score — uses quick heuristic for speed"""
    if not resume_text or not jobs:
        return jobs
    
    resume_lower = resume_text.lower()
    
    # Extract skills from resume using common patterns
    skill_patterns = [
        r'\b(python|javascript|typescript|java|golang|rust|c\+\+|react|angular|vue|nodejs|django|fastapi|flask|spring|kubernetes|docker|aws|azure|gcp|sql|mongodb|postgresql|mysql|redis|kafka|tensorflow|pytorch|scikit|pandas|spark|hadoop|tableau|power\s*bi|figma|git|linux|bash|html|css)\b'
    ]
    
    found_skills = set()
    for pattern in skill_patterns:
        matches = re.findall(pattern, resume_lower)
        found_skills.update(matches)
    
    ranked = []
    for job in jobs:
        score = 50  # base score
        
        title_lower = job.get('title', '').lower()
        desc_lower = job.get('description', '').lower()
        job_skills = [s.lower() for s in job.get('skills', [])]
        
        # Title keyword match
        title_words = [w for w in title_lower.split() if len(w) > 3]
        title_score = sum(20 for w in title_words if w in resume_lower) / max(len(title_words), 1)
        score += min(title_score, 25)
        
        # Skills match
        if found_skills and job_skills:
            skill_overlap = len(found_skills.intersection(set(job_skills)))
            score += min(int(skill_overlap / max(len(job_skills), 1) * 30), 30)
        elif found_skills:
            # Check skills in description
            desc_matches = sum(1 for s in found_skills if s in desc_lower)
            score += min(desc_matches * 3, 25)
        
        # Freshness bonus — fresher jobs get a boost to surface them
        freshness = job.get('freshness', '')
        if 'Just' in freshness:
            score += 10
        elif 'min' in freshness:
            score += 5
        elif 'Today' in freshness:
            score += 2
        
        score = min(100, max(0, int(score)))
        
        job_with_score = job.copy()
        job_with_score['match_score'] = score
        job_with_score['match_label'] = (
            'EXCELLENT' if score >= 85 else
            'STRONG' if score >= 70 else
            'GOOD' if score >= 55 else
            'PARTIAL' if score >= 40 else 'WEAK'
        )
        ranked.append(job_with_score)
    
    def _posted_at_sort_value(value):
        if isinstance(value, datetime):
            return value.timestamp()
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()
            except Exception:
                return 0
        return 0

    ranked.sort(key=lambda x: (x['match_score'], _posted_at_sort_value(x.get('posted_at'))), reverse=True)
    return ranked
