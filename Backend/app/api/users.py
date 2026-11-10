from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.middleware.auth import get_current_user
from app.database.connection import get_db
from bson import ObjectId
import io

router = APIRouter()

@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    user = current_user.copy()
    user["_id"] = str(user["_id"])
    user.pop("password", None)
    return user

@router.put("/profile")
async def update_profile(updates: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    updates.pop("password", None)
    updates.pop("_id", None)
    await db.users.update_one({"_id": current_user["_id"]}, {"$set": updates})
    return {"message": "Profile updated"}

@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    db = get_db()
    content = await file.read()
    text = ""
    
    if file.filename.endswith(".pdf"):
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(content))
            for page in reader.pages:
                text += page.extract_text() or ""
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"PDF parse error: {str(e)}")
    elif file.filename.endswith(".docx"):
        try:
            from docx import Document
            doc = Document(io.BytesIO(content))
            text = "\n".join([p.text for p in doc.paragraphs])
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"DOCX parse error: {str(e)}")
    else:
        text = content.decode("utf-8", errors="ignore")
    
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"resume_text": text, "resume_filename": file.filename}}
    )
    return {
        "message": "Resume uploaded",
        "text_length": len(text),
        "preview": text[:500],
        "resume_text": text,
        "resume_filename": file.filename,
    }
