"""Refresh the prepared payload from reviewed local text; never writes remotely."""
from pathlib import Path
from collections import Counter
import datetime
import hashlib
import json
import re

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]
DOCS = ROOT / "registry_docs_v2"
MIRRORS = ROOT / "gitlab/aerosense-software/docs/aerosense/parts"
COLLECTION = "https://registry.igem.org/collections/40067138-a3dd-4e5b-b8a4-50b097ee0156"
PAT = re.compile(r'^={10,}\s*\nENTRY · Type: \*\*(?P<type>[^*]+)\*\*\s*\nTitle: (?P<title>[^\n]+)\nAffiliation: (?P<affiliation>[^\n]+)\n={10,}\s*\n', re.M)


def sha(value):
    return hashlib.sha256(value if isinstance(value, bytes) else value.encode("utf-8")).hexdigest()


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def parse(text):
    matches = list(PAT.finditer(text))
    entries = []
    for index, match in enumerate(matches):
        body = text[match.end():matches[index + 1].start() if index + 1 < len(matches) else len(text)]
        body = re.sub(r'<!-- (?:BEGIN|END) ODOR 2026-10-21 -->', '', body).strip()
        entries.append({**match.groupdict(), "body_markdown": body})
    return entries


now = datetime.datetime.now(datetime.timezone.utc).isoformat()
payload_path = OUT / "registry-documentation-payload.json"
payload = json.loads(payload_path.read_text("utf-8"))
prior_payload_sha = sha(payload_path.read_bytes())
readback_path = OUT / "registry-test2-live-readback-working.json"
readback = json.loads(readback_path.read_text("utf-8"))
live = {record["key"]: record for record in readback if isinstance(record.get("response", {}).get("data"), list)}
for record in live.values():
    for entry in record["response"]["data"]:
        entry["value_sha256"] = sha(entry["value"])

corrections = json.loads((OUT / "registry-test2-label-corrections.json").read_text("utf-8"))
for record in corrections["files"]:
    path = DOCS / record["file"]
    assert sha(path.read_bytes()) == record["after_sha256"]
    assert path.read_bytes() == (MIRRORS / path.name).read_bytes()
for path in DOCS.glob("*.md"):
    assert path.read_bytes() == (MIRRORS / path.name).read_bytes(), path.name

mapping = []
changed_payload_entries = []
for page in payload["pages"]:
    path = ROOT / page["source_path"]
    latest = parse(path.read_text("utf-8"))
    assert len(latest) == len(page["entries"])
    page["source_sha256"] = sha(path.read_bytes())
    snapshot = live.get(page["page_key"])
    remote = snapshot["response"]["data"] if snapshot else []
    for entry, source in zip(page["entries"], latest):
        assert entry["type"] == source["type"]
        original_sha = entry["body_sha256"]
        original_title = entry["title"]
        links = []
        prior_links = {item["target"]: item for item in entry.get("link_resolution", [])}
        body = source["body_markdown"]
        for match in re.finditer(r'(?P<image>!)?\[(?P<label>[^\]]*)\]\((?P<target>[^)]+)\)', body):
            target = match["target"]
            item = dict(prior_links.get(target, {}))
            item.update(target=target, image=bool(match["image"]), label=match["label"])
            if "://" in target:
                item["kind"] = "existing public URL"
            elif target.startswith("#"):
                item["kind"] = "in-page anchor"
            else:
                filename, _, anchor = target.partition("#")
                if filename == "00_COLLECTION.md":
                    item.update(kind="Registry collection link", publication_target=COLLECTION + ("#" + anchor if anchor else ""))
                elif filename.startswith("BBa_") and filename.endswith(".md"):
                    item.update(kind="Registry part link", publication_target="https://registry.igem.org/parts/" + filename.split("__")[0].lower().replace("_", "-") + ("#" + anchor if anchor else ""))
                else:
                    assert item.get("publication_target"), (entry["entry_key"], target)
            links.append(item)
        entry.update(source, source_body_sha256=sha(body), link_resolution=links)
        for item in links:
            if item.get("publication_target"):
                body = body.replace("](" + item["target"] + ")", "](" + item["publication_target"] + ")")
        assert all("://" in target or target.startswith("#") for target in re.findall(r'\]\(([^)]+)\)', body))
        assert "gitlab.igem.org/2026/nthu/-/" not in body
        entry.update(body_markdown=body, body_sha256=sha(body), section_headings=re.findall(r'^#{2,6}\s+(.+)$', body, re.M))
        if original_sha != entry["body_sha256"] or original_title != entry["title"]:
            changed_payload_entries.append(entry["entry_key"])
        same = [old for old in remote if old["type"].lower() == entry["type"].lower()]
        ordinal = entry["type_ordinal"]
        old = same[ordinal - 1] if ordinal <= len(same) else None
        action = "resolve_current_existing_entry_in_UI"
        if snapshot:
            action = "update_existing" if old else "check_current_absence_before_create"
        plan = {
            "entry_key": entry["entry_key"], "page_url": page["url"],
            "type": entry["type"], "type_ordinal": ordinal,
            "new_title": entry["title"], "new_body_sha256": entry["body_sha256"],
            "source_path": page["source_path"], "action": action,
            "remote_entry_id": old["uuid"] if old else None,
            "old_title": old["title"] if old else None,
            "old_body_sha256": old["value_sha256"] if old else None,
            "old_updated": old.get("updated") if old else None,
            "checked_at": snapshot["checked_at"] if snapshot else None,
            "mapping_basis": "Existing type ordinal and reviewed content scope; confirm the UUID in UI before any save" if snapshot else "Not freshly read in this audit; prior mappings are not proof of absence",
        }
        if old:
            plan["body_already_matches"] = old["value_sha256"] == entry["body_sha256"]
            plan["edit_url_pattern"] = page["url"] + "/documentation/" + old["uuid"] + "/modify"
            plan["edit_url_observed"] = old["uuid"] == "89c578d6-1dcf-4c19-be19-4cc2fc84c858"
        mapping.append(plan)
        if snapshot:
            entry["remote_entry_id"] = plan["remote_entry_id"]
            entry["live_matching"] = plan

