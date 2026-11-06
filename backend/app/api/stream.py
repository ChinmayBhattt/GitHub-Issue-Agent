"""Real-time log streaming using Server-Sent Events (SSE)."""
import asyncio
import json
from typing import AsyncGenerator
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from app.storage.json_store import json_store

router = APIRouter()


async def log_event_generator(job_id: str) -> AsyncGenerator[str, None]:
    """Stream log entries for a job as Server-Sent Events."""
    seen_count = 0
    max_idle_seconds = 300  # 5 minutes timeout
    idle_time = 0

    while True:
        logs = json_store.get_logs(job_id)
        current_count = len(logs)

        if current_count > seen_count:
            # Emit new logs
            for entry in logs[seen_count:]:
                yield f"data: {json.dumps(entry)}\n\n"
            seen_count = current_count
            idle_time = 0
        else:
            idle_time += 1

        # Check job terminal state
        job = json_store.get_job(job_id)
        if job and job.get("status") in ["COMPLETED", "REJECTED", "FAILED"]:
            # Yield final state event and finish stream
            yield f"event: done\ndata: {json.dumps({'status': job.get('status')})}\n\n"
            break

        if idle_time > max_idle_seconds:
            yield f"event: timeout\ndata: {json.dumps({'message': 'Stream timeout'})}\n\n"
            break

        await asyncio.sleep(1.0)


@router.get("/api/jobs/{job_id}/stream")
async def stream_job_logs(job_id: str) -> StreamingResponse:
    """
    GET /api/jobs/{job_id}/stream
    Stream live execution logs in real-time via Server-Sent Events (SSE).
    """
    job = json_store.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found."
        )

    return StreamingResponse(
        log_event_generator(job_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

