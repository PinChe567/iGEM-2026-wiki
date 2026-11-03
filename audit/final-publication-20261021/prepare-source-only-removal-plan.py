"""Prepare, but never execute, the approved source-only artifact cleanup."""
from __future__ import annotations

import hashlib
import json
import os
import stat
from datetime import datetime, timezone
from pathlib import Path

AUDIT = Path(__file__).resolve().parent
ROOT = AUDIT.parents[2]
REPO = ROOT / "gitlab/nthu"
ARCHIVE = ROOT / "zenodo-release"
MANIFEST = REPO / "code/aerosense/source-manifest.json"


def sha(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def assert_safe(path: Path, allowed: Path) -> None:
    absolute = Path(os.path.abspath(path))
    assert absolute != allowed
    assert absolute.is_relative_to(allowed), (absolute, allowed)
    assert absolute.resolve(strict=True) == absolute, absolute
    for candidate in (absolute, *absolute.parents):
        info = candidate.lstat()
        assert not (getattr(info, "st_file_attributes", 0) & stat.FILE_ATTRIBUTE_REPARSE_POINT), candidate
        assert not candidate.is_symlink(), candidate
        if candidate == ROOT:
            break
    else:
        raise AssertionError(f"Outside workspace ancestry: {absolute}")
    assert absolute.is_file(), absolute


manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
assert manifest["schema_version"] == "aerosense-source-only-v1"
records = manifest["excluded_artifacts"]
assert len(records) == 550
assert sum(row["bytes"] for row in records) == 108211247
retained = {row["path"] for row in manifest["files"]}
seen = set()
prepared = []
for row in records:
    rel = row["path"]
    assert rel not in retained and rel not in seen, rel
    seen.add(rel)
    assert rel.startswith(("code/aerosense/", "docs/aerosense/")), rel
    source = REPO / rel
    allowed = REPO / ("code/aerosense" if rel.startswith("code/") else "docs/aerosense")
    canonical = ROOT / row["canonical_archive"]
    assert_safe(source, allowed)
    assert_safe(canonical, ARCHIVE)
    assert source != canonical
    source_hash, canonical_hash = sha(source), sha(canonical)
    assert source.stat().st_size == canonical.stat().st_size == row["bytes"], rel
    assert source_hash == canonical_hash == row["sha256"], rel
    prepared.append({
        "repository_relative": rel,
        "source_absolute": str(source),
        "allowed_source_root": str(allowed),
        "canonical_relative": row["canonical_archive"],
        "canonical_absolute": str(canonical),
        "bytes": row["bytes"],
        "source_sha256": source_hash,
        "canonical_sha256": canonical_hash,
        "category": row["category"],
        "verified_official_urls": row.get("verified_official_urls", []),
        "source_and_canonical_no_reparse": True,
    })

plan = {
    "schema_version": "aerosense-guarded-source-only-cleanup-v1",
    "prepared_at_utc": datetime.now(timezone.utc).isoformat(),
    "status": "PREPARED ONLY; not executed. Await explicit root signal after document rendering.",
    "authorization_context": "User authorized publication and canonical-verified duplicate cleanup; root approved the 550-file exclusion selection and requested this guarded plan. Execution is deliberately deferred.",
    "workspace_root": str(ROOT),
    "repository_root": str(REPO),
    "archive_root": str(ARCHIVE),
    "source_manifest_relative": str(MANIFEST.relative_to(ROOT)).replace("\\", "/"),
    "source_manifest_sha256_at_plan": sha(MANIFEST),
    "protected": ["github/", "gitlab/nthu/.git/", "gitlab/local-only/", "zenodo-release/", "all canonical raw data and figures", "7 original AVI and 3 unique MP4"],
    "scope": "Only the listed publication copies. No canonical files, directories, index, source code, or runtime site files may be removed.",
    "file_count": len(prepared),
    "total_bytes": sum(row["bytes"] for row in prepared),
    "all_550_source_and_canonical_hashes_checked": True,
    "files": prepared,
}
out = AUDIT / "source-only-artifact-removal-plan.json"
out.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"plan": str(out.relative_to(ROOT)), "files": len(prepared), "bytes": plan["total_bytes"], "plan_sha256": sha(out), "executed": False}))
