import json
import re
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.news_cluster import NewsCluster, NewsdeskSnapshot
from app.models.raw_news import RawNews

router = APIRouter(prefix="/api/v1/newsdesk", tags=["newsdesk"])


# --- 불용어 ---
_STOP_WORDS = {
    # 영어 일반
    "the", "a", "an", "and", "or", "in", "on", "of", "to", "for", "is", "are",
    "was", "were", "be", "been", "with", "that", "this", "from", "by", "at",
    "as", "it", "its", "has", "have", "had", "will", "can", "do", "does",
    "not", "but", "all", "new", "more", "about", "into", "after", "over",
    "between", "through", "up", "out", "their", "his", "her", "our", "they",
    "we", "he", "she", "you", "my", "your", "him", "them", "us", "also",
    "while", "such", "may", "could", "would", "should", "being", "other",
    "than", "including", "which", "what", "when", "where", "how", "who",
    "during", "despite", "among", "various", "several", "both", "each",
    # 뉴스/금융 일반
    "articles", "article", "news", "report", "market", "analysis", "update",
    "updates", "sector", "sectors", "company", "companies", "inc", "ltd",
    "corp", "group", "holdings", "plc", "llc", "international",
    "said", "says", "according", "announced", "recent", "recently",
    "expected", "potential", "significant", "major", "key", "following",
    # 실적발표 관련 (가짜 연결 방지)
    "earnings", "call", "quarterly", "quarter", "annual", "fiscal",
    "published", "slide", "deck", "held", "participation", "executives",
    # 날짜/시간 관련
    "january", "february", "march", "april", "june", "july",
    "august", "september", "october", "november", "december",
    "2024", "2025", "2026", "2027",
    # 일반 동사/형용사
    "financial", "current", "based", "related", "discussed", "discussing",
    "covering", "topics", "trends", "developments", "opportunities",
    "challenges", "strategies", "activities", "activity",
    # 한국어 불용어
    "기사", "관련", "대한", "있다", "있는", "하는", "및", "등", "위한", "통해",
    "있으며", "것으로", "이다", "한다", "따라", "대해", "되고", "것이", "보인다",
    "예상된다", "것이다", "전반", "주요", "따른", "영향", "미칠",
}


@router.get("/today")
async def get_today(db: Session = Depends(get_db)):
    """오늘 최신 스냅샷을 반환한다."""
    today = date.today()
    return _get_newsdesk(db, today)


@router.get("/{target_date}")
async def get_by_date(target_date: date, db: Session = Depends(get_db)):
    """특정 날짜의 스냅샷을 반환한다."""
    return _get_newsdesk(db, target_date)


@router.get("/history/recent")
async def get_history(days: int = 7, db: Session = Depends(get_db)):
    """최근 N일간 요약을 반환한다."""
    from datetime import timedelta

    results = []
    for i in range(days):
        d = date.today() - timedelta(days=i)
        snapshot = (
            db.query(NewsdeskSnapshot)
            .filter(
                NewsdeskSnapshot.snapshot_date == d,
                NewsdeskSnapshot.status == "completed",
            )
            .order_by(NewsdeskSnapshot.created_at.desc())
            .first()
        )
        if snapshot:
            results.append({
                "date": d.isoformat(),
                "overallSentiment": snapshot.overall_sentiment,
                "totalClusters": snapshot.total_clusters,
                "totalNews": snapshot.total_news,
                "snapshotTime": snapshot.snapshot_time,
            })

    return results


@router.get("/clusters/{cluster_id}")
async def get_cluster_detail(cluster_id: int, db: Session = Depends(get_db)):
    """클러스터 상세 정보를 반환한다."""
    cluster = db.query(NewsCluster).filter(NewsCluster.id == cluster_id).first()
    if not cluster:
        return {"error": "Cluster not found"}

    # 원문 뉴스 로드
    news = []
    if cluster.news_ids:
        raw_news = (
            db.query(RawNews)
            .filter(RawNews.id.in_(cluster.news_ids))
            .all()
        )
        news = [
            {
                "id": n.id,
                "source": n.source,
                "title": n.title,
                "description": n.description,
                "url": n.url,
                "publishedAt": n.published_at.isoformat() if n.published_at else None,
            }
            for n in raw_news
        ]

    return {
        "id": cluster.id,
        "title": cluster.title,
        "sentiment": cluster.sentiment,
        "newsCount": cluster.news_count,
        "isTeamRelated": cluster.is_team_related,
        "relatedStocks": cluster.related_stocks or [],
        "summary": cluster.summary,
        "connectedClusters": cluster.connected_clusters or [],
        "aiArticle": cluster.ai_article,
        "relationMap": cluster.relation_map,
        "news": news,
    }


@router.get("/map/{target_date}")
async def get_cluster_map(target_date: date, db: Session = Depends(get_db)):
    """클러스터 간 관계 맵 데이터를 반환한다."""
    return _get_cluster_map(db, target_date)


