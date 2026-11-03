"""Remove the retired translation controls without rewriting page content.

Default scope excludes Model and Engineering, which have concurrent editors.
Pass --files model.html engineering.html once their content edits are complete.
"""
from pathlib import Path
import argparse, json, re

ROOT = Path(__file__).resolve().parents[2]
p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--files', nargs='+')
args = p.parse_args()
paths = [ROOT / name for name in args.files] if args.files else [
    *[f for f in ROOT.glob('*.html') if f.name not in {'model.html', 'engineering.html'}],
    ROOT / 'templates/header.html', ROOT / 'learning-platform/progress.html',
]
changes = []
for path in paths:
    if not path.resolve().is_relative_to(ROOT) or not path.is_file():
        raise SystemExit(f'Invalid input: {path}')
    old = path.read_text(encoding='utf-8')
    new = re.sub(r'<!--\s*local-language-v19\s*-->.*?<!--\s*/local-language-v19\s*-->', '', old, flags=re.S)
    new = re.sub(r'<button\b(?=[^>]*\bdata-language-toggle\b)[^>]*>.*?</button>', '', new, flags=re.S)
    new = re.sub(r'<div\s+class="home-menu__language">\s*</div>', '', new)
    if new != old:
        path.write_text(new, encoding='utf-8', newline='\n')
        changes.append(path.relative_to(ROOT).as_posix())
print(json.dumps({'changed': changes, 'scope': 'translation loader and selector only'}))
