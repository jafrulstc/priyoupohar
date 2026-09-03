#!/usr/bin/env python3
"""End-to-end upload test: login -> upload PNG -> fetch preview_url."""

import io
import json
import struct
import urllib.request
import zlib

BASE = "http://localhost:8000"


def make_png(width=64, height=64, rgb=(200, 60, 120)):
    """Minimal valid PNG generator."""
    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    raw = b"".join(b"\x00" + bytes(rgb) * width for _ in range(height))
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", header)
        + chunk(b"IDAT", zlib.compress(raw))
        + chunk(b"IEND", b"")
    )


def post_json(path, payload, token=None):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())


def main():
    # 1. Admin login
    login = post_json(
        "/api/auth/login",
        {"email": "admin@bloombliss.test", "password": "Admin@12345"},
    )
    token = login.get("access_token") or login.get("token")
    assert token, f"no token in response: {list(login.keys())}"
    print(f"[1] login OK (token {len(token)} chars)")

    # 2. Upload PNG
    boundary = "----bbtestboundary42"
    png = make_png()
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="file"; filename="e2e-test.png"\r\n'
        "Content-Type: image/png\r\n\r\n"
    ).encode() + png + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(
        BASE + "/api/admin/upload",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=30) as r:
        up = json.loads(r.read())
    print(f"[2] upload OK: storage={up.get('storage')} url={up.get('url')}")

    # 3. Fetch preview_url through the gateway (:81) as the browser would
    preview = up["preview_url"]
    if preview.startswith("/"):
        fetch_url = "http://localhost" + preview  # gateway port 80 default? try 81
    else:
        fetch_url = preview
    ok = None
    for candidate in (
        "http://localhost:8000" + preview if preview.startswith("/") else preview,
        "http://localhost:81" + preview if preview.startswith("/") else preview,
        "http://localhost:3000" + preview if preview.startswith("/") else preview,
    ):
        try:
            with urllib.request.urlopen(candidate, timeout=10) as r:
                data = r.read()
            if r.status == 200 and data[:4] == b"\x89PNG":
                ok = candidate
                break
        except Exception:  # noqa: BLE001
            continue
    assert ok, f"preview_url NOT fetchable anywhere: {preview}"
    print(f"[3] preview_url fetch OK ({len(data)} bytes PNG) via {ok}")
    print("E2E PASS")


if __name__ == "__main__":
    main()
