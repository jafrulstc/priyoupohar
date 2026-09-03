#!/bin/sh
# Self-healing supervisor for the Bloom & Bliss stack.
# Restarts FastAPI (8000) / Next.js standalone (3000) when the sandbox reaper kills them.
BACKEND=/home/z/my-project/mini-services/fastapi-backend
FRONT=/home/z/my-project

while true; do
  # FastAPI (supervisor loop inside bun run dev restarts uvicorn on crash)
  if ! curl -s -m 3 -o /dev/null http://localhost:8000/api/health; then
    setsid sh -c "cd $BACKEND && exec bun run dev" >>"$BACKEND/uvicorn.log" 2>&1 &
  fi
  # Next.js standalone production server
  if ! curl -s -m 3 -o /dev/null http://localhost:3000/; then
    setsid sh -c "cd $FRONT && NODE_ENV=production exec node .next/standalone/server.js" >>"$FRONT/server.log" 2>&1 &
  fi
  sleep 6
done
