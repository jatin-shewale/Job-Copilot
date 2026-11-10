from ai.base import call_ai_json

CAREER_SYSTEM = """You are an elite career coach who has guided 2000+ professionals from junior roles to senior/staff positions at FAANG and top startups.
You specialize in:
- Career roadmaps and progression plans
- Interview preparation and strategies
- Salary negotiation (you've helped candidates increase offers by 20-40%)
- Personal branding and visibility
- Technical interview preparation
Be specific, tactical, and brutally honest."""


def _fallback_career_roadmap(resume_text: str, current_role: str, target_role: str, years: int = 2) -> dict:
    target = target_role or "target role"
    years = max(1, int(years or 2))
    milestones = []
    for month, focus, goal, deliverable in [
        (1, "Role alignment", f"Map your current strengths to {target} requirements and close the biggest gaps.", "Updated resume and learning plan"),
        (3, "Portfolio proof", "Build one project that demonstrates the target stack and measurable impact.", "A publishable project"),
        (6, "Interview readiness", "Strengthen system design, behavioral stories, and core technical questions.", "Three STAR stories and mock interview notes"),
        (12, "Application sprint", "Apply with a sharper narrative and stronger evidence of role fit.", "Targeted applications and outreach"),
    ]:
        milestones.append({
            "month": month,
            "title": focus,
            "goals": [goal],
            "skills_to_gain": ["Communication", "Ownership", "Role-specific technical depth"],
            "actions": [f"Spend focused time on {focus.lower()}.", "Track one measurable outcome each week."],
            "checkpoint": deliverable,
        })

    return {
        "executive_summary": (
            f"You are already building a base, but reaching {target} will require tighter role alignment, "
            "clearer proof of impact, and a repeatable application/interview routine."
        ),
        "milestones": milestones[: max(3, min(6, years * 2))],
        "quick_wins": [
            {"action": "Rewrite your resume summary to match the target role.", "timeline": "1-2 weeks", "impact": "Stronger recruiter alignment"},
            {"action": "Add 2 measurable achievements to your most recent experience.", "timeline": "1 week", "impact": "Better impact signal"},
            {"action": "Build one project that proves a missing skill.", "timeline": "2-3 weeks", "impact": "Higher proof of readiness"},
        ],
        "interview_prep": {
            "behavioral_questions": [
                {
                    "question": "Tell me about a time you improved a process or shipped something difficult.",
                    "star_answer_template": "Situation, Task, Action, Result with measurable outcome.",
                    "key_points": ["Ownership", "Metric", "Tradeoff", "Result"],
                }
            ],
            "technical_topics": ["Data structures", "System design basics", "Role-specific stack"],
            "resources": [
                {"name": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer", "priority": "High"},
                {"name": "LeetCode top interview questions", "url": "https://leetcode.com/problemset/", "priority": "High"},
            ],
        },
        "salary_strategy": {
            "current_market_rate": "Market dependent",
            "target_salary": "Ask for the top of your evidence-backed range",
            "negotiation_tips": [
                "Anchor with your strongest comparable offer or market data.",
                "Tie compensation to impact, scope, and proof of delivery.",
            ],
            "leverage_points": ["Projects", "Relevant experience", "Interview performance"],
        },
        "personal_brand": {
            "github_strategy": "Publish one polished project and document tradeoffs clearly.",
            "linkedin_strategy": "Post concise updates about what you're building and learning.",
            "blog_topics": ["What I built and why", "Lessons from solving a hard problem"],
            "community": ["Local meetups", "Role-specific Discord/Slack communities"],
        },
        "risks_and_mitigation": [
            {"risk": "Applying before the evidence is strong enough", "mitigation": "Delay applications until one strong project is complete."},
            {"risk": "Too many goals at once", "mitigation": "Focus on one role and one stack."},
        ],
    }


def _fallback_interview_prep(job_title: str, company_name: str, job_description: str, resume_text: str) -> dict:
    return {
        "company_research": {
            "key_facts": [f"Role: {job_title or 'Target role'} at {company_name or 'the company'}"],
            "recent_news": ["Research company updates before the interview."],
            "culture_values": ["Ownership", "Execution", "Collaboration"],
            "why_they_hire": "They want someone who can solve real problems and communicate clearly.",
        },
        "likely_interview_rounds": [
            {"round": "Recruiter screen", "format": "Conversation", "duration": "30 mins", "focus": "Motivation and fit", "prep_tips": ["Have a crisp career story.", "Explain why this role now."]},
            {"round": "Technical round", "format": "Problem solving", "duration": "45-60 mins", "focus": "Core skills and depth", "prep_tips": ["Review fundamentals.", "Prepare one example of shipping impact."]},
            {"round": "Hiring manager", "format": "Deep dive", "duration": "45 mins", "focus": "Scope, ownership, and collaboration", "prep_tips": ["Be specific about outcomes.", "Show ownership."]},
        ],
        "behavioral_questions": [
            {
                "question": "Tell me about a challenging project you owned.",
                "why_asked": "To test ownership and execution.",
                "ideal_answer_structure": "Use STAR with one measurable outcome.",
                "candidate_example": "Use one of your strongest resume projects here.",
            },
            {
                "question": "Tell me about a time you had a conflict or disagreement.",
                "why_asked": "To see collaboration and judgment.",
                "ideal_answer_structure": "Explain context, tradeoff, and how you aligned stakeholders.",
                "candidate_example": "Choose a cross-functional example from your resume.",
            },
        ],
        "technical_questions": [
            {
                "topic": "Core stack",
                "question": f"What are the tradeoffs in the stack listed for {job_title or 'this role'}?",
                "approach": "Explain how you would choose the right architecture and justify it.",
                "concepts": ["Scalability", "Maintainability", "Performance"],
            },
            {
                "topic": "Problem solving",
                "question": "How would you debug a production issue?",
                "approach": "Walk through triage, isolation, and rollback strategy.",
                "concepts": ["Logging", "Metrics", "Root cause analysis"],
            },
        ],
        "questions_to_ask": [
            "What does success look like in the first 90 days?",
            "What are the biggest challenges this team is solving right now?",
            "How do top performers on this team stand out?",
        ],
        "red_flags_to_avoid": [
            "Being vague about your own impact.",
            "Talking too much without a clear structure.",
            "Skipping questions about tradeoffs or outcomes.",
        ],
        "day_of_tips": [
            "Prepare a 60-second intro and a 2-minute project story.",
            "Have one story for conflict, one for impact, and one for growth.",
            "Keep a notepad with key metrics and keywords.",
        ],
        "follow_up_email": (
            f"Hi {company_name or 'Team'},\n\nThank you for the conversation today. "
            "I enjoyed learning more about the role and the team's priorities. "
            "I’m excited about the opportunity and would love to continue the conversation.\n\nBest,\n[Your Name]"
        ),
    }


async def get_career_roadmap(resume_text: str, current_role: str, target_role: str, years: int = 2) -> dict:
    prompt = f"""
Create a detailed {years}-year career roadmap.

CURRENT PROFILE:
{resume_text[:2000]}

Current Role: {current_role}
Target Role: {target_role}
Timeline: {years} years

Return JSON:
{{
  "executive_summary": "<honest assessment of current position and what it will take>",
  "milestones": [
    {{
      "month": <month number>,
      "title": "<milestone name>",
      "goals": ["<specific goal>"],
      "skills_to_gain": ["<skill>"],
      "actions": ["<specific action>"],
      "checkpoint": "<how to know you've achieved this>"
    }}
  ],
  "quick_wins": [
    {{"action": "<action>", "timeline": "<1-2 weeks>", "impact": "<expected result>"}}
  ],
  "interview_prep": {{
    "behavioral_questions": [
      {{"question": "<question>", "star_answer_template": "<STAR format template>", "key_points": ["<point>"]}}
    ],
    "technical_topics": ["<topic to study>"],
    "resources": [{{"name": "<resource>", "url": "<url>", "priority": "<High/Medium>"}}]
  }},
  "salary_strategy": {{
    "current_market_rate": "<range>",
    "target_salary": "<range>",
    "negotiation_tips": ["<tip>"],
    "leverage_points": ["<leverage>"]
  }},
  "personal_brand": {{
    "github_strategy": "<what to build and post>",
    "linkedin_strategy": "<content and connection strategy>",
    "blog_topics": ["<topic to write about>"],
    "community": ["<community/event to join>"]
  }},
  "risks_and_mitigation": [
    {{"risk": "<risk>", "mitigation": "<how to mitigate>"}}
  ]
}}"""

    result = await call_ai_json(prompt, CAREER_SYSTEM, timeout_seconds=15, max_tokens=1200)
    if not result or not result.get("milestones") or result.get("executive_summary") is None:
        result = _fallback_career_roadmap(resume_text, current_role, target_role, years)
    return result


async def generate_interview_prep(job_title: str, company_name: str, job_description: str, resume_text: str) -> dict:
    prompt = f"""
Create a comprehensive interview preparation guide.

ROLE: {job_title} at {company_name}
JOB DESCRIPTION: {job_description[:1000]}
CANDIDATE RESUME: {resume_text[:1500]}

Return JSON:
{{
  "company_research": {{
    "key_facts": ["<fact>"],
    "recent_news": ["<news item>"],
    "culture_values": ["<value>"],
    "why_they_hire": "<what they look for>"
  }},
  "likely_interview_rounds": [
    {{"round": "<round name>", "format": "<format>", "duration": "<duration>", "focus": "<focus area>", "prep_tips": ["<tip>"]}}
  ],
  "behavioral_questions": [
    {{"question": "<question>", "why_asked": "<reason>", "ideal_answer_structure": "<STAR method>", "candidate_example": "<example from resume>"}}
  ],
  "technical_questions": [
    {{"topic": "<topic>", "question": "<question>", "approach": "<how to answer>", "concepts": ["<concept>"]}}
  ],
  "questions_to_ask": ["<smart question to ask interviewer>"],
  "red_flags_to_avoid": ["<common mistake>"],
  "day_of_tips": ["<practical tip>"],
  "follow_up_email": "<template follow-up email after interview>"
}}"""

    result = await call_ai_json(prompt, CAREER_SYSTEM, timeout_seconds=12, max_tokens=1000)
    if not result or not result.get("likely_interview_rounds") or result.get("company_research") is None:
        result = _fallback_interview_prep(job_title, company_name, job_description, resume_text)
    return result
