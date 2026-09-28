import socket
import ssl
import urllib.request

host = "195.200.14.40"
ports = [22, 80, 443, 8080, 8093, 8000, 3306, 6379, 8443, 8090, 8088, 8092, 5173, 3000]

print("=== TCP ===")
for p in ports:
    s = socket.socket()
    s.settimeout(3)
    try:
        s.connect((host, p))
        print(f"{p}\tOPEN")
    except Exception:
        print(f"{p}\tclosed")
    finally:
        s.close()

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

urls = [
    "http://195.200.14.40/",
    "http://195.200.14.40/api/v1/health",
    "https://195.200.14.40/",
    "https://195.200.14.40/api/v1/health",
    "http://195.200.14.40:8093/api/v1/health",
    "http://195.200.14.40:8080/api/v1/health",
    "https://195.200.14.40:8093/api/v1/health",
]

print("=== HTTP ===")
for u in urls:
    try:
        req = urllib.request.Request(u, method="GET", headers={"User-Agent": "diyar-qa"})
        opener_ctx = ctx if u.startswith("https") else None
        with urllib.request.urlopen(req, timeout=12, context=opener_ctx) as r:
            body = r.read(200)
            print(f"{u} -> {r.status} ct={r.headers.get('content-type')} body={body[:120]!r}")
    except Exception as e:
        print(f"{u} -> FAIL {type(e).__name__}: {e}")
