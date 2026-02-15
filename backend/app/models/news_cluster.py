from datetime import datetime, date

from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Float, Boolean, JSON
from app.database import Base


class NewsCluster(Base):
    __tablename__ = "news_clusters"

    id = Column(Integer, primary_key=True, index=True)
    newsdesk_date = Column(Date, default=date.today, nullable=False, index=True)
    title = Column(String(300), nullable=False)
    sentiment = Column(Float, default=50.0)  # 0-100 scale
    news_count = Column(Integer, default=0)
    is_team_related = Column(Boolean, default=False)
    related_stocks = Column(JSON, nullable=True)  # ["AAPL", "삼성전자", ...]
    summary = Column(Text, nullable=True)
    connected_clusters = Column(JSON, nullable=True)  # [cluster_id, ...]
    ai_article = Column(Text, nullable=True)  # markdown format
    relation_map = Column(JSON, nullable=True)  # {"nodes": [...], "edges": [...]}
    news_ids = Column(JSON, nullable=True)  # [raw_news_id, ...]
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class NewsdeskSnapshot(Base):
    __tablename__ = "newsdesk_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    snapshot_date = Column(Date, nullable=False, index=True)
    snapshot_time = Column(String(5), nullable=False)  # "06:00", "12:00", "18:00", "23:00"
    overall_sentiment = Column(Float, default=50.0)  # 0-100
    total_clusters = Column(Integer, default=0)
    total_news = Column(Integer, default=0)
    clusters_data = Column(JSON, nullable=True)  # full cluster data for this snapshot
    keywords = Column(JSON, nullable=True)  # [{"word": ..., "count": ..., "sentiment": ...}]
    sectors = Column(JSON, nullable=True)  # [{"name": ..., "score": ...}]
    status = Column(String(20), default="completed")  # "completed", "failed", "running"
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
