"""Bounded anonymous Registry read-only survey; no writes or credentials."""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import Counter
import datetime
import hashlib
import json
import threading
import time

OUT = Path(__file__).resolve().parent
payload = json.loads((OUT / "registry-upload-documentation-payload.json").read_text("utf-8"))
API = "https://api.registry.igem.org/v1/"
sha = lambda text: hashlib.sha256(text.encode("utf-8")).hexdigest()
lock = threading.Lock()
last_start = [0.0]
rate_limited = threading.Event()
known = {"BBa_26LLF3LM": "7e651f43-bfcd-4749-afdd-50e6136e51da"}


def get(url):
    with lock:
        if rate_limited.is_set():
            raise RuntimeError("Survey stopped after HTTP429; no retry")
        delay = max(0, 0.8 - (time.monotonic() - last_start[0]))
        time.sleep(delay)
        last_start[0] = time.monotonic()
    try:
        with urlopen(Request(url, headers={"User-Agent": "AeroSense-public-documentation-verification/1.0"}), timeout=30) as response:
            data = response.read()
            return json.loads(data), hashlib.sha256(data).hexdigest(), response.status
    except HTTPError as error:
        if error.code == 429:
            rate_limited.set()
        raise


def inspect(page):
    result = {"page_key": page["page_key"], "page_url": page["url"], "read_only": True}
    try:
        if page["kind"] == "collection":
            url = API + "collections/" + page["collection_uuid"] + "/documentation"
            result["collection_uuid"] = page["collection_uuid"]
        else:
            uuid = page.get("part_uuid") or known.get(page["page_key"])
            if not uuid:
                metadata, metadata_hash, _ = get(API + "parts/slugs/" + page["slug"])
                uuid = metadata["uuid"]
                result["metadata_response_sha256"] = metadata_hash
            result["part_uuid"] = uuid
            url = API + "parts/" + uuid + "/documentation"
        response, response_hash, status = get(url)
        entries = response["data"]
        result.update(url=url, status=status, checked_at=datetime.datetime.now(datetime.timezone.utc).isoformat(), response_sha256=response_hash, existing_count=len(entries), existing_entries=entries, mapping=[])
        for old in entries:
            old["value_sha256"] = sha(old["value"])
        for entry in page["entries"]:
            same_type = [old for old in entries if old["type"].lower() == entry["type"].lower()]
            ordinal = entry["type_ordinal"]
            old = same_type[ordinal - 1] if ordinal <= len(same_type) else None
            action = "check_current_absence_before_create"
            if old:
                action = "already_matches" if old["value_sha256"] == entry["body_sha256"] and old["title"] == entry["title"] else "update_existing"
            result["mapping"].append({
                "entry_key": entry["entry_key"], "page_url": page["url"], "type": entry["type"], "type_ordinal": ordinal,
                "new_title": entry["title"], "new_body_sha256": entry["body_sha256"],
                "remote_entry_id": old["uuid"] if old else None, "old_title": old["title"] if old else None,
                "old_body_sha256": old["value_sha256"] if old else None, "old_updated": old.get("updated") if old else None,
                "action": action, "edit_url_pattern": page["url"] + "/documentation/" + old["uuid"] + "/modify" if old else None,
                "matching_basis": "Current public type/order and content; confirm the actual UUID in the official UI. Preserve unrelated user/contributor entries.",
            })
    except Exception as error:
        result.update(status="error", error=str(error))
    return result


rows = []
with ThreadPoolExecutor(max_workers=2) as pool:
    futures = [pool.submit(inspect, page) for page in payload["pages"]]
    for future in as_completed(futures):
        result = future.result()
        rows.append(result)
        print(result["page_key"], result["status"], result.get("existing_count", ""), flush=True)

order = {page["page_key"]: index for index, page in enumerate(payload["pages"])}
rows.sort(key=lambda item: order[item["page_key"]])
mapping = [item for row in rows for item in row.get("mapping", [])]
survey = {
    "checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat(), "scope": "Anonymous read-only GET, max two concurrent requests and at least0.8seconds between starts; no retries after429",
    "page_count": len(rows), "successful_pages": sum(row["status"] == 200 for row in rows),
    "existing_entry_count": sum(row.get("existing_count", 0) for row in rows),
    "action_counts": dict(Counter(item["action"] for item in mapping)), "pages": rows, "mapping": mapping,
}
(OUT / "registry-current-existing-entry-survey.json").write_text(json.dumps(survey, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({key: survey[key] for key in ["page_count", "successful_pages", "existing_entry_count", "action_counts"]}, indent=2))
