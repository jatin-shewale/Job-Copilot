import re
from collections import Counter
from datetime import datetime

from ai.base import call_ai_json

RECRUITER_SYSTEM = """You are a Senior Technical Recruiter with 15+ years of experience at top tech companies (Google, Amazon, Microsoft, Meta).
You have deep expertise in:
- Resume evaluation using Google XYZ formula (Accomplished [X] as measured by [Y], by doing [Z])
- ATS systems and keyword optimization
- Hiring probability assessment
- Skill gap identification
- Career path guidance

Be brutally honest, specific, and actionable. Think like a hiring manager who reviews 500+ resumes daily."""

COMMON_SKILLS = [
    "python", "javascript", "typescript", "java", "golang", "go", "rust", "c++", "react", "next.js",
    "node", "nodejs", "django", "fastapi", "flask", "spring", "aws", "azure", "gcp", "docker", "kubernetes",
    "sql", "postgresql", "mysql", "mongodb", "redis", "kafka", "rest", "graphql", "ci/cd", "git", "linux",
    "html", "css", "tailwind", "redux", "data analysis", "machine learning", "nlp", "pandas", "numpy"
]


def _tokenize_skills(text: str) -> list[str]:
    lowered = text.lower()
    found = []
    for skill in COMMON_SKILLS:
        if skill in lowered:
            found.append(skill)
    return list(dict.fromkeys(found))


def _extract_bullets(text: str) -> list[str]:
    bullets = []
    for line in text.splitlines():
      line = line.strip()
      if not line:
          continue
      if line.startswith(("-", "•", "*")) or re.match(r"^\d+[\.\)]\s+", line):
          cleaned = re.sub(r"^[-•*]\s*", "", line)
          cleaned = re.sub(r"^\d+[\.\)]\s+", "", cleaned)
          bullets.append(cleaned)
    return bullets


def _grade(score: int) -> str:
    if score >= 90:
        return "A+"
    if score >= 82:
        return "A"
    if score >= 74:
        return "B+"
    if score >= 64:
        return "B"
    if score >= 54:
        return "C"
    return "D"


def _heuristic_resume_analysis(resume_text: str, job_title: str = "", job_description: str = "") -> dict:
    text = resume_text or ""
    lower = text.lower()
    skills = _tokenize_skills(text)
    job_skills = _tokenize_skills(f"{job_title} {job_description}")
    overlap = [s for s in job_skills if s in skills]
    missing = [s for s in job_skills if s not in skills]
    bullets = _extract_bullets(text)

    length_score = min(100, max(25, int(len(text) / 55)))
    skill_score = min(100, 35 + len(skills) * 5 + len(overlap) * 4)
    ats_score = min(100, int((length_score * 0.45) + (skill_score * 0.55)))
    resume_score = min(100, max(30, ats_score - 6 + (12 if any(term in lower for term in ["impact", "result", "led", "built", "improved"]) else 0)))
    selection_probability = max(10, min(95, int((resume_score * 0.6) + (len(overlap) * 4) + (10 if job_title else 0))))

    strengths = []
    if skills:
        strengths.append(f"Demonstrates hands-on experience with {', '.join(skills[:3])}.")
    if len(text) > 900:
        strengths.append("Resume has enough detail for a meaningful recruiter review.")
    if any(word in lower for word in ["led", "built", "improved", "shipped", "owned"]):
        strengths.append("Contains action-oriented language that reads like real ownership.")
    if not strengths:
        strengths.append("Resume has readable structure and is ready for optimization.")

    weaknesses = []
    if not bullets:
        weaknesses.append("Add bullet points under each role so achievements are easier to scan.")
    if len(overlap) < 3 and job_skills:
        weaknesses.append("Add more target-role keywords to align with the job description.")
    if not any(ch.isdigit() for ch in text):
        weaknesses.append("Add metrics and outcomes so accomplishments feel measurable.")
    if "summary" not in lower:
        weaknesses.append("Add a short summary that states target role, years of experience, and main stack.")
    if len(weaknesses) < 3:
        weaknesses.extend([
            "Tighten the strongest bullets so they lead with impact.",
            "Reduce generic phrasing and add more role-specific evidence.",
        ])

    missing_skills = missing[:6] or ["AWS", "Docker", "CI/CD"]
    present_skills = skills[:6] or ["Python", "SQL", "Problem Solving"]

    sample_bullets = bullets[:3] or [
        "Led a project end-to-end",
        "Worked with stakeholders to deliver features",
        "Improved a process or workflow",
    ]

    xyz_rewrites = []
    for bullet in sample_bullets[:3]:
        xyz_rewrites.append({
            "original": bullet,
            "improved": f"Accomplished a measurable improvement in the area described by '{bullet[:40]}...' by leading the work end-to-end and delivering clear business impact.",
            "impact": "Adds outcome, ownership, and recruiter-friendly clarity."
        })

    action_items = [
        {
            "priority": "HIGH",
            "action": "Add quantified achievements to the top 3 bullets in your most recent experience.",
            "impact": "Makes the resume easier for recruiters and ATS systems to rank highly."
        },
        {
            "priority": "HIGH" if missing_skills else "MEDIUM",
            "action": "Mirror more keywords from the target job description in your skills and experience sections.",
            "impact": "Improves match quality for role-specific screening."
        },
        {
            "priority": "MEDIUM",
            "action": "Condense long paragraphs into bullet points with strong verbs and metrics.",
            "impact": "Improves scannability and highlights seniority faster."
        },
    ]

    interview_tips = [
        f"Be ready to explain any experience related to {present_skills[0]} in one crisp example." if present_skills else "Have a strong example ready for your most relevant project.",
        "Prepare one metric-driven story that shows impact, not just responsibilities.",
        "Expect follow-up questions on the missing skills and frame them as active learning goals.",
    ]

    career_level = "Senior" if len(text) > 2500 else "Mid" if len(text) > 1400 else "Junior"
    salary_estimate = "Market dependent; likely mid-range for the target role" if career_level != "Senior" else "Upper-mid to senior market range"

    return {
        "ats_score": ats_score,
        "resume_score": resume_score,
        "selection_probability": selection_probability,
        "overall_grade": _grade(resume_score),
        "strengths": strengths[:4],
        "weaknesses": weaknesses[:4],
        "missing_skills": missing_skills,
        "present_skills": present_skills,
        "xyz_rewrites": xyz_rewrites,
        "ats_keywords_missing": missing_skills,
        "ats_keywords_present": present_skills,
        "formatting_issues": [
            "Use clear role headings and bullet points.",
            "Keep spacing consistent and avoid dense blocks of text."
        ],
        "recruiter_feedback": (
            "This resume is workable, but it will perform better with more quantified outcomes, "
            "clearer role-level storytelling, and tighter keyword alignment."
        ),
        "action_items": action_items,
        "interview_tips": interview_tips,
        "salary_estimate": salary_estimate,
        "career_level": career_level,
        "key_findings": (
            f"The resume shows {len(present_skills)} visible strengths, but it needs sharper metrics and "
            f"better alignment to the target role{f' ({job_title})' if job_title else ''}. "
            "The biggest lift will come from rewriting the strongest bullets using the XYZ format."
        ),
    }

