FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

WORKDIR /app

# Dependencias primero para aprovechar la caché de capas.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Código, scripts y configuración de ejemplo.
COPY . .

# Local / docker compose: recolección continua.
# En Render el Cron Job usa: python scripts/run_pipeline.py
CMD ["sh", "-c", "python scripts/monitor_viviendas.py --interval \"${COLLECT_INTERVAL_SECONDS:-600}\""]
