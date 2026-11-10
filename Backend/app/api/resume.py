from fastapi import APIRouter, Depends
from app.middleware.auth import get_current_user
from agents.resume.agent import rewrite_resume, generate_linkedin_profile
from agents.career.agent import get_career_roadmap, generate_interview_prep

router = APIRouter()

@router.post("/rewrite")
async def rewrite(data: dict, current_user: dict = Depends(get_current_user)):
    resume_text = data.get("resume_text") or current_user.get("resume_text", "")
    return await rewrite_resume(resume_text, data.get("target_role", ""), data.get("job_description", ""))

@router.post("/linkedin")
async def linkedin_profile(data: dict, current_user: dict = Depends(get_current_user)):
    resume_text = data.get("resume_text") or current_user.get("resume_text", "")
    return await generate_linkedin_profile(resume_text)
