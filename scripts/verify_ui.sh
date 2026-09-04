#!/usr/bin/env bash
# One-shot UI verification v3 — patient bash-side polling (dev cold compiles
# in this sandbox can take >60s; agent-browser --wait caps out too early).
set -u
cd /home/z/my-project
mkdir -p tool-results

# 1) Ensure Next dev server is up
if ! ss -tln 2>/dev/null | rg -q ':3000'; then
  echo "[boot] starting next dev..."
  setsid nohup bun run dev </dev/null >/dev/null 2>&1 &
fi
code=000
for i in $(seq 1 30); do
  sleep 3
  code=$(curl -s -m 5 -o /dev/null -w '%{http_code}' http://localhost:3000/ 2>/dev/null)
  [ "$code" = "200" ] && break
done
echo "[boot] storefront http=$code"
[ "$code" != "200" ] && { echo "FATAL: server not up"; exit 1; }

wait_selector() { # $1 = JS boolean expression
  for i in $(seq 1 60); do
    sleep 3
    ok=$(agent-browser eval "$1" 2>/dev/null | tr -d '"' | tail -1)
    [ "$ok" = "true" ] && { echo "[wait] ok after ~$((i*3))s"; return 0; }
  done
  echo "[wait] TIMEOUT for: $1"; return 1
}

agent-browser close >/dev/null 2>&1
agent-browser open "http://localhost:3000/?v=verify3" --timeout 90000 >/dev/null
wait_selector '!!document.querySelector("button[aria-label^=\"Open gift bag\"]")' || true

agent-browser set viewport 1512 860 >/dev/null
sleep 2
echo "--- header @1512 ---"
agent-browser eval '
(() => {
  const cart = document.querySelector("button[aria-label^=\"Open gift bag\"]");
  const pill = document.querySelectorAll("button[aria-label=\"Search gifts\"]")[0];
  const compact = document.querySelectorAll("button[aria-label=\"Search gifts\"]")[1];
  const hb = document.querySelector("header div.max-w-7xl").getBoundingClientRect();
  const cb = cart.getBoundingClientRect();
  return JSON.stringify({
    cartInHeader: cb.right <= hb.right + 1 && cb.top >= hb.top - 1 && cb.bottom <= hb.bottom + 1,
    cartX: Math.round(cb.x), cartRight: Math.round(cb.right), headerRight: Math.round(hb.right),
    pillHidden: getComputedStyle(pill).display === "none",
    compactVisible: getComputedStyle(compact).display !== "none",
    noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth
  });
})()'
agent-browser screenshot tool-results/v-header-1512.png >/dev/null
echo "[shot] v-header-1512.png"

agent-browser set viewport 1890 900 >/dev/null
sleep 2
echo "--- header @1890 ---"
agent-browser eval '
(() => {
  const cart = document.querySelector("button[aria-label^=\"Open gift bag\"]");
  const pill = document.querySelectorAll("button[aria-label=\"Search gifts\"]")[0];
  const hb = document.querySelector("header div.max-w-7xl").getBoundingClientRect();
  const cb = cart.getBoundingClientRect();
  return JSON.stringify({
    cartInHeader: cb.right <= hb.right + 1,
    cartRight: Math.round(cb.right), headerRight: Math.round(hb.right),
    pillVisible: getComputedStyle(pill).display !== "none",
    noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth
  });
})()'
agent-browser screenshot tool-results/v-header-1890.png >/dev/null
echo "[shot] v-header-1890.png"

# 2) Admin flow
agent-browser set viewport 1512 860 >/dev/null
sleep 1
agent-browser eval 'document.querySelector("button[aria-label=\"Open admin panel\"]").click()' >/dev/null
wait_selector '!!document.querySelector("#admin-email")' || true
agent-browser find first "#admin-email" fill "admin@bloombliss.test" >/dev/null
agent-browser find first "#admin-password" fill "Admin@12345" >/dev/null
agent-browser eval 'document.querySelector("button[type=submit]").click()' >/dev/null
wait_selector '!!document.querySelector("nav[aria-label=\"Admin workspace\"] ul li button")' || true
sleep 2

echo "--- admin shell ---"
agent-browser eval '
(() => {
  const nav = document.querySelector("nav[aria-label=\"Admin workspace\"]");
  const items = Array.from(nav.querySelectorAll("ul li button")).map(b => b.textContent.trim());
  const tablists = document.querySelectorAll("[role=tablist]").length;
  const crumb = Array.from(document.querySelectorAll("header span")).map(s => s.textContent.trim()).filter(Boolean).slice(0, 5);
  return JSON.stringify({ itemCount: items.length, sidebarItems: items, tablistsOnOverview: tablists, crumb });
})()'
agent-browser screenshot tool-results/v-admin-overview.png >/dev/null
echo "[shot] v-admin-overview.png"

click_nav() {
  agent-browser eval "
(() => {
  const btns = Array.from(document.querySelectorAll('nav[aria-label=\"Admin workspace\"] ul li button'));
  const b = btns.find(x => x.textContent.includes('$1'));
  if (b) b.click();
  return b ? 'clicked $1' : 'NOT FOUND';
})()"
}

echo "--- products section ---"
click_nav "Products" >/dev/null
sleep 3
agent-browser eval '
(() => {
  const activeNav = document.querySelector("nav[aria-label=\"Admin workspace\"] button[aria-current=\"page\"]")?.textContent?.trim();
  const panelHead = Array.from(document.querySelectorAll("main h2")).map(h => h.textContent.trim()).slice(0, 2);
  const tabs = Array.from(document.querySelectorAll("[role=tablist] [role=tab]")).map(t => t.textContent.trim());
  const ths = Array.from(document.querySelectorAll("main table th")).map(t => t.textContent.trim()).slice(0, 6);
  return JSON.stringify({ activeNav, panelHead, subTabs: tabs, tableHeaders: ths });
})()'
agent-browser screenshot tool-results/v-admin-products.png >/dev/null
echo "[shot] v-admin-products.png"

echo "--- offers section ---"
click_nav "Offers" >/dev/null
sleep 3
agent-browser eval '
(() => {
  const activeNav = document.querySelector("nav[aria-label=\"Admin workspace\"] button[aria-current=\"page\"]")?.textContent?.trim();
  const tabs = Array.from(document.querySelectorAll("[role=tablist] [role=tab]")).map(t => t.textContent.trim());
  return JSON.stringify({ activeNav, subTabs: tabs });
})()'

echo "--- settings section ---"
click_nav "Settings" >/dev/null
sleep 3
agent-browser eval '
(() => {
  const tabs = Array.from(document.querySelectorAll("[role=tablist] [role=tab]")).map(t => t.textContent.trim());
  const crumb = Array.from(document.querySelectorAll("header span")).map(s => s.textContent.trim()).filter(Boolean).slice(0, 5);
  return JSON.stringify({ subTabs: tabs, crumb });
})()'
agent-browser screenshot tool-results/v-admin-settings.png >/dev/null
echo "[shot] v-admin-settings.png"

echo "--- page errors ---"
agent-browser errors 2>&1 | tail -4
agent-browser close >/dev/null 2>&1
echo "DONE"
