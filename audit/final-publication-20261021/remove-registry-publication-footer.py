"""Approved two-sentence administrative footer removal; no scientific edits."""
from pathlib import Path
import datetime
import hashlib
import json
import re

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]
DOCS = ROOT / "registry_docs_v2"
SOFTWARE = ROOT / "gitlab/aerosense-software"
NEEDLE = " These Markdown entries are prepared for Registry. A public attachment URL does not establish that the corresponding Registry documentation has been saved."
PAT = re.compile(r'^={10,}\s*\nENTRY · Type: \*\*(?P<type>[^*]+)\*\*\s*\nTitle: (?P<title>[^\n]+)\nAffiliation: (?P<affiliation>[^\n]+)\n={10,}\s*\n', re.M)
sha = lambda data: hashlib.sha256(data if isinstance(data, bytes) else data.encode("utf-8")).hexdigest()


def parse(text):
    matches = list(PAT.finditer(text))
    rows = []
    for index, match in enumerate(matches):
        body = text[match.end():matches[index + 1].start() if index + 1 < len(matches) else len(text)]
        body = re.sub(r'<!-- (?:BEGIN|END) ODOR 2026-10-21 -->', '', body).strip()
        rows.append({**match.groupdict(), "body_markdown": body})
    return rows


plan = json.loads((OUT / "registry-public-prose-cleanup-plan.json").read_text("utf-8"))
proof_path = OUT / "registry-final-publication-readback.json"
proof_bytes = proof_path.read_bytes()
proof = json.loads(proof_bytes)
assert proof["all_76_exact"]
historical = OUT / "registry-before-footer-cleanup-readback.json"
if historical.exists():
    assert historical.read_bytes() == proof_bytes
else:
    historical.write_bytes(proof_bytes)
source_paths = sorted({ROOT / row["source_path"] for row in plan["public_entries"]})
assert len(source_paths) == 11
paths = source_paths + [SOFTWARE / "docs/aerosense/parts" / path.name for path in source_paths]
paths += [DOCS / "integrate_disturbance_characterisation.py", SOFTWARE / "code/aerosense/parts-analysis/integrate_disturbance_characterisation.py"]
changes = []
for path in paths:
    before = path.read_bytes()
    assert before.count(NEEDLE.encode()) == 1, path
    after = before.replace(NEEDLE.encode(), b"")
    table_lines = lambda data: [line.strip() for line in data.decode("utf-8").splitlines() if line.strip().startswith("|")]
    assert table_lines(before) == table_lines(after)
    assert re.findall(rb'\]\([^)]+\)', before) == re.findall(rb'\]\([^)]+\)', after)
    changes.append({"path": path.relative_to(ROOT).as_posix(), "before_sha256": sha(before), "after_sha256": sha(after), "removed_bytes": len(before) - len(after), "tables_unchanged": True, "link_targets_unchanged": True})
    path.write_bytes(after)
for path in source_paths:
    assert path.read_bytes() == (SOFTWARE / "docs/aerosense/parts" / path.name).read_bytes()

payload_path = OUT / "registry-documentation-payload.json"
payload = json.loads(payload_path.read_text("utf-8"))
prior_payload_sha = sha(payload_path.read_bytes())
changed_entries = []
for page in payload["pages"]:
    path = ROOT / page["source_path"]
    source_entries = parse(path.read_text("utf-8"))
    assert len(source_entries) == len(page["entries"])
    page["source_sha256"] = sha(path.read_bytes())
    for entry, local in zip(page["entries"], source_entries):
        assert entry["title"] == local["title"] and entry["type"] == local["type"]
        if NEEDLE in entry["body_markdown"]:
            assert entry["body_markdown"].count(NEEDLE) == 1
            entry["body_markdown"] = entry["body_markdown"].replace(NEEDLE, "")
            entry["body_sha256"] = sha(entry["body_markdown"])
            entry["source_body_sha256"] = sha(local["body_markdown"])
            changed_entries.append(entry["entry_key"])
assert len(changed_entries) == 11
payload["status"] = "76 entries previously confirmed publicly;11 existing Test2 entries now prepared for removal of obsolete publication-status sentences"
payload["publication_footer_cleanup"] = {"prepared_at": datetime.datetime.now(datetime.timezone.utc).isoformat(), "prior_payload_sha256": prior_payload_sha, "historical_76_pass_receipt_sha256": sha(proof_bytes), "changed_entries": changed_entries, "scientific_values_images_titles_links_unchanged": True}
payload_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
receipt = {"applied_at": datetime.datetime.now(datetime.timezone.utc).isoformat(), "exact_removed_text": NEEDLE, "replacement": "", "changed_public_entry_keys": changed_entries, "changes": changes, "software_changes": [row for row in changes if row["path"].startswith("gitlab/aerosense-software/")], "base_payload_sha256": sha(payload_path.read_bytes()), "historical_readback": historical.relative_to(ROOT).as_posix(), "no_remote_writes": True, "no_source_manifest_index_commit_or_push": True}
(OUT / "registry-footer-cleanup-source-receipt.json").write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"local_markdown": 11, "software_markdown": 11, "generator_templates": 2, "software_changed_files": len(receipt["software_changes"]), "changed_public_entries": 11, "base_payload_sha256": receipt["base_payload_sha256"]}, indent=2))
