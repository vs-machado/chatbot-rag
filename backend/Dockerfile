# ====================================
# Base image (common setup)
# ====================================
FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# System dependencies (psycopg2, torch, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements to leverage Docker cache
COPY requirements.txt .

# ====================================
# Development stage (faster rebuilds)
# ====================================
FROM base AS development

# Keep pip cache (faster when rebuilding)
RUN pip install -r requirements.txt

# Copy application code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--access-log", "--log-level", "debug"]


# ====================================
# Production stage (smaller image)
# ====================================
FROM base AS production

# No pip cache -> smaller final image
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
