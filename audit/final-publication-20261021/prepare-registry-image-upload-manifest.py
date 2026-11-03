"""Resolve existing prepared images to preserved upload originals; no downloads."""
from pathlib import Path
from collections import defaultdict, Counter
import csv
import datetime
import hashlib
import json
import re
import urllib.parse

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]
payload = json.loads((OUT / "registry-documentation-payload.json").read_text("utf-8"))
ledger = json.loads((ROOT / "aerosense-wiki/igem-upload/verified-official-urls.json").read_text("utf-8"))
public_links = json.loads((ROOT / "registry_docs_v2/publication-links.json").read_text("utf-8"))["links"]
legacy = json.loads((OUT / "verified-registry-root-png-cleanup-plan.json").read_text("utf-8"))["files"]
compatibility_path = OUT / "registry-image-original-compatibility.json"
compatibility = json.loads(compatibility_path.read_text("utf-8"))["checks"] if compatibility_path.exists() else []
preservation_path = OUT / "registry-historical-gel-preservation.json"
preserved_gels = json.loads(preservation_path.read_text("utf-8"))["files"] if preservation_path.exists() else []
archive = list(csv.DictReader((ROOT / "zenodo-release/manifest.csv").open(encoding="utf-8-sig", newline="")))
sha_paths = defaultdict(list)
for record in archive:
    sha_paths[record["sha256"]].append(ROOT / "zenodo-release" / record["destination_relative"])

url_records = {}
for record in ledger:
    urls = [record.get("official_url"), *record.get("superseded_official_urls", [])]
    for url in urls:
        if url:
            url_records[url] = record
image_occurrences = defaultdict(list)
for page in payload["pages"]:
    for entry in page["entries"]:
        assert "<img" not in entry["body_markdown"].lower(), "Review HTML image separately"
        for alt, url in re.findall(r'!\[([^\]]*)\]\(([^)]+)\)', entry["body_markdown"]):
            image_occurrences[url].append({"entry_key": entry["entry_key"], "page_url": page["url"], "alt": alt})

queue, missing = [], []
for url, occurrences in image_occurrences.items():
    record = url_records.get(url, {})
    linked = next((x for x in public_links.values() if x["url"] == url), {})
    old = next((x for x in legacy if x["official_url"] == url), {})
    recovered = next((x for x in compatibility if x["source_image_url"] == url and x.get("exact_path")), {})
    preserved = next((x for x in preserved_gels if x["source_image_url"] == url), {})
    expected = linked.get("sha256") or record.get("source_sha256") or record.get("response_sha256")
    candidate_paths = []
    relation = "byte-identical published image"
    if recovered:
        expected = recovered["sha256"]
        if preserved:
            candidate_paths.append(ROOT / preserved["canonical_path"])
        candidate_paths.append(Path(recovered["exact_path"]))
        relation = "exact historical CDN bytes recovered because no surviving exact canonical was indexed; preserve before temporary-cache cleanup"
    if old:
        expected = old["sha256"]
        candidate_paths.append(ROOT / old["retain_canonical"])
        relation = "preserved original PNG of the official automatic AVIF conversion; byte identity is not claimed across formats"
    if linked.get("canonical_archive_path"):
        candidate_paths.append(ROOT / linked["canonical_archive_path"])
    if record.get("canonical_archive_path"):
        candidate_paths.append(ROOT / record["canonical_archive_path"])
    if url in record.get("superseded_official_urls", []):
        relation = "current full-field layout from the same microscopy source and display windows; superseded panels were 1440x1160, corrected canonical is 1440x1210; not pixel-identical whole layouts"
    elif not old and not recovered and record.get("response_sha256") and expected != record.get("response_sha256"):
        relation = "preserved source original; prior CDN encoding recorded as " + record.get("verification_grade", "transcoded") + "; encoded file bytes differ"
    candidate_paths.extend(sha_paths.get(expected, []))
    for source in record.get("source_paths", []):
        candidate_paths.extend([ROOT / source, ROOT / "aerosense-wiki" / source, ROOT / "zenodo-release" / source, ROOT / "zenodo-release/aerosense-wiki" / source])
    found = None
    for path in dict.fromkeys(candidate_paths):
        if path.is_file() and hashlib.sha256(path.read_bytes()).hexdigest() == expected:
            found = path
            break
    if not found:
        missing.append({"url": url, "expected_source_sha256": expected, "candidate_paths": [str(x) for x in candidate_paths]})
        continue
    queue.append({
        "source_image_url": url, "canonical_path": found.relative_to(ROOT).as_posix(),
        "canonical_absolute_path": str(found), "sha256": expected, "bytes": found.stat().st_size,
        "format": found.suffix.lower().lstrip("."), "source_relation": relation,
        "currently_verified_cdn_url": record.get("official_url") or linked.get("url"),
        "historical_cdn_response_sha256": old.get("remote_sha256") or record.get("response_sha256") or linked.get("sha256"),
        "occurrences": occurrences, "occurrence_count": len(occurrences),
        "registry_upload_required": not urllib.parse.urlsplit(url).hostname.endswith("registry.igem.org"),
        "registry_uploaded_url": None,
    })

