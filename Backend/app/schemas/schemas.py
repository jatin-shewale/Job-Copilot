from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    target_role: Optional[str] = None
    location: Optional[str] = None
    experience_years: Optional[int] = 0
    skills: Optional[List[str]] = []

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class JobSearch(BaseModel):
    query: str
    location: Optional[str] = None
    experience: Optional[str] = None
    job_type: Optional[str] = None
    limit: Optional[int] = 500

class ResumeAnalysisRequest(BaseModel):
    resume_text: str
    job_title: Optional[str] = None
    job_description: Optional[str] = None

class ATSRequest(BaseModel):
    resume_text: str
    job_description: str

class CoverLetterRequest(BaseModel):
    resume_text: str
    job_title: str
    company_name: str
    job_description: str
    company_info: Optional[str] = None

class ColdEmailRequest(BaseModel):
    resume_text: str
    job_title: str
    company_name: str
    hr_name: Optional[str] = None
    company_email: Optional[str] = None

class SkillGapRequest(BaseModel):
    resume_text: str
    target_role: str
    experience_years: Optional[int] = 0

class CompanyResearchRequest(BaseModel):
    company_name: str
    company_website: Optional[str] = None
