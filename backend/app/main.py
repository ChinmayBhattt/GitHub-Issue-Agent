"""FastAPI application entrypoint for GitHub Issue Resolution Agent."""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.config.settings import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("github_issue_agent")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown hooks."""
    logger.info("Initializing GitHub Issue Resolution Agent Backend...")
    settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
    settings.WORKSPACE_BASE_DIR.mkdir(parents=True, exist_ok=True)
    yield
    logger.info("Shutting down GitHub Issue Resolution Agent Backend...")


app = FastAPI(
    title="GitHub Issue Resolution Agent API",
    description="Autonomous AI coding agent that triages, analyzes, fixes, tests, and opens PRs for GitHub issues.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

