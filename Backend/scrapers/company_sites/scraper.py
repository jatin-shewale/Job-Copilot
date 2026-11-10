import re
from datetime import datetime, timedelta

import httpx
from bs4 import BeautifulSoup

from scrapers._shared import compose_description, freshness_label, normalize_text, stable_source_id

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.9",
}

KNOWN_CAREER_PAGES = {
    "razorpay": "https://razorpay.com/jobs/",
    "swiggy": "https://careers.swiggy.com/",
    "zomato": "https://www.zomato.com/careers",
    "cred": "https://careers.cred.club/",
    "groww": "https://groww.in/careers",
    "meesho": "https://meesho.io/careers",
    "zepto": "https://www.zeptonow.com/careers",
    "coinbase": "https://www.coinbase.com/careers/positions",
    "stripe": "https://stripe.com/jobs/search",
    "atlassian": "https://www.atlassian.com/company/careers/all-jobs",
}


async def scrape_company_career_page(company_name: str, career_url: str = "", query: str = "") -> list:
    jobs = []

    if not career_url:
        slug = company_name.lower().strip().replace(" ", "")
        career_url = KNOWN_CAREER_PAGES.get(slug, "")

    if not career_url:
        slug = re.sub(r"[^a-z0-9]", "", company_name.lower())
        career_url = f"https://www.{slug}.com/careers"

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        try:
            resp = await client.get(career_url, headers=HEADERS)
            if resp.status_code not in [200, 301, 302]:
                return jobs

            soup = BeautifulSoup(resp.text, "html.parser")
            job_selectors = [
                {"tag": "div", "attrs": {"class": re.compile(r"(?:job|jobs|career|careers|position|positions|opening|openings|role|roles|vacancy|vacancies)(?:[-_ ]?(?:card|item|listing|row|result|opening|position|role|vacancy))?", re.I)}},
                {"tag": "li", "attrs": {"class": re.compile(r"job|position|opening|role|vacancy", re.I)}},
                {"tag": "tr", "attrs": {"class": re.compile(r"job|position|opening", re.I)}},
                {"tag": "article", "attrs": {}},
            ]

            found_cards = []
            for selector in job_selectors:
                cards = soup.find_all(selector["tag"], selector["attrs"])
                if len(cards) >= 2:
                    found_cards = cards
                    break

            if not found_cards:
                found_cards = soup.find_all(
                    ["div", "li", "article"],
                    class_=re.compile(r"(job|career|opening|position|role|vacancy)", re.I),
                )
            if not found_cards:
                anchors = soup.find_all("a", href=True)
                for anchor in anchors:
                    text = normalize_text(anchor.get_text(" ", strip=True))
                    href = anchor.get("href", "")
                    if len(text) < 5:
                        continue
                    if any(k in text.lower() or k in href.lower() for k in ["job", "career", "position", "role", "opening", "vacancy"]):
                        found_cards.append(anchor)

            for card in found_cards[:20]:
                try:
                    title_el = card.find(["h1", "h2", "h3", "h4", "h5"]) or card.find("a", href=re.compile(r"job|career|position|role"))
                    if not title_el:
                        continue
                    title = normalize_text(title_el.get_text(" ", strip=True))
                    if len(title) < 5 or len(title) > 120:
                        continue
                    if any(x in title.lower() for x in ["click", "apply", "view", "see all", "more jobs"]):
                        continue
                    if query and query.lower() not in title.lower():
                        query_words = query.lower().split()
                        if not any(w in title.lower() for w in query_words):
                            continue

                    loc_el = card.find(["span", "div", "p"], string=re.compile(r"remote|india|bangalore|mumbai|delhi|hyderabad|chennai|pune", re.I))
                    job_location = normalize_text(loc_el.get_text(" ", strip=True)) if loc_el else "India"

                    link_el = card.find("a", href=True)
                    if link_el:
                        href = link_el["href"]
                        if href.startswith("http"):
                            apply_link = href
                        elif href.startswith("/"):
                            base = "/".join(career_url.split("/")[:3])
                            apply_link = base + href
                        else:
                            apply_link = career_url
                    else:
                        apply_link = career_url

                    posted_at = datetime.utcnow() - timedelta(hours=2)
                    jobs.append(
                        {
                            "title": title,
                            "company": company_name,
                            "location": job_location,
                            "salary": "",
                            "job_type": "Full-time",
                            "posted_at": posted_at,
                            "freshness": freshness_label(posted_at),
                            "apply_link": apply_link,
                            "source": "Career Page",
                            "source_id": stable_source_id("career", company_name, title, apply_link),
                            "description": compose_description(card, title, company_name, job_location),
                            "skills": [],
                            "scraped_at": datetime.utcnow(),
                        }
                    )
                except Exception:
                    continue
        except Exception as e:
            print(f"Career page scrape error for {company_name}: {e}")

    return jobs


async def scrape_multiple_company_pages(companies: list, query: str = "") -> list:
    import asyncio

    tasks = [scrape_company_career_page(c.get("name", ""), c.get("url", ""), query) for c in companies]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_jobs = []
    for result in results:
        if isinstance(result, list):
            all_jobs.extend(result)

    return all_jobs
