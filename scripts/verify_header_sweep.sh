#!/usr/bin/env bash
# Header width-sweep verification (v4)
set -u
cd /home/z/my-project

if ! ss -tln 2>/dev/null | rg -q ':3000'; then
  setsid nohup bun run dev </dev/null >/dev/null 2>&1 &
fi
code=000
for i in $(seq 1 30); do
  sleep 3
  code=$(curl -s -m 5 -o /dev/null -w '%{http_code}' http://localhost:3000/ 2>/dev/null)
  [ "$code" = "200" ] && break
done
echo "[boot] http=$code"
[ "$code" != "200" ] && exit 1

agent-browser close >/dev/null 2>&1
agent-browser open "http://localhost:3000/?v=verify4" --timeout 90000 >/dev/null
for i in $(seq 1 60); do
  sleep 3
  ok=$(agent-browser eval '!!document.querySelector("button[aria-label^=\"Open gift bag\"]")' 2>/dev/null | tr -d '"' | tail -1)
  [ "$ok" = "true" ] && { echo "[wait] header ready ~$((i*3))s"; break; }
done

check() { # $1 width
  agent-browser set viewport "$1" 860 >/dev/null
  sleep 1.5
  agent-browser eval "
(() => {
  const cart = document.querySelector('button[aria-label^=\"Open gift bag\"]');
  if (!cart) return 'NO CART';
  const bars = document.querySelectorAll('header div.max-w-7xl, header div[class*=\"1560\"]');
  const bar = bars[bars.length - 1];
  const hb = bar.getBoundingClientRect();
  const cb = cart.getBoundingClientRect();
  return JSON.stringify({
    w: window.innerWidth,
    cartInBar: cb.right <= hb.right + 1 && cb.top >= hb.top - 1 && cb.bottom <= hb.bottom + 1,
    cartRight: Math.round(cb.right), barRight: Math.round(hb.right),
    hOverflow: document.documentElement.scrollWidth > window.innerWidth
  });
})()"
}

for w in 1280 1366 1512 1890 2560; do check "$w"; done

agent-browser set viewport 1512 860 >/dev/null
agent-browser screenshot tool-results/v-header-final-1512.png >/dev/null
agent-browser set viewport 1890 900 >/dev/null
agent-browser screenshot tool-results/v-header-final-1890.png >/dev/null
agent-browser close >/dev/null 2>&1
echo DONE
