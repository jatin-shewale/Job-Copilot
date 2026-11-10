import httpx
import json
import os
from typing import Optional

OLLAMA_BASE = os.getenv("OLLAMA_BASE", "http://localhost:11434")
MODEL = os.getenv("AI_MODEL", "qwen3:14b")
AI_TIMEOUT_SECONDS = float(os.getenv("AI_TIMEOUT_SECONDS", "180"))

async def call_ai(
    prompt: str,
    system: str = "",
    temperature: float = 0.3,
    max_tokens: int = 2000,
    timeout_seconds: float | None = None,
) -> str:
    """Call Ollama AI model"""
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    
    effective_timeout = timeout_seconds if timeout_seconds is not None else AI_TIMEOUT_SECONDS
    timeout = httpx.Timeout(
        timeout=effective_timeout,
        connect=10.0,
        read=effective_timeout,
        write=30.0,
        pool=10.0,
    )

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.post(
                f"{OLLAMA_BASE}/api/chat",
                json={
                    "model": MODEL,
                    "messages": messages,
                    "stream": False,
                    "options": {"temperature": temperature, "num_predict": max_tokens}
                }
            )
            if response.status_code == 200:
                data = response.json()
                content = data.get("message", {}).get("content", "")
                if not content:
                    print(f"AI call error: empty response body (model={MODEL}, status=200)")
                return content
            print(f"AI call error: HTTP {response.status_code} - {response.text[:300]}")
        except httpx.ReadTimeout as e:
            print(
                f"AI call error: ReadTimeout(model={MODEL}, timeout={effective_timeout}s, base={OLLAMA_BASE})"
            )
        except Exception as e:
            print(f"AI call error: {type(e).__name__}({repr(e)})")
    return ""

async def call_ai_json(
    prompt: str,
    system: str = "",
    timeout_seconds: float | None = None,
    temperature: float = 0.1,
    max_tokens: int = 2000,
) -> dict:
    """Call AI and expect JSON response"""
    sys_prompt = (system or "") + "\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation, just JSON."
    raw = await call_ai(
        prompt,
        sys_prompt,
        temperature=temperature,
        timeout_seconds=timeout_seconds,
        max_tokens=max_tokens,
    )
    
    # Try to extract JSON
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, dict):
            return parsed
    except:
        # Try to find JSON in response
        import re
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            try:
                parsed = json.loads(match.group())
                if isinstance(parsed, dict):
                    return parsed
            except:
                pass
    return {}
