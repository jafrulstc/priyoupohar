#!/usr/bin/env bash
# FINAL combined verification: clean boot → curl warmup → browser sweep + admin.
set -u
cd /home/z/my-project

# 1) Clean single instance
pkill -f 'next dev' 2>/dev/null; pkill -f 'next-server' 2>/dev/null; sleep 3
setsid nohup bun run dev </dev/null >/dev/null 2>&1 &

# 2) Wait until SSR HTML actually contains the header cart button
ready=0
for i in $(seq 1 60); do
  sleep 3
  if curl -s -m 8 http://localhost:3000/ 2>/dev/null | rg -q 'Open gift bag'; then ready=1; echo "[boot] SSR ready ~$((i*3))s"; break; fi
done
[ "$ready" != "1" ] && { echo FATAL: SSR never ready; exit 1; }

agent-browser close >/dev/null 2>&1
agent-browser open "http://localhost:3000/?v=final" --timeout 90000 >/dev/null
for i in $(seq 1 40); do
  sleep 3
  ok=$(agent-browser eval '!!document.querySelector("button[aria-label^=\"Open gift bag\"]")' 2>/dev/null | tr -d '"' | tail -1)
  [ "$ok" = "true" ] && { echo "[browser] hydrated ~$((i*3))s"; break; }
done

sweep() {
  agent-browser set viewport "$1" 860 >/dev/null
  sleep 1.5
  agent-browser eval "
(() => {
  const cart = document.querySelector('button[aria-label^=\"Open gift bag\"]');
  if (!cart) return 'NO CART';
  const bar = cart.closest('div');
  const hb = bar.getBoundingClientRect();
  const cb = cart.getBoundingClientRect();
  return JSON.stringify({ w: window.innerWidth, cartInBar: cb.right <= hb.right + 1 && cb.top >= hb.top - 1 && cb.bottom <= hb.bottom + 1, cartRight: Math.round(cb.right), barRight: Math.round(hb.right), hOverflow: document.documentElement.scrollWidth > window.innerWidth });
})()"
}
echo "--- width sweep ---"
for w in 1280 1366 1512 1680 1890 2560; do sweep "$w"; done

agent-browser set viewport 1512 860 >/dev/null; sleep 1
agent-browser screenshot tool-results/final-header-1512.png >/dev/null
agent-browser set viewport 1890 900 >/dev/null; sleep 1
agent-browser screenshot tool-results/final-header-1890.png >/dev/null
echo "[shots] final-header-1512/1890.png"

# 3) Admin re-check (session persisted in localStorage)
agent-browser set viewport 1512 860 >/dev/null; sleep 1
agent-browser eval 'document.querySelector("button[aria-label=\"Open admin panel\"]").click()' >/dev/null
for i in $(seq 1 20); do
  sleep 2
  ok=$(agent-browser eval '!!document.querySelector("nav[aria-label=\"Admin workspace\"] ul li button")' 2>/dev/null | tr -d '"' | tail -1)
  [ "$ok" = "true" ] && break
done
sleep 2
echo "--- admin ---"
agent-browser eval '
(() => {
  const items = Array.from(document.querySelectorAll("nav[aria-label=\"Admin workspace\"] ul li button")).map(b => b.textContent.trim());
  return JSON.stringify({ sidebarItems: items, count: items.length });
})()'
agent-browser screenshot tool-results/final-admin-sidebar.png >/dev/null
echo "[shot] final-admin-sidebar.png"
agent-browser errors 2>&1 | tail -3
agent-browser close >/dev/null 2>&1
echo DONE
