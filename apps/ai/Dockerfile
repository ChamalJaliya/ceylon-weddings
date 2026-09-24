FROM python:3.12-slim AS base

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

ENV PORT=8001
EXPOSE 8001

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8001/health')"

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8001}"]
