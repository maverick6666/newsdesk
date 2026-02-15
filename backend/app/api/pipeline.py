import asyncio
from datetime import date, datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.services.pipeline import Pipeline
from app.services.ollama_client import ollama

router = APIRouter(prefix="/api/v1/pipeline", tags=["pipeline"])

# 파이프라인 상태 (in-memory)
_pipeline_state = {
    "status": "idle",
    "message": "",
    "last_run": None,
    "result": None,
}


async def _run_pipeline_bg(target_date: date, snapshot_time: str):
    """백그라운드에서 파이프라인을 실행한다."""
    _pipeline_state["status"] = "running"
    _pipeline_state["message"] = "Starting pipeline..."
    _pipeline_state["last_run"] = datetime.now().isoformat()

    db = SessionLocal()
    try:
        pipeline = Pipeline(db)
        result = await pipeline.run(target_date, snapshot_time)
        _pipeline_state["status"] = result.get("status", "completed")
        _pipeline_state["message"] = result.get("message", "Done")
        _pipeline_state["result"] = result
    except Exception as e:
        _pipeline_state["status"] = "failed"
        _pipeline_state["message"] = str(e)
    finally:
        db.close()


@router.post("/run")
async def run_pipeline(
    target_date: date | None = None,
    snapshot_time: str | None = None,
):
    """AI 파이프라인을 백그라운드로 실행한다."""
    if _pipeline_state["status"] == "running":
        return {"status": "already_running", "message": _pipeline_state["message"]}

    if not await ollama.is_available():
        return {"status": "failed", "message": "Ollama is not available"}

    if not await ollama.model_loaded():
        return {
            "status": "failed",
            "message": f"Model '{ollama.model}' is not loaded. Run: ollama pull {ollama.model}",
        }

    if target_date is None:
        target_date = date.today()
    if snapshot_time is None:
        snapshot_time = datetime.now().strftime("%H:%M")

    # 백그라운드로 실행
    asyncio.create_task(_run_pipeline_bg(target_date, snapshot_time))

    return {
        "status": "started",
        "message": f"Pipeline started for {target_date} ({snapshot_time})",
    }


@router.get("/status")
async def pipeline_status():
    """파이프라인 및 Ollama 상태를 확인한다."""
    available = await ollama.is_available()
    model_ready = await ollama.model_loaded() if available else False

    return {
        "ollama_available": available,
        "model": ollama.model,
        "model_ready": model_ready,
        "pipeline": _pipeline_state,
    }
