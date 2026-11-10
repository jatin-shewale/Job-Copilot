import re

from ai.base import call_ai_json

SKILL_GAP_SYSTEM = """You are a Senior Technical Curriculum Designer and Career Coach who has helped 5000+ developers upskill and land roles at top companies.
You know exactly what skills are required for different roles in 2024-2025, which resources are best, and realistic timelines.
Be specific, practical, and senior-engineer honest."""

COMMON_SKILLS = [
    "python", "javascript", "typescript", "java", "golang", "go", "rust", "c++", "react", "next.js",
    "node", "nodejs", "django", "fastapi", "flask", "spring", "aws", "azure", "gcp", "docker", "kubernetes",
    "sql", "postgresql", "mysql", "mongodb", "redis", "kafka", "rest", "graphql", "ci/cd", "git", "linux",
    "html", "css", "tailwind", "redux", "data analysis", "machine learning", "nlp", "pandas", "numpy",
    "system design", "microservices", "testing", "api", "analytics", "excel"
]


def _tokenize_skills(text: str) -> list[str]:
    lowered = (text or "").lower()
    found = []
    for skill in COMMON_SKILLS:
        if skill in lowered:
            found.append(skill)
    return list(dict.fromkeys(found))


def _fallback_skill_gap(resume_text: str, target_role: str, experience_years: int = 0) -> dict:
    skills = _tokenize_skills(resume_text)
    role_skills = _tokenize_skills(target_role)
    strong_skills = skills[:6] or ["Python", "SQL", "Git", "Problem Solving"]
    transferable_skills = [s for s in strong_skills if s not in {"git"}][:4] or strong_skills[:3]

    base_gaps = [
        {"skill": "System Design", "priority": "HIGH", "current_level": "Beginner", "required_level": "Advanced", "learning_time": "3-4 weeks"},
        {"skill": "Cloud / Deployment", "priority": "HIGH", "current_level": "Beginner", "required_level": "Intermediate", "learning_time": "2-3 weeks"},
        {"skill": "Testing", "priority": "MEDIUM", "current_level": "Beginner", "required_level": "Intermediate", "learning_time": "1-2 weeks"},
    ]

    for rs in role_skills[:3]:
        if rs not in {g["skill"].lower() for g in base_gaps}:
            base_gaps.insert(0, {
                "skill": rs.title(),
                "priority": "HIGH" if rs not in skills else "LOW",
                "current_level": "None" if rs not in skills else "Beginner",
                "required_level": "Intermediate",
                "learning_time": "1-2 weeks",
            })

    skill_gaps = base_gaps[:4]
    roadmap = [
        {
            "week": "1-2",
            "focus": "Core role alignment",
            "goal": f"Close the biggest gaps for {target_role or 'the target role'} and sharpen your resume keywords.",
            "deliverable": "Updated resume bullets and a short skill plan.",
        },
        {
            "week": "3-4",
            "focus": "Project proof",
            "goal": "Build one portfolio project that demonstrates the target stack and measurable output.",
            "deliverable": "A polished GitHub repo and a short project write-up.",
        },
        {
            "week": "5-8",
            "focus": "Interview readiness",
            "goal": "Practice system design, behavioral stories, and core technical questions.",
            "deliverable": "Three strong STAR stories and one mock interview run.",
        },
        {
            "week": "9-12",
            "focus": "Application sprint",
            "goal": "Apply with stronger positioning and targeted keywords.",
            "deliverable": "Customized applications and a repeatable application workflow.",
        },
    ]

    project_ideas = [
        {
            "title": f"{(target_role or 'Role').split()[0]} Portfolio Project",
            "description": "Build a realistic project that mirrors the target role and shows end-to-end ownership.",
            "skills_covered": strong_skills[:5],
            "difficulty": "Intermediate",
            "estimated_time": "2-3 weeks",
            "portfolio_impact": "High",
        },
        {
            "title": "Metrics Dashboard",
            "description": "Create a dashboard that tracks metrics, trends, and business impact.",
            "skills_covered": ["SQL", "Dashboarding", "Data Analysis"],
            "difficulty": "Beginner",
            "estimated_time": "1-2 weeks",
            "portfolio_impact": "Medium",
        },
    ]

    certifications = [
        {"name": "Role-aligned certification or course", "provider": "Coursera / Udemy", "cost": "Low", "time": "2-4 weeks", "roi": "High"},
        {"name": "Cloud fundamentals", "provider": "AWS / Azure / GCP", "cost": "Low-Medium", "time": "2-4 weeks", "roi": "High"},
    ]

    months_to_ready = max(2, min(12, 12 - min(6, len(strong_skills)) + (1 if experience_years < 2 else 0)))
    readiness_score = max(20, min(90, 40 + len(strong_skills) * 6 + (10 if experience_years >= 2 else 0)))

    return {
        "current_level": "Mid" if experience_years >= 2 else "Junior",
        "target_level": "Senior" if experience_years >= 5 else "Mid",
        "readiness_score": readiness_score,
        "months_to_ready": months_to_ready,
        "skill_gaps": skill_gaps,
        "strong_skills": strong_skills,
        "transferable_skills": transferable_skills,
        "learning_roadmap": roadmap,
        "project_ideas": project_ideas,
        "certifications": certifications,
        "job_market_insights": {
            "demand_level": "High",
            "avg_salary_with_skills": "Market dependent, typically higher than current baseline",
            "top_companies_hiring": ["Top startups", "Mid-size product companies", "Enterprise teams"],
            "trend": "growing",
        },
        "quick_wins": [
            "Rewrite your resume summary to match the target role.",
            "Add 2-3 role-specific keywords to your skills section.",
            "Publish one project that demonstrates the missing skills.",
        ],
        "mentor_advice": (
            "Focus on one high-signal project and one strong resume rewrite first. "
            "That usually moves the needle faster than collecting too many courses."
        ),
    }


