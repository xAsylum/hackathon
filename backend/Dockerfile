FROM python:3.11-slim

# 1. Kopiujemy gotowy plik binarny uv z oficjalnego obrazu Astral
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Set environment variables - instalujemy venv w /opt/venv poza montowanym /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

# Install system dependencies if required (sqlite3, curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# 2. Kopiujemy pliki zależności uv
COPY pyproject.toml uv.lock ./

# 3. Instalujemy zależności do /opt/venv (w tym networkx i osmnx)
RUN uv sync --frozen --no-dev

# Create directory for SQLite storage
RUN mkdir -p /app/data

# Copy application code
COPY . .

EXPOSE 8000

# Komenda startowa
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]