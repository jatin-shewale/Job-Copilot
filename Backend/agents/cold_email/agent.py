from ai.base import call_ai, call_ai_json
import httpx
from bs4 import BeautifulSoup
import re

EMAIL_SYSTEM = """You are a cold outreach expert who has sent 50,000+ cold emails with 35%+ open rates.
You write emails that:
- Have subject lines with 60%+ open rates
- Open with a personalized observation about the company
- Lead with value, not requests
- Are brief (under 150 words)
- Have a single clear CTA
- Sound human and authentic"""


def _fallback_cold_emails(job_title: str, company_name: str, hr_name: str = "") -> dict:
    recipient_name = hr_name.strip() or "Hiring Team"
    subject_base = f"{job_title} opportunity at {company_name}"
    return {
        "emails": [
            {
                "type": "Direct & Confident",
                "subject": f"Interest in {job_title} at {company_name}",
                "body": (
                    f"Hi {recipient_name},\n\n"
                    f"I'm reaching out because I'm very interested in the {job_title} role at {company_name}. "
                    "My background is in building practical, high-impact solutions and I’d love to bring that same approach to your team.\n\n"
                    "If helpful, I’d be glad to share a brief summary of relevant work or jump on a quick call.\n\n"
                    "Best,\n[Your Name]"
                ),
                "best_for": "When you want to sound confident and direct.",
            },
            {
                "type": "Value-First Approach",
                "subject": f"How I can contribute to {company_name}",
                "body": (
                    f"Hi {recipient_name},\n\n"
                    f"I’m interested in the {job_title} opening at {company_name} and wanted to introduce myself. "
                    "I focus on delivering measurable results, improving processes, and shipping work that matters.\n\n"
                    "If there’s a fit, I’d love to connect and share how I can help.\n\n"
                    "Regards,\n[Your Name]"
                ),
                "best_for": "When you want to lead with value instead of asking for a job.",
            },
            {
                "type": "Mutual Connection / Research-Based",
                "subject": subject_base,
                "body": (
                    f"Hi {recipient_name},\n\n"
                    f"I came across the {job_title} opportunity at {company_name} and wanted to reach out directly. "
                    "Your team’s work stood out to me, and I think my experience could be a strong match.\n\n"
                    "I’d appreciate the chance to introduce myself and see whether I could be useful to your team.\n\n"
                    "Thanks,\n[Your Name]"
                ),
                "best_for": "When you want a warmer, more relationship-driven note.",
            },
        ],
        "follow_up_template": (
            f"Hi {recipient_name},\n\n"
            f"Just following up on my message about the {job_title} role at {company_name}. "
            "I’m still very interested and would welcome the chance to connect if you’re open to it.\n\n"
            "Best,\n[Your Name]"
        ),
        "sending_tips": [
            "Send Tuesday to Thursday in the morning or early afternoon.",
            "Keep the subject line short and specific.",
            "Make the first 2 sentences about them, not you.",
        ],
        "best_time_to_send": "Tuesday-Thursday, 9:00 AM to 11:30 AM local time",
    }

async def generate_cold_email(
    resume_text: str,
    job_title: str,
    company_name: str,
    hr_name: str = "",
    company_email: str = ""
) -> dict:
    recipient = f"Hi {hr_name}" if hr_name else f"Hi Hiring Team at {company_name}"
    
    prompt = f"""
Write 3 different cold email variations for job outreach.

CANDIDATE INFO (from resume):
{resume_text[:1500]}

TARGET: {job_title} at {company_name}
RECIPIENT: {hr_name or "HR/Hiring Manager"}

Return JSON:
{{
  "emails": [
    {{
      "type": "Direct & Confident",
      "subject": "<compelling subject line>",
      "body": "<full email body, 100-130 words>",
      "best_for": "<when to use this>"
    }},
    {{
      "type": "Value-First Approach",
      "subject": "<subject line>",
      "body": "<full email body>",
      "best_for": "<when to use>"
    }},
    {{
      "type": "Mutual Connection / Research-Based",
      "subject": "<subject line>",
      "body": "<full email body>",
      "best_for": "<when to use>"
    }}
  ],
  "follow_up_template": "<follow up email for 7 days later>",
  "sending_tips": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "best_time_to_send": "<day and time recommendation>"
    }}"""
    
    result = await call_ai_json(prompt, EMAIL_SYSTEM)
    if result and result.get("emails") and result.get("follow_up_template"):
        return result
    return _fallback_cold_emails(job_title, company_name, hr_name)

async def scrape_company_contact(company_name: str, website: str = "") -> dict:
    """Scrape company website for HR/contact info"""
    results = {
        "company_name": company_name,
        "website": website,
        "emails_found": [],
        "hr_contact": None,
        "careers_page": None,
        "linkedin_page": None,
        "social_links": {}
    }
    
    if not website:
        # Try to guess website
        slug = company_name.lower().replace(" ", "").replace(",", "").replace(".", "")
        website = f"https://www.{slug}.com"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            # Try main website
            try:
                resp = await client.get(website, headers=headers)
                soup = BeautifulSoup(resp.text, "html.parser")
                
                # Find emails
                emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', resp.text)
                # Filter relevant emails
                relevant = [e for e in set(emails) if not any(x in e.lower() for x in ['example', 'test', 'noreply', 'no-reply'])]
                results["emails_found"] = relevant[:5]
                
                # Find careers page
                links = soup.find_all("a", href=True)
                for link in links:
                    href = link.get("href", "").lower()
                    text = link.get_text().lower()
                    if any(x in href or x in text for x in ["career", "jobs", "hiring", "work-with-us", "join"]):
                        careers_url = href if href.startswith("http") else website.rstrip("/") + "/" + href.lstrip("/")
                        results["careers_page"] = careers_url
                        break
                
                # Find social links
                for link in links:
                    href = link.get("href", "")
                    if "linkedin.com" in href:
                        results["social_links"]["linkedin"] = href
                    elif "twitter.com" in href or "x.com" in href:
                        results["social_links"]["twitter"] = href
                
            except Exception as e:
                results["error"] = str(e)
            
            # Try careers page for HR emails
            if results.get("careers_page"):
                try:
                    resp2 = await client.get(results["careers_page"], headers=headers)
                    more_emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', resp2.text)
                    results["emails_found"].extend([e for e in set(more_emails) if e not in results["emails_found"]][:3])
                    
                    soup2 = BeautifulSoup(resp2.text, "html.parser")
                    # Look for HR contact names
                    text = soup2.get_text()
                    hr_patterns = re.findall(r'(?:HR|Recruiter|Talent|People)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)', text)
                    if hr_patterns:
                        results["hr_contact"] = hr_patterns[0]
                except:
                    pass
    except Exception as e:
        results["scrape_error"] = str(e)
    
    results["emails_found"] = list(set(results["emails_found"]))
    return results
