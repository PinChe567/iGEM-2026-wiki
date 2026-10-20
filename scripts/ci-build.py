"""Rebuild the wiki from source in an isolated CI checkout; never push/upload.

Use --check for a read-only prerequisite/route check. A full build restores the
locked game dependencies, rebuilds generated assets and creates public/.
"""
from pathlib import Path
from urllib.parse import unquote, urlsplit
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys

SITE = Path(__file__).resolve().parents[1]


def run(command, cwd=SITE):
    subprocess.run(command, cwd=cwd, check=True)


def preflight():
    if sys.version_info < (3, 11):
        raise RuntimeError("Python 3.11 or later is required.")
    tools = {name: shutil.which(name) for name in ("node", "npm")}
    if not all(tools.values()):
        raise RuntimeError("Node.js and npm must be on PATH.")
    node_version = subprocess.check_output(
        [tools["node"], "--version"], text=True, encoding="utf-8"
    ).strip()
    if int(node_version.lstrip("v").split(".")[0]) < 20:
        raise RuntimeError("The locked game toolchain requires Node.js 20 or later.")
    required = [
        "game/package.json", "game/package-lock.json",
        "game/apps/wiki-client/package.json", "game/apps/wiki-client/vite.config.ts",
        "game/docs/education-games/README.md", "game/docs/education-study-protocol.md",
        "home-bundle-sources.json", "igem-upload/verified-official-urls.json",
        "scripts/build-design-system.mjs", "scripts/build-home-bundles.mjs",
        "scripts/qa-compliance.cjs", "scripts/audit-publish-assets-v7.cjs",
        "scripts/prepare_publication_manifest_v7.py", "scripts/build-publication.py",
        "scripts/build-locales.py",
    ]
    for relative in required:
        if not (SITE / relative).is_file():
            raise RuntimeError(f"Missing editable/build input: {relative}")
    package = json.loads((SITE / "game/package.json").read_text(encoding="utf-8"))
    lock = json.loads((SITE / "game/package-lock.json").read_text(encoding="utf-8"))
    if lock.get("lockfileVersion", 0) < 2:
        raise RuntimeError("Commit a current npm package lockfile.")
    root_lock = lock.get("packages", {}).get("", {})
    for group in ("dependencies", "devDependencies"):
        if package.get(group, {}) != root_lock.get(group, {}):
            raise RuntimeError(f"Root package.json and package-lock.json differ: {group}")
    manifest = json.loads((SITE / "home-bundle-sources.json").read_text(encoding="utf-8"))
    for relative in manifest["styles"] + manifest["scripts"]:
        if relative == "css/design-system.css" or re.match(r"js/i18n-.*-v19\.js$", relative):
            continue
        source = (SITE / relative).resolve()
        if not source.is_relative_to(SITE) or not source.is_file():
            raise RuntimeError(f"Missing homepage source: {relative}")
    for script in ("build-design-system.mjs", "build-home-bundles.mjs",
                   "qa-compliance.cjs", "audit-publish-assets-v7.cjs"):
        run([tools["node"], "--check", str(SITE / "scripts" / script)])
    return tools, node_version


def refresh_local_hashes():
    """Resolve local CSS/JS/HTML cache hashes; leave official media URLs intact."""
    candidates = list(SITE.glob("*.html"))
    for directory in ("js", "css", "templates", "learning-platform", "design_system"):
        candidates.extend(p for p in (SITE / directory).rglob("*")
                          if p.suffix in (".html", ".js", ".mjs", ".css") and p.is_file()
                          and "vendor" not in p.parts)
    quoted = re.compile(r'''(?P<q>["'])(?P<url>[^"'\s<>]+)\?v=(?P<hash>[a-f0-9]{8,64})(?P<tail>[^"'\s<>]*)(?P=q)''')
    for _ in range(12):
        changed = 0
        for source in candidates:
            text = source.read_text(encoding="utf-8")

            def replace(match):
                url = match["url"]
                parsed = urlsplit(url)
                if parsed.scheme or parsed.netloc or "\\" in url:
                    return match[0]
                decoded = unquote(url)
                if decoded.startswith("/nthu/"):
                    options = [SITE / decoded[6:]]
                elif decoded.startswith("/"):
                    return match[0]
                else:
                    options = [source.parent / decoded, SITE / decoded]
                target = next((p.resolve() for p in options
                               if p.resolve().is_relative_to(SITE) and p.is_file()), None)
                if target is None or target.suffix not in (".css", ".js", ".mjs", ".html"):
                    return match[0]
                digest = hashlib.sha256(target.read_bytes()).hexdigest()[:len(match["hash"])]
                return f'{match["q"]}{url}?v={digest}{match["tail"]}{match["q"]}'

            updated = quoted.sub(replace, text)
            if updated != text:
                source.write_text(updated, encoding="utf-8", newline="")
                changed += 1
        if not changed:
            return
    raise RuntimeError("Cache hashes did not converge; inspect circular hash references.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true",
                        help="Read-only preflight; no npm install, build or output copy.")
    parser.add_argument("--output", default=str(SITE / "public"))
    args = parser.parse_args()
    tools, version = preflight()
    license_present = (SITE / "LICENSE").is_file()
    if args.check:
        run([sys.executable, "scripts/build-publication.py", "--routes-only", "--check"])
        print(json.dumps({
            "source_preflight": "passed", "node": version,
            "root_license_present": license_present,
            "next_step_if_license_absent": (
                None if license_present else
                "Preserve the existing official repository root LICENSE when staging source."
            ),
            "game_install_and_build_executed": False,
            "full_ci_executed": False, "output_created": False,
            "deployment_verified": False,
        }))
        return
    if not license_present:
        raise RuntimeError("Keep the official repository root LICENSE before a full CI build.")
    output = Path(args.output).resolve()
    run([sys.executable, "scripts/build-publication.py",
         "--routes-only", "--check", "--output", str(output)])
    if output.exists() and (not output.is_dir() or any(output.iterdir())):
        raise RuntimeError("Use an empty output directory; the build never deletes old output.")
    run([tools["npm"], "ci", "--no-audit", "--no-fund"], SITE / "game")
    run([tools["npm"], "run", "build:wiki"], SITE / "game")
    run([sys.executable, "scripts/build-locales.py"])
    run([tools["node"], "scripts/build-design-system.mjs"])
    refresh_local_hashes()
    run([tools["node"], "scripts/build-home-bundles.mjs"])
    refresh_local_hashes()
    run([tools["node"], "scripts/qa-compliance.cjs"])
    run([tools["node"], "scripts/audit-publish-assets-v7.cjs"])
    run([sys.executable, "scripts/prepare_publication_manifest_v7.py"])
    run([sys.executable, "scripts/build-publication.py", "--check"])
    run([sys.executable, "scripts/build-publication.py", "--output", str(output)])
    print(json.dumps({"source_build": "passed", "output": str(output),
                      "official_pipeline_verified": False, "deployment_verified": False}))


if __name__ == "__main__":
    main()
