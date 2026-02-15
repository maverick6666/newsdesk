from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.raw_news import RawNews
from app.services.news_collector import NewsCollector

router = APIRouter(prefix="/api/v1/collect", tags=["collect"])


@router.post("/run")
async def run_collect(target_date: date | None = None, db: Session = Depends(get_db)):
    """해당 날짜의 뉴스를 수집한다."""
    collector = NewsCollector(db)
    result = await collector.collect_all(target_date)
    return {"status": "completed", **result}


@router.get("/status")
async def collect_status(db: Session = Depends(get_db)):
    """수집 현황을 반환한다."""
    today = date.today()
    today_count = db.query(RawNews).filter(RawNews.newsdesk_date == today).count()
    total_count = db.query(RawNews).count()

    last_news = (
        db.query(RawNews)
        .order_by(RawNews.collected_at.desc())
        .first()
    )

    return {
        "status": "idle",
        "totalCollected": total_count,
        "todayCollected": today_count,
        "lastCollect": last_news.collected_at if last_news else None,
    }
