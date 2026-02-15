"""
인사이트 에이전트 v2 — 투자자 관점 구조화 분석
Bloomberg 3-bullet 포맷: 무슨 일 / 왜 중요 / 다음은?
구조화 출력: headline, tldr, so_what, key_metrics, scenarios, affected_sectors, investment_signal, narrative
"""
import json

from app.services.ollama_client import ollama

SYSTEM_PROMPT = """You are a senior financial analyst writing investor-focused intelligence briefs.
Your analysis MUST answer three questions:
1. What happened? (무슨 일이 일어났는가)
2. Why does it matter for investors? (투자자에게 왜 중요한가 - "So What?")
3. What's next? (앞으로 어떻게 될 것인가 - 시나리오 분석)

CRITICAL RULES:
- Write everything in Korean (한국어)
- Be specific with numbers, dates, company names
- Never say "매수" or "매도" — instead give scenario analysis
- Provide concrete implications: "수출 허용 시 → 엔비디아 매출 15% 증가 가능"
- key_metrics: extract actual numbers from the news (금액, 비율, 가격 등)
- scenarios: always provide at least 2 (best case / worst case)
- affected_sectors: which sectors are impacted and WHY
- investment_signal direction must be one of: bullish, cautious_positive, neutral, cautious_negative, bearish
- narrative: 3-4 short paragraphs, punchy and analytical, not descriptive"""

INSIGHT_SCHEMA = {
    "type": "object",
    "properties": {
        "headline": {
            "type": "string",
            "description": "임팩트 있는 한 줄 제목 (20자 이내)",
        },
        "tldr": {
            "type": "string",
            "description": "핵심 요약 3줄 (bullet point 형태, 각 줄은 | 로 구분)",
        },
        "so_what": {
            "type": "string",
            "description": "투자자에게 왜 중요한지 2줄",
        },
        "key_metrics": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "label": {"type": "string"},
                    "value": {"type": "string"},
                    "change": {"type": "string"},
                    "sentiment": {
                        "type": "string",
                        "enum": ["positive", "negative", "neutral"],
                    },
                },
                "required": ["label", "value", "sentiment"],
            },
        },
        "scenarios": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "condition": {"type": "string"},
                    "outcome": {"type": "string"},
                    "probability": {
                        "type": "string",
                        "enum": ["high", "medium", "low"],
                    },
                    "impact": {
                        "type": "string",
                        "enum": ["positive", "negative", "neutral"],
                    },
                },
                "required": ["title", "outcome", "impact"],
            },
        },
        "affected_sectors": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "direction": {
                        "type": "string",
                        "enum": ["up", "down", "neutral"],
                    },
                    "reason": {"type": "string"},
                },
                "required": ["name", "direction", "reason"],
            },
        },
        "investment_signal": {
            "type": "object",
            "properties": {
                "direction": {
                    "type": "string",
                    "enum": [
                        "bullish",
                        "cautious_positive",
                        "neutral",
                        "cautious_negative",
                        "bearish",
                    ],
                },
                "confidence": {"type": "integer"},
                "timeframe": {"type": "string"},
            },
            "required": ["direction", "confidence", "timeframe"],
        },
        "narrative": {
            "type": "string",
            "description": "분석 기사 3-4문단 (마크다운)",
        },
    },
    "required": [
        "headline",
        "tldr",
        "so_what",
        "key_metrics",
        "scenarios",
        "affected_sectors",
        "investment_signal",
        "narrative",
    ],
}


class InsightAgent:
    async def run(
        self, clusters: list[dict], news_map: dict[int, dict]
    ) -> dict[int, str]:
        """
        각 클러스터에 대해 구조화된 투자자 분석을 생성한다.
        Returns: {cluster_id: json_string}
        """
        results = {}
        for cluster in clusters:
            cid = cluster["id"]
            news_ids = cluster.get("news_ids", [])
            if not news_ids:
                continue

            print(
                f"[Insight] Analyzing cluster {cid}: '{cluster['title']}'"
            )
            analysis = await self._analyze(cluster, news_ids, news_map)
            results[cid] = analysis

        return results

    async def _analyze(
        self,
        cluster: dict,
        news_ids: list[int],
        news_map: dict[int, dict],
    ) -> str:
        news_text = []
        for nid in news_ids[:12]:
            n = news_map.get(nid)
            if n:
                title = n.get("title", "")
                desc = n.get("description", "")
                source = n.get("source", "")
                if desc and len(desc) > 250:
                    desc = desc[:250] + "..."
                news_text.append(f"[{source}] {title}")
                if desc:
                    news_text.append(f"  {desc}")

        prompt = f"""Analyze this news cluster for investors.

TOPIC: "{cluster['title']}"
SUMMARY: {cluster.get('summary', '')}
NEWS COUNT: {len(news_ids)}건

SOURCE ARTICLES:
{chr(10).join(news_text)}

INSTRUCTIONS:
- headline: 임팩트 있는 한국어 한 줄 제목 (예: "엔비디아 수출 규제 완화 임박, 반도체 랠리 촉발 가능")
- tldr: 핵심 3줄 요약, 각 줄을 | 로 구분 (예: "첫번째 요약|두번째 요약|세번째 요약")
- so_what: "이게 왜 중요?" — 투자자 관점에서 구체적 시사점
- key_metrics: 기사에서 추출한 핵심 수치 (금액, 비율, 가격변동 등). 최소 2개, 최대 4개.
- scenarios: 최소 2개 시나리오 (긍정적/부정적). condition에 조건, outcome에 결과.
- affected_sectors: 영향 받는 섹터/산업 (반도체, 금융, 에너지 등). direction은 up/down/neutral.
- investment_signal: 종합 판단. confidence는 0-100.
- narrative: 3-4문단 분석 기사. 구체적 수치 인용. "~할 것으로 보인다" 대신 "~가 예상된다, 이유는..."

ALL OUTPUT MUST BE IN KOREAN."""

        result = await ollama.generate(
            prompt=prompt,
            system=SYSTEM_PROMPT,
            json_schema=INSIGHT_SCHEMA,
            temperature=0.3,
        )

        if isinstance(result, dict) and "headline" in result:
            return json.dumps(result, ensure_ascii=False)
        if isinstance(result, dict) and "error" in result:
            # Fallback: 기존 마크다운 형태
            return json.dumps(
                {
                    "headline": cluster["title"],
                    "tldr": cluster.get("summary", ""),
                    "so_what": "분석 생성 실패",
                    "key_metrics": [],
                    "scenarios": [],
                    "affected_sectors": [],
                    "investment_signal": {
                        "direction": "neutral",
                        "confidence": 0,
                        "timeframe": "-",
                    },
                    "narrative": result.get("raw", ""),
                },
                ensure_ascii=False,
            )
        return json.dumps(
            {
                "headline": cluster["title"],
                "tldr": cluster.get("summary", ""),
                "so_what": "",
                "key_metrics": [],
                "scenarios": [],
                "affected_sectors": [],
                "investment_signal": {
                    "direction": "neutral",
                    "confidence": 0,
                    "timeframe": "-",
                },
                "narrative": str(result) if result else "",
            },
            ensure_ascii=False,
        )
