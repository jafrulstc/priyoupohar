#!/bin/sh
# Start whichever service is down; safe to call repeatedly.
if ! curl -s -m 2 -o /dev/null http://localhost:8000/api/health; then
  setsid sh -c 'cd /home/z/my-project/mini-services/fastapi-backend && exec bun run dev' >>/home/z/my-project/mini-services/fastapi-backend/uvicorn.log 2>&1 &
fi
if ! curl -s -m 2 -o /dev/null http://localhost:3000/; then
  setsid sh -c 'cd /home/z/my-project && NODE_ENV=production exec node .next/standalone/server.js' >>/home/z/my-project/server.log 2>&1 &
fi
sleep 4
echo "next=$(curl -s -m 2 -o /dev/null -w '%{http_code}' http://localhost:3000/) api=$(curl -s -m 2 -o /dev/null -w '%{http_code}' http://localhost:8000/api/health)"
