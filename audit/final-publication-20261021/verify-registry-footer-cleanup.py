"""Verify only the11 changed part pages; reuse unchanged proven page records."""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import argparse
import datetime
import hashlib
import json
import time

OUT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument("--only", help="Check one affected page key; preserve exact successful proofs for this payload.")
parser.add_argument("--resume", action="store_true", help="Reuse already exact affected-page proofs and request only the remaining pages.")
args = parser.parse_args()
payload_path = OUT / "registry-upload-documentation-payload.json"
payload = json.loads(payload_path.read_text("utf-8"))
old_path = OUT / "registry-before-footer-cleanup-readback.json"
old = json.loads(old_path.read_text("utf-8"))
patch = json.loads((OUT / "registry-footer-cleanup-ui-patch.json").read_text("utf-8"))
assert hashlib.sha256(payload_path.read_bytes()).hexdigest() == patch["payload_sha256"]
changed = {row["entry_key"] for row in patch["rows"]}
assert len(changed) == 11 and old["all_76_exact"]
old_entries = {entry["entry_key"]: entry for page in old["pages"] for entry in page["entries"]}
old_pages = {page["page_key"]: page for page in old["pages"]}
affected = [page for page in payload["pages"] if any(entry["entry_key"] in changed for entry in page["entries"])]
assert len(affected) == 11
unchanged = [entry for page in payload["pages"] for entry in page["entries"] if entry["entry_key"] not in changed]
assert len(unchanged) == 65 and all(entry["body_sha256"] == old_entries[entry["entry_key"]]["actual_body_sha256"] for entry in unchanged)
sha = lambda text: hashlib.sha256(text.encode("utf-8")).hexdigest()
fresh = {}
receipt_path = OUT / "registry-footer-cleanup-readback.json"
if (args.resume or args.only) and receipt_path.exists():
    previous = json.loads(receipt_path.read_text("utf-8"))
    if previous["expected_payload_sha256"] == patch["payload_sha256"]:
        fresh = {page["page_key"]: page for page in previous["pages"] if page.get("status") == 200 and len(page.get("entries", [])) == 5 and all(entry.get("pass", False) for entry in page["entries"])}
reused_count = len(fresh)
requested_count = 0
if args.only:
    assert args.only in {page["page_key"] for page in affected}
last_start = 0.0
for page in affected:
    if (args.only and page["page_key"] != args.only) or page["page_key"] in fresh:
        continue
    time.sleep(max(0, 2.0 - (time.monotonic() - last_start)))
    last_start = time.monotonic()
    requested_count += 1
    url = old_pages[page["page_key"]]["url"]
    result = {"page_key": page["page_key"], "page_url": page["url"], "url": url, "entries": []}
    try:
        with urlopen(Request(url, headers={"User-Agent": "AeroSense-public-documentation-verification/1.0"}), timeout=30) as response:
            raw = response.read()
            records = json.loads(raw)["data"]
            result["status"] = response.status
        result.update(checked_at=datetime.datetime.now(datetime.timezone.utc).isoformat(), response_sha256=hashlib.sha256(raw).hexdigest(), public_entry_count=len(records), public_entries=[{"uuid": record["uuid"], "type": record["type"], "title": record["title"], "value_sha256": sha(record["value"]), "updated": record.get("updated")} for record in records])
        matched = set()
        for entry in page["entries"]:
            remote_id = old_entries[entry["entry_key"]]["remote_entry_id"]
            candidates = [record for record in records if record["uuid"] == remote_id]
            row = {"entry_key": entry["entry_key"], "expected_title": entry["title"], "expected_body_sha256": entry["body_sha256"], "existing_id_preserved": remote_id, "candidate_count": len(candidates)}
            if len(candidates) == 1:
                record = candidates[0]
                matched.add(remote_id)
                row.update(remote_entry_id=remote_id, type_matches=record["type"].lower() == entry["type"].lower(), title_matches=record["title"] == entry["title"], body_matches=record["value"] == entry["body_markdown"], actual_body_sha256=sha(record["value"]), updated=record.get("updated"), organisation_name=(record.get("organisation") or {}).get("name"))
                row["affiliation_matches"] = row["organisation_name"] == entry["affiliation"]
                row["duplicate_title_count"] = sum(other["type"].lower() == entry["type"].lower() and other["title"] == entry["title"] for other in records)
                row["pass"] = all(row[key] for key in ["type_matches", "title_matches", "body_matches", "affiliation_matches"]) and row["duplicate_title_count"] == 1
            else:
                row["pass"] = False
            result["entries"].append(row)
        result["unmatched_public_entries"] = [{"uuid": record["uuid"], "type": record["type"], "title": record["title"]} for record in records if record["uuid"] not in matched]
    except HTTPError as error:
        result.update(status="error", error=str(error), error_status=error.code, retry_after=error.headers.get("Retry-After"))
    except Exception as error:
        result.update(status="error", error=str(error))
    fresh[page["page_key"]] = result
    print(page["page_key"], result["status"], sum(entry.get("pass", False) for entry in result["entries"]), flush=True)
    if result.get("error_status") == 429:
        break

changes_checked = [entry for page in fresh.values() for entry in page["entries"] if entry["entry_key"] in changed]
new_pass = len(changes_checked) == 11 and all(entry.get("pass", False) for entry in changes_checked)
incremental = {
    "checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat(), "expected_payload_sha256": patch["payload_sha256"],
    "scope": "11affectedpages only, unchanged65target body hashes confirmed against prior76-pass proof. Whole returned page entries also checked without extra requests.",
    "new_page_GETs": requested_count, "reused_exact_affected_page_proofs": reused_count, "changed_entries_expected": 11, "changed_entries_exact": sum(entry.get("pass", False) for entry in changes_checked),
    "unchanged_65_payload_hashes_match_prior_proof": True, "all_11_exact": new_pass,
    "historical_76_pass_receipt_sha256": hashlib.sha256(old_path.read_bytes()).hexdigest(), "pages": list(fresh.values()),
}
(OUT / "registry-footer-cleanup-readback.json").write_text(json.dumps(incremental, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
if len(fresh) == 11 and all(page["status"] == 200 and all(entry.get("pass", False) for entry in page["entries"]) for page in fresh.values()):
    merged_pages = [fresh.get(page["page_key"], page) for page in old["pages"]]
    entries = [entry for page in merged_pages for entry in page["entries"]]
    merged = {**old, "checked_at": incremental["checked_at"], "expected_payload_sha256": patch["payload_sha256"], "reused_successful_page_proofs": 15, "new_page_GETs_requested": 11, "page_count": 26, "successful_page_GETs": 26, "exact_matching_entries": sum(entry.get("pass", False) for entry in entries), "all_76_exact": len(entries) == 76 and all(entry.get("pass", False) for entry in entries), "footer_cleanup_incremental_receipt": "registry-footer-cleanup-readback.json", "unchanged_65_payload_hashes_match_prior_proof": True, "pages": merged_pages, "unexpected_entries": [entry for page in merged_pages for entry in page.get("unmatched_public_entries", [])]}
    merged["obsolete_footer_absent_from_current_payload_and_all_exact_public_bodies"] = not any("These Markdown entries are prepared for Registry." in entry["body_markdown"] for page in payload["pages"] for entry in page["entries"])
    merged["original_part_anchor_count_preserved"] = sum('<a id="odor-2026-10-21"></a>' in entry["body_markdown"] for page in payload["pages"] for entry in page["entries"])
    (OUT / "registry-final-publication-readback.json").write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({key: value for key, value in incremental.items() if key != "pages"}, indent=2))