async def analyze_skill_gap(resume_text: str, target_role: str, experience_years: int = 0) -> dict:
    prompt = f"""
Perform a comprehensive skill gap analysis.

CANDIDATE RESUME:
{resume_text[:2500]}

TARGET ROLE: {target_role}
EXPERIENCE: {experience_years} years

Return JSON:
{{
  "current_level": "<Junior/Mid/Senior/Lead>",
  "target_level": "<what they need for {target_role}>",
  "readiness_score": <0-100>,
  "months_to_ready": <estimated months>,
  "skill_gaps": [
    {{
      "skill": "<skill name>",
      "priority": "<CRITICAL/HIGH/MEDIUM/LOW>",
      "current_level": "<None/Beginner/Intermediate>",
      "required_level": "<Intermediate/Advanced/Expert>",
      "learning_time": "<X weeks>",
      "resources": [
        {{"type": "Course", "name": "<name>", "platform": "<platform>", "url": "<url>", "free": <true/false>, "duration": "<duration>"}},
        {{"type": "Project", "description": "<project to build>", "github_idea": "<repo idea>"}}
      ]
    }}
  ],
  "strong_skills": ["<skill 1>", "<skill 2>"],
  "transferable_skills": ["<skill>"],
  "learning_roadmap": [
    {{"week": "1-2", "focus": "<topic>", "goal": "<specific goal>", "deliverable": "<what to build/achieve>"}},
    {{"week": "3-4", "focus": "<topic>", "goal": "<specific goal>", "deliverable": "<what to build/achieve>"}},
    {{"week": "5-8", "focus": "<topic>", "goal": "<specific goal>", "deliverable": "<what to build/achieve>"}},
    {{"week": "9-12", "focus": "<topic>", "goal": "<specific goal>", "deliverable": "<what to build/achieve>"}}
  ],
  "project_ideas": [
    {{
      "title": "<project name>",
      "description": "<what it does>",
      "skills_covered": ["<skill>"],
      "difficulty": "<Beginner/Intermediate/Advanced>",
      "estimated_time": "<X weeks>",
      "portfolio_impact": "<High/Medium/Low>"
    }}
  ],
  "certifications": [
    {{"name": "<cert>", "provider": "<provider>", "cost": "<cost>", "time": "<time>", "roi": "<High/Medium/Low>"}}
  ],
  "job_market_insights": {{
    "demand_level": "<Very High/High/Medium/Low>",
    "avg_salary_with_skills": "<range>",
    "top_companies_hiring": ["<company 1>", "<company 2>", "<company 3>"],
    "trend": "<growing/stable/declining>"
  }},
  "quick_wins": ["<thing to do in under 1 week that immediately boosts profile>"],
  "mentor_advice": "<personalized advice from a senior engineer in this field>"
}}"""

    result = await call_ai_json(prompt, SKILL_GAP_SYSTEM, timeout_seconds=15, max_tokens=1200)
    if not result or not result.get("skill_gaps") or result.get("months_to_ready") is None:
        result = _fallback_skill_gap(resume_text, target_role, experience_years)

    result.setdefault("current_level", "Junior" if experience_years < 2 else "Mid")
    result.setdefault("target_level", "Mid" if experience_years < 5 else "Senior")
    result.setdefault("readiness_score", 50)
    result.setdefault("months_to_ready", max(2, 12 - min(6, experience_years)))
    result.setdefault("skill_gaps", [])
    result.setdefault("strong_skills", _tokenize_skills(resume_text)[:6] or ["Python", "SQL"])
    result.setdefault("transferable_skills", result.get("strong_skills", [])[:4])
    result.setdefault("learning_roadmap", [])
    result.setdefault("project_ideas", [])
    result.setdefault("certifications", [])
    result.setdefault("job_market_insights", {
        "demand_level": "Medium",
        "avg_salary_with_skills": "Market dependent",
        "top_companies_hiring": [],
        "trend": "stable",
    })
    result.setdefault("quick_wins", [
        "Add role-specific keywords to your resume.",
        "Build one project that proves the missing skill.",
        "Prepare one STAR story for each priority skill gap.",
    ])
    result.setdefault("mentor_advice", "Focus on the highest-signal gaps first and show proof through projects.")
    return result
