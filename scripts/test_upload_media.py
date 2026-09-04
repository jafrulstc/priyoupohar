"""E2E upload test: admin login -> upload PNG -> fetch back via /api/media proxy."""

import json
import urllib.request
import uuid

BASE = "http://localhost:8000"

# 1) admin login
req = urllib.request.Request(
    f"{BASE}/api/auth/login",
    data=json.dumps({"email": "admin@bloombliss.test", "password": "Admin@12345"}).encode(),
    headers={"Content-Type": "application/json"},
    method="POST",
)
token = json.loads(urllib.request.urlopen(req, timeout=10).read())["access_token"]
print("login OK")

# 2) tiny valid PNG (1x1 transparent)
png = bytes.fromhex(
    "89504e470d0a1a0a0000000d494844520000000100000001080600000"
    "01f15c4890000000d4944415478da63fccf50cf000004fc01f70b3bfb"
    "0000000049454e44ae426082"
)
boundary = uuid.uuid4().hex
body = (
    f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="probe.png"\r\n'
    f"Content-Type: image/png\r\n\r\n"
).encode() + png + f"\r\n--{boundary}--\r\n".encode()
req = urllib.request.Request(
    f"{BASE}/api/admin/upload",
    data=body,
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": f"multipart/form-data; boundary={boundary}",
    },
    method="POST",
)
resp = json.loads(urllib.request.urlopen(req, timeout=90).read())
print("upload resp:", json.dumps(resp, indent=1))

# 3) fetch the stored media back through the public proxy
url = BASE + resp["url"]
with urllib.request.urlopen(url, timeout=15) as r:
    data = r.read()
    print("media GET", r.status, r.headers.get("Content-Type"), len(data), "bytes")
    assert data == png, "content mismatch"
    print("round-trip OK")

# 4) path traversal guard must 404
for bad in ("/api/media/../.env", "/api/media/products/..%2f..%2f.env"):
    try:
        urllib.request.urlopen(BASE + bad, timeout=10)
        print("TRAVERSAL FAIL (200!):", bad)
    except urllib.error.HTTPError as exc:
        print("traversal guard", exc.code, "OK for", bad)
print("ALL DONE")
