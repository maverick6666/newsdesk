from datetime import datetime, date

from sqlalchemy import Column, Integer, String, Text, DateTime, Date, JSON
from app.database import Base


class RawNews(Base):
    __tablename__ = "raw_news"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(50), nullable=False)  # "marketaux", "naver"
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    url = Column(String(1000), nullable=False, unique=True)
    published_at = Column(DateTime, nullable=True)
    collected_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    newsdesk_date = Column(Date, default=date.today, nullable=False, index=True)
    entities = Column(JSON, nullable=True)  # {"tickers": [...], "topics": [...]}
