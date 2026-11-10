from fastapi import APIRouter, Depends
from app.schemas.schemas import CoverLetterRequest
from app.middleware.auth import get_current_user
from app.database.connection import get_db
from agents.cover_letter.agent import generate_cover_letter
from datetime import datetime

router = APIRouter()

@router.post("/generate")
async def gen_cover_letter(data: CoverLetterRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    resume_text = data.resume_text or current_user.get("resume_text", "")
    result = await generate_cover_letter(
        resume_text, data.job_title, data.company_name,
        data.job_description, data.company_info or ""
    )
    await db.cover_letters.insert_one({
        "user_id": str(current_user["_id"]),
        "job_title": data.job_title, "company": data.company_name,
        "data": result, "created_at": datetime.utcnow()
    })
    return result
