"""
관계 분석 에이전트
각 클러스터 내 뉴스들의 인과관계를 분석하고 React Flow 호환 JSON을 생성한다.
"""
from app.services.ollama_client import ollama

SYSTEM_PROMPT = """You are a financial news analyst specializing in causal relationship analysis.
Analyze the relationships between news articles within a cluster.
Identify cause-effect, response, and related connections.
IMPORTANT: All node labels and edge labels MUST be written in Korean (한국어).
Respond ONLY in the required JSON format."""

RELATION_SCHEMA = {
    "type": "object",
    "properties": {
        "nodes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "type": {"type": "string"},
                    "label": {"type": "string"},
                },
                "required": ["id", "type", "label"],
            },
        },
        "edges": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "source": {"type": "string"},
                    "target": {"type": "string"},
                    "label": {"type": "string"},
                },
                "required": ["id", "source", "target", "label"],
            },
        },
    },
    "required": ["nodes", "edges"],
}


class RelationAgent:
    async def run(self, clusters: list[dict], news_map: dict[int, dict]) -> dict[int, dict]:
        """
        각 클러스터에 대해 뉴스 간 관계 맵을 생성한다.
        Returns: {cluster_id: {"nodes": [...], "edges": [...]}}
        """
        results = {}
        for cluster in clusters:
            cid = cluster["id"]
            news_ids = cluster.get("news_ids", [])
            if len(news_ids) < 2:
                # 뉴스가 1개면 관계 분석 불필요
                results[cid] = self._single_node(news_ids, news_map)
                continue

            print(f"[Relation] Analyzing cluster {cid}: '{cluster['title']}' ({len(news_ids)} articles)")
            relation = await self._analyze_cluster(cluster, news_ids, news_map)
            results[cid] = relation

        return results

    async def _analyze_cluster(
        self, cluster: dict, news_ids: list[int], news_map: dict[int, dict]
    ) -> dict:
        news_text = []
        for nid in news_ids[:8]:  # 컨텍스트 제한으로 최대 8개
            n = news_map.get(nid)
            if n:
                title = n.get("title", "")
                desc = n.get("description", "")
                if desc and len(desc) > 150:
                    desc = desc[:150] + "..."
                news_text.append(f"[news_{nid}] {title}")
                if desc:
                    news_text.append(f"  > {desc}")

        prompt = f"""Analyze the causal relationships between these news articles in the cluster "{cluster['title']}".

ARTICLES:
{chr(10).join(news_text)}

Create a relationship map with:
- Nodes: Each article as a "news" node (id: "news_{{id}}"), plus optional "insight" nodes for key conclusions
- Edges: Connections with labels like "원인", "대응", "결과", "관련"
- Edge IDs should be "edge_1", "edge_2", etc.

IMPORTANT: All node labels and edge labels must be in Korean (한국어).
Keep node labels short (max 20 Korean chars). Create 1-3 insight nodes summarizing key takeaways in Korean."""

        result = await ollama.generate(
            prompt=prompt,
            system=SYSTEM_PROMPT,
            json_schema=RELATION_SCHEMA,
            temperature=0.2,
        )

        if isinstance(result, dict) and "error" not in result:
            return result
        return {"nodes": [], "edges": []}

    @staticmethod
    def _single_node(news_ids: list[int], news_map: dict[int, dict]) -> dict:
        nodes = []
        for nid in news_ids:
            n = news_map.get(nid)
            if n:
                label = n.get("title", "")[:30]
                nodes.append({"id": f"news_{nid}", "type": "news", "label": label})
        return {"nodes": nodes, "edges": []}
