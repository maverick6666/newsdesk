"""
파이프라인 오케스트레이터
뉴스 수집 → 클러스터링 → 관계분석 → 인사이트 → 감성분석 → 스냅샷 저장
"""
from datetime import date, datetime

from sqlalchemy.orm import Session

from app.models.raw_news import RawNews
from app.models.news_cluster import NewsCluster, NewsdeskSnapshot
from app.services.agents.clustering_agent import ClusteringAgent
from app.services.agents.relation_agent import RelationAgent
from app.services.agents.insight_agent import InsightAgent
from app.services.agents.sentiment_agent import SentimentAgent


class Pipeline:
    def __init__(self, db: Session):
        self.db = db
        self.status = "idle"
        self.message = ""

    async def run(
        self,
        target_date: date | None = None,
        snapshot_time: str | None = None,
    ) -> dict:
        if target_date is None:
            target_date = date.today()
        if snapshot_time is None:
            snapshot_time = datetime.now().strftime("%H:%M")

        self.status = "running"
        self.message = "Loading news..."

        try:
            # 1. raw_news 로드
            raw_news = (
                self.db.query(RawNews)
                .filter(RawNews.newsdesk_date == target_date)
                .order_by(RawNews.published_at.desc())
                .all()
            )

            if not raw_news:
                self.status = "failed"
                self.message = f"No news found for {target_date}"
                return {"status": "failed", "message": self.message}

            # news_map: id -> dict (에이전트들이 참조)
            news_map = {}
            news_list = []
            for n in raw_news:
                d = {
                    "id": n.id,
                    "title": n.title,
                    "description": n.description or "",
                    "source": n.source,
                    "url": n.url,
                    "published_at": n.published_at.isoformat() if n.published_at else None,
                    "entities": n.entities,
                }
                news_map[n.id] = d
                news_list.append(d)

            print(f"[Pipeline] {len(news_list)} articles loaded for {target_date}")

            # 2. 클러스터링
            self.message = "Clustering news..."
            clustering = ClusteringAgent()
            clusters = await clustering.run(news_list)

            # 3. 관계 분석
            self.message = "Analyzing relationships..."
            relation = RelationAgent()
            relations = await relation.run(clusters, news_map)

            # 4. 인사이트 (AI 기사)
            self.message = "Writing AI articles..."
            insight = InsightAgent()
            articles = await insight.run(clusters, news_map)

            # 5. 감성 분석
            self.message = "Analyzing sentiment..."
            sentiment = SentimentAgent()
            sentiment_data = await sentiment.run(clusters, news_map)

            # 6. DB 저장
            self.message = "Saving results..."
            await self._save_results(
                target_date, snapshot_time,
                clusters, relations, articles, sentiment_data,
            )

            self.status = "completed"
            self.message = f"Pipeline completed: {len(clusters)} clusters from {len(news_list)} articles"
            return {
                "status": "completed",
                "date": target_date.isoformat(),
                "snapshot_time": snapshot_time,
                "total_news": len(news_list),
                "total_clusters": len(clusters),
                "overall_sentiment": sentiment_data.get("overall_sentiment", 50),
            }

        except Exception as e:
            self.status = "failed"
            self.message = str(e)
            print(f"[Pipeline] Error: {e}")

            # 실패 스냅샷 저장
            self._save_failed_snapshot(target_date, snapshot_time, str(e))
            return {"status": "failed", "message": str(e)}

    async def _save_results(
        self,
        target_date: date,
        snapshot_time: str,
        clusters: list[dict],
        relations: dict[int, dict],
        articles: dict[int, str],
        sentiment_data: dict,
    ):
        # 기존 같은 날짜 클러스터 삭제 (새로 생성)
        self.db.query(NewsCluster).filter(
            NewsCluster.newsdesk_date == target_date
        ).delete()

        # 클러스터별 감성 매핑
        cluster_sentiments = {
            cs["cluster_id"]: cs["sentiment"]
            for cs in sentiment_data.get("cluster_sentiments", [])
        }

        clusters_data = []
        for cluster in clusters:
            cid = cluster["id"]

            db_cluster = NewsCluster(
                newsdesk_date=target_date,
                title=cluster["title"],
                sentiment=cluster_sentiments.get(cid, 50.0),
                news_count=len(cluster.get("news_ids", [])),
                is_team_related=False,
                related_stocks=self._extract_stocks(cluster, {}),
                summary=cluster.get("summary", ""),
                ai_article=articles.get(cid, ""),
                relation_map=relations.get(cid),
                news_ids=cluster.get("news_ids", []),
            )
            self.db.add(db_cluster)
            self.db.flush()  # ID 생성

            clusters_data.append({
                "id": db_cluster.id,
                "title": cluster["title"],
                "sentiment": cluster_sentiments.get(cid, 50.0),
                "news_count": len(cluster.get("news_ids", [])),
                "summary": cluster.get("summary", ""),
            })

        # 스냅샷 저장
        snapshot = NewsdeskSnapshot(
            snapshot_date=target_date,
            snapshot_time=snapshot_time,
            overall_sentiment=sentiment_data.get("overall_sentiment", 50.0),
            total_clusters=len(clusters),
            total_news=sum(len(c.get("news_ids", [])) for c in clusters),
            clusters_data=clusters_data,
            keywords=sentiment_data.get("keywords", []),
            sectors=sentiment_data.get("sectors", []),
            status="completed",
        )
        self.db.add(snapshot)
        self.db.commit()
        print(f"[Pipeline] Saved {len(clusters)} clusters + snapshot")

    def _save_failed_snapshot(self, target_date: date, snapshot_time: str, error: str):
        try:
            snapshot = NewsdeskSnapshot(
                snapshot_date=target_date,
                snapshot_time=snapshot_time,
                status="failed",
                error_message=error,
            )
            self.db.add(snapshot)
            self.db.commit()
        except Exception:
            self.db.rollback()

    @staticmethod
    def _extract_stocks(cluster: dict, news_map: dict) -> list[str]:
        """클러스터의 뉴스에서 관련 종목을 추출한다."""
        stocks = set()
        for nid in cluster.get("news_ids", []):
            n = news_map.get(nid, {})
            entities = n.get("entities") or {}
            for ticker in entities.get("tickers", []):
                if isinstance(ticker, dict):
                    stocks.add(ticker.get("symbol", ""))
                elif isinstance(ticker, str):
                    stocks.add(ticker)
        stocks.discard("")
        return list(stocks)[:10]