payload["prepared_at_utc"] = now
payload["status"] = "ready-auth-Ijung prior snapshot; local Test 1/Test 2 labels corrected; 0 remote saves confirmed; verify current UI rights and exact IDs before saving"
payload["test2_label_audit"] = {
    "updated_at": now, "changed_payload_entries": changed_payload_entries,
    "fresh_public_pages": list(live), "remote_saves": 0,
    "prior_payload_sha256": prior_payload_sha,
}
write(payload_path, payload)
numerical = json.loads((OUT / "registry-test2-consistency-audit.json").read_text("utf-8"))
plan = {
    "checked_at": now,
    "scope": "Local assay-label corrections only. No numeric data, plot or remote Registry mutation.",
    "prepared_payload_sha256": sha(payload_path.read_bytes()),
    "counts": dict(Counter(item["action"] for item in mapping)),
    "fresh_public_pages": list(live),
    "not_freshly_read_pages": [p["page_key"] for p in payload["pages"] if p["page_key"] not in live],
    "confirmed_remote_saves": 0,
    "save_failure_cause": "Undetermined. Prior UI Save showed an Object error and public content remained old. No evidence establishes rate limiting or any specific validation error as the cause.",
    "supported_update_path": "Open each public page, use its existing Edit control, confirm UUID/type/content, replace the prepared title/body, and require a success signal plus fresh public readback. Create only after checking current absence; no blind retries or duplicate entries.",
    "source_mirror_changes": corrections["files"],
    "all_28_markdown_mirrors_exact": True,
    "numeric_checks": {k: numerical[k] for k in ["per_part_table_cells_checked", "collection_table_cells_checked", "independently_recomputed_S_wells", "independently_recomputed_N_entries", "numeric_mismatches", "vuaa1_rows"]},
    "mapping": mapping,
}
write(OUT / "registry-test2-update-plan.json", plan)
write(OUT / "registry-test2-public-readback.json", {
    "scope": "Four anonymous GET requests, three complete documentation lists. Full bodies preserved for exact original-entry matching; no credentials or write requests.",
    "requests": readback,
})
print(json.dumps({"changed_markdown_files": len(corrections["files"]), "changed_payload_entries": len(changed_payload_entries), "entry_count": len(mapping), "actions": plan["counts"], "payload_sha256": plan["prepared_payload_sha256"]}, indent=2))
