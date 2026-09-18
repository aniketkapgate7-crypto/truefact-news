# Pinned official Python 3.11 slim image
FROM python:3.11-slim-bookworm

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install minimal system packages and remove apt caches
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root application user and group
RUN groupadd --system --gid 10001 appuser \
    && useradd --system --uid 10001 --gid appuser --no-create-home appuser

# Copy dependency definition first for layer caching
COPY requirements.txt ./

# Install dependencies without pip cache
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application runtime files and configuration
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini ./

# Set ownership to the non-root user
RUN chown -R appuser:appuser /app

# Switch to the non-root user
USER appuser:appuser

# Default port for local container testing (Cloud Run sets PORT dynamically at runtime)
EXPOSE 8080

# Exec-style process replacement using safe shell command for PORT expansion
# Note: alembic migrations must NOT be run automatically during container startup
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
