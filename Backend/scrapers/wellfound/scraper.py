import json
import re
import os
from datetime import datetime, timedelta

import httpx
from bs4 import BeautifulSoup

from scrapers._shared import compose_description, freshness_label, normalize_text, stable_source_id

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,*/*",
}


def _extract_job_like_objects(node):
    found = []
    if isinstance(node, dict):
        keys = set(node.keys())
        if {"title", "company"} & keys or {"name", "company"} <= keys or {"title", "id"} <= keys:
            found.append(node)
        for value in node.values():
            found.extend(_extract_job_like_objects(value))
    elif isinstance(node, list):
        for item in node:
            found.extend(_extract_job_like_objects(item))
    return found


async def scrape_wellfound(query: str, location: str = "", limit: int = 20) -> list:
    jobs = []
    url = f"https://wellfound.com/jobs?q={query.replace(' ', '+')}&location={location.replace(' ', '+')}"

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        try:
            resp = await client.get(url, headers=HEADERS)
            soup = BeautifulSoup(resp.text, "html.parser")

            scripts = soup.find_all("script", {"type": "application/json"})
            for script in scripts:
                try:
                    data = json.loads(script.string or "{}")
                    job_list = data.get("jobs", []) or data.get("data", {}).get("jobs", []) or _extract_job_like_objects(data)
                    for job in job_list[:limit]:
                        title = normalize_text(job.get("title", "") or job.get("name", ""))
                        company_data = job.get("company", {})
                        company = normalize_text(company_data.get("name", "")) if isinstance(company_data, dict) else normalize_text(company_data)
                        posted_at = datetime.utcnow() - timedelta(hours=2)
                        apply_link = f"https://wellfound.com/jobs/{job.get('id', '')}"
                        jobs.append(
                            {
                                "title": title,
                                "company": company,
                                "location": normalize_text(job.get("location", location)),
                                "posted_at": posted_at,
                                "freshness": freshness_label(posted_at),
                                "apply_link": apply_link,
                                "source": "Wellfound",
                                "source_id": stable_source_id("wellfound", title, company, apply_link),
                                "description": normalize_text(job.get("description", "")) or compose_description(soup, title, company, location),
                                "skills": job.get("skills", []) or [],
                                "salary": normalize_text(job.get("compensation", "")),
                                "scraped_at": datetime.utcnow(),
                            }
                        )
                except Exception:
                    continue

            if not jobs:
                for script in soup.find_all("script", type=re.compile(r"ld\+json", re.I)):
                    try:
                        data = json.loads(script.string or "{}")
                        for job in _extract_job_like_objects(data)[:limit]:
                            title = normalize_text(job.get("title", "") or job.get("name", ""))
                            if not title:
                                continue
                            company_data = job.get("company", {})
                            company = normalize_text(company_data.get("name", "")) if isinstance(company_data, dict) else normalize_text(company_data)
                            posted_at = datetime.utcnow() - timedelta(hours=2)
                            apply_link = normalize_text(job.get("url", "")) or f"https://wellfound.com/jobs/{job.get('id', '')}"
                            jobs.append(
                                {
                                    "title": title,
                                    "company": company,
                                    "location": normalize_text(job.get("location", location)),
                                    "posted_at": posted_at,
                                    "freshness": freshness_label(posted_at),
                                    "apply_link": apply_link,
                                    "source": "Wellfound",
                                    "source_id": stable_source_id("wellfound", title, company, apply_link),
                                    "description": normalize_text(job.get("description", "")) or compose_description(soup, title, company, location),
                                    "skills": job.get("skills", []) or [],
                                    "salary": normalize_text(job.get("compensation", "")),
                                    "scraped_at": datetime.utcnow(),
                                }
                            )
                    except Exception:
                        continue

            if not jobs:
                cards = soup.find_all("div", class_=re.compile(r"(job|listing|card)", re.I))
                for card in cards[:limit]:
                    title_el = card.find(["h2", "h3", "a"], class_=re.compile(r"(title|name)", re.I))
                    title = normalize_text(title_el.get_text(" ", strip=True)) if title_el else ""
                    if not title:
                        continue
                    posted_at = datetime.utcnow() - timedelta(hours=3)
                    jobs.append(
                        {
                            "title": title,
                            "company": "",
                            "location": location,
                            "posted_at": posted_at,
                            "freshness": freshness_label(posted_at),
                            "apply_link": url,
                            "source": "Wellfound",
                            "source_id": stable_source_id("wellfound", title, location, url),
                            "description": compose_description(card, title, "", location),
                            "skills": [],
                            "scraped_at": datetime.utcnow(),
                        }
                    )
        except Exception as e:
            print(f"Wellfound error: {e}")

    return jobs[:limit]


async def scrape_internshala(query: str, location: str = "", limit: int = 20) -> list:
    jobs = []
    q = query.lower().replace(" ", "-")
    url = f"https://internshala.com/jobs/{q}-jobs-in-{location.lower().replace(' ', '-') or 'india'}"

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        try:
            resp = await client.get(url, headers=HEADERS)
            soup = BeautifulSoup(resp.text, "html.parser")
            cards = soup.find_all("div", class_=re.compile(r"(internship_meta|job_card|individual_internship)", re.I))

            for card in cards[:limit]:
                try:
                    title_el = card.find(["a", "h3"], class_=re.compile(r"(job-title|profile|heading)", re.I))
                    title = normalize_text(title_el.get_text(" ", strip=True)) if title_el else ""
                    comp_el = card.find(["a", "p"], class_=re.compile(r"(company|employer)", re.I))
                    company = normalize_text(comp_el.get_text(" ", strip=True)) if comp_el else ""
                    loc_el = card.find(["span", "div"], class_=re.compile(r"(location|city)", re.I))
                    job_location = normalize_text(loc_el.get_text(" ", strip=True)) if loc_el else location
                    link_el = card.find("a", href=True)
                    href = link_el["href"] if link_el else ""
                    apply_link = f"https://internshala.com{href}" if href and not href.startswith("http") else href
                    posted_at = datetime.utcnow() - timedelta(hours=6)
                    if title:
                        jobs.append(
                            {
                                "title": title,
                                "company": company,
                                "location": job_location,
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
        except Exception as e:
            print(f"Internshala error: {e}")

    return jobs[:limit]


async def scrape_foundit(query: str, location: str = "", limit: int = 20) -> list:
    jobs = []
    url = f"https://www.foundit.in/srp/results?query={query.replace(' ', '+')}&location={location.replace(' ', '+')}&experienceRanges=0~2&sort=1"

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        try:
            resp = await client.get(url, headers=HEADERS)
            soup = BeautifulSoup(resp.text, "html.parser")
            cards = soup.find_all("div", class_=re.compile(r"(cardBody|job-card|srpResultCardContainer)", re.I))

            for card in cards[:limit]:
                try:
                    title_el = card.find(["h3", "a", "span"], class_=re.compile(r"(title|jobTitle|position)", re.I))
                    title = normalize_text(title_el.get_text(" ", strip=True)) if title_el else ""
                    comp_el = card.find(["span", "a"], class_=re.compile(r"(companyName|company)", re.I))
                    company = normalize_text(comp_el.get_text(" ", strip=True)) if comp_el else ""
                    link_el = card.find("a", href=True)
                    href = link_el["href"] if link_el else ""
                    apply_link = f"https://www.foundit.in{href}" if href and not href.startswith("http") else href
                    posted_at = datetime.utcnow() - timedelta(hours=4)
                    if title:
                        jobs.append(
                            {
                                "title": title,
                                "company": company,
                                "location": location,
                                "posted_at": posted_at,
                                "freshness": freshness_label(posted_at),
                                "apply_link": apply_link,
                                "source": "Foundit",
                                "source_id": stable_source_id("foundit", title, company, apply_link),
                                "description": compose_description(card, title, company, location),
                                "skills": [],
                                "scraped_at": datetime.utcnow(),
                            }
                        )
                except Exception:
                    continue
        except Exception as e:
            print(f"Foundit error: {e}")

    return jobs[:limit]
