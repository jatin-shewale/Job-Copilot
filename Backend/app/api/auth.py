from fastapi import APIRouter, HTTPException, status
from app.schemas.schemas import UserRegister, UserLogin
from app.middleware.auth import hash_password, verify_password, create_access_token
from app.database.connection import get_db
from datetime import datetime
from bson import ObjectId

router = APIRouter()

def serialize_user(user):
    user["_id"] = str(user["_id"])
    user.pop("password", None)
    return user

@router.post("/register")
async def register(data: UserRegister):
    db = get_db()
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "target_role": data.target_role,
        "location": data.location,
        "experience_years": data.experience_years,
        "skills": data.skills,
        "resume_text": None,
        "ats_score": 0,
        "resume_score": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    result = await db.users.insert_one(user_doc)
    token = create_access_token({"sub": str(result.inserted_id)})
    user_doc["_id"] = str(result.inserted_id)
    user_doc.pop("password")
    return {"token": token, "user": user_doc}

@router.post("/login")
async def login(data: UserLogin):
    db = get_db()
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user["_id"])})
    return {"token": token, "user": serialize_user(user)}