groups = {}
for item in queue:
    group = groups.setdefault(item["sha256"], {
        "upload_key": item["sha256"][:12] + "-" + Path(item["canonical_path"]).name,
        "canonical_path": item["canonical_path"], "canonical_absolute_path": item["canonical_absolute_path"],
        "sha256": item["sha256"], "bytes": item["bytes"], "format": item["format"],
        "source_image_urls": [], "entry_keys": [], "registry_uploaded_url": None,
    })
    group["source_image_urls"].append(item["source_image_url"])
    group["entry_keys"].extend(x["entry_key"] for x in item["occurrences"] if x["entry_key"] not in group["entry_keys"])

for group in groups.values():
    source = ROOT / group["canonical_path"]
    if source.suffix.lower() != ".svg" or source.name.startswith("architecture"):
        continue
    candidates = [source.with_suffix(".png"), ROOT / "zenodo-release/aerosense-wiki/fig/odor-2026-10-21" / source.with_suffix(".png").name]
    alternate = next((path for path in candidates if path.is_file()), None)
    if alternate:
        group.update(alternate_upload_path=alternate.relative_to(ROOT).as_posix(), alternate_upload_absolute_path=str(alternate), alternate_upload_sha256=hashlib.sha256(alternate.read_bytes()).hexdigest(), alternate_upload_bytes=alternate.stat().st_size, alternate_upload_relation="Existing canonical PNG rendering of the same scientific plot; numerical inputs unchanged, original SVG preserved. Genuine PNG, no extension disguise.")

def priority(item):
    name = Path(item["canonical_path"]).name
    if "receptor-" in name or any("odor-2026-10-21" in path for path in [item["canonical_path"]]) and name.endswith(".svg"):
        return (0, name)
    if name.startswith("architecture"):
        return (1, name)
    return (2, name)

result = {
    "prepared_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "trigger": "Confirmed official Registry Save HTTP400: Only images uploaded to the Registry are allowed",
    "scope": "Image upload/routing only. No scientific body or numerical data changes or remote writes. Existing canonical sources reused; exact historical assets recovered only when no surviving exact canonical was indexed.",
    "source_payload_sha256": hashlib.sha256((OUT / "registry-documentation-payload.json").read_bytes()).hexdigest(),
    "image_occurrences": sum(len(x) for x in image_occurrences.values()), "unique_image_urls": len(image_occurrences),
    "resolved_image_urls": len(queue), "unique_upload_files": len(groups),
    "total_unique_bytes": sum(x["bytes"] for x in groups.values()),
    "max_single_file_bytes": max((x["bytes"] for x in groups.values()), default=0),
    "format_counts": dict(Counter(x["format"] for x in groups.values())),
    "known_registry_upload_size_limit": "Not independently established; inspect official upload UI for its constraint",
    "mapping": queue, "upload_queue": sorted(groups.values(), key=priority), "unresolved": missing,
}
(OUT / "registry-image-upload-manifest.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({k: v for k, v in result.items() if k not in ["mapping", "upload_queue", "unresolved"]}, indent=2))
print("unresolved", json.dumps(missing, ensure_ascii=False))
