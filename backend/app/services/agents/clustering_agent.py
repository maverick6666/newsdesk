"""
클러스터링 에이전트 — 우체국 직원 방식
뉴스를 10개씩 배치로 처리하며 점진적으로 클러스터를 형성한다.
"""
from app.services.ollama_client import ollama

SYSTEM_PROMPT = """You are a financial news clustering expert.
Your job is to group news articles into thematic clusters.
Each cluster should represent a distinct topic or event.
IMPORTANT: cluster title and summary MUST be written in Korean (한국어).
Even if the source articles are in English, always write cluster titles and summaries in Korean.
Respond ONLY in the required JSON format."""

# Ollama structured output용 JSON 스키마
CLUSTER_SCHEMA = {
    "type": "object",
    "properties": {
        "assignments": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "news_id": {"type": "integer"},
                    "cluster_id": {"type": "integer"},
                    "is_new_cluster": {"type": "boolean"},
                },
                "required": ["news_id", "cluster_id", "is_new_cluster"],
            },
        },
        "clusters": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer"},
                    "title": {"type": "string"},
                    "summary": {"type": "string"},
                },
                "required": ["id", "title", "summary"],
            },
        },
    },
    "required": ["assignments", "clusters"],
}


class ClusteringAgent:
    def __init__(self):
        self.clusters: list[dict] = []
        self.assignments: dict[int, int] = {}  # news_id -> cluster_id
        self.next_cluster_id = 1

    async def run(self, news_list: list[dict]) -> list[dict]:
        """
        전체 뉴스를 10개씩 배치로 나눠 점진적으로 클러스터링한다.
        Returns: [{id, title, summary, news_ids: [...]}, ...]
        """
        batch_size = 10
        batches = [
            news_list[i : i + batch_size]
            for i in range(0, len(news_list), batch_size)
        ]

        print(f"[Clustering] {len(news_list)} articles in {len(batches)} batches")

        for i, batch in enumerate(batches):
            print(f"[Clustering] Processing batch {i + 1}/{len(batches)}...")
            await self._process_batch(batch, is_first=(i == 0))

        # 클러스터에 news_ids 매핑
        cluster_news_map: dict[int, list[int]] = {}
        for news_id, cluster_id in self.assignments.items():
            cluster_news_map.setdefault(cluster_id, []).append(news_id)

        result = []
        for cluster in self.clusters:
            cid = cluster["id"]
            result.append({
                "id": cid,
                "title": cluster["title"],
                "summary": cluster["summary"],
                "news_ids": cluster_news_map.get(cid, []),
            })

        print(f"[Clustering] Done: {len(result)} clusters")
        return result

    async def _process_batch(self, batch: list[dict], is_first: bool):
        news_text = self._format_news(batch)

        if is_first:
            prompt = f"""Here are {len(batch)} news articles. Group them into thematic clusters.
Create new clusters as needed. Each cluster must have a clear title and brief summary IN KOREAN (한국어).

NEWS ARTICLES:
{news_text}

Assign each article to a cluster. Create cluster IDs starting from 1.
Remember: All cluster titles and summaries must be in Korean."""
        else:
            existing = self._format_existing_clusters()
            prompt = f"""Here are {len(batch)} new news articles and existing clusters.
Assign each article to an existing cluster OR create a new cluster if no existing one fits.

EXISTING CLUSTERS:
{existing}

NEW ARTICLES:
{news_text}

For new clusters, use IDs starting from {self.next_cluster_id}.
IMPORTANT: All cluster titles and summaries must be written in Korean (한국어)."""

        result = await ollama.generate(
            prompt=prompt,
            system=SYSTEM_PROMPT,
            json_schema=CLUSTER_SCHEMA,
            temperature=0.2,
        )

        if isinstance(result, dict) and "error" not in result:
            self._merge_result(result)

    def _merge_result(self, result: dict):
        # 새 클러스터 추가 또는 기존 업데이트
        for cluster in result.get("clusters", []):
            cid = cluster["id"]
            existing = next((c for c in self.clusters if c["id"] == cid), None)
            if existing:
                existing["summary"] = cluster.get("summary", existing["summary"])
            else:
                self.clusters.append({
                    "id": cid,
                    "title": cluster["title"],
                    "summary": cluster.get("summary", ""),
                })
                if cid >= self.next_cluster_id:
                    self.next_cluster_id = cid + 1

        # 뉴스-클러스터 배정
        for assign in result.get("assignments", []):
            self.assignments[assign["news_id"]] = assign["cluster_id"]

    @staticmethod
    def _format_news(news_list: list[dict]) -> str:
        lines = []
        for n in news_list:
            title = n.get("title", "")
            desc = n.get("description", "")
            if desc and len(desc) > 200:
                desc = desc[:200] + "..."
            lines.append(f"[ID:{n['id']}] {title}")
            if desc:
                lines.append(f"  > {desc}")
        return "\n".join(lines)

    def _format_existing_clusters(self) -> str:
        lines = []
        for c in self.clusters:
            count = sum(1 for cid in self.assignments.values() if cid == c["id"])
            lines.append(f"[Cluster {c['id']}] {c['title']} ({count} articles)")
            lines.append(f"  Summary: {c['summary']}")
        return "\n".join(lines)
