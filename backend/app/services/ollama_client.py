"""
Ollama HTTP 클라이언트
JSON 스키마 강제 + 스트림 비활성으로 구조화된 응답을 받는다.
"""
import json

import httpx

from app.config import settings


class OllamaClient:
    def __init__(self):
        self.base_url = settings.ollama_host
        self.model = settings.ollama_model

    async def generate(
        self,
        prompt: str,
        system: str = "",
        json_schema: dict | None = None,
        temperature: float = 0.3,
        timeout: float = 180.0,
    ) -> dict | str:
        """
        Ollama generate API 호출.
        json_schema가 주어지면 format 파라미터로 JSON 스키마를 강제한다.
        """
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_ctx": 8192,
            },
        }

        if system:
            payload["system"] = system

        if json_schema:
            payload["format"] = json_schema

        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                f"{self.base_url}/api/generate",
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()

        response_text = data.get("response", "")

        if json_schema:
            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                return {"error": "Failed to parse JSON", "raw": response_text}

        return response_text

    async def is_available(self) -> bool:
        """Ollama 서버 연결 확인."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                return resp.status_code == 200
        except Exception:
            return False

    async def model_loaded(self) -> bool:
        """설정된 모델이 로드되어 있는지 확인."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                if resp.status_code != 200:
                    return False
                models = resp.json().get("models", [])
                return any(m.get("name", "").startswith(self.model) for m in models)
        except Exception:
            return False


ollama = OllamaClient()
