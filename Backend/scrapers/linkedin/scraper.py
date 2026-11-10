import re
from datetime import datetime, timedelta

import httpx
from bs4 import BeautifulSoup

from scrapers._shared import compose_description, freshness_label, normalize_text, stable_source_id

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
}


def parse_posted_time(time_str: str) -> datetime:
    now = datetime.utcnow()
    if not time_str:
        return now
    text = time_str.lower().strip()
    try:
        if "second" in text or "just now" in text:
            return now
        if "minute" in text:
            mins = int(re.search(r"\d+", text).group()) if re.search(r"\d+", text) else 1
            return now - timedelta(minutes=mins)
        if "hour" in text:
            hrs = int(re.search(r"\d+", text).group()) if re.search(r"\d+", text) else 1
            return now - timedelta(hours=hrs)
        if "day" in text:
            days = int(re.search(r"\d+", text).group()) if re.search(r"\d+", text) else 1
            return now - timedelta(days=days)
        if "week" in text:
            weeks = int(re.search(r"\d+", text).group()) if re.search(r"\d+", text) else 1
            return now - timedelta(weeks=weeks)
    except Exception:
        pass
    return now


async def scrape_linkedin_jobs(query: str, location: str = "", limit: int = 30) -> list:
    jobs = []
    query_encoded = query.replace(" ", "%20")
    location_encoded = location.replace(" ", "%20") if location else ""

    urls = [
        f"https://www.linkedin.com/jobs/search/?keywords={query_encoded}&location={location_encoded}&f_TPR=r3600&sortBy=DD",
        f"https://www.linkedin.com/jobs/search/?keywords={query_encoded}&location={location_encoded}&f_TPR=r86400&sortBy=DD",
        f"https://www.linkedin.com/jobs/search?keywords={query_encoded}&location={location_encoded}&sortBy=DD",
    ]

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        for url in urls:
            try:
                resp = await client.get(url, headers=HEADERS)
                if resp.status_code != 200:
                    continue

                soup = BeautifulSoup(resp.text, "html.parser")
                job_cards = soup.find_all(
                    ["li", "div"],
                    class_=re.compile(r"(job-search-card|base-card|result-card|job-card|job-result-card)", re.I),
                )
                if not job_cards:
                    job_cards = soup.find_all("li", attrs={"data-occludable-job-id": True})

                for card in job_cards[:limit]:
                    try:
                        title_el = card.find(["h3", "h4", "a"], class_=re.compile(r"title", re.I))
                        title = normalize_text(title_el.get_text(" ", strip=True)) if title_el else ""
                        company_el = card.find(["h4", "a", "span"], class_=re.compile(r"subtitle|company", re.I))
                        company = normalize_text(company_el.get_text(" ", strip=True)) if company_el else ""
                        loc_el = card.find(["span", "div"], class_=re.compile(r"location|job-location", re.I))
                        job_location = normalize_text(loc_el.get_text(" ", strip=True)) if loc_el else location

                        time_el = card.find(["time", "span"], class_=re.compile(r"date|posted|time", re.I))
                        posted_str = ""
                        if time_el:
                            posted_str = time_el.get("datetime", "") or time_el.get_text(" ", strip=True)
                        time_tag = card.find("time")
                        if time_tag and time_tag.get("datetime"):
                            try:
                                posted_at = datetime.fromisoformat(time_tag["datetime"].replace("Z", "+00:00")).replace(tzinfo=None)
                            except Exception:
                                posted_at = parse_posted_time(posted_str)
                        else:
                            posted_at = parse_posted_time(posted_str)

                        link_el = card.find("a", href=True)
                        apply_link = link_el["href"] if link_el else ""
                        if apply_link and not apply_link.startswith("http"):
                            apply_link = "https://www.linkedin.com" + apply_link

                        job_id = re.search(r"/jobs/view/(\d+)", apply_link or "")
                        source_id = f"linkedin_{job_id.group(1)}" if job_id else stable_source_id("linkedin", title, company, job_location)
                        if not title:
                            continue

                        jobs.append(
                            {
                                "title": title,
                                "company": company,
                                "location": job_location or location,
                                "posted_at": posted_at,
                                "freshness": freshness_label(posted_at),
                                "apply_link": apply_link,
                                "source": "LinkedIn",
                                "source_id": source_id,
                                "description": compose_description(card, title, company, job_location),
                                "skills": [],
                                "job_type": "Full-time",
                                "scraped_at": datetime.utcnow(),
                            }
                        )
                    except Exception:
                        continue

                if len(jobs) >= limit:
                    break
            except Exception as e:
                print(f"LinkedIn scrape error: {e}")

    jobs.sort(key=lambda x: x["posted_at"], reverse=True)
    return jobs[:limit]
