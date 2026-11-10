import re
from datetime import datetime, timedelta

import httpx
from bs4 import BeautifulSoup

from scrapers._shared import compose_description, freshness_label, normalize_text, stable_source_id

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.9",
    "Accept-Language": "en-US,en;q=0.9",
}


async def scrape_internshala_jobs(query: str, location: str = "", limit: int = 20) -> list:
    jobs = []
    q = query.lower().strip().replace(" ", "-")
    loc = location.lower().strip().replace(" ", "-") if location else "india"

    urls = [
        f"https://internshala.com/jobs/{q}-jobs",
        f"https://internshala.com/jobs/{q}-jobs-in-{loc}",
        f"https://internshala.com/internships/{q}-internship",
    ]

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        for url in urls:
            try:
                resp = await client.get(url, headers=HEADERS)
                if resp.status_code != 200:
                    continue

                soup = BeautifulSoup(resp.text, "html.parser")
                cards = (
                    soup.find_all("div", class_=re.compile(r"(individual_internship|internship_meta|job_internship_name)", re.I))
                    or soup.find_all("div", id=re.compile(r"individual_internship_\d+"))
                    or soup.find_all("article")
                )

                for card in cards[:limit]:
                    try:
                        title_el = (
                            card.find("a", class_=re.compile(r"(job-title|profile|internship-heading)", re.I))
                            or card.find("h3")
                            or card.find("h4")
                        )
                        title = normalize_text(title_el.get_text(" ", strip=True)) if title_el else ""

                        comp_el = card.find(["a", "p", "div"], class_=re.compile(r"(company-name|company_name|employer)", re.I))
                        company = normalize_text(comp_el.get_text(" ", strip=True)) if comp_el else ""

                        loc_el = card.find(["span", "div"], class_=re.compile(r"(location|city)", re.I))
                        job_location = normalize_text(loc_el.get_text(" ", strip=True)) if loc_el else (location or "India")

                        stipend_el = card.find(["span", "div"], class_=re.compile(r"(stipend|salary|ctc)", re.I))
                        salary = normalize_text(stipend_el.get_text(" ", strip=True)) if stipend_el else ""

                        link_el = card.find("a", href=True)
                        href = link_el["href"] if link_el else ""
                        apply_link = href if href.startswith("http") else f"https://internshala.com{href}"

                        type_el = card.find("span", class_=re.compile(r"(part_time|full_time|job_type|badge)", re.I))
                        job_type = normalize_text(type_el.get_text(" ", strip=True)) if type_el else "Full-time"

                        posted_at = datetime.utcnow() - timedelta(hours=4)
                        active_el = card.find(["span", "div"], class_=re.compile(r"(actively|recent|new)", re.I))
                        if active_el and "active" in active_el.get_text(strip=True).lower():
                            posted_at = datetime.utcnow() - timedelta(hours=1)

                        if not title or len(title) <= 3:
                            continue

                        jobs.append(
                            {
                                "title": title,
                                "company": company,
                                "location": job_location,
                                "salary": salary,
                                "job_type": job_type,
                                "posted_at": posted_at,
                                "freshness": freshness_label(posted_at),
                                "apply_link": apply_link,
                                "source": "Internshala",
                                "source_id": stable_source_id("internshala", title, company, job_location, apply_link),
                                "description": compose_description(card, title, company, job_location),
                                "skills": [],
                                "scraped_at": datetime.utcnow(),
                            }
                        )
                    except Exception:
                        continue

                if jobs:
                    break
            except Exception as e:
                print(f"Internshala scrape error: {e}")

    return jobs[:limit]
