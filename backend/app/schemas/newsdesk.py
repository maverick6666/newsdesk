from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel


# --- Raw News ---

class RawNewsResponse(BaseModel):
    id: int
    source: str
    title: str
    description: Optional[str] = None
    url: str
    published_at: Optional[datetime] = None
    collected_at: datetime
    entities: Optional[dict] = None

    model_config = {"from_attributes": True}


# --- Cluster ---

class RelationNode(BaseModel):
    id: str
    type: str  # "news", "insight"
    label: str
    data: Optional[dict] = None


class RelationEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str  # "원인", "대응", "결과", "관련"


class RelationMap(BaseModel):
    nodes: list[RelationNode] = []
    edges: list[RelationEdge] = []


class ClusterResponse(BaseModel):
    id: int
    title: str
    sentiment: float
    newsCount: int
    isTeamRelated: bool
    relatedStocks: list[str] = []
    summary: Optional[str] = None
    connectedClusters: list[int] = []
    aiArticle: Optional[str] = None
    relationMap: Optional[RelationMap] = None
    news: list[RawNewsResponse] = []

    model_config = {"from_attributes": True}

    @classmethod
    def from_db(cls, cluster, news_list: list = None):
        return cls(
            id=cluster.id,
            title=cluster.title,
            sentiment=cluster.sentiment or 50.0,
            newsCount=cluster.news_count or 0,
            isTeamRelated=cluster.is_team_related or False,
            relatedStocks=cluster.related_stocks or [],
            summary=cluster.summary,
            connectedClusters=cluster.connected_clusters or [],
            aiArticle=cluster.ai_article,
            relationMap=cluster.relation_map,
            news=news_list or [],
        )


# --- Keywords & Sectors ---

class KeywordItem(BaseModel):
    word: str
    count: int
    sentiment: Optional[float] = None
    isTeamRelated: bool = False


class SectorSentiment(BaseModel):
    name: str
    score: float


# --- NewsDesk Response ---

class NewsDeskResponse(BaseModel):
    date: date
    lastUpdate: Optional[datetime] = None
    snapshotTime: Optional[str] = None
    overallSentiment: float = 50.0
    totalClusters: int = 0
    totalNews: int = 0
    teamRelatedCount: int = 0
    clusters: list[ClusterResponse] = []
    keywords: list[KeywordItem] = []
    sectors: list[SectorSentiment] = []
    status: str = "completed"


# --- History ---

class NewsDeskSummary(BaseModel):
    date: date
    overallSentiment: float
    totalClusters: int
    totalNews: int
    snapshotTimes: list[str] = []


# --- Pipeline ---

class PipelineRunRequest(BaseModel):
    target_date: Optional[date] = None
    snapshot_time: Optional[str] = None


class PipelineStatusResponse(BaseModel):
    status: str  # "idle", "running", "completed", "failed"
    lastRun: Optional[datetime] = None
    message: Optional[str] = None


# --- Crawl ---

class CrawlStatusResponse(BaseModel):
    status: str
    totalCollected: int = 0
    todayCollected: int = 0
    lastCrawl: Optional[datetime] = None
    message: Optional[str] = None
