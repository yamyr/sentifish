# Python backend
FROM python:3.14-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1

# Install uv (pinned version for reproducible builds)
COPY --from=ghcr.io/astral-sh/uv:0.7.8 /uv /uvx /bin/

# Install Python dependencies
COPY server/pyproject.toml server/uv.lock ./
RUN uv sync --frozen --no-dev --no-editable

# Copy server code and datasets
COPY server/app/ app/
COPY server/datasets/ datasets/

# Run as non-root user
RUN useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app
USER appuser

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT:-4010}/health')"

CMD .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-4010}
