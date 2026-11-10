from fastapi import APIRouter, Depends
from app.schemas.schemas import SkillGapRequest
from app.middleware.auth import get_current_user
from agents.skill_gap.agent import analyze_skill_gap

router = APIRouter()

@router.post("/analyze")
async def skill_gap(data: SkillGapRequest, current_user: dict = Depends(get_current_user)):
    resume_text = data.resume_text or current_user.get("resume_text", "")
    return await analyze_skill_gap(resume_text, data.target_role, data.experience_years or 0)
