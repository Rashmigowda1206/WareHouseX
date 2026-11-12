# Stage 1: Build React Vite Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Runtime
FROM python:3.11-slim
WORKDIR /app

# Install standard Linux server administration utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    tar gzip procps curl sqlite3 && \
    rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY opt_warehousex/ ./opt_warehousex/
COPY WareHouseX_Evidence/ ./WareHouseX_Evidence/
COPY start_server.sh ./

# Initialize database
RUN python backend/database/seed_data.py

ENV PORT=5000
ENV WAREHOUSEX_MODE=auto
EXPOSE 5000

CMD ["gunicorn", "--chdir", "backend", "app:app", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120"]
