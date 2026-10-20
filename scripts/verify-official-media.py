"""Read back currently referenced official media without saving duplicate files."""
import concurrent.futures
import argparse
import base64
import datetime
import hashlib
import io
import json
import math
import re
from html.parser import HTMLParser
from pathlib import Path
import urllib.request
import urllib.error
import urllib.parse

SITE = Path(__file__).resolve().parents[1]
INVENTORY = SITE / "igem-upload/publication/all-assets-inventory.json"
REPORT = SITE / "audit/media-readback.json"


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def require(condition, message):
    if not condition:
        raise ValueError(message)


def get_json(url, expected_hash=None, expected_bytes=None):
    """Download once into memory. Return a readback row and parsed JSON."""
    parsed = urllib.parse.urlsplit(url)
    require(parsed.scheme == "https" and parsed.hostname == "static.igem.wiki"
            and not parsed.username and not parsed.password, "Not an official static URL")
    request = urllib.request.Request(url, headers={"User-Agent": "AeroSense-publication-audit/1.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        data = response.read(32 * 1024 * 1024 + 1)
        require(len(data) <= 32 * 1024 * 1024, "Unexpectedly large frame JSON")
        require(response.status == 200, "Frame JSON HTTP status is not 200")
        require(urllib.parse.urlsplit(response.url).hostname == "static.igem.wiki",
                "Frame JSON redirected outside official CDN")
        digest = hashlib.sha256(data).hexdigest()
        row = {"url": url, "status": response.status, "bytes": len(data),
               "content_type": response.headers.get("Content-Type", ""),
               "sha256": digest, "final_url": response.url,
               "checked_at_utc": now(), "ok": True}
    if expected_hash:
        row.update(expected_sha256=expected_hash, hash_matches=digest == expected_hash)
        require(row["hash_matches"], "JSON SHA-256 mismatch: " + url)
    if expected_bytes is not None:
        require(len(data) == expected_bytes, "JSON byte length mismatch: " + url)
        row["expected_bytes"] = expected_bytes
    prefix = re.match(r"([0-9a-f]{12})-", parsed.path.rsplit("/", 1)[-1])
    if prefix:
        row["filename_hash_prefix_matches"] = digest.startswith(prefix[1])
        require(row["filename_hash_prefix_matches"], "JSON filename hash prefix mismatch")
    return row, json.loads(data)


class FramePlayerParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.players = []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if attrs.get("data-frames-manifest"):
            self.players.append({"manifest_url": attrs["data-frames-manifest"],
                                 "index_url": attrs.get("data-index")})


def verify_frame_player(player, known_hashes):
    """Verify every chunk, concatenated byte, indexed JPEG and acquisition time."""
    from PIL import Image
    assets = []
    row = {**player, "checked_at_utc": now(), "ok": False}
    try:
        manifest_url = player["manifest_url"]
        manifest_row, manifest = get_json(manifest_url, known_hashes.get(manifest_url.split("?")[0]))
        assets.append(manifest_row)
        require(manifest.get("schema") == "aerosense.frame-bytes-manifest.v1"
                and manifest.get("encoding") == "base64"
                and manifest.get("ready_for_upload") is True, "Invalid manifest schema")
        chunks = manifest.get("chunks", [])
        require(bool(chunks) and manifest.get("chunk_count") == len(chunks),
                "Manifest chunk count mismatch")
        index_row, index = get_json(player["index_url"], manifest.get("source_index_sha256"))
        assets.append(index_row)
        restored = bytearray()
        chunk_checks = []
        for sequence, part in enumerate(chunks):
            require(part["index"] == sequence and part["offset"] == len(restored),
                    "Chunks are not consecutive and gap-free")
            require(type(part["length"]) is int and part["length"] > 0,
                    "Invalid decoded chunk length")
            download, payload = get_json(part["official_url"], part["json_sha256"], part["json_bytes"])
            assets.append(download)
            require(payload.get("schema") == "aerosense.frame-bytes-chunk.v1"
                    and payload.get("encoding") == "base64", "Invalid chunk schema")
            for key in ("index", "offset", "length", "sha256"):
                require(payload.get(key) == part[key], "Chunk metadata mismatch: " + key)
            encoded = payload.get("data")
            require(isinstance(encoded, str) and len(encoded) == ((part["length"] + 2) // 3) * 4,
                    "Base64 string length mismatch")
            decoded = base64.b64decode(encoded, validate=True)
            decoded_sha = hashlib.sha256(decoded).hexdigest()
            require(len(decoded) == part["length"] and decoded_sha == part["sha256"],
                    "Decoded chunk length or SHA-256 mismatch")
            restored.extend(decoded)
            chunk_checks.append({"index": sequence, "url": part["official_url"],
                                 "json_sha256": download["sha256"], "json_bytes": download["bytes"],
                                 "offset": part["offset"], "decoded_bytes": len(decoded),
                                 "decoded_sha256": decoded_sha, "ok": True})
            print(f"Verified frame chunk {sequence + 1}/{len(chunks)}: {manifest['source_filename']}",
                  flush=True)
        restored_sha = hashlib.sha256(restored).hexdigest()
        require(len(restored) == manifest["total_bytes"] and restored_sha == manifest["sha256"],
                "Reassembled frame bytes or SHA-256 mismatch")
        offsets, count = index.get("offsets"), index.get("frames")
        require(type(count) is int and count > 0 and isinstance(offsets, list)
                and len(offsets) == count + 1 and offsets[0] == 0
                and offsets[-1] == len(restored), "Invalid frame index extent")
        require(all(type(value) is int and 0 <= value <= len(restored)
                    and (i == 0 or value > offsets[i - 1]) for i, value in enumerate(offsets)),
                "Frame offsets are not strictly ordered and within byte bounds")
        require(index.get("width", 0) > 0 and index.get("height", 0) > 0 and index.get("fps", 0) > 0,
                "Invalid image geometry or playback FPS")
        sizes = []
        for frame in range(count):
            jpeg = restored[offsets[frame]:offsets[frame + 1]]
            require(jpeg.startswith(b"\xff\xd8") and jpeg.endswith(b"\xff\xd9"),
                    f"Frame {frame} JPEG boundary markers invalid")
            with Image.open(io.BytesIO(jpeg)) as image:
                require(image.format == "JPEG" and image.size == (index["width"], index["height"]),
                        f"Frame {frame} JPEG geometry mismatch")
                image.load()
            sizes.append(len(jpeg))
        times = index.get("acquisitionTimesSeconds")
        if times is not None:
            require(isinstance(times, list) and len(times) == count
                    and all(isinstance(t, (int, float)) and math.isfinite(t) and t >= 0
                            and (i == 0 or t >= times[i - 1]) for i, t in enumerate(times)),
                    "Acquisition-time index invalid")
        row.update(ok=True, source_filename=manifest["source_filename"],
                   manifest_sha256=manifest_row["sha256"], index_sha256=index_row["sha256"],
                   source_index_hash_matches=True, chunk_count=len(chunks), chunks=chunk_checks,
                   total_bytes=len(restored), concatenated_sha256=restored_sha,
                   total_bytes_matches=True, concatenated_hash_matches=True,
                   index_checks={"frames": count, "offset_count": len(offsets),
                                 "first_offset": offsets[0], "final_offset": offsets[-1],
                                 "strictly_increasing": True, "all_ranges_within_bytes": True,
                                 "all_jpegs_fully_decoded": True, "decoded_frame_count": count,
                                 "width": index["width"], "height": index["height"],
                                 "min_frame_bytes": min(sizes), "max_frame_bytes": max(sizes),
                                 "acquisition_time_count": len(times) if times is not None else 0,
                                 "acquisition_times_valid": times is not None,
                                 "playback_fps": index["fps"], "time_basis": index.get("timeBasis")})
    except Exception as error:
        row["error"] = str(error)
    return row, assets


def frames_only():
    """Incrementally merge dynamic evidence; never repeat the whole asset audit."""
    players = {}
    for source in ("description.html", "results.html"):
        parser = FramePlayerParser()
        parser.feed((SITE / source).read_text(encoding="utf-8"))
        for player in parser.players:
            key = (player["manifest_url"], player["index_url"])
            item = players.setdefault(key, {**player, "referenced_by": []})
            item["referenced_by"].append(source)
    mapping = json.loads((SITE / "igem-upload/verified-official-urls.json").read_text(encoding="utf-8"))
    hashes = {r["official_url"].split("?")[0]: r.get("response_sha256") for r in mapping}
    rows, downloads = [], []
    for player in players.values():
        row, assets = verify_frame_player(player, hashes)
        rows.append(row)
        downloads.extend(assets)
    # Read the report after the downloads so concurrent independent readback
    # additions are retained, then update only this incremental evidence.
    report = json.loads(REPORT.read_text(encoding="utf-8")) if REPORT.exists() else {"assets": []}
    merged = {asset["url"]: asset for asset in report.get("assets", [])}
    merged.update({asset["url"]: asset for asset in downloads})
    report["assets"] = sorted(merged.values(), key=lambda item: item["url"])
    report["total"] = len(report["assets"])
    report["passed"] = sum(asset.get("ok", False) for asset in report["assets"])
    report["failed"] = [asset for asset in report["assets"] if not asset.get("ok", False)]
    report["dynamic_frames"] = {
        "checked_at_utc": now(), "method": "Full official GET/JSON checksums, strict Base64 decode, decoded chunk and concatenated SHA-256/length, every indexed JPEG fully decoded in memory; no downloaded files retained.",
        "players": len(rows), "unique_dynamic_urls": len({asset["url"] for asset in downloads}),
        "chunk_files": sum(row.get("chunk_count", 0) for row in rows),
        "decoded_frames": sum(row.get("index_checks", {}).get("decoded_frame_count", 0) for row in rows),
        "passed": sum(row["ok"] for row in rows), "results": rows,
        "limits": "Integrity and image decoding do not establish Video Universe moderator approval or policy acceptance of a frame-based fallback."
    }
    REPORT.parent.mkdir(exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: report["dynamic_frames"][k] for k in
                      ("players", "unique_dynamic_urls", "chunk_files", "decoded_frames", "passed")},
                     ensure_ascii=False), flush=True)
    if not rows or any(not row["ok"] for row in rows):
        raise SystemExit(1)


def verify(item):
    url, expected = item
    row = {"url": url}
    try:
        request = urllib.request.Request(url, headers={"User-Agent": "AeroSense-publication-audit/1.0"})
        with urllib.request.urlopen(request, timeout=45) as response:
            digest = hashlib.sha256()
            size = 0
            for chunk in iter(lambda: response.read(1024 * 1024), b""):
                digest.update(chunk)
                size += len(chunk)
            row.update(status=response.status, bytes=size,
                       content_type=response.headers.get("Content-Type", ""),
                       sha256=digest.hexdigest(), final_url=response.url)
        row["ok"] = row["status"] == 200 and size > 0
        if expected:
            row["expected_sha256"] = expected
            row["hash_matches"] = digest.hexdigest() == expected
            row["ok"] = row["ok"] and row["hash_matches"]
    except Exception as error:
        row.update(ok=False, error=str(error))
        if isinstance(error, urllib.error.HTTPError):
            row["status"] = error.code
    return row


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--frames-only", action="store_true",
                        help="Only verify and merge the recursively referenced light-sheet frame containers")
    args = parser.parse_args()
    if args.frames_only:
        frames_only()
        return
    inventory = json.loads(INVENTORY.read_text(encoding="utf-8"))
    mapping = json.loads((SITE / "igem-upload/verified-official-urls.json").read_text(encoding="utf-8"))
    expected = {r["official_url"]: r.get("response_sha256") for r in mapping}
    urls = sorted({x["url"].split("#")[0] for x in inventory["summary"]["external_sources"]
                   if x["url"].startswith("https://static.igem.wiki/")})
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as executor:
        for row in executor.map(verify, [(u, expected.get(u)) for u in urls]):
            results.append(row)
            if len(results) % 100 == 0:
                print(f"Checked {len(results)}/{len(urls)} official assets", flush=True)
    report = {
        "checked_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "scope": "Unique static.igem.wiki URLs from the current linked-dependency inventory; full GET readback, not HEAD only.",
        "total": len(results), "passed": sum(r["ok"] for r in results),
        "failed": [r for r in results if not r["ok"]], "assets": results,
        "limits": "Does not prove unexecuted dynamic branches, future uptime, official moderation, or final GitLab deployment."
    }
    if REPORT.exists():
        prior = json.loads(REPORT.read_text(encoding="utf-8"))
        if prior.get("dynamic_frames"):
            report["dynamic_frames"] = prior["dynamic_frames"]
    REPORT.parent.mkdir(exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: report[k] for k in ("total", "passed", "failed")}, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
