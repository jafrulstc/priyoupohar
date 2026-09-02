#!/bin/bash
# Keeps both services running. Call with: timeout 300 bash /home/z/my-project/scripts/service-runner.sh &
# This script keeps itself alive, which keeps child processes alive in the sandbox.

FASTAPI_CMD="/home/z/my-project/mini-services/fastapi-backend/.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
NEXT_CMD="bun run dev"
NEXT_DIR="/home/z/my-project"
export DATABASE_URL="postgresql://postgres.etjpsrocmzdtoucaviji:priyoupohar@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"

start_fastapi() {
  cd /home/z/my-project/mini-services/fastapi-backend
  $FASTAPI_CMD >uvicorn.log 2>&1 &
  echo "FastAPI started PID=$!"
}

start_next() {
  cd "$NEXT_DIR"
  $NEXT_CMD >dev.log 2>&1 &
  echo "Next.js started PID=$!"
}

start_fastapi
start_next

# Keep this script running so children stay alive
sleep 300