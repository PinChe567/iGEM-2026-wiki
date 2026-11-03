"""Check all prepared Registry documents after UI publication, using public GETs.

Never modifies Registry, Markdown, data, source, or the prepared payload.
"""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from concurrent.futures import ThreadPoolExecutor, as_completed
import argparse
import datetime
import hashlib
import json
import threading
import time

OUT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--preflight-only", action="store_true")
parser.add_argument("--resume", action="store_true", help="Reuse successful exact proofs for the unchanged payload")
parser.add_argument("--request-gap", type=float, default=2.0)
parser.add_argument("--workers", type=int, default=1)
args = parser.parse_args()
assert 1 <= args.workers <= 2 and args.request_gap >= 0.8
payload_path = OUT / "registry-upload-documentation-payload.json"
payload = json.loads(payload_path.read_text("utf-8"))
survey = json.loads((OUT / "registry-current-existing-entry-survey.json").read_text("utf-8"))
pages_by_key = {page["page_key"]: page for page in survey["pages"] if page["status"] == 200}
expected = [entry for page in payload["pages"] for entry in page["entries"]]
assert len(expected) == 76
assert len(payload["pages"]) == 26
assert len(pages_by_key) == 26
assert all(entry.get("registry_image_routing", {}).get("ready") for entry in expected), "Complete official image routing before final verification"
if args.preflight_only:
    print("Preflight passed:26known pages,76entries,image routing complete; no network request")
    raise SystemExit(0)

sha = lambda value: hashlib.sha256(value.encode("utf-8")).hexdigest()
lock = threading.Lock()
last_started = [0.0]
rate_limited = threading.Event()


def inspect(page):
    observed = pages_by_key[page["page_key"]]
    url = observed["url"]
    result = {"page_key": page["page_key"], "page_url": page["url"], "url": url, "entries": []}
    try:
        with lock:
            if rate_limited.is_set():
                raise RuntimeError("Stopped after429; no retry")
            time.sleep(max(0, args.request_gap - (time.monotonic() - last_started[0])))
            last_started[0] = time.monotonic()
        with urlopen(Request(url, headers={"User-Agent": "AeroSense-public-documentation-verification/1.0"}), timeout=30) as response:
            data = response.read()
            records = json.loads(data)["data"]
            result["status"] = response.status
        result.update(checked_at=datetime.datetime.now(datetime.timezone.utc).isoformat(), response_sha256=hashlib.sha256(data).hexdigest(), public_entry_count=len(records), public_entries=[{"uuid": record["uuid"], "type": record["type"], "title": record["title"], "value_sha256": sha(record["value"]), "updated": record.get("updated")} for record in records])
        matched_ids = set()
        for entry in page["entries"]:
            # Preserve known old IDs; a new record is located only by exact type/title.
            old_id = entry.get("remote_entry_id")
            candidates = [record for record in records if record["uuid"] == old_id] if old_id else [record for record in records if record["type"].lower() == entry["type"].lower() and record["title"] == entry["title"]]
            row = {"entry_key": entry["entry_key"], "expected_title": entry["title"], "expected_body_sha256": entry["body_sha256"], "existing_id_preserved": old_id, "candidate_count": len(candidates)}
            if len(candidates) == 1:
                record = candidates[0]
                matched_ids.add(record["uuid"])
                row.update(remote_entry_id=record["uuid"], type_matches=record["type"].lower() == entry["type"].lower(), title_matches=record["title"] == entry["title"], body_matches=record["value"] == entry["body_markdown"], actual_body_sha256=sha(record["value"]), updated=record.get("updated"), organisation_name=(record.get("organisation") or {}).get("name"))
                row["affiliation_matches"] = row["organisation_name"] == entry["affiliation"]
                row["pass"] = row["type_matches"] and row["title_matches"] and row["body_matches"] and row["affiliation_matches"]
                row["duplicate_title_count"] = sum(record2["type"].lower() == entry["type"].lower() and record2["title"] == entry["title"] for record2 in records)
                if row["duplicate_title_count"] != 1:
                    row["pass"] = False
            else:
                row["pass"] = False
            result["entries"].append(row)
        result["unmatched_public_entries"] = [{"uuid": record["uuid"], "type": record["type"], "title": record["title"]} for record in records if record["uuid"] not in matched_ids]
    except HTTPError as error:
        if error.code == 429:
            rate_limited.set()
        result.update(status="error", error=str(error), error_status=error.code, retry_after=error.headers.get("Retry-After"))
    except Exception as error:
        result.update(status="error", error=str(error))
    return result


receipt_path = OUT / "registry-final-publication-readback.json"
previous = json.loads(receipt_path.read_text("utf-8")) if args.resume and receipt_path.exists() else {}
if previous:
    assert previous["expected_payload_sha256"] == hashlib.sha256(payload_path.read_bytes()).hexdigest()
results = [page for page in previous.get("pages", []) if page["status"] == 200 and all(entry.get("pass", False) for entry in page["entries"])]
reused_count = len(results)
reused_keys = {page["page_key"] for page in results}
pending_pages = [page for page in payload["pages"] if page["page_key"] not in reused_keys]
with ThreadPoolExecutor(max_workers=args.workers) as pool:
    for future in as_completed([pool.submit(inspect, page) for page in pending_pages]):
        result = future.result()
        results.append(result)
        print(result["page_key"], result["status"], sum(entry.get("pass", False) for entry in result["entries"]), flush=True)
order = {page["page_key"]: index for index, page in enumerate(payload["pages"])}
results.sort(key=lambda result: order[result["page_key"]])
entries = [entry for page in results for entry in page["entries"]]
report = {
    "checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "expected_payload_sha256": hashlib.sha256(payload_path.read_bytes()).hexdigest(),
    "reused_successful_page_proofs": reused_count,
    "new_page_GETs_requested": len(pending_pages),
    "request_gap_seconds": args.request_gap,
    "concurrent_requests": args.workers,
    "previous_rate_limit_evidence": [{"page_key": page["page_key"], "error": page.get("error"), "retry_after": page.get("retry_after")} for page in previous.get("pages", []) if "429" in page.get("error", "")],
    "page_count": 26, "successful_page_GETs": sum(page["status"] == 200 for page in results),
    "expected_entries": 76, "exact_matching_entries": sum(entry.get("pass", False) for entry in entries),
    "all_76_exact": len(entries) == 76 and all(entry.get("pass", False) for entry in entries),
    "scope": "All expected types/titles/whole Markdown bodies/team affiliations, existing IDs retained, newly created entries uniquely matched by exact type/title. No edits or deletions.",
    "unexpected_entries": [entry for page in results for entry in page.get("unmatched_public_entries", [])],
    "pages": results,
}
receipt_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({key: value for key, value in report.items() if key != "pages"}, indent=2))
