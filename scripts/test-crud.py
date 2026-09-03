"""Quick CRUD verification against the FastAPI admin endpoints."""

import json, sys, requests

BASE = "http://localhost:8000"

def login():
    r = requests.post(f"{BASE}/api/auth/login", json={
        "email": "admin@bloombliss.test",
        "password": "admin123"
    })
    data = r.json()
    token = data.get("access_token", "")
    if not token:
        print(f"LOGIN FAILED: {data}")
        sys.exit(1)
    print(f"✅ Login OK (token={token[:15]}…)")
    return token

headers = lambda t: {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}

def test_products(token):
    h = headers(token)

    # CREATE
    body = {
        "name": "Test Daisy Bouquet",
        "slug": "test-daisy-bouquet-crud",
        "description": "CRUD verification product",
        "price": 299,
        "original_price": 399,
        "category_id": None,
        "stock": 50,
        "badge": None,
        "image_url": "",
        "is_featured": False,
        "is_active": True,
    }
    r = requests.post(f"{BASE}/api/admin/products", json=body, headers=h)
    assert r.status_code in (200, 201), f"CREATE failed: {r.status_code} {r.text}"
    pid = r.json()["id"]
    print(f"✅ CREATE product id={pid}")

    # READ (via list filter — no single-product GET endpoint)
    r = requests.get(f"{BASE}/api/admin/products", headers=h)
    assert r.status_code == 200, f"LIST failed: {r.status_code}"
    found = [p for p in r.json().get("items", []) if p["id"] == pid]
    assert found, f"Created product {pid} not found in list"
    assert found[0]["name"] == body["name"]
    print(f"✅ READ product id={pid} (via list)")

    # UPDATE
    r = requests.patch(f"{BASE}/api/admin/products/{pid}", json={"price": 349, "description": "Updated"}, headers=h)
    assert r.status_code == 200, f"UPDATE failed: {r.status_code} {r.text}"
    assert r.json()["price"] == 349
    print(f"✅ UPDATE product id={pid} price→349")

    # DELETE
    r = requests.delete(f"{BASE}/api/admin/products/{pid}", headers=h)
    assert r.status_code == 200, f"DELETE failed: {r.status_code} {r.text}"
    print(f"✅ DELETE product id={pid}")

    # VERIFY DELETED
    r = requests.get(f"{BASE}/api/admin/products", headers=h)
    items = r.json().get("items", [])
    still = [p for p in items if p["id"] == pid]
    assert not still, f"Product {pid} still in list after delete"
    print(f"✅ VERIFY DELETE (gone from list)")

def test_categories(token):
    h = headers(token)

    # CREATE
    body = {"name": "Test CRUD Cat", "slug": "test-crud-cat", "description": "temp", "image_url": None, "is_active": True}
    r = requests.post(f"{BASE}/api/admin/categories", json=body, headers=h)
    assert r.status_code in (200, 201), f"CAT CREATE failed: {r.status_code} {r.text}"
    cid = r.json()["id"]
    print(f"✅ CREATE category id={cid}")

    # UPDATE
    r = requests.patch(f"{BASE}/api/admin/categories/{cid}", json={"name": "Updated Cat"}, headers=h)
    assert r.status_code == 200, f"CAT UPDATE failed: {r.status_code} {r.text}"
    print(f"✅ UPDATE category id={cid}")

    # DELETE
    r = requests.delete(f"{BASE}/api/admin/categories/{cid}", headers=h)
    assert r.status_code == 200, f"CAT DELETE failed: {r.status_code} {r.text}"
    print(f"✅ DELETE category id={cid}")

def test_orders(token):
    h = headers(token)
    r = requests.get(f"{BASE}/api/admin/orders?limit=3", headers=h)
    assert r.status_code == 200, f"ORDERS LIST failed: {r.status_code}"
    data = r.json()
    items = data.get("items", [])
    print(f"✅ LIST orders ({len(items)} returned)")
    if items:
        oid = items[0]["id"]
        # Status update
        r = requests.patch(f"{BASE}/api/admin/orders/{oid}", json={"status": items[0]["status"]}, headers=h)
        assert r.status_code == 200, f"ORDER STATUS UPDATE failed: {r.status_code} {r.text}"
        print(f"✅ PATCH order status id={oid}")

if __name__ == "__main__":
    t = login()
    test_products(t)
    test_categories(t)
    test_orders(t)
    print("\n🎉 ALL CRUD ENDPOINT TESTS PASSED")
