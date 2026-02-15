# AI 프롬프트 전략 리서치 요약 (2026-02-14)

## 핵심: Bloomberg 3-Bullet 포맷
모든 뉴스 분석은 3가지 질문에 답해야 함:
1. **무슨 일이 일어났는가?** (What happened)
2. **왜 중요한가?** (Why it matters / So What?)
3. **다음은 무엇인가?** (What's next)

## 투자자 관점 프롬프트 전략
- **FinCoT (Financial Chain of Thought)**: 단순 요약이 아닌 추론 체인
  - 사건 → 직접 영향 → 간접 영향 → 투자 시사점
- **시나리오 분석**: 모든 클러스터에 Best/Base/Worst 시나리오
- **관련 섹터/종목 영향도**: "이 뉴스가 어떤 섹터에 어떤 영향?"
- **"매수/매도 권유" 대신 시나리오**: "수출 허용 시 → 매출 15% 증가 가능"

## 구조화 출력 스키마 (insight_agent)
```json
{
  "headline": "임팩트 있는 한 줄 제목",
  "tldr": "3줄 핵심 요약",
  "so_what": "투자자에게 왜 중요한지 2줄",
  "key_metrics": [
    {"label": "이름", "value": "값", "change": "+23%", "sentiment": "positive"}
  ],
  "scenarios": [
    {"title": "시나리오명", "condition": "조건", "outcome": "결과", "probability": "high/medium/low", "impact": "positive/negative"}
  ],
  "affected_sectors": [
    {"name": "섹터명", "direction": "up/down/neutral", "reason": "이유"}
  ],
  "investment_signal": {
    "direction": "cautious_positive/bullish/bearish/neutral",
    "confidence": 72,
    "timeframe": "1-2주"
  },
  "narrative": "짧은 분석 기사 (3-4문단, 마크다운)"
}
```

## Qwen3 최적화
- **Two-Step Thinking**: /think 모드로 추론 → JSON 출력
- **JSON 스키마 강제**: Ollama format 파라미터 활용
- **토큰 절약**: 구조화 출력은 자유 텍스트보다 토큰 효율적
- **한국어 강제**: system 프롬프트에 "반드시 한국어로" 명시

## 참고 서비스
- **MarketSenseAI**: LLM 기반 투자 분석 (125.9% 수익률)
- **TradingAgents**: Bullish/Bearish 토론으로 다각적 분석
- **Perplexity**: 출처 연결 + 핵심 요약
- **Finimize**: 3분 투자 뉴스 포맷
