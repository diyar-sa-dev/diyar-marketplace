import json
from pathlib import Path
from collections import defaultdict

d = Path(r"backend/storage/certification/kvm2-equivalent/phase1-2")
order = [
    "health", "vu5", "vu10", "vu25", "vu50",
    "rps25", "rps50", "rps75", "rps100",
    "search", "products", "detail",
    "rps125", "rps150", "rps200",
]
print("=== SUMMARIES ===")
windows = []
for name in order:
    p = d / f"summary-{name}.json"
    if not p.exists():
        print(name, "MISSING")
        continue
    s = json.loads(p.read_text(encoding="utf-8"))
    print(
        f"{s['profile']:10} wl={s.get('workload','?'):8} "
        f"rps={s['rps']:7.2f} req={str(s.get('requested_rps')):4} "
        f"p50={s['p50_ms']:8.1f} p95={s['p95_ms']:8.1f} p99={s['p99_ms']:8.1f} "
        f"search={s.get('search_p95_ms') or 0:8.1f} prod={s.get('products_p95_ms') or 0:8.1f} "
        f"det={s.get('detail_p95_ms') or 0:8.1f} err={s['error_rate']} "
        f"429={s['http_429']} 5xx={s['http_5xx']} vu={s['vus_max']} ts={s['timestamp_utc']}"
    )
    windows.append((name, s["timestamp_utc"]))

jsonl = d / "sampler-campaign.jsonl"
if not jsonl.exists():
    print("NO sampler-campaign.jsonl")
    raise SystemExit(0)

rows = []
for line in jsonl.read_text(encoding="utf-8-sig").splitlines():
    line = line.strip()
    if not line:
        continue
    rows.append(json.loads(line.lstrip("\ufeff")))
print(f"\n=== SAMPLER ROWS {len(rows)} ===")

def cpu_pct(val):
    if not val:
        return 0.0
    return float(str(val).replace("%", "").strip() or 0)

def mem_mib(val):
    # "207.6MiB / 1.5GiB"
    if not val:
        return 0.0
    left = str(val).split("/")[0].strip()
    n = float(left.replace("MiB", "").replace("GiB", "").strip())
    if "GiB" in left:
        n *= 1024
    return n

# Peak per container across whole file
peaks = defaultdict(lambda: {"cpu": 0.0, "mem": 0.0})
max_thr_run = 0
max_thr_conn = 0
max_redis_ops = 0
max_ngx_active = 0
for r in rows:
    for c in r.get("docker") or []:
        name = (c.get("name") or "").replace("diyar-kvm2-test-", "")
        peaks[name]["cpu"] = max(peaks[name]["cpu"], cpu_pct(c.get("cpu")))
        peaks[name]["mem"] = max(peaks[name]["mem"], mem_mib(c.get("mem")))
    my = r.get("mysql") or {}
    try:
        max_thr_run = max(max_thr_run, int(my.get("threads_running") or 0))
        max_thr_conn = max(max_thr_conn, int(my.get("threads_connected") or 0))
    except Exception:
        pass
    rd = r.get("redis") or {}
    try:
        max_redis_ops = max(max_redis_ops, int(rd.get("instantaneous_ops_per_sec") or 0))
    except Exception:
        pass
    ngx = r.get("nginx_status") or ""
    m = None
    if "Active connections:" in ngx:
        try:
            max_ngx_active = max(max_ngx_active, int(ngx.split("Active connections:")[1].split()[0]))
        except Exception:
            pass

print("PEAK CPU% / RSS MiB (during-load sampler):")
for name, v in sorted(peaks.items()):
    print(f"  {name:22} cpu_peak={v['cpu']:7.2f}%  rss_peak={v['mem']:8.1f} MiB")
print(f"mysql threads_running peak={max_thr_run} threads_connected peak={max_thr_conn}")
print(f"redis ops/s peak={max_redis_ops}")
print(f"nginx active connections peak={max_ngx_active}")

# Slice around each summary timestamp +/- 90s
from datetime import datetime, timezone, timedelta

def parse_ts(ts):
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))

print("\n=== SAMPLER NEAR EACH PROFILE END (±100s) ===")
for name, ts in windows:
    t = parse_ts(ts)
    lo, hi = t - timedelta(seconds=100), t + timedelta(seconds=10)
    slice_rows = [r for r in rows if lo <= parse_ts(r["ts"]) <= hi]
    if not slice_rows:
        print(f"{name:10} no sampler rows")
        continue
    pc = defaultdict(float)
    pm = defaultdict(float)
    tr = 0
    tc = 0
    ops = 0
    for r in slice_rows:
        for c in r.get("docker") or []:
            n = (c.get("name") or "").replace("diyar-kvm2-test-", "")
            pc[n] = max(pc[n], cpu_pct(c.get("cpu")))
            pm[n] = max(pm[n], mem_mib(c.get("mem")))
        my = r.get("mysql") or {}
        tr = max(tr, int(my.get("threads_running") or 0))
        tc = max(tc, int(my.get("threads_connected") or 0))
        rd = r.get("redis") or {}
        ops = max(ops, int(rd.get("instantaneous_ops_per_sec") or 0))
    print(
        f"{name:10} n={len(slice_rows):3} appCPU={pc.get('app-1',0):6.1f}% mysqlCPU={pc.get('mysql-1',0):6.1f}% "
        f"redisCPU={pc.get('redis-1',0):5.1f}% ngxCPU={pc.get('nginx-1',0):5.1f}% "
        f"appRSS={pm.get('app-1',0):6.0f} mysqlRSS={pm.get('mysql-1',0):6.0f} redisRSS={pm.get('redis-1',0):6.0f} "
        f"thr_run={tr} thr_conn={tc} redis_ops={ops}"
    )
