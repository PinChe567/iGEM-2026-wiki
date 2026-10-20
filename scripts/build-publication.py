"""Create iGEM directory routes from editable HTML; never upload or push.

--check validates inputs and renders routes in memory, without creating public/.
--routes-only omits dependency copies and is not a deployable site.
"""
from pathlib import Path
import argparse
import json
import re
import shutil

SITE = Path(__file__).resolve().parents[1]
TEAM_BASE = "/nthu/"


def route_html(text):
    """Keep hand-authored content intact while resolving slash-route resources."""
    text = re.sub(r"<base\b[^>]*>", "", text, flags=re.I)
    text, count = re.subn(
        r"<head\b([^>]*)>", r'<head\1>' + f'\n  <base href="{TEAM_BASE}">',
        text, count=1, flags=re.I,
    )
    if count != 1:
        raise ValueError("A source page must contain a head element.")
    return text


def publication_inputs(routes_only=False):
    pages = sorted(SITE.glob("*.html"))
    if not pages or not (SITE / "index.html").is_file():
        raise ValueError("The editable root HTML pages and index.html are required.")
    for source in pages:
        route_html(source.read_text(encoding="utf-8"))
    files = []
    if not routes_only:
        manifest = SITE / "publication-files.json"
        if not manifest.is_file():
            raise ValueError("Generate publication-files.json from the asset audit first.")
        entries = json.loads(manifest.read_text(encoding="utf-8"))
        if not isinstance(entries, list) or not all(isinstance(p, str) for p in entries):
            raise ValueError("The publication manifest must be a list of relative paths.")
        for relative in entries:
            if (not relative or "\\" in relative or ":" in relative
                    or Path(relative).is_absolute() or ".." in Path(relative).parts):
                raise ValueError(f"Unsafe publication dependency path: {relative}")
            source = (SITE / relative).resolve()
            if not source.is_relative_to(SITE) or not source.is_file():
                raise ValueError(f"Missing or outside publication dependency: {relative}")
            files.append((relative, source))
    return pages, files


def validate_output(output):
    output = output.resolve()
    if output == SITE or output in SITE.parents:
        raise ValueError("Publication output must not replace the source or a parent.")
    if output.is_relative_to(SITE) and output != SITE / "public":
        raise ValueError("Inside the source tree, only the dedicated public/ output is allowed.")
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default=str(SITE / "public"))
    parser.add_argument("--routes-only", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    output = validate_output(Path(args.output))
    pages, files = publication_inputs(args.routes_only)
    routes = [TEAM_BASE + p.stem for p in pages if p.stem != "index"]
    if args.check:
        print(json.dumps({
            "checked": True, "source_pages": len(pages), "standard_routes": len(routes),
            "manifest_paths": len(files), "output_created": False,
            "deployment_verified": False,
        }))
        return
    # Do not merge stale deployment files or delete a user directory.
    if output.exists() and (not output.is_dir() or any(output.iterdir())):
        raise ValueError("Choose an empty output directory; existing output is never deleted.")
    output.mkdir(parents=True, exist_ok=True)
    for relative, source in files:
        destination = (output / relative).resolve()
        if not destination.is_relative_to(output):
            raise ValueError(f"Publication destination escapes output: {relative}")
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
    for source in pages:
        text = source.read_text(encoding="utf-8")
        (output / source.name).write_text(text, encoding="utf-8")
        if source.stem != "index":
            route = output / source.stem
            route.mkdir(exist_ok=True)
            (route / "index.html").write_text(route_html(text), encoding="utf-8")
    (output / "route-manifest.json").write_text(
        json.dumps({"team_base": TEAM_BASE, "routes": routes,
                    "dependencies_copied": not args.routes_only}, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({"output": str(output), "standard_routes": len(routes),
                      "dependencies_copied": not args.routes_only,
                      "deployment_verified": False}))


if __name__ == "__main__":
    main()
