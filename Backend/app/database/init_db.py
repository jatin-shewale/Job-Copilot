"""
MongoDB index creation and database initialization.
Run this once on first setup, or it's called automatically on startup.
"""
from datetime import datetime, timedelta

from motor.motor_asyncio import AsyncIOMotorDatabase


async def create_indexes(db: AsyncIOMotorDatabase):
    """Create all necessary indexes for optimal performance"""

    await db.users.create_index("email", unique=True)
    await db.users.create_index("target_role")
    await db.users.create_index("created_at")

    await db.jobs.create_index([("source_id", 1), ("source", 1)], unique=True, sparse=True)
    await db.jobs.create_index(
        [
            ("title", "text"),
            ("description", "text"),
            ("company", "text"),
            ("skills", "text"),
        ],
        weights={
            "title": 10,
            "skills": 5,
            "company": 3,
            "description": 1,
        },
    )
    await db.jobs.create_index([("posted_at", -1)])
    await db.jobs.create_index("source")
    await db.jobs.create_index("scraped_at")

    await db.reports.create_index([("user_id", 1), ("created_at", -1)])
    await db.reports.create_index("type")

    await db.cover_letters.create_index([("user_id", 1), ("created_at", -1)])
    await db.cold_emails.create_index([("user_id", 1), ("created_at", -1)])
    await db.applications.create_index([("user_id", 1), ("applied_at", -1)])
    await db.applications.create_index("status")

    print("MongoDB indexes created successfully")


async def seed_sample_jobs(db: AsyncIOMotorDatabase):
    """Seed with sample jobs for testing when scrapers haven't run yet."""
    count = await db.jobs.count_documents({})
    if count > 0:
        return

    now = datetime.utcnow()
    sample_jobs = [
        {
            "title": "Senior Software Engineer - React",
            "company": "Razorpay",
            "location": "Bangalore, India",
            "description": "We are looking for a Senior Software Engineer with strong React.js skills to join our payments team.",
            "skills": ["React", "JavaScript", "TypeScript", "Node.js", "AWS"],
            "salary": "₹25-45 LPA",
            "job_type": "Full-time",
            "source": "LinkedIn",
            "source_id": "sample_001",
            "apply_link": "https://razorpay.com/jobs/",
            "posted_at": now - timedelta(minutes=3),
            "freshness": "Just Posted",
            "scraped_at": now,
        },
        {
            "title": "Data Scientist - ML Platform",
            "company": "Swiggy",
            "location": "Bangalore, India",
            "description": "Build and deploy ML models for our recommendation and pricing systems.",
            "skills": ["Python", "Machine Learning", "TensorFlow", "Spark", "SQL"],
            "salary": "₹20-40 LPA",
            "job_type": "Full-time",
            "source": "Indeed",
            "source_id": "sample_002",
            "apply_link": "https://careers.swiggy.com/",
            "posted_at": now - timedelta(minutes=12),
            "freshness": "12 min ago",
            "scraped_at": now,
        },
        {
            "title": "Full Stack Developer - Node.js + React",
            "company": "Groww",
            "location": "Bangalore, India",
            "description": "Join our fintech platform team to build scalable financial applications.",
            "skills": ["React", "Node.js", "PostgreSQL", "Redis", "Docker"],
            "salary": "₹18-35 LPA",
            "job_type": "Full-time",
            "source": "Wellfound",
            "source_id": "sample_003",
            "apply_link": "https://groww.in/careers",
            "posted_at": now - timedelta(minutes=28),
            "freshness": "28 min ago",
            "scraped_at": now,
        },
        {
            "title": "Backend Engineer - Python/FastAPI",
            "company": "CRED",
            "location": "Bangalore, India",
            "description": "Build high-performance APIs for our credit card management platform.",
            "skills": ["Python", "FastAPI", "PostgreSQL", "Kafka", "Kubernetes"],
            "salary": "₹22-40 LPA",
            "job_type": "Full-time",
            "source": "Foundit",
            "source_id": "sample_004",
            "apply_link": "https://careers.cred.club/",
            "posted_at": now - timedelta(hours=1, minutes=15),
            "freshness": "75 min ago",
            "scraped_at": now,
        },
        {
            "title": "DevOps Engineer - AWS/Kubernetes",
            "company": "Zepto",
            "location": "Mumbai, India",
            "description": "Own our cloud infrastructure and CI/CD pipelines for our 10-minute grocery delivery platform.",
            "skills": ["AWS", "Kubernetes", "Docker", "Terraform", "Jenkins", "Python"],
            "salary": "₹20-38 LPA",
            "job_type": "Full-time",
            "source": "LinkedIn",
            "source_id": "sample_005",
            "apply_link": "https://www.zeptonow.com/careers",
            "posted_at": now - timedelta(hours=2),
            "freshness": "Today",
            "scraped_at": now,
        },
        {
            "title": "Software Development Intern - React",
            "company": "Meesho",
            "location": "Bangalore, India (Hybrid)",
            "description": "6-month internship to work on our seller and buyer facing React applications.",
            "skills": ["React", "JavaScript", "HTML", "CSS", "Git"],
            "salary": "₹40,000/month",
            "job_type": "Internship",
            "source": "Internshala",
            "source_id": "sample_006",
            "apply_link": "https://meesho.io/careers",
            "posted_at": now - timedelta(hours=3),
            "freshness": "Today",
            "scraped_at": now,
        },
        {
            "title": "Machine Learning Engineer",
            "company": "Flipkart",
            "location": "Bangalore, India",
            "description": "Build recommendation systems and search ranking models at scale.",
            "skills": ["Python", "PyTorch", "Spark", "Hadoop", "Scala", "SQL"],
            "salary": "₹30-55 LPA",
            "job_type": "Full-time",
            "source": "Indeed",
            "source_id": "sample_007",
            "apply_link": "https://www.flipkartcareers.com/",
            "posted_at": now - timedelta(hours=4),
            "freshness": "Today",
            "scraped_at": now,
        },
        {
            "title": "Product Manager - Growth",
            "company": "PhonePe",
            "location": "Bangalore, India",
            "description": "Lead growth initiatives for our UPI and financial services products.",
            "skills": ["Product Management", "SQL", "Analytics", "A/B Testing", "User Research"],
            "salary": "₹25-50 LPA",
            "job_type": "Full-time",
            "source": "LinkedIn",
            "source_id": "sample_008",
            "apply_link": "https://www.phonepe.com/careers/",
            "posted_at": now - timedelta(hours=5),
            "freshness": "Today",
            "scraped_at": now,
        },
    ]

    for job in sample_jobs:
        await db.jobs.update_one({"source_id": job["source_id"]}, {"$set": job}, upsert=True)

    print(f"Seeded {len(sample_jobs)} sample jobs")
