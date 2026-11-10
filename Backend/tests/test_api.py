"""
Basic smoke tests for JobCopilot AI backend.
Run with: pytest tests/ -v
"""
import pytest
import asyncio
from httpx import AsyncClient
from main import app

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def client():
    async with AsyncClient(app=app, base_url="http://test") as c:
        yield c

@pytest.mark.asyncio
async def test_root(client):
    resp = await client.get("/")
    assert resp.status_code == 200
    assert resp.json()["status"] == "running"

@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "mongodb" in data
    assert "ai_model" in data

@pytest.mark.asyncio
async def test_register_and_login(client):
    # Register
    reg_resp = await client.post("/auth/register", json={
        "name": "Test User",
        "email": "test_jobcopilot@example.com",
        "password": "testpassword123",
        "target_role": "Software Engineer",
        "location": "Bangalore"
    })
    assert reg_resp.status_code == 200
    token = reg_resp.json().get("token")
    assert token

    # Login
    login_resp = await client.post("/auth/login", json={
        "email": "test_jobcopilot@example.com",
        "password": "testpassword123"
    })
    assert login_resp.status_code == 200
    assert login_resp.json().get("token")
    return token

@pytest.mark.asyncio
async def test_invalid_login(client):
    resp = await client.post("/auth/login", json={
        "email": "notexist@example.com",
        "password": "wrongpassword"
    })
    assert resp.status_code == 401

@pytest.mark.asyncio
async def test_profile_requires_auth(client):
    resp = await client.get("/users/profile")
    assert resp.status_code in [401, 403]

@pytest.mark.asyncio
async def test_job_search_requires_auth(client):
    resp = await client.post("/jobs/search", json={"query": "python developer"})
    assert resp.status_code in [401, 403]
