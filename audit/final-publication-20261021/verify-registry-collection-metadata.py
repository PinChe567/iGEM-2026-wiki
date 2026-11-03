"""One anonymous GET to verify the saved collection title/description."""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import datetime
import hashlib
import json

OUT = Path(__file__).resolve().parent
payload = json.loads((OUT / "registry-upload-documentation-payload.json").read_text("utf-8"))
expected = payload["collection_form"]
url = "https://api.registry.igem.org/v1/parts/collections/" + expected["existing_collection_uuid"]
report = {"checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat(), "url": url, "expected_title": expected["title"], "expected_description_sha256": hashlib.sha256(expected["description"].encode()).hexdigest(), "expected_description_characters": len(expected["description"])}
report["route_evidence"] = {"source_url": "https://registry.igem.org/assets/part-collection.slice-gWYfGi4M.js", "source_sha256": "7ac0be8b07cbeff00900359dfca5e21a7c0572bf04ef25d1999d8fd69e3f00a7", "observed_fetch_route": "parts/collections/${e}", "method": "Read the official public JavaScript as text; no execution or authentication"}
previous_path = OUT / "registry-collection-metadata-readback.json"
if previous_path.exists():
    previous = json.loads(previous_path.read_text("utf-8"))
    if previous.get("status") == 404:
        report["prior_wrong_route"] = {key: previous.get(key) for key in ["url", "status", "error", "checked_at"]}
try:
    with urlopen(Request(url, headers={"User-Agent": "AeroSense-public-documentation-verification/1.0"}), timeout=30) as response:
        raw = response.read()
        report["status"] = response.status
    parsed = json.loads(raw)
    data = parsed.get("data", parsed)
    if not isinstance(data, dict):
        raise ValueError("Unexpected metadata response structure")
    report.update(response_sha256=hashlib.sha256(raw).hexdigest(), response_keys=list(data), actual_title=data.get("title"), actual_description=data.get("description"), actual_uuid=data.get("uuid"))
    report["uuid_matches"] = data.get("uuid") == expected["existing_collection_uuid"]
    report["title_matches"] = data.get("title") == expected["title"]
    report["description_matches"] = data.get("description") == expected["description"]
    report["all_exact"] = report["uuid_matches"] and report["title_matches"] and report["description_matches"]
except HTTPError as error:
    report.update(status=error.code, error=str(error), retry_after=error.headers.get("Retry-After"), all_exact=False)
except Exception as error:
    report.update(error=str(error), all_exact=False)
(OUT / "registry-collection-metadata-readback.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({key: value for key, value in report.items() if key not in ["actual_description", "response_keys"]}, indent=2))
