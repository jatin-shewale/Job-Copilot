"""
MongoDB collection schemas and helper functions.
Motor (async MongoDB) doesn't enforce schemas, but we define 
them here for documentation and validation purposes.
"""
from datetime import datetime
from typing import Optional, List

# ── User Document ──────────────────────────────────────────
USER_SCHEMA = {
    "name": str,
    "email": str,                    # unique index
    "password": str,                  # bcrypt hashed
    "target_role": Optional[str],
    "location": Optional[str],
    "experience_years": int,
    "skills": List[str],
    "resume_text": Optional[str],
    "resume_filename": Optional[str],
    "ats_score": int,                 # 0–100
    "resume_score": int,              # 0–100
    "last_analysis": Optional[dict],  # latest recruiter analysis
    "created_at": datetime,
    "updated_at": datetime,
}

# ── Job Document ───────────────────────────────────────────
JOB_SCHEMA = {
    "title": str,
    "company": str,
    "location": str,
    "description": str,
    "skills": List[str],
    "salary": Optional[str],
    "job_type": Optional[str],        # Full-time / Internship / Contract
    "experience": Optional[str],
    "source": str,                    # LinkedIn / Indeed / Wellfound / etc.
    "source_id": str,                 # unique per source (compound index)
    "apply_link": str,
    "posted_at": datetime,
    "freshness": str,                 # "⚡ Just Posted" / "🔥 X min ago" / etc.
    "scraped_at": datetime,
    "match_score": Optional[int],     # set when matched against a user
}

# ── Resume Document ────────────────────────────────────────
RESUME_SCHEMA = {
    "user_id": str,
    "original_text": str,
    "rewritten_text": Optional[str],
    "ats_score": int,
    "resume_score": int,
    "filename": str,
    "created_at": datetime,
}

# ── Report Document ────────────────────────────────────────
REPORT_SCHEMA = {
    "user_id": str,
    "type": str,              # full_analysis / ats / skill_gap / etc.
    "data": dict,
    "created_at": datetime,
}

# ── Cover Letter Document ──────────────────────────────────
COVER_LETTER_SCHEMA = {
    "user_id": str,
    "job_title": str,
    "company": str,
    "full_cover_letter": str,
    "email_version": str,
    "created_at": datetime,
}

# ── Cold Email Document ────────────────────────────────────
COLD_EMAIL_SCHEMA = {
    "user_id": str,
    "company": str,
    "job_title": str,
    "emails": list,
    "follow_up_template": str,
    "created_at": datetime,
}

# ── Application Document ───────────────────────────────────
APPLICATION_SCHEMA = {
    "user_id": str,
    "job_id": str,
    "job_title": str,
    "company": str,
    "status": str,            # applied / interview / rejected / offer
    "applied_at": datetime,
    "notes": Optional[str],
}


def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return {}
    result = {}
    for key, value in doc.items():
        if key == "_id":
            result["_id"] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, dict):
            result[key] = serialize_doc(value)
        elif isinstance(value, list):
            result[key] = [serialize_doc(i) if isinstance(i, dict) else i for i in value]
        else:
            result[key] = value
    return result
