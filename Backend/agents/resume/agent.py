import re
from collections import Counter

from ai.base import call_ai_json, call_ai

RESUME_SYSTEM = """You are a professional resume writer who has written 3000+ resumes that landed interviews at Google, Amazon, Meta, Microsoft, and top startups.
You use the Google XYZ formula: 'Accomplished [X] as measured by [Y], by doing [Z]'
Every bullet must be achievement-focused with quantified impact.
You know exactly what makes a resume stand out."""

COMMON_SKILLS = [
    "python", "javascript", "typescript", "java", "golang", "go", "rust", "c++", "react", "next.js",
    "node", "nodejs", "django", "fastapi", "flask", "spring", "aws", "azure", "gcp", "docker", "kubernetes",
    "sql", "postgresql", "mysql", "mongodb", "redis", "kafka", "rest", "graphql", "ci/cd", "git", "linux",
    "html", "css", "tailwind", "redux", "data analysis", "machine learning", "nlp", "pandas", "numpy"
]


def _tokenize_skills(text: str) -> list[str]:
    lowered = (text or "").lower()
    found = []
    for skill in COMMON_SKILLS:
        if skill in lowered:
            found.append(skill)
    return list(dict.fromkeys(found))


def _extract_bullets(text: str) -> list[str]:
    bullets = []
    for line in (text or "").splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith(("-", "•", "*")) or re.match(r"^\d+[\.\)]\s+", line):
            cleaned = re.sub(r"^[-•*]\s*", "", line)
            cleaned = re.sub(r"^\d+[\.\)]\s+", "", cleaned)
            bullets.append(cleaned)
    return bullets


def _fallback_resume_rewrite(resume_text: str, target_role: str = "", job_description: str = "") -> dict:
    text = resume_text or ""
    skills = _tokenize_skills(text)
    job_skills = _tokenize_skills(f"{target_role} {job_description}")
    overlap = [s for s in job_skills if s in skills]
    missing = [s for s in job_skills if s not in skills]
    bullets = _extract_bullets(text)
    top_bullets = bullets[:3] or [
        "Led a project end-to-end and delivered clear impact.",
        "Worked with stakeholders to ship useful improvements.",
        "Improved a process or workflow with measurable results.",
    ]

    rewritten_bullets = [
        f"Accomplished measurable improvements in the area described by '{bullet[:40]}...' by leading the work end-to-end and delivering stronger business impact."
        for bullet in top_bullets
    ]

    summary_skills = skills[:4] or ["problem solving", "ownership", "communication", "execution"]
    keywords_added = list(dict.fromkeys((overlap + missing)[:8] or summary_skills[:4]))

    experience_rewrites = [{
        "original_title": "Most Recent Role",
        "company": "Current Company",
        "duration": "Recent experience",
        "original_bullets": top_bullets,
        "rewritten_bullets": rewritten_bullets,
    }]

    projects_rewrites = [{
        "project_name": "Highlighted Project",
        "original": "Existing project description from the resume.",
        "rewritten": "Reframed the project with clearer scope, technology, and measurable outcomes.",
        "bullet_points": [
            "Defined the problem and delivered the solution end-to-end.",
            "Highlighted the tools, scale, and the final business impact.",
        ],
    }]

    before_score = min(70, 40 + len(skills) * 2 + len(overlap) * 2)
    after_score = min(95, before_score + 12 + (4 if any(ch.isdigit() for ch in text) else 0))

    return {
        "professional_summary": (
            f"Results-driven {target_role or 'professional'} with strengths in {', '.join(summary_skills[:3])}. "
            "Focused on measurable impact, strong execution, and role-aligned keywords."
        ),
        "skills_section": {
            "technical_skills": skills[:10] or ["Python", "SQL", "Git"],
            "soft_skills": ["Ownership", "Communication", "Problem Solving"],
            "tools": [s for s in skills if s in {"git", "docker", "kubernetes", "linux", "redis"}][:5] or ["Git", "Docker"],
            "frameworks": [s for s in skills if s in {"react", "next.js", "django", "fastapi", "flask", "spring"}][:5] or ["React", "FastAPI"],
        },
        "experience_rewrites": experience_rewrites,
        "projects_rewrites": projects_rewrites,
        "keywords_added": keywords_added,
        "formatting_recommendations": [
            "Use one-column layout with standard headings.",
            "Add bullet points under each role.",
            "Include metrics and outcomes in every key bullet.",
        ],
        "score_improvement": {"before": before_score, "after": after_score},
        "full_resume_text": text or "Rewritten resume content unavailable from the current input.",
    }

async def rewrite_resume(resume_text: str, target_role: str = "", job_description: str = "") -> dict:
    prompt = f"""
Completely rewrite this resume to maximize impact.
Target Role: {target_role or "Software Engineer"}

ORIGINAL RESUME:
{resume_text[:3000]}

{f"JOB DESCRIPTION:\\n{job_description[:800]}" if job_description else ""}

Return JSON:
{{
  "professional_summary": "<2-3 powerful sentences using strong keywords and quantified impact>",
  "skills_section": {{
    "technical_skills": ["<skill 1>", "<skill 2>"],
    "soft_skills": ["<skill>"],
    "tools": ["<tool>"],
    "frameworks": ["<framework>"]
  }},
  "experience_rewrites": [
    {{
      "original_title": "<original job title>",
      "company": "<company>",
      "duration": "<duration>",
      "original_bullets": ["<original bullet>"],
      "rewritten_bullets": [
        "<Google XYZ formula bullet with metric>",
        "<achievement bullet with impact>",
        "<quantified result bullet>"
      ]
    }}
  ],
  "projects_rewrites": [
    {{
      "project_name": "<name>",
      "original": "<original description>",
      "rewritten": "<powerful rewrite with tech stack, scale, and impact>",
      "bullet_points": ["<bullet 1>", "<bullet 2>"]
    }}
  ],
  "keywords_added": ["<keyword 1>", "<keyword 2>"],
  "formatting_recommendations": ["<recommendation>"],
  "score_improvement": {{"before": <0-100>, "after": <0-100>}},
  "full_resume_text": "<complete rewritten resume in plain text format>"
}}"""
    
    result = await call_ai_json(prompt, RESUME_SYSTEM, timeout_seconds=20, max_tokens=1400)
    if result and result.get("professional_summary") and result.get("experience_rewrites"):
        return result
    return _fallback_resume_rewrite(resume_text, target_role, job_description)

async def generate_linkedin_profile(resume_text: str) -> dict:
    prompt = f"""
Based on this resume, write optimized LinkedIn profile sections.

RESUME:
{resume_text[:2500]}

Return JSON:
{{
  "headline": "<compelling LinkedIn headline, max 220 chars>",
  "about": "<2000-character LinkedIn About section with keywords>",
  "skills": ["<top 10 skills to list>"],
  "experience_descriptions": [
    {{"company": "<company>", "description": "<LinkedIn description with achievements>"}}
  ]
}}"""
    result = await call_ai_json(prompt, RESUME_SYSTEM, timeout_seconds=12, max_tokens=700)
    if result and result.get("headline"):
        return result
    skills = _tokenize_skills(resume_text)
    return {
        "headline": f"{' | '.join(skills[:3])} | {skills[0].title() if skills else 'Professional'}",
        "about": "Experienced professional focused on measurable impact, technical execution, and role-relevant outcomes.",
        "skills": skills[:10] or ["Python", "SQL", "Communication"],
        "experience_descriptions": [],
    }
