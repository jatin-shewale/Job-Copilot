import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, users, jobs, resume, analysis, ats, cover_letter, cold_email, skill_gap, recommendations
from app.database.connection import connect_db, disconnect_db

app = FastAPI(
    title="JobCopilot AI",
    version="1.0.0",
    description="AI-Powered Job Intelligence & Career Copilot Platform",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await connect_db()
    print("JobCopilot AI Backend running")


@app.on_event("shutdown")
async def shutdown():
    await disconnect_db()


app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
app.include_router(resume.router, prefix="/resume", tags=["Resume"])
app.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
app.include_router(ats.router, prefix="/ats", tags=["ATS"])
app.include_router(cover_letter.router, prefix="/cover-letter", tags=["Cover Letter"])
app.include_router(cold_email.router, prefix="/cold-email", tags=["Cold Email"])
app.include_router(skill_gap.router, prefix="/skill-gap", tags=["Skill Gap"])
app.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])


@app.get("/")
async def root():
    return {
        "message": "JobCopilot AI API",
        "status": "running",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health")
async def health():
    from app.database.connection import get_db

    db = get_db()
    mongo_ok = False
    ai_ok = False
    try:
        await db.command("ping")
        mongo_ok = True
    except Exception:
        pass
    try:
        import httpx, os
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(f"{os.getenv('OLLAMA_BASE', 'http://localhost:11434')}/api/tags")
            ai_ok = r.status_code == 200
    except Exception:
        pass
    return {
        "mongodb": "ok" if mongo_ok else "error",
        "ai_model": "ok" if ai_ok else "unavailable (scrapers still work)",
        "status": "healthy",
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
