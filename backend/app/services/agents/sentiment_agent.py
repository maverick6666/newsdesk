"""
감성 분석 에이전트
전체 시장 감성, 섹터별 감성, 핫 키워드를 분석한다.
"""
from app.services.ollama_client import ollama

SYSTEM_PROMPT = """You are a market sentiment analyst.
Analyze the overall market sentiment from news articles.
Score sentiment on a 0-100 scale: 0=extreme fear, 50=neutral, 100=extreme greed.
IMPORTANT: Sector names and keywords MUST be written in Korean (한국어).
For example: "기술", "금융", "에너지", "헬스케어", "부동산", "암호화폐" etc.
Respond ONLY in the required JSON format."""

SENTIMENT_SCHEMA = {
    "type": "object",
    "properties": {
        "overall_sentiment": {"type": "number"},
        "sectors": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "score": {"type": "number"},
                },
                "required": ["name", "score"],
            },
        },
        "keywords": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "word": {"type": "string"},
                    "count": {"type": "integer"},
                    "sentiment": {"type": "number"},
                },
                "required": ["word", "count", "sentiment"],
            },
        },
        "cluster_sentiments": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "cluster_id": {"type": "integer"},
                    "sentiment": {"type": "number"},
                },
                "required": ["cluster_id", "sentiment"],
            },
        },
    },
    "required": ["overall_sentiment", "sectors", "keywords", "cluster_sentiments"],
}


class SentimentAgent:
    async def run(
        self, clusters: list[dict], news_map: dict[int, dict]
    ) -> dict:
        """
        전체 클러스터를 기반으로 시장 감성을 분석한다.
        Returns: {overall_sentiment, sectors, keywords, cluster_sentiments}
        """
        cluster_summaries = []
        for c in clusters:
            news_ids = c.get("news_ids", [])
            # 대표 뉴스 제목 3개
            titles = []
            for nid in news_ids[:3]:
                n = news_map.get(nid)
                if n:
                    titles.append(n.get("title", ""))
            cluster_summaries.append(
                f"[Cluster {c['id']}] {c['title']} ({len(news_ids)} articles)\n"
                f"  Summary: {c.get('summary', '')}\n"
                f"  Sample headlines: {'; '.join(titles)}"
            )

        prompt = f"""Analyze the market sentiment from today's news clusters.

CLUSTERS:
{chr(10).join(cluster_summaries)}

Provide:
1. overall_sentiment (0-100): Overall market mood
2. sectors: Sentiment by sector — use Korean names (기술, 금융, 에너지, 헬스케어, 부동산, 암호화폐, 소비재, 산업 등)
3. keywords: Top 10 hot keywords with mention count and sentiment — use Korean keywords when possible (e.g. 비트코인, 반도체, 부동산, 삼성 etc.)
4. cluster_sentiments: Sentiment score for each cluster

Sentiment scale: 0=extreme fear, 25=fear, 50=neutral, 75=greed, 100=extreme greed"""

        print(f"[Sentiment] Analyzing {len(clusters)} clusters...")
        result = await ollama.generate(
            prompt=prompt,
            system=SYSTEM_PROMPT,
            json_schema=SENTIMENT_SCHEMA,
            temperature=0.2,
        )

        if isinstance(result, dict) and "error" not in result:
            return result

        return {
            "overall_sentiment": 50.0,
            "sectors": [],
            "keywords": [],
            "cluster_sentiments": [],
        }
