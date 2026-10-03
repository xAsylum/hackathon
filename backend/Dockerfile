FROM python:3.11-slim

# 1. Kopiujemy gotowy plik binarny uv z oficjalnego obrazu Astral
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies if required (sqlite3, curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# 2. Kopiujemy pliki zależności uv
COPY pyproject.toml uv.lock ./

# 3. Instalujemy zależności bez zbędnych pakietów deweloperskich
RUN uv sync --frozen --no-dev

# 4. Dodajemy utworzone przez uv środowisko wirtualne do PATH
# Dzięki temu system widzi uvicorna i wszystkie zainstalowane paczki bez wpisywania "uv run"
ENV PATH="/app/.venv/bin:$PATH"

# Create directory for SQLite storage
RUN mkdir -p /app/data

# Copy application code
COPY . .

EXPOSE 8000

# Komenda startowa pozostaje bez zmian
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]