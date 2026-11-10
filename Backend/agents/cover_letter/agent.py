import asyncio

from ai.base import call_ai

COVER_SYSTEM = """You are an expert career coach and professional writer who has helped 10,000+ candidates land interviews at Fortune 500 companies.
You write compelling, personalized cover letters that:
- Open with a powerful hook
- Demonstrate specific knowledge of the company
- Align candidate's achievements with job requirements
- Use the Google XYZ formula for achievements
- Close with a confident call to action
- Sound human, not AI-generated"""


def _fallback_cover_letter(
    resume_text: str,
    job_title: str,
    company_name: str,
    job_description: str = "",
    company_info: str = "",
) -> dict:
    clean_job = job_title or "the role"
    clean_company = company_name or "your team"
    short_context = (job_description or company_info or "").strip()
    first_line = (
        f"I’m excited to apply for the {clean_job} position at {clean_company} because the role aligns with my background "
        "in building practical, high-impact work and shipping results that matter."
    )
    second_line = (
        "In my recent experience, I’ve worked across technical execution, problem solving, and cross-functional collaboration, "
        "with a focus on measurable outcomes and clear ownership."
    )
    third_line = (
        f"What stood out to me about {clean_company} was its work and the opportunity to contribute with a thoughtful, "
        "reliable, and impact-oriented approach."
    )
    if short_context:
        third_line = (
            f"What stood out to me about {clean_company} was the focus on {short_context[:180]} and the chance to contribute "
            "with a thoughtful, reliable, and impact-oriented approach."
        )
    closing = (
        "I would welcome the opportunity to discuss how my experience could support your team’s goals. "
        "Thank you for your time and consideration."
    )

    full_cover_letter = "\n\n".join([first_line, second_line, third_line, closing])
    email_version = (
        f"Hi Hiring Team,\n\n{first_line} "
        f"{second_line} {third_line} {closing}\n\nBest,\n[Your Name]"
    )

    return {
        "full_cover_letter": full_cover_letter,
        "email_version": email_version,
        "job_title": job_title,
        "company_name": company_name,
    }

async def generate_cover_letter(
    resume_text: str,
    job_title: str,
    company_name: str,
    job_description: str,
    company_info: str = ""
) -> dict:
    prompt = f"""
Write a professional cover letter.

CANDIDATE RESUME:
{resume_text[:2000]}

TARGET JOB: {job_title} at {company_name}

JOB DESCRIPTION:
{job_description[:1200]}

COMPANY INFO:
{company_info[:500] if company_info else "Research and mention what you know about " + company_name}

Requirements:
- 3-4 paragraphs
- Paragraph 1: Powerful opening with specific reason for applying to THIS company
- Paragraph 2: 2-3 specific achievements matching job requirements (use XYZ formula)
- Paragraph 3: Company-specific knowledge and cultural fit
- Paragraph 4: Confident close with specific call to action
- Tone: Professional but genuine, confident not arrogant
- Length: 300-400 words

Return ONLY the cover letter text, no JSON."""

    letter_task = call_ai(
        prompt,
        COVER_SYSTEM,
        temperature=0.55,
        max_tokens=800,
        timeout_seconds=20,
    )
    
    prompt2 = f"""
Now also write an alternative version of this cover letter that is more concise (150-200 words) for email body.

CANDIDATE RESUME (brief):
{resume_text[:1000]}

TARGET JOB: {job_title} at {company_name}

Return ONLY the short email version."""

    short_task = call_ai(
        prompt2,
        COVER_SYSTEM,
        temperature=0.45,
        max_tokens=250,
        timeout_seconds=12,
    )

    letter, short_version = await asyncio.gather(letter_task, short_task)

    if not letter or not short_version:
        fallback = _fallback_cover_letter(resume_text, job_title, company_name, job_description, company_info)
        if not letter:
            letter = fallback["full_cover_letter"]
        if not short_version:
            short_version = fallback["email_version"]

    return {
        "full_cover_letter": letter,
        "email_version": short_version,
        "job_title": job_title,
        "company_name": company_name,
    }
