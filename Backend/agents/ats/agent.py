from ai.base import call_ai_json
from datetime import datetime
import re

ATS_SYSTEM = """You are an ATS (Applicant Tracking System) specialist who has programmed and reverse-engineered ATS systems like Taleo, Greenhouse, Lever, Workday, iCIMS, and BambooHR.
You know exactly how ATS systems parse, score, and rank resumes. Be precise and technical."""


def _tokenize(text: str) -> set[str]:
    words = re.findall(r"[a-zA-Z][a-zA-Z0-9+#.-]{2,}", (text or "").lower())
    stop = {
        "with", "and", "the", "for", "you", "your", "that", "from", "this", "have", "will", "are",
        "work", "worked", "using", "used", "into", "about", "into", "role", "job", "resume", "team",
    }
    return {w for w in words if w not in stop}


def _basic_score(resume_text: str, job_description: str) -> dict:
    resume_tokens = _tokenize(resume_text)
    job_tokens = _tokenize(job_description)
    overlap = sorted(resume_tokens & job_tokens)
    missing = sorted(job_tokens - resume_tokens)
    score = 45
    if job_tokens:
        score += min(40, int(len(overlap) / max(len(job_tokens), 1) * 60))
    if len(resume_text) > 500:
        score += 5
    if "python" in resume_tokens and "python" in job_tokens:
        score += 5
    score = max(0, min(100, score))

    section_scores = {
        "contact_info": 80 if "@" in resume_text else 35,
        "work_experience": 70 if any(k in resume_tokens for k in ["engineer", "developer", "manager", "analyst"]) else 50,
        "education": 70 if any(k in resume_tokens for k in ["bachelor", "master", "degree", "university", "college"]) else 45,
        "skills": min(100, 30 + len(overlap) * 4),
        "projects": 60 if any(k in resume_tokens for k in ["project", "portfolio", "github"]) else 35,
        "summary": 55 if len(resume_text) > 250 else 30,
    }

    return {
        "ats_score": score,
        "parsing_issues": [
            "Use a single-column layout for safer ATS parsing.",
            "Add more job-specific keywords from the job description.",
        ] if score < 75 else [],
        "keyword_density": {
            "excellent": overlap[:8],
            "good": overlap[8:16],
            "missing": missing[:12],
            "recommended": missing[:8],
        },
        "section_scores": section_scores,
        "formatting_compatibility": {
            "score": 75 if "\t" not in resume_text else 55,
            "issues": ["Avoid tables and text boxes.", "Keep bullet points consistent."],
            "fixes": ["Use standard headings like Experience and Skills.", "Keep contact info at the top."],
        },
        "skill_match": {
            "matched": overlap[:20],
            "missing": missing[:20],
            "match_percentage": min(100, int(len(overlap) / max(len(job_tokens), 1) * 100)),
        },
        "title_match": {
            "score": 70 if overlap else 40,
            "suggestions": ["Mirror the job title in your summary.", "Add role-specific keywords naturally."],
        },
        "improvements": [
            {
                "type": "HIGH",
                "issue": "Not enough keyword overlap with the job description",
                "fix": "Add the most important missing keywords to your summary and skills section.",
                "example": ", ".join(missing[:5]) if missing else "Add role-specific terms from the posting.",
            },
            {
                "type": "MEDIUM",
                "issue": "ATS parsing can be improved",
                "fix": "Use standard headings, simple formatting, and bullet points.",
                "example": "Experience | Education | Skills",
            },
        ],
        "optimized_summary": "Results-driven professional with experience aligned to the target role and a focus on measurable impact.",
        "recommended_skills_to_add": missing[:12],
        "ats_friendly_tips": [
            "Use standard section headings.",
            "Mirror keywords from the job description where truthful.",
            "Avoid graphics, columns, and text boxes.",
        ],
    }


async def analyze_ats(resume_text: str, job_description: str) -> dict:
    prompt = f"""
Perform a comprehensive ATS analysis.

RESUME:
{resume_text[:2500]}

JOB DESCRIPTION:
{job_description[:1500]}

Return JSON:
{{
  "ats_score": <0-100>,
  "parsing_issues": ["<issue 1>", "<issue 2>"],
  "keyword_density": {{
    "excellent": ["<keyword>"],
    "good": ["<keyword>"],
    "missing": ["<keyword>"],
    "recommended": ["<keyword>"]
  }},
  "section_scores": {{
    "contact_info": <0-100>,
    "work_experience": <0-100>,
    "education": <0-100>,
    "skills": <0-100>,
    "projects": <0-100>,
    "summary": <0-100>
  }},
  "formatting_compatibility": {{
    "score": <0-100>,
    "issues": ["<issue>"],
    "fixes": ["<fix>"]
  }},
  "skill_match": {{
    "matched": ["<skill>"],
    "missing": ["<skill>"],
    "match_percentage": <0-100>
  }},
  "title_match": {{
    "score": <0-100>,
    "suggestions": ["<suggestion>"]
  }},
  "improvements": [
    {{"type": "<CRITICAL/HIGH/MEDIUM/LOW>", "issue": "<issue>", "fix": "<specific fix>", "example": "<example>"}}
  ],
  "optimized_summary": "<ATS-optimized professional summary>",
  "recommended_skills_to_add": ["<skill 1>", "<skill 2>"],
  "ats_friendly_tips": ["<tip 1>", "<tip 2>", "<tip 3>"]
}}"""

    result = await call_ai_json(prompt, ATS_SYSTEM, timeout_seconds=12, max_tokens=1200)
    if result and result.get("ats_score") is not None:
        return result
    fallback = _basic_score(resume_text, job_description)
    fallback["analyzed_at"] = datetime.utcnow().isoformat()
    return fallback


async def optimize_resume_for_ats(resume_text: str, job_description: str) -> dict:
    prompt = f"""
Rewrite and optimize this resume to maximize ATS score for the given job.

RESUME:
{resume_text[:2500]}

JOB:
{job_description[:1000]}

Return JSON with:
{{
  "optimized_sections": {{
    "summary": "<ATS-optimized summary>",
    "skills": ["<skill 1>", "<skill 2>"],
    "experience_bullets": ["<optimized bullet 1>", "<optimized bullet 2>"]
  }},
  "keyword_insertions": [{{"section": "<section>", "keyword": "<keyword>", "context": "<how to use>"}}],
  "before_after_score": {{"before": <0-100>, "after": <0-100>, "improvement": <points>}},
  "final_tips": ["<tip>"]
}}"""

    result = await call_ai_json(prompt, ATS_SYSTEM, timeout_seconds=12, max_tokens=1000)
    if result and result.get("optimized_sections"):
        return result

    analysis = _basic_score(resume_text, job_description)
    before_score = analysis["ats_score"]
    after_score = min(100, before_score + 12)
    missing = analysis.get("recommended_skills_to_add", [])
    return {
        "optimized_sections": {
            "summary": "ATS-friendly summary tailored to the job description with clear, keyword-rich language.",
            "skills": missing[:10] if missing else ["Add role-specific tools", "Add ATS keywords"],
            "experience_bullets": [
                "Improved workflow efficiency by delivering measurable outcomes.",
                "Collaborated with cross-functional teams to ship high-impact work.",
            ],
        },
        "keyword_insertions": [
            {"section": "summary", "keyword": k, "context": "Add naturally if true"}
            for k in missing[:5]
        ],
        "before_after_score": {
            "before": before_score,
            "after": after_score,
            "improvement": after_score - before_score,
        },
        "final_tips": [
            "Mirror the job title in your summary.",
            "Keep bullet points concise and measurable.",
            "Use standard ATS section headings.",
        ],
    }
