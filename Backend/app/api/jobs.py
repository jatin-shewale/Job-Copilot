from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query, BackgroundTasks

from app.database.connection import get_db
from app.middleware.auth import get_current_user
from app.models.schemas import serialize_doc
from app.schemas.schemas import JobSearch
from agents.matching.agent import rank_jobs_by_match
from scrapers.job_aggregator import scrape_all_sources

router = APIRouter()


def _normalize_limit(value: int | None, default: int = 100, maximum: int = 5000) -> int:
    if not value:
        return default
    return max(1, min(int(value), maximum))


async def _load_db_fallback_jobs(db, data: JobSearch, seen_ids: set[str], limit: int) -> list:
    query_filter = {}
    if data.query:
        query_filter["$or"] = [
            {"title": {"$regex": data.query, "$options": "i"}},
            {"company": {"$regex": data.query, "$options": "i"}},
            {"description": {"$regex": data.query, "$options": "i"}},
            {"skills": {"$regex": data.query, "$options": "i"}},
        ]
    if data.location:
        query_filter["location"] = {"$regex": data.location, "$options": "i"}

    jobs_list = []
    cursor = db.jobs.find(query_filter).sort("posted_at", -1).limit(limit)
    async for job in cursor:
        if str(job.get("source_id")) in seen_ids:
            continue
        jobs_list.append(serialize_doc(job))
        if len(jobs_list) + len(seen_ids) >= limit:
            break
    return jobs_list


@router.post("/search")
async def search_jobs(
    data: JobSearch,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    limit = _normalize_limit(data.limit, default=100, maximum=5000)

    scraped = await scrape_all_sources(data.query, data.location or "", limit)

    async def save_jobs(jobs):
        for job in jobs:
            try:
                await db.jobs.update_one(
                    {"source_id": job.get("source_id"), "source": job.get("source")},
                    {"$set": job},
                    upsert=True,
                )
            except Exception:
                pass

    background_tasks.add_task(save_jobs, scraped)

    jobs_list = list(scraped)
    seen_ids = {str(job.get("source_id")) for job in jobs_list if job.get("source_id")}

    if len(jobs_list) < limit:
        fallback_jobs = await _load_db_fallback_jobs(db, data, seen_ids, limit)
        jobs_list.extend(fallback_jobs)

    resume_text = current_user.get("resume_text", "")
    if resume_text and jobs_list:
        jobs_list = await rank_jobs_by_match(resume_text, jobs_list)

    jobs_list = jobs_list[:limit]

    for job in jobs_list:
        if isinstance(job.get("posted_at"), datetime):
            job["posted_at"] = job["posted_at"].isoformat()
        if isinstance(job.get("scraped_at"), datetime):
            job["scraped_at"] = job["scraped_at"].isoformat()

    sources = list(set(j.get("source", "") for j in jobs_list))
    return {
        "jobs": jobs_list,
        "total": len(jobs_list),
        "scraped_live": len(scraped),
        "sources": sources,
        "query": data.query,
        "location": data.location,
    }


@router.get("/latest")
async def get_latest_jobs(
    query: str = Query(..., description="Job title or keyword"),
    location: str = Query(default="", description="City or country"),
    limit: int = Query(default=100, le=5000),
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    limit = _normalize_limit(limit, default=100, maximum=5000)
    scraped = await scrape_all_sources(query, location, limit)

    for job in scraped:
        try:
            await db.jobs.update_one(
                {"source_id": job.get("source_id"), "source": job.get("source")},
                {"$set": job},
                upsert=True,
            )
        except Exception:
            pass

    for job in scraped:
        if isinstance(job.get("posted_at"), datetime):
            job["posted_at"] = job["posted_at"].isoformat()
        if isinstance(job.get("scraped_at"), datetime):
            job["scraped_at"] = job["scraped_at"].isoformat()

    return {"jobs": scraped[:limit], "total": len(scraped[:limit]), "query": query}


@router.get("/freshness/{source_id}")
async def get_job_freshness(source_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    job = await db.jobs.find_one({"source_id": source_id})
    if not job:
        return {"error": "Job not found"}

    now = datetime.utcnow()
    posted = job.get("posted_at", now)
    diff = now - posted
    secs = diff.total_seconds()

    if secs < 60:
        freshness = "Just Posted"
    elif secs < 600:
        freshness = f"{int(secs // 60)} min ago"
    elif secs < 3600:
        freshness = f"{int(secs // 60)} min ago"
    elif diff.days == 0:
        freshness = "Today"
    else:
        freshness = f"{diff.days}d ago"

    return {
        "freshness": freshness,
        "posted_at": posted.isoformat() if isinstance(posted, datetime) else posted,
    }


@router.get("/stats")
async def get_job_stats(current_user: dict = Depends(get_current_user)):
    db = get_db()
    now = datetime.utcnow()

    total = await db.jobs.count_documents({})
    today = await db.jobs.count_documents({"posted_at": {"$gte": now - timedelta(days=1)}})
    last_hour = await db.jobs.count_documents({"posted_at": {"$gte": now - timedelta(hours=1)}})

    pipeline = [{"$group": {"_id": "$source", "count": {"$sum": 1}}}]
    cursor = db.jobs.aggregate(pipeline)
    sources = {}
    async for doc in cursor:
        sources[doc["_id"]] = doc["count"]

    return {
        "total_jobs": total,
        "posted_today": today,
        "posted_last_hour": last_hour,
        "by_source": sources,
    }


@router.post("/save/{job_source_id}")
async def save_job(job_source_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$addToSet": {"saved_jobs": job_source_id}},
    )
    return {"saved": True}


@router.delete("/save/{job_source_id}")
async def unsave_job(job_source_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$pull": {"saved_jobs": job_source_id}},
    )
    return {"saved": False}


@router.get("/saved")
async def get_saved_jobs(current_user: dict = Depends(get_current_user)):
    db = get_db()
    saved_ids = current_user.get("saved_jobs", [])
    if not saved_ids:
        return {"jobs": []}

    cursor = db.jobs.find({"source_id": {"$in": saved_ids}})
    jobs = []
    async for job in cursor:
        jobs.append(serialize_doc(job))
    return {"jobs": jobs}
