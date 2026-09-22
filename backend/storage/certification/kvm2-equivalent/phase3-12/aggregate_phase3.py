import json
from collections import defaultdict
from pathlib import Path

term = Path(
    r"C:\Users\APL TECH\.cursor\projects\c-Users-APL-TECH-OneDrive-Documents-Web-Work-Hamid-project-diyar-marketplace\terminals\839737.txt"
)
out = Path(__file__).resolve().parent
summaries = []
for line in term.read_text(encoding="utf-8", errors="replace").splitlines():
    line = line.strip()
    if line.startswith('{"profile":'):
        s = json.loads(line)
        summaries.append(s)
        (out / f"summary-{s['profile']}.json").write_text(
            json.dumps(s, indent=2), encoding="utf-8"
        )

(out / "campaign.json").write_text(
    json.dumps({"profiles": summaries, "source": "k6-stdout"}, indent=2),
    encoding="utf-8",
)


def cpu_pct(val):
    return float(str(val or "0").replace("%", "").strip() or 0)


print("=== SUMMARIES ===")
for s in summaries:
    print(
        f"{s['profile']:10} rps={s['rps']:7.2f} p50={s['p50_ms']:8.1f} "
        f"p95={s['p95_ms']:8.1f} p99={s['p99_ms']:8.1f} "
        f"search={s.get('search_p95_ms') or 0:8.1f} "
        f"prod={s.get('products_p95_ms') or 0:8.1f} "
        f"det={s.get('detail_p95_ms') or 0:8.1f} "
        f"err={s['error_rate']} 429={s['http_429']} 5xx={s['http_5xx']}"
    )

print("\n=== SAMPLER PEAKS PER PROFILE ===")
peaks_out = []
for s in summaries:
    p = out / f"sampler-{s['profile']}.jsonl"
    row = {"profile": s["profile"]}
    if not p.exists():
        print(s["profile"], "no sampler")
        peaks_out.append(row)
        continue
    pc = defaultdict(float)
    tr = tc = ops = ev = slow = 0
    n = 0
    for line in p.read_text(encoding="utf-8-sig").splitlines():
        if not line.strip():
            continue
        r = json.loads(line.lstrip("\ufeff"))
        n += 1
        for c in r.get("docker") or []:
            name = (c.get("name") or "").replace("diyar-kvm2-test-", "")
            if name.startswith("k6-run-"):
                name = "k6"
            pc[name] = max(pc[name], cpu_pct(c.get("cpu")))
        my = r.get("mysql") or {}
        tr = max(tr, int(my.get("threads_running") or 0))
        tc = max(tc, int(my.get("threads_connected") or 0))
        slow = max(slow, int(my.get("slow_queries") or 0))
        rd = r.get("redis") or {}
        ops = max(ops, int(rd.get("instantaneous_ops_per_sec") or 0))
        ev = max(ev, int(rd.get("evicted_keys") or 0))
    row.update(
        {
            "n": n,
            "app_cpu": pc.get("app-1", 0),
            "mysql_cpu": pc.get("mysql-1", 0),
            "redis_cpu": pc.get("redis-1", 0),
            "queue_critical_cpu": pc.get("queue-critical-1", 0),
            "nginx_cpu": pc.get("nginx-1", 0),
            "k6_cpu": pc.get("k6", 0),
            "thr_run": tr,
            "thr_conn": tc,
            "redis_ops": ops,
            "evicted": ev,
            "slow_queries": slow,
        }
    )
    peaks_out.append(row)
    print(
        f"{s['profile']:10} n={n:2} app={row['app_cpu']:6.1f} mysql={row['mysql_cpu']:6.1f} "
        f"redis={row['redis_cpu']:6.1f} qcrit={row['queue_critical_cpu']:6.1f} "
        f"ngx={row['nginx_cpu']:5.1f} k6={row['k6_cpu']:5.1f} "
        f"thr_run={tr} thr_conn={tc} redis_ops={ops} evict={ev} slow={slow}"
    )

(out / "sampler-peaks.json").write_text(json.dumps(peaks_out, indent=2), encoding="utf-8")