@router.get("/map/today")
async def get_cluster_map_today(db: Session = Depends(get_db)):
    """오늘의 클러스터 관계 맵."""
    return _get_cluster_map(db, date.today())


def _extract_keywords(text: str) -> set[str]:
    """텍스트에서 의미 있는 키워드를 추출한다."""
    words = re.findall(r'[가-힣]{2,}|[A-Za-z]{3,}|\d+[A-Za-z]+', text)
    return {w.lower() for w in words if w.lower() not in _STOP_WORDS and len(w) > 1}


def _get_cluster_map(db: Session, target_date: date) -> dict:
    """클러스터 간 연결 관계를 키워드 유사도로 계산한다."""
    clusters = (
        db.query(NewsCluster)
        .filter(NewsCluster.newsdesk_date == target_date)
        .order_by(NewsCluster.sentiment.desc())
        .all()
    )

    if not clusters:
        return {"nodes": [], "edges": []}

    # 노드 생성
    nodes = []
    cluster_keywords: dict[int, set[str]] = {}
    for c in clusters:
        text = f"{c.title} {c.summary or ''}"
        keywords = _extract_keywords(text)
        cluster_keywords[c.id] = keywords

        nodes.append({
            "id": str(c.id),
            "title": c.title,
            "sentiment": c.sentiment,
            "newsCount": c.news_count,
            "isTeamRelated": c.is_team_related,
            "summary": c.summary or "",
        })

    # 엣지 생성: 키워드 유사도 기반
    edges = []
    edge_id = 0
    cluster_ids = [c.id for c in clusters]

    for i, cid_a in enumerate(cluster_ids):
        for cid_b in cluster_ids[i + 1:]:
            kw_a = cluster_keywords[cid_a]
            kw_b = cluster_keywords[cid_b]
            shared = kw_a & kw_b

            if len(shared) >= 2:  # 최소 2개 공통 키워드
                # Jaccard 유사도
                union = kw_a | kw_b
                strength = len(shared) / len(union) if union else 0

                if strength >= 0.1:  # 최소 유사도 임계치
                    edge_id += 1
                    # 공통 키워드 중 짧은 것 3개 선택
                    shared_sorted = sorted(shared, key=len)[:3]
                    edges.append({
                        "id": f"e{edge_id}",
                        "source": str(cid_a),
                        "target": str(cid_b),
                        "strength": round(strength, 3),
                        "keywords": shared_sorted,
                    })

    return {"nodes": nodes, "edges": edges}


def _get_newsdesk(db: Session, target_date: date) -> dict:
    """특정 날짜의 뉴스데스크 데이터를 조합한다."""
    # 최신 완료 스냅샷
    snapshot = (
        db.query(NewsdeskSnapshot)
        .filter(
            NewsdeskSnapshot.snapshot_date == target_date,
            NewsdeskSnapshot.status == "completed",
        )
        .order_by(NewsdeskSnapshot.created_at.desc())
        .first()
    )

    # 해당 날짜 클러스터
    clusters = (
        db.query(NewsCluster)
        .filter(NewsCluster.newsdesk_date == target_date)
        .order_by(NewsCluster.sentiment.desc())
        .all()
    )

    cluster_list = []
    team_related_count = 0
    for c in clusters:
        if c.is_team_related:
            team_related_count += 1

        # 인사이트 필드 파싱 (ai_article JSON에서 핵심 데이터 추출)
        insight_fields: dict = {}
        if c.ai_article:
            try:
                parsed = json.loads(c.ai_article)
                if isinstance(parsed, dict) and "headline" in parsed:
                    insight_fields = {
                        "headline": parsed.get("headline", ""),
                        "tldr": parsed.get("tldr", ""),
                        "investmentSignal": parsed.get("investment_signal", {}),
                        "keyMetrics": (parsed.get("key_metrics") or [])[:2],
                        "soWhat": parsed.get("so_what", ""),
                    }
            except (json.JSONDecodeError, TypeError):
                pass

        cluster_list.append({
            "id": c.id,
            "title": c.title,
            "sentiment": c.sentiment,
            "newsCount": c.news_count,
            "isTeamRelated": c.is_team_related,
            "relatedStocks": c.related_stocks or [],
            "summary": c.summary,
            **insight_fields,
        })

    return {
        "date": target_date.isoformat(),
        "lastUpdate": snapshot.created_at.isoformat() if snapshot else None,
        "snapshotTime": snapshot.snapshot_time if snapshot else None,
        "overallSentiment": snapshot.overall_sentiment if snapshot else 50.0,
        "totalClusters": len(clusters),
        "totalNews": snapshot.total_news if snapshot else 0,
        "teamRelatedCount": team_related_count,
        "clusters": cluster_list,
        "keywords": snapshot.keywords if snapshot else [],
        "sectors": snapshot.sectors if snapshot else [],
        "status": snapshot.status if snapshot else "no_data",
    }
