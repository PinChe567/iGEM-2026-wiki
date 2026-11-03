"""Make a separate UI payload using only observed Registry-upload image URLs.

The original documentary, source payload, scientific values and non-image links
are not modified. Re-run as the official UI upload mapping grows.
"""
from pathlib import Path
from urllib.parse import urlsplit
import copy
import datetime
import hashlib
import json
import re

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]
SOURCE = OUT / "registry-documentation-payload.json"
MAP = OUT / "registry-image-upload-map.json"
TARGET = OUT / "registry-upload-documentation-payload.json"
PAT = re.compile(r'(!\[[^\]]*\]\()([^)]+)(\))')
sha = lambda data: hashlib.sha256(data).hexdigest()
source = json.loads(SOURCE.read_text("utf-8"))
payload = copy.deepcopy(source)
uploads = json.loads(MAP.read_text("utf-8"))
preservation_path = OUT / "registry-historical-gel-preservation.json"
preserved = {row["sha256"]: row["canonical_path"] for row in json.loads(preservation_path.read_text("utf-8"))["files"]} if preservation_path.exists() else {}
by_url = {}
for item in uploads:
    assert urlsplit(item["registry_url"]).hostname == "registry.igem.wiki"
    assert urlsplit(item["registry_url"]).path.startswith("/documentation/")
    path = ROOT / item["canonical"]
    if not path.exists() and item["source_sha256"] in preserved:
        path = ROOT / preserved[item["source_sha256"]]
    assert path.is_file() and sha(path.read_bytes()) == item["source_sha256"]
    assert item["source_url"] not in by_url or by_url[item["source_url"]] == item["registry_url"]
    by_url[item["source_url"]] = item["registry_url"]

report = []
survey_path = OUT / "registry-current-existing-entry-survey.json"
survey = json.loads(survey_path.read_text("utf-8")) if survey_path.exists() else {}
live_pages = {page["page_key"]: page for page in survey.get("pages", []) if page.get("status") == 200}
live_entries = {entry["entry_key"]: entry for entry in survey.get("mapping", [])}
confirmed_path = OUT / "registry-final-publication-readback.json"
confirmed = json.loads(confirmed_path.read_text("utf-8")) if confirmed_path.exists() else {}
confirmed_entries = {entry["entry_key"]: entry for page in confirmed.get("pages", []) for entry in page.get("entries", []) if entry.get("pass")}
for page, original_page in zip(payload["pages"], source["pages"]):
    if page["page_key"] in live_pages:
        current = live_pages[page["page_key"]]
        if current.get("part_uuid"):
            page["part_uuid"] = current["part_uuid"]
    for entry, original in zip(page["entries"], original_page["entries"]):
        before = original["body_markdown"]
        after = PAT.sub(lambda match: match[1] + by_url.get(match[2], match[2]) + match[3], before)
        assert PAT.sub(lambda match: match[1] + "IMAGE-URL" + match[3], before) == PAT.sub(lambda match: match[1] + "IMAGE-URL" + match[3], after)
        missing = sorted({match[2] for match in PAT.finditer(after) if urlsplit(match[2]).hostname != "registry.igem.wiki"})
        replacements = sum(match[2] in by_url for match in PAT.finditer(before))
        entry["body_markdown"] = after
        entry["body_sha256"] = sha(after.encode("utf-8"))
        entry["registry_image_routing"] = {"ready": not missing, "replacements": replacements, "unuploaded_image_urls": missing, "source_body_sha256": original["body_sha256"]}
        if entry["entry_key"] in live_entries:
            live = live_entries[entry["entry_key"]]
            entry["remote_entry_id"] = live["remote_entry_id"]
            entry["live_matching"] = live
        if entry["entry_key"] in confirmed_entries:
            proof = confirmed_entries[entry["entry_key"]]
            remote_id = proof["remote_entry_id"]
            entry["remote_entry_id"] = remote_id
            entry["live_matching"] = {**entry.get("live_matching", {}), "remote_entry_id": remote_id, "old_body_sha256": proof["actual_body_sha256"], "new_body_sha256": entry["body_sha256"], "new_title": entry["title"], "action": "already_matches" if proof["actual_body_sha256"] == entry["body_sha256"] else "update_existing", "edit_url_pattern": page["url"] + "/documentation/" + remote_id + "/modify", "matching_basis": "Exact public readback confirmed this existing UUID; do not create a duplicate"}
        for link in entry.get("link_resolution", []):
            if link.get("image") and link.get("target") in by_url:
                link.update(registry_uploaded_url=by_url[link["target"]], kind="observed official Registry image upload")
        report.append({"entry_key": entry["entry_key"], "ready": not missing, "replacements": replacements, "unuploaded_image_count": len(missing), "body_sha256": entry["body_sha256"]})

payload["registry_upload_routing"] = {
    "prepared_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "source_payload_sha256": sha(SOURCE.read_bytes()), "upload_mapping_sha256": sha(MAP.read_bytes()),
    "observed_image_mappings": len(by_url), "ready_entries": sum(x["ready"] for x in report),
    "total_entries": len(report), "scientific_text_tables_unchanged": True,
    "policy": "Only image destinations change. An image-ready entry still requires correct current remote-ID matching, an actual UI save and successful public readback.",
}
TARGET.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(OUT / "registry-upload-routing-status.json").write_text(json.dumps({**payload["registry_upload_routing"], "payload_sha256": sha(TARGET.read_bytes()), "entries": report}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(payload["registry_upload_routing"], indent=2))
