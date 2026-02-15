# Ollama 구조화 출력 패턴

## 핵심
Ollama의 `format` 파라미터로 JSON 스키마 강제 출력 가능

## 사용법
```python
response = await client.generate(
    model="qwen3:14b",
    prompt="...",
    format={  # JSON Schema
        "type": "object",
        "properties": {
            "clusters": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "cluster_id": {"type": "integer"},
                        "title": {"type": "string"},
                    }
                }
            }
        },
        "required": ["clusters"]
    }
)
```

## 주의사항
- `format`은 JSON Schema 객체 (문자열 아님)
- 응답은 자동으로 유효한 JSON으로 강제됨
- `stream=False`로 설정해야 전체 응답 한번에 받음
- Qwen3-14B는 한국어 프롬프트 + JSON 출력 잘 지원
