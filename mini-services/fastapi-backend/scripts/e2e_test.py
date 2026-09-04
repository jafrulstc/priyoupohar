"""End-to-end API test for the Bloom & Bliss backend (httpx, no test framework).

Run:  cd mini-services/fastapi-backend && .venv/bin/python scripts/e2e_test.py
Exits non-zero if any check fails.
"""

import base64
import random
import re
import string
import sys

import httpx

BASE = "http://127.0.0.1:8000"
ADMIN_EMAIL, ADMIN_PASSWORD = "admin@bloombliss.test", "Admin@12345"
DEMO_EMAIL, DEMO_PASSWORD = "ravi@demo.test", "Demo@1234"

client = httpx.Client(base_url=BASE, timeout=30)
results: list[tuple[bool, str, str]] = []


def check(name: str, ok: bool, extra: str = "") -> None:
    results.append((ok, name, extra))
    print(f"  {'PASS' if ok else 'FAIL'}  {name}{(' — ' + extra) if extra and not ok else ''}")


def rnd(n: int = 8) -> str:
    return "".join(random.choices(string.ascii_lowercase, k=n))


# 1x1 transparent PNG
PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


def main() -> int:
    print("== health ==")
    r = client.get("/api/health")
    check("GET /api/health", r.status_code == 200 and r.json()["service"] == "bloom-bliss-api", r.text)

    print("== store (public) ==")
    r = client.get("/api/store/categories")
    cats = r.json()
    check("GET /api/store/categories", r.status_code == 200 and len(cats) == 5 and any(c["slug"] == "flowers" for c in cats), r.text)

    r = client.get("/api/store/products?limit=100")
    body = r.json()
    check("GET /api/store/products", r.status_code == 200 and body["total"] == 16 and len(body["items"]) == 16, f"total={body.get('total')}")
    p0 = body["items"][0]
    check("ProductOut shape", p0["price"] == 549.0 and isinstance(p0["price"], float) and p0["images"] == [] and p0["badge"] == "Bestseller" and p0["category"]["slug"] == "flowers", str(p0)[:220])
    check("featured-first ordering", all(item["is_featured"] for item in body["items"][:5]), "")

    r = client.get("/api/store/products?category=flowers")
    check("filter category=flowers", r.json()["total"] == 4 and all(i["category"]["slug"] == "flowers" for i in r.json()["items"]), r.text[:200])
    r = client.get("/api/store/products?q=ROSE")
    check("q=ROSE case-insensitive", any(i["slug"] == "eternal-red-roses" for i in r.json()["items"]), r.text[:200])
    r = client.get("/api/store/products?featured=true")
    check("featured=true", r.json()["total"] == 5 and all(i["is_featured"] for i in r.json()["items"]), f"total={r.json()['total']}")

    r = client.get("/api/store/products/eternal-red-roses")
    check("GET product by slug", r.status_code == 200 and r.json()["price"] == 549.0 and r.json()["rating"] == 4.9, r.text[:200])
    check("GET unknown slug → 404", client.get("/api/store/products/does-not-exist").status_code == 404, "")

    print("== store orders (guest checkout) ==")
    roses = client.get("/api/store/products/eternal-red-roses").json()
    stock_before = roses["stock"]
    order_payload = {
        "customer_name": "Test Guest", "customer_phone": "9999888877",
        "customer_email": "guest@example.test",
        "shipping_address": "21 Test Lane, Gulshan", "city": "Dhaka", "pincode": "1212",
        "items": [{"product_id": roses["id"], "quantity": 1}, {"product_id": client.get("/api/store/products/photo-mug").json()["id"], "quantity": 2}],
        "notes": "ring the bell twice",
    }
    r = client.post("/api/store/orders", json=order_payload)
    order = r.json().get("order", {})
    # 549 + 2*399 = 1347 >= 999 → delivery 0 → total 1347
    check("POST /api/store/orders 201", r.status_code == 201 and re.fullmatch(r"BB-\d{6}-[0-9A-F]{4}", order.get("order_number", "")) is not None, r.text[:300])
    check("order totals/fee", order.get("items_total") == 1347.0 and order.get("delivery_fee") == 0.0 and order.get("total") == 1347.0 and order.get("status") == "pending", str(order.get("items_total")))
    items = order.get("items", [])
    check("order items snapshot", len(items) == 2 and items[0].get("product_name") == "Eternal Red Roses Bouquet" and items[1].get("line_total") == 798.0, str(items)[:200])
    stock_after = client.get("/api/store/products/eternal-red-roses").json()["stock"]
    check("stock decremented", stock_after == stock_before - 1, f"{stock_before}→{stock_after}")

    r = client.get(f"/api/store/orders/{order.get('order_number', '')}")
    check("track order", r.status_code == 200 and r.json().get("order", {}).get("id") == order.get("id"), r.text[:200])
    check("track unknown → 404", client.get("/api/store/orders/BB-000000-ZZZZ").status_code == 404, "")
    # pick the lowest-stock active product and request stock+1 (valid qty ≤ 20)
    all_items = client.get("/api/store/products?limit=50").json()["items"]
    scarce = min(all_items, key=lambda p: p["stock"])
    scarce_qty = min(scarce["stock"] + 1, 20)
    bad = {**order_payload, "items": [{"product_id": scarce["id"], "quantity": scarce_qty}]}
    check(
        "insufficient stock → 400",
        client.post("/api/store/orders", json=bad).status_code == 400,
        f"stock={scarce['stock']} qty={scarce_qty}",
    )
    bad_qty = {**order_payload, "items": [{"product_id": roses["id"], "quantity": 25}]}
    check("qty > 20 → 422", client.post("/api/store/orders", json=bad_qty).status_code == 422, "")
    print("== auth ==")
    email = f"test-{rnd()}@example.test"
    r = client.post("/api/auth/register", json={"name": "E2E Tester", "email": email, "password": "Passw0rd!23"})
    check("register 201", r.status_code == 201 and r.json()["token_type"] == "bearer" and r.json()["user"]["role"] == "customer", r.text[:200])
    user_token = r.json()["access_token"]
    check("register duplicate → 409", client.post("/api/auth/register", json={"name": "E2E", "email": email, "password": "Passw0rd!23"}).status_code == 409, "")
    check("short password → 422", client.post("/api/auth/register", json={"name": "E2E", "email": f"x-{rnd()}@e.test", "password": "short"}).status_code == 422, "")
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {user_token}"})
    check("me with token", r.status_code == 200 and r.json()["email"] == email, r.text[:200])
    check("me no token → 401", client.get("/api/auth/me").status_code == 401, "")
    check("me bad token → 401", client.get("/api/auth/me", headers={"Authorization": "Bearer garbage"}).status_code == 401, "")

    r = client.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    check("admin login", r.status_code == 200 and r.json()["user"]["role"] == "admin", r.text[:200])
    admin_token = r.json()["access_token"]
    check("wrong password → 401", client.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": "nope-nope"}).status_code == 401, "")
    r = client.post("/api/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    check("demo customer login", r.status_code == 200, r.text[:200])
    demo_token = r.json()["access_token"]

    print("== admin guard ==")
    H = {"Authorization": f"Bearer {admin_token}"}
    check("admin endpoint no token → 401", client.get("/api/admin/stats").status_code == 401, "")
    check("admin endpoint customer → 403", client.get("/api/admin/stats", headers={"Authorization": f"Bearer {demo_token}"}).status_code == 403, "")

    print("== admin stats/products/categories ==")
    r = client.get("/api/admin/stats", headers=H)
    s = r.json()
    check("stats", r.status_code == 200 and s["products"] == 16 and s["categories"] == 5 and s["users"] >= 4 and s["orders"] >= 4 and s["revenue"] >= 3604.0 and s["pending_orders"] >= 1, r.text[:300])

    r = client.post("/api/admin/products", headers=H, json={"name": "E2E Orchid Deluxe", "price": 777.5, "stock": 9, "badge": "New", "images": ["a.jpg"]})
    check("product create", r.status_code == 201 and r.json()["slug"] == "e2e-orchid-deluxe" and r.json()["images"] == ["a.jpg"] and r.json()["price"] == 777.5, r.text[:300])
    pid = r.json()["id"]
    r = client.post("/api/admin/products", headers=H, json={"name": "E2E Orchid Deluxe"})
    check("slug clash → -2", r.status_code == 201 and r.json()["slug"] == "e2e-orchid-deluxe-2", r.text[:200])
    pid2 = r.json()["id"]
    r = client.patch(f"/api/admin/products/{pid}", headers=H, json={"price": 888.25, "stock": 4, "is_featured": True})
    check("product patch", r.status_code == 200 and r.json()["price"] == 888.25 and r.json()["stock"] == 4 and r.json()["is_featured"], r.text[:200])
    check("patch unknown product → 404", client.patch("/api/admin/products/999999", headers=H, json={"price": 1}).status_code == 404, "")
    r = client.get("/api/admin/products", headers=H)
    check("admin products list", r.status_code == 200 and r.json()["total"] == 18, f"total={r.json().get('total')}")
    r = client.get("/api/admin/products?q=orchid", headers=H)
    check("admin products q", r.json()["total"] == 3, f"total={r.json().get('total')}")
    r = client.get("/api/admin/products?is_active=false", headers=H)
    check("admin products is_active filter", r.json()["total"] == 0, f"total={r.json().get('total')}")
    check("delete products", client.delete(f"/api/admin/products/{pid}", headers=H).json().get("ok") is True and client.delete(f"/api/admin/products/{pid2}", headers=H).status_code == 200 and client.delete(f"/api/admin/products/{pid}", headers=H).status_code == 404, "")

    r = client.post("/api/admin/categories", headers=H, json={"name": "E2E Gift Baskets", "description": "temp"})
    check("category create", r.status_code == 201 and r.json()["slug"] == "e2e-gift-baskets", r.text[:200])
    cid = r.json()["id"]
    r = client.patch(f"/api/admin/categories/{cid}", headers=H, json={"name": "E2E Baskets", "is_active": False})
    check("category patch", r.status_code == 200 and r.json()["slug"] == "e2e-baskets" and r.json()["is_active"] is False, r.text[:200])
    check("hidden from store categories", all(c["id"] != cid for c in client.get("/api/store/categories").json()), "")
    check("admin categories incl inactive", any(c["id"] == cid for c in client.get("/api/admin/categories", headers=H).json()), "")
    check("category delete", client.delete(f"/api/admin/categories/{cid}", headers=H).json().get("ok") is True, "")
    check("category delete again → 404", client.delete(f"/api/admin/categories/{cid}", headers=H).status_code == 404, "")

    print("== admin orders/users ==")
    r = client.get("/api/admin/orders", headers=H)
    check("admin orders list", r.status_code == 200 and r.json()["total"] >= 4 and r.json()["items"][0]["created_at"] >= r.json()["items"][-1]["created_at"], f"total={r.json().get('total')}")
    check("admin orders status filter", all(o["status"] == "shipped" for o in client.get("/api/admin/orders?status=shipped", headers=H).json()["items"]), "")
    check("admin orders new guest order present", any(o["order_number"] == order.get("order_number") for o in client.get("/api/admin/orders", headers=H).json()["items"]), "")
    r = client.get("/api/admin/orders?limit=1&offset=0", headers=H)
    oid = r.json()["items"][0]["id"]
    r = client.patch(f"/api/admin/orders/{oid}", headers=H, json={"status": "confirmed"})
    check("order status patch", r.status_code == 200 and r.json()["status"] == "confirmed", r.text[:200])
    check("order status invalid → 422", client.patch(f"/api/admin/orders/{oid}", headers=H, json={"status": "teleported"}).status_code == 422, "")

    r = client.get("/api/admin/users", headers=H)
    users = r.json()
    check("users list", r.status_code == 200 and len(users) >= 4 and all("password_hash" not in u for u in users), f"n={len(users)}")
    test_user = next(u for u in users if u["email"] == email)
    admin_user = next(u for u in users if u["email"] == ADMIN_EMAIL)
    r = client.patch(f"/api/admin/users/{test_user['id']}", headers=H, json={"is_active": False})
    check("user patch is_active", r.status_code == 200 and r.json()["is_active"] is False, r.text[:200])
    check("deactivated login → 403", client.post("/api/auth/login", json={"email": email, "password": "Passw0rd!23"}).status_code == 403, "")
    check("deactivated me → 401", client.get("/api/auth/me", headers={"Authorization": f"Bearer {user_token}"}).status_code == 401, "")
    client.patch(f"/api/admin/users/{test_user['id']}", headers=H, json={"is_active": True, "role": "admin"})
    check("user patch role", client.get("/api/admin/users", headers=H).json() and next(u for u in client.get("/api/admin/users", headers=H).json() if u["id"] == test_user["id"])["role"] == "admin", "")
    check("delete self → 409", client.delete(f"/api/admin/users/{admin_user['id']}", headers=H).status_code == 409, "")
    check("delete test user", client.delete(f"/api/admin/users/{test_user['id']}", headers=H).json().get("ok") is True, "")

    print("== upload ==")
    r = client.post("/api/admin/upload", headers=H, files={"file": ("e2e.png", PNG, "image/png")})
    check("upload 200", r.status_code == 200 and r.json().get("url", "").startswith("https://s3.filebase.io/") and "/products/" in r.json().get("url", ""), r.text[:300])
    uploaded = r.json() if r.status_code == 200 else {}
    print(f"  UPLOAD URL: {uploaded.get('url')}")
    print(f"  PREVIEW:    {uploaded.get('preview_url', '')[:110]}…")
    check("preview presigned", uploaded.get("preview_url", "").startswith("https://s3.filebase.io/") and "X-Amz-Signature" in uploaded.get("preview_url", ""), "")
    check("upload .txt → 415", client.post("/api/admin/upload", headers=H, files={"file": ("a.txt", b"hello", "text/plain")}).status_code == 415, "")
    check("upload >8MB → 413", client.post("/api/admin/upload", headers=H, files={"file": ("big.png", b"x" * (8 * 1024 * 1024 + 1), "image/png")}).status_code == 413, "")
    check("upload no token → 401", client.post("/api/admin/upload", files={"file": ("e2e.png", PNG, "image/png")}).status_code == 401, "")
    try:
        dl = httpx.get(uploaded["preview_url"], timeout=20)
        check("preview_url GET 200", dl.status_code == 200 and dl.content == PNG, f"status={dl.status_code}")
    except Exception as exc:  # noqa: BLE001
        check("preview_url GET 200", False, str(exc)[:120])

    failed = [f"{name} ({extra})" for ok, name, extra in results if not ok]
    print(f"\n{'=' * 60}\n{len(results) - len(failed)}/{len(results)} checks passed")
    for f in failed:
        print(f"  FAILED: {f}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
