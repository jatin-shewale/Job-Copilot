import asyncio
from collections import defaultdict
from datetime import datetime
import re
from scrapers.linkedin.scraper import scrape_linkedin_jobs
from scrapers.indeed.scraper import scrape_indeed_jobs
from scrapers.wellfound.scraper import scrape_wellfound, scrape_foundit
from scrapers.internshala.scraper import scrape_internshala_jobs
from scrapers.greenhouse.scraper import scrape_greenhouse_jobs
from scrapers.company_sites.scraper import scrape_multiple_company_pages, KNOWN_CAREER_PAGES

SOURCE_ORDER = [
    "LinkedIn",
    "Indeed",
    "Wellfound",
    "Internshala",
    "Foundit",
    "Greenhouse",
    "Career Page",
    "Unknown",
]

ROLE_STOPWORDS = {
    "junior",
    "jr",
    "senior",
    "sr",
    "lead",
    "staff",
    "principal",
    "entry",
    "mid",
    "level",
    "intern",
    "internship",
    "associate",
    "trainee",
    "remote",
    "onsite",
    "hybrid",
    "full-time",
    "fulltime",
    "part-time",
    "contract",
    "temporary",
}

ROLE_SYNONYMS = {
    "software engineer": ["software developer", "backend engineer", "frontend engineer", "full stack engineer"],
    "software developer": ["software engineer", "backend developer", "frontend developer", "full stack developer"],
    "frontend developer": ["frontend engineer", "react developer", "ui developer", "web developer"],
    "frontend engineer": ["frontend developer", "react engineer", "ui engineer", "web developer"],
    "backend developer": ["backend engineer", "api developer", "platform engineer"],
    "backend engineer": ["backend developer", "api engineer", "platform engineer"],
    "full stack developer": ["full stack engineer", "software engineer", "web developer"],
    "data scientist": ["machine learning engineer", "data analyst", "ml engineer"],
    "data analyst": ["business analyst", "reporting analyst", "product analyst"],
    "product manager": ["product owner", "program manager", "project manager"],
    "qa engineer": ["test engineer", "automation engineer", "sdet"],
    "ui ux designer": ["product designer", "graphic designer", "ux designer"],
}


def _build_query_variants(query: str) -> list[str]:
    clean = " ".join((query or "").split()).strip()
    if not clean:
        return [""]

    variants = [clean]
    words = [part for part in re.split(r"\s+", clean) if part]
    stripped = [word for word in words if word.lower() not in ROLE_STOPWORDS]
    if stripped:
        variants.append(" ".join(stripped))
    if len(words) > 1:
        variants.append(words[-1])
        variants.append(words[0])

    variants.extend(ROLE_SYNONYMS.get(clean.lower(), []))

    deduped = []
    seen = set()
    for variant in variants:
        normalized = " ".join(variant.split()).strip()
        if normalized and normalized.lower() not in seen:
            seen.add(normalized.lower())
            deduped.append(normalized)
    return deduped[:4]


async def _scrape_round(query: str, location: str, per_source: int) -> tuple[list, dict]:
    tasks = [
        scrape_linkedin_jobs(query, location, per_source),
        scrape_indeed_jobs(query, location, per_source),
        scrape_wellfound(query, location, per_source),
        scrape_internshala_jobs(query, location, per_source),
        scrape_foundit(query, location, per_source),
        scrape_greenhouse_jobs(query, location, per_source),
        scrape_multiple_company_pages(
            [{"name": name.title(), "url": url} for name, url in list(KNOWN_CAREER_PAGES.items())[:10]],
            query,
        ),
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)

    round_jobs = []
    source_counts = {}

    for result in results:
        if isinstance(result, list) and result:
            round_jobs.extend(result)
            source = result[0].get("source", "Unknown")
            source_counts[source] = source_counts.get(source, 0) + len(result)
        elif isinstance(result, Exception):
            print(f"Scraper error: {result}")

    return round_jobs, source_counts


def _posted_at_key(job: dict) -> datetime:
    posted_at = job.get("posted_at")
    return posted_at if isinstance(posted_at, datetime) else datetime.min


def _balance_by_source(jobs: list) -> list:
    buckets = defaultdict(list)
    seen_sources = []

    for job in jobs:
        source = job.get("source") or "Unknown"
        if source not in buckets:
            seen_sources.append(source)
        buckets[source].append(job)

    for source_jobs in buckets.values():
        source_jobs.sort(key=_posted_at_key, reverse=True)

    ordered_sources = [source for source in SOURCE_ORDER if source in buckets]
    ordered_sources.extend(source for source in seen_sources if source not in SOURCE_ORDER)

    balanced = []
    index = 0
    total_jobs = sum(len(source_jobs) for source_jobs in buckets.values())

    while len(balanced) < total_jobs:
        progress = False
        for source in ordered_sources:
            source_jobs = buckets.get(source, [])
            if index < len(source_jobs):
                balanced.append(source_jobs[index])
                progress = True
        if not progress:
            break
        index += 1

    return balanced


async def scrape_all_sources(query: str, location: str = "", limit: int = 50) -> list:
    """Aggregate jobs from all sources concurrently"""
    query = (query or "").strip()
    location = (location or "").strip()
    per_source = max(limit // 7, 50)
    all_jobs = []
    source_counts = {}

    for variant in _build_query_variants(query):
        round_jobs, round_counts = await _scrape_round(variant, location, per_source)
        all_jobs.extend(round_jobs)
        for source, count in round_counts.items():
            source_counts[source] = source_counts.get(source, 0) + count

        if len(all_jobs) >= limit * 2:
            break

    # Deduplicate by title+company (case-insensitive)
    seen = {}
    unique_jobs = []
    for job in all_jobs:
        key = f"{job.get('title','').lower().strip()}|{job.get('company','').lower().strip()}"
        if key not in seen:
            seen[key] = True
            unique_jobs.append(job)

    # Keep results fresh, but interleave sources so one scraper does not dominate the top of the list.
    unique_jobs.sort(key=_posted_at_key, reverse=True)
    unique_jobs = _balance_by_source(unique_jobs)

    print(f"[Aggregator] Sources: {source_counts} | Total unique: {len(unique_jobs)}")
    return unique_jobs[:limit]

async def scrape_company_jobs(company_name: str, company_website: str = "", query: str = "") -> list:
    """Scrape jobs from a specific company's career page"""
    from scrapers.company_sites.scraper import scrape_company_career_page
    return await scrape_company_career_page(company_name, company_website, query)