async def analyze_resume_full(resume_text: str, job_title: str = "", job_description: str = "") -> dict:
    """Full AI recruiter analysis"""
    
    job_context = f"\nTarget Job: {job_title}\nJob Description:\n{job_description[:1500]}" if job_description else f"\nTarget Role: {job_title}" if job_title else ""
    
    prompt = f"""
Analyze this resume as a Senior Recruiter and ATS specialist.{job_context}

RESUME:
{resume_text[:3000]}

Provide a comprehensive JSON analysis:
{{
  "ats_score": <0-100 integer>,
  "resume_score": <0-100 integer>,
  "selection_probability": <0-100 integer>,
  "overall_grade": "<A+/A/B+/B/C/D>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "missing_skills": ["<skill 1>", "<skill 2>", "<skill 3>"],
  "present_skills": ["<skill 1>", "<skill 2>", "<skill 3>"],
  "xyz_rewrites": [
    {{
      "original": "<original bullet>",
      "improved": "<Google XYZ formula rewrite>",
      "impact": "<why this is better>"
    }}
  ],
  "ats_keywords_missing": ["<keyword 1>", "<keyword 2>"],
  "ats_keywords_present": ["<keyword 1>", "<keyword 2>"],
  "formatting_issues": ["<issue 1>", "<issue 2>"],
  "recruiter_feedback": "<detailed honest feedback as a senior recruiter>",
  "action_items": [
    {{"priority": "HIGH", "action": "<specific action>", "impact": "<expected impact>"}},
    {{"priority": "MEDIUM", "action": "<specific action>", "impact": "<expected impact>"}},
    {{"priority": "LOW", "action": "<specific action>", "impact": "<expected impact>"}}
  ],
  "interview_tips": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "salary_estimate": "<estimated salary range based on skills>",
  "career_level": "<Junior/Mid/Senior/Lead/Principal>",
  "key_findings": "<2-3 sentence executive summary for the candidate>"
}}"""
    
    result = await call_ai_json(prompt, RECRUITER_SYSTEM, timeout_seconds=18)
    if not result or not result.get("strengths") or not result.get("recruiter_feedback"):
        result = _heuristic_resume_analysis(resume_text, job_title, job_description)
    result["analyzed_at"] = datetime.utcnow().isoformat()
    return result

async def predict_selection_chance(resume_text: str, job_description: str) -> dict:
    """Predict interview selection probability"""
    prompt = f"""
As a senior recruiter, predict the interview selection probability.

RESUME (first 2000 chars):
{resume_text[:2000]}

JOB DESCRIPTION:
{job_description[:1500]}

Return JSON:
{{
  "selection_probability": <0-100>,
  "skill_match_score": <0-100>,
  "experience_match_score": <0-100>,
  "keyword_match_score": <0-100>,
  "overall_match": <0-100>,
  "hiring_verdict": "<STRONG MATCH/GOOD MATCH/PARTIAL MATCH/WEAK MATCH>",
  "top_reasons_to_hire": ["<reason 1>", "<reason 2>", "<reason 3>"],
  "top_concerns": ["<concern 1>", "<concern 2>"],
  "recommendation": "<specific recommendation to improve chances>"
}}"""
    
    return await call_ai_json(prompt, RECRUITER_SYSTEM)
