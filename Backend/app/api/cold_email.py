from fastapi import APIRouter, Depends
from app.schemas.schemas import ColdEmailRequest, CompanyResearchRequest
from app.middleware.auth import get_current_user
from app.database.connection import get_db
from agents.cold_email.agent import generate_cold_email, scrape_company_contact
from datetime import datetime

router = APIRouter()

@router.post("/generate")
async def gen_cold_email(data: ColdEmailRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    resume_text = data.resume_text or current_user.get("resume_text", "")
    result = await generate_cold_email(
        resume_text, data.job_title, data.company_name,
        data.hr_name or "", data.company_email or ""
    )
    await db.cold_emails.insert_one({
        "user_id": str(current_user["_id"]),
        "company": data.company_name, "data": result,
        "created_at": datetime.utcnow()
    })
    return result

@router.post("/company-research")
async def company_research(data: CompanyResearchRequest, current_user: dict = Depends(get_current_user)):
    return await scrape_company_contact(data.company_name, data.company_website or "")
