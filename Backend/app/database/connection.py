from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "jobcopilot")

client = None
db = None

async def connect_db():
    global client, db
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    # Create indexes
    from app.database.init_db import create_indexes, seed_sample_jobs
    await create_indexes(db)
    await seed_sample_jobs(db)
    print(f"✅ Connected to MongoDB: {DB_NAME}")

async def disconnect_db():
    global client
    if client:
        client.close()
        print("Disconnected from MongoDB")

def get_db():
    return db
