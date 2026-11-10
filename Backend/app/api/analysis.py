from fastapi import APIRouter, Depends
from app.schemas.schemas import ResumeAnalysisRequest
from app.middleware.auth import get_current_user
from app.database.connection import get_db
from agents.recruiter.agent import analyze_resume_full, predict_selection_chance
from datetime import datetime

router = APIRouter()

@router.post("/full")
async def full_analysis(data: ResumeAnalysisRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    resume_text = data.resume_text or current_user.get("resume_text", "")
    if not resume_text:
        return {"error": "No resume text provided"}
    
    result = await analyze_resume_full(resume_text, data.job_title or "", data.job_description or "")
    
    # Save to user profile
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {
            "ats_score": result.get("ats_score", 0),
            "resume_score": result.get("resume_score", 0),
            "last_analysis": result,
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Save to reports
    await db.reports.insert_one({
        "user_id": str(current_user["_id"]),
        "type": "full_analysis",
        "data": result,
        "created_at": datetime.utcnow()
    })
    
    return result

@router.post("/predict")
async def predict_chances(data: ResumeAnalysisRequest, current_user: dict = Depends(get_current_user)):
    resume_text = data.resume_text or current_user.get("resume_text", "")
    result = await predict_selection_chance(resume_text, data.job_description or "")
    return result
