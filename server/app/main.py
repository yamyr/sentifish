import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from rich.logging import RichHandler

from .config import settings
from .runner import load_persisted_runs
from .views import router as views_router

logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(rich_tracebacks=True, show_path=False)],
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app):
    results_path = Path(settings.results_dir)
    results_path.mkdir(parents=True, exist_ok=True)
    load_persisted_runs()
    logger.info(
        "Sentifish started — results dir: %s (%d runs loaded)",
        results_path.resolve(),
        len(list(results_path.glob("*.json"))),
    )
    yield
    logger.info("Sentifish shutting down")


app = FastAPI(
    title="Sentifish",
    description="Web Search Evaluation Platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(views_router)


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Serve the built frontend (only present inside the Docker image at /app/static)
# ---------------------------------------------------------------------------
static_dir = Path("/app/static")
if static_dir.is_dir():
    # Catch-all for SPA routing — must come AFTER API routes
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = static_dir / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(static_dir / "index.html")
