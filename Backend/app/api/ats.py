from fastapi import APIRouter, Depends
from app.schemas.schemas import ATSRequest
from app.middleware.auth import get_current_user
from agents.ats.agent import analyze_ats, optimize_resume_for_ats

router = APIRouter()

@router.post("/analyze")
async def ats_analyze(data: ATSRequest, current_user: dict = Depends(get_current_user)):
    return await analyze_ats(data.resume_text, data.job_description)

@router.post("/optimize")
async def ats_optimize(data: ATSRequest, current_user: dict = Depends(get_current_user)):
    return await optimize_resume_for_ats(data.resume_text, data.job_description)
