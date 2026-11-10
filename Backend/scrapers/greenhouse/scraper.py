import os
import re
from datetime import datetime, timedelta
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

from scrapers._shared import compose_description, freshness_label, normalize_text, stable_source_id

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json,text/html,application/xhtml+xml,*/*",
}


def _env_boards() -> list[str]:
    raw = os.getenv("GREENHOUSE_BOARDS", "")
    return [part.strip() for part in raw.split(",") if part.strip()]


def _extract_token_from_url(url: str) -> str | None:
    match = re.search(r"(?:boards-api\.greenhouse\.io/v1/boards/|boards\.greenhouse\.io/embed/job_board\?for=)([a-z0-9_-]+)", url, re.I)
    if match:
        return match.group(1)
    return None


async def _discover_tokens_from_page(client: httpx.AsyncClient, url: str) -> list[str]:
    tokens = []
    try:
        resp = await client.get(url, headers=HEADERS)
        if resp.status_code != 200:
            return tokens
        html = resp.text
        soup = BeautifulSoup(html, "html.parser")

        for pattern in [
            r"boards-api\.greenhouse\.io/v1/boards/([a-z0-9_-]+)",
            r"boards\.greenhouse\.io/embed/job_board\?for=([a-z0-9_-]+)",
        ]:
            tokens.extend(re.findall(pattern, html, re.I))

        for tag in soup.find_all(True):
            for attr in ("href", "src", "data-src", "data-href", "data-url"):
                value = tag.get(attr)
                if not value:
                    continue
                token = _extract_token_from_url(str(value))
                if token:
                    tokens.append(token)
    except Exception:
        pass
    return tokens


async def scrape_greenhouse_jobs(query: str, location: str = "", limit: int = 30) -> list:
    jobs = []
    seen_tokens = set()

    discovered_tokens = _env_boards()

    try:
        from scrapers.company_sites.scraper import KNOWN_CAREER_PAGES

        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            for url in KNOWN_CAREER_PAGES.values():
                discovered_tokens.extend(await _discover_tokens_from_page(client, url))
    except Exception:
        pass

    discovered_tokens = [t for t in dict.fromkeys(discovered_tokens) if t and t not in seen_tokens]

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        for token in discovered_tokens:
            try:
                api_url = f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true"
                resp = await client.get(api_url, headers=HEADERS)
                if resp.status_code != 200:
                    continue

                data = resp.json()
                job_list = data.get("jobs", [])
                for job in job_list[:limit]:
                    title = normalize_text(job.get("title", ""))
                    company = normalize_text(job.get("company_name", "")) or token.replace("-", " ").title()
                    location_text = normalize_text(job.get("location", {}).get("name", "")) if isinstance(job.get("location"), dict) else normalize_text(location)
                    if query and query.lower() not in f"{title} {job.get('content','')}".lower():
                        query_words = query.lower().split()
                        if not any(word in f"{title} {job.get('content','')}".lower() for word in query_words):
                            continue
                    posted_at = datetime.utcnow() - timedelta(hours=2)
                    description = normalize_text(job.get("content", ""))
                    if not description:
                        description = compose_description(job.get("metadata", {}), title, company, location_text)
                    jobs.append(
                        {
                            "title": title,
                            "company": company,
                            "location": location_text or location,
                            "posted_at": posted_at,
                            "freshness": freshness_label(posted_at),
                            "apply_link": job.get("absolute_url", api_url),
                            "source": "Greenhouse",
                            "source_id": stable_source_id("greenhouse", token, title, company, job.get("absolute_url", "")),
                            "description": description,
                            "skills": [],
                            "scraped_at": datetime.utcnow(),
                        }
                    )
                    if len(jobs) >= limit:
                        break
            except Exception as e:
                print(f"Greenhouse error for {token}: {e}")

            if len(jobs) >= limit:
                break

    return jobs[:limit]
