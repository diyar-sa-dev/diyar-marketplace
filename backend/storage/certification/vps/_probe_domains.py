import socket
import subprocess
import urllib.request
import ssl

print("=== DNS ===")
for host in [
    "deyarhome.com",
    "www.deyarhome.com",
    "api.deyarhome.com",
    "app.deyarhome.com",
    "admin.deyarhome.com",
    "realtime.deyarhome.com",
    "staging.deyarhome.com",
]:
    try:
        infos = socket.getaddrinfo(host, None)
        ips = sorted({x[4][0] for x in infos})
        print(f"{host} -> {ips}")
    except Exception as e:
        print(f"{host} -> FAIL {e}")

ctx = ssl.create_default_context()
urls = [
    "https://deyarhome.com/",
    "https://www.deyarhome.com/",
    "https://api.deyarhome.com/api/v1/health",
    "https://api.deyarhome.com/api/v1/health/ready",
    "https://deyarhome.com/api/v1/health",
    "https://app.deyarhome.com/",
]
print("=== HTTP ===")
for u in urls:
    try:
        req = urllib.request.Request(u, headers={"User-Agent": "diyar-qa-validation"})
        with urllib.request.urlopen(req, timeout=15, context=ctx) as r:
            body = r.read(180)
            print(f"{u} -> {r.status} ct={r.headers.get('content-type')} server={r.headers.get('server')} body={body[:140]!r}")
    except Exception as e:
        print(f"{u} -> FAIL {type(e).__name__}: {e}")
