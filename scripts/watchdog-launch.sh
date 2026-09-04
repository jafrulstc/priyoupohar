#!/bin/bash
# Launches both FastAPI and Next.js services
# Usage: bash /home/z/my-project/scripts/watchdog-launch.sh &

# FastAPI
cd /home/z/my-project/mini-services/fastapi-backend
.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
FASTAPI_PID=$!
echo "FastAPI PID: $FASTAPI_PID"

# Next.js
cd /home/z/my-project
export DATABASE_URL="postgresql://postgres.etjpsrocmzdtoucaviji:priyoupohar@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
bun run dev &
NEXT_PID=$!
echo "Next.js PID: $NEXT_PID"

# Wait for either to die
wait -n $FASTAPI_PID $NEXT_PID 2>/dev/null
exit 0
