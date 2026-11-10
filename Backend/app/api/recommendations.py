from fastapi import APIRouter, Depends
from app.middleware.auth import get_current_user
from agents.career.agent import get_career_roadmap, generate_interview_prep

router = APIRouter()

@router.post("/career-roadmap")
async def career_roadmap(data: dict, current_user: dict = Depends(get_current_user)):
    resume_text = data.get("resume_text") or current_user.get("resume_text", "")
    return await get_career_roadmap(
        resume_text,
        data.get("current_role", ""),
        data.get("target_role", current_user.get("target_role", "")),
        data.get("years", 2)
    )

@router.post("/interview-prep")
async def interview_prep(data: dict, current_user: dict = Depends(get_current_user)):
    resume_text = data.get("resume_text") or current_user.get("resume_text", "")
    return await generate_interview_prep(
        data.get("job_title", ""),
        data.get("company_name", ""),
        data.get("job_description", ""),
        resume_text
    )
