"""Incremental anonymous full-byte verification of observed Registry uploads."""
from pathlib import Path
from urllib.request import Request, urlopen
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from PIL import Image
import datetime
import hashlib
import json
import xml.etree.ElementTree as ET

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[2]
MAP = OUT / "registry-image-upload-map.json"
RECEIPT = OUT / "registry-image-upload-readback.json"
items = json.loads(MAP.read_text("utf-8"))
prior = json.loads(RECEIPT.read_text("utf-8")).get("results", []) if RECEIPT.exists() else []
existing = {x["registry_url"]: x for x in prior if x.get("status") == 200}
preservation_path = OUT / "registry-historical-gel-preservation.json"
preserved = {row["sha256"]: row["canonical_path"] for row in json.loads(preservation_path.read_text("utf-8"))["files"]} if preservation_path.exists() else {}


def dimensions(data):
    try:
        im = Image.open(BytesIO(data))
        return list(im.size)
    except Exception:
        try:
            xml = ET.fromstring(data)
            viewbox = xml.attrib.get("viewBox", "").split()
            if len(viewbox) == 4:
                return [float(viewbox[2]), float(viewbox[3])]
            return [float(xml.attrib["width"]), float(xml.attrib["height"])]
        except Exception:
            return None


def verify(item):
    source = ROOT / item["canonical"]
    if not source.exists() and item["source_sha256"] in preserved:
        source = ROOT / preserved[item["source_sha256"]]
    original = source.read_bytes()
    assert hashlib.sha256(original).hexdigest() == item["source_sha256"]
    cached = existing.get(item["registry_url"])
    if cached and cached["source_sha256"] == item["source_sha256"]:
        return cached
    result = {"source_url": item["source_url"], "registry_url": item["registry_url"], "source_sha256": item["source_sha256"], "canonical_path": item["canonical"]}
    try:
        with urlopen(Request(item["registry_url"], headers={"User-Agent": "AeroSense-public-image-integrity-check/1.0"}), timeout=30) as response:
            data = response.read()
            result.update(status=response.status, content_type=response.headers.get("Content-Type"))
        target_dimensions = dimensions(data)
        source_dimensions = dimensions(original)
        exact = original == data
        result.update(checked_at=datetime.datetime.now(datetime.timezone.utc).isoformat(), registry_response_sha256=hashlib.sha256(data).hexdigest(), bytes=len(data), source_dimensions=source_dimensions, dimensions=target_dimensions, byte_identical=exact, verification="Byte-identical source" if exact else "Official Registry automatic image conversion; geometry recorded separately, encoded bytes are not identical")
        if target_dimensions and source_dimensions:
            expected_height = source_dimensions[1] * target_dimensions[0] / source_dimensions[0]
            result["aspect_ratio_preserved_within_one_pixel"] = abs(expected_height - target_dimensions[1]) <= 1.0
    except Exception as error:
        result.update(status="error", error=str(error))
    return result


with ThreadPoolExecutor(max_workers=2) as pool:
    results = list(pool.map(verify, items))
report = {"checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat(), "mapping_snapshot_sha256": hashlib.sha256(MAP.read_bytes()).hexdigest(), "mapped_count": len(items), "success_count": sum(x.get("status") == 200 for x in results), "results": results}
RECEIPT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({k: v for k, v in report.items() if k != "results"}, indent=2))
