import json
import glob
import os

root = os.path.dirname(os.path.abspath(__file__))
rows = []
for path in sorted(glob.glob(os.path.join(root, "summary-*.json"))):
    with open(path, encoding="utf-8") as f:
        d = json.load(f)
    p = d.get("profile", os.path.basename(path))
    err = float(d.get("error_rate") or 0)
    p95 = float(d.get("p95_ms") or 0)
    if err > 0.01 or p95 > 2000:
        result = "FAILED"
    elif p95 > 1000:
        result = "DEGRADED"
    elif p95 > 500:
        result = "ACCEPTABLE"
    else:
        result = "VERIFIED"
    rows.append(
        {
            "profile": p,
            "vus_max": d.get("vus_max"),
            "rps": round(float(d.get("rps") or 0), 2),
            "p50_ms": round(float(d.get("p50_ms") or 0), 1),
            "p95_ms": round(p95, 1),
            "p99_ms": round(float(d.get("p99_ms") or 0), 1),
            "error_rate": round(err, 4),
            "http_429": d.get("http_429", 0),
            "http_5xx": d.get("http_5xx", 0),
            "search_p95_ms": round(float(d.get("search_p95_ms") or 0), 1),
            "result": result,
        }
    )

out = {"profiles": rows, "count": len(rows)}
with open(os.path.join(root, "aggregated-metrics.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=2)
print(json.dumps(out, indent=2))
