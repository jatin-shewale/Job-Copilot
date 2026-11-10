from datetime import datetime, timedelta
from typing import Optional
import hashlib
import bcrypt
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

SECRET_KEY = os.getenv("SECRET_KEY", "jobcopilot-super-secret-key-2024-ai-powered")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

security = HTTPBearer()

def hash_password(password: str) -> str:
    # Pre-hash to remove bcrypt's 72-byte input limit, then store the bcrypt hash
    # with a prefix so we can distinguish it from legacy bcrypt hashes.
    digest = hashlib.sha256(password.encode("utf-8")).digest()
    hashed = bcrypt.hashpw(digest, bcrypt.gensalt()).decode("utf-8")
    return f"$bcrypt-sha256${hashed}"

def verify_password(plain: str, hashed: str) -> bool:
    if hashed.startswith("$bcrypt-sha256$"):
        digest = hashlib.sha256(plain.encode("utf-8")).digest()
        return bcrypt.checkpw(digest, hashed.removeprefix("$bcrypt-sha256$").encode("utf-8"))
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    from app.database.connection import get_db
    from bson import ObjectId
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = payload.get("sub")
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
