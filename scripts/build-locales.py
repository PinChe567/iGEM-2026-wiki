"""Build browser translation catalogs from editable locale JSON.

--check compares every reconstructed dictionary with the current runtime data
without writing files. Shared overlays have an explicit, stable merge order.
"""
from pathlib import Path
import argparse
import json
import re

SITE = Path(__file__).resolve().parents[1]
LOCALES = SITE / "locales"


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def extra(name):
    path = LOCALES / "extras/zh-Hant" / f"{name}.json"
    return read_json(path) if path.is_file() else {}


def core(name):
    source = read_json(LOCALES / "source" / f"{name}.json")
    translated = read_json(LOCALES / "zh-Hant" / f"{name}.json")
    return {item["text"]: translated[key] for key, item in source.items()
            if key in translated and isinstance(translated[key], str)}


def build(name):
    result = core(name)
    if name == "common":
        result.update(core("glossary"))
        result.update(extra("glossary"))
        for shared in ("fly-a", "fly-b", "search"):
            result.update(extra(shared))
    result.update(extra(name))
    if name.startswith("learning-") or name == "progress":
        result.update(extra("learning-runtime"))
        result.update(extra("learning-ui"))
    if not all(isinstance(key, str) and isinstance(value, str)
               for key, value in result.items()):
        raise ValueError(f"Catalog {name} contains non-string entries.")
    return result


def existing(path):
    result = {}
    for match in re.finditer(r"\.push\((\{.*?\})\);",
                             path.read_text(encoding="utf-8"), re.S):
        result.update(json.loads(match.group(1)))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    catalogs = 0
    for source in sorted((LOCALES / "source").glob("*.json")):
        name = source.stem
        target = SITE / "js" / f"i18n-{name}-v19.js"
        data = build(name)
        if args.check:
            if not target.is_file() or existing(target) != data:
                raise ValueError(f"Runtime/source translation mismatch: {name}")
        else:
            comment = f"/* Generated local Traditional Chinese catalog. Edit locales/zh-Hant/{name}.json and locale overlays; run scripts/build-locales.py. */\n"
            text = comment + "(window.AeroSenseTranslations ||= []).push(" + json.dumps(
                data, ensure_ascii=False, separators=(",", ":")
            ) + ");\n"
            target.write_text(text, encoding="utf-8", newline="")
        catalogs += 1
    print(json.dumps({"catalogs": catalogs, "checked": args.check,
                      "written": not args.check}))


if __name__ == "__main__":
    main()
