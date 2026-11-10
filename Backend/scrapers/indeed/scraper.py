import re
from datetime import datetime, timedelta

import httpx
from bs4 import BeautifulSoup

from scrapers._shared import compose_description, freshness_label, normalize_text, stable_source_id

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}


def parse_indeed_time(time_str: str) -> datetime:
    now = datetime.utcnow()
    if not time_str:
        return now
    text = time_str.lower().strip()
    if "just" in text or "moment" in text:
        return now
    nums = re.findall(r"\d+", text)
    n = int(nums[0]) if nums else 1
    if "minute" in text:
        return now - timedelta(minutes=n)
    if "hour" in text:
        return now - timedelta(hours=n)
    if "day" in text:
        return now - timedelta(days=n)
    if "week" in text:
        return now - timedelta(weeks=n)
    if "month" in text or "30+" in text:
        return now - timedelta(days=n * 30)
    return now


async def scrape_indeed_jobs(query: str, location: str = "", limit: int = 30) -> list:
    jobs = []
    q = query.replace(" ", "+")
    l = location.replace(" ", "+")

    urls = [
        f"https://www.indeed.com/jobs?q={q}&l={l}&sort=date&fromage=1",
        f"https://in.indeed.com/jobs?q={q}&l={l}&sort=date&fromage=1",
        f"https://www.indeed.com/jobs?q={q}&l={l}&sort=date",
    ]
    page_starts = [0, 10, 20, 30, 40, 50, 60, 70]

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        for url in urls:
            try:
                for start in page_starts:
                    page_url = f"{url}&start={start}" if "start=" not in url else url
                    resp = await client.get(page_url, headers=HEADERS)
                    if resp.status_code != 200:
                        continue

                    soup = BeautifulSoup(resp.text, "html.parser")
                    cards = soup.find_all("div", class_=re.compile(r"(job_seen_beacon|resultContent|jobCard)", re.I))
                    if not cards:
                        cards = soup.find_all("td", class_="resultContent")

                    for card in cards[:limit]:
                        try:
                            title_el = card.find(["h2", "a"], class_=re.compile(r"jobTitle|title", re.I)) or card.find("h2")
                            title = ""
                            if title_el:
                                span = title_el.find("span")
                                title = normalize_text(span.get_text(" ", strip=True) if span else title_el.get_text(" ", strip=True))

                            comp_el = card.find(["span", "a"], class_=re.compile(r"companyName|company", re.I))
                            company = normalize_text(comp_el.get_text(" ", strip=True)) if comp_el else ""

                            loc_el = card.find(["div", "span"], class_=re.compile(r"companyLocation|location", re.I))
                            job_location = normalize_text(loc_el.get_text(" ", strip=True)) if loc_el else location

                            time_el = card.find(["span", "div"], class_=re.compile(r"(date|posted|age)", re.I))
                            posted_at = parse_indeed_time(time_el.get_text(" ", strip=True) if time_el else "")

                            link_el = card.find("a", href=re.compile(r"/rc/clk|/pagead/clk|/clk"))
                            if not link_el:
                                link_el = card.find("a", href=True)
                            href = link_el["href"] if link_el else ""
                            apply_link = f"https://www.indeed.com{href}" if href and not href.startswith("http") else href

                            jk_match = re.search(r"jk=([a-z0-9]+)", apply_link)
                            source_id = f"indeed_{jk_match.group(1)}" if jk_match else stable_source_id("indeed", title, company, job_location)
                            if not title:
                                continue

                            salary_el = card.find(["div", "span"], class_=re.compile(r"(salary|compensation|pay)", re.I))
                            salary = normalize_text(salary_el.get_text(" ", strip=True)) if salary_el else ""

                            jobs.append(
                                {
                                    "title": title,
                                    "company": company,
                                    "location": job_location or location,
                                    "salary": salary,
                                    "posted_at": posted_at,
                                    "freshness": freshness_label(posted_at),
                                    "apply_link": apply_link,
                                    "source": "Indeed",
                                    "source_id": source_id,
                                    "description": compose_description(card, title, company, job_location),
                                    "skills": [],
                                    "scraped_at": datetime.utcnow(),
                                }
                            )
                        except Exception:
                            continue

                    if len(jobs) >= limit:
                        break

                if len(jobs) >= limit:
                    break
            except Exception as e:
                print(f"Indeed error: {e}")

    jobs.sort(key=lambda x: x["posted_at"], reverse=True)
    return jobs[:limit]
