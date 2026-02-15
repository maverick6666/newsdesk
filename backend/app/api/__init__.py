from fastapi import APIRouter

from app.api.health import router as health_router
from app.api.crawl import router as crawl_router
from app.api.pipeline import router as pipeline_router
from app.api.newsdesk import router as newsdesk_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(crawl_router)
api_router.include_router(pipeline_router)
api_router.include_router(newsdesk_router)
