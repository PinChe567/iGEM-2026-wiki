"""Verify the frozen daily build and record exact files for one public refresh."""
from pathlib import Path
import hashlib
import json
import stat
from datetime import datetime, timezone

OUT = Path(__file__).resolve().parent
WORK = OUT.parents[2]
SITE = WORK / 'aerosense-wiki'
REPO = WORK / 'gitlab/nthu'
OLD = REPO / 'public'
NEW = REPO / '.build-check/measurement-curves-new-public'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def contained_plain(path):
    assert path.resolve().is_relative_to(WORK.resolve()), str(path)
    assert not path.is_symlink(), str(path)
    assert not (path.stat().st_file_attributes & stat.FILE_ATTRIBUTE_REPARSE_POINT), str(path)

def inventory(root):
    for parent in [root, *root.parents]:
        if parent == WORK.parent:
            break
        contained_plain(parent)
    items = []
    for path in sorted(root.rglob('*')):
        contained_plain(path)
        if path.is_file():
            assert path.suffix != '.pyc', str(path)
            items.append({'path': path.relative_to(root).as_posix(),
                          'bytes': path.stat().st_size, 'sha256': sha(path)})
    return items

dependencies = json.loads((SITE / 'publication-files.json').read_text(encoding='utf-8'))
pages = sorted(p.name for p in SITE.glob('*.html'))
new = inventory(NEW)
old = inventory(OLD)
assert len(new) == 287, len(new)
assert sum(p['path'].endswith('.html') for p in new) == 67
route = json.loads((NEW / 'route-manifest.json').read_text(encoding='utf-8'))
expected_routes = sorted('/nthu/' + Path(p).stem for p in pages if p != 'index.html')
assert sorted(route['routes']) == expected_routes and len(expected_routes) == 27
assert route['team_base'] == '/nthu/' and route['dependencies_copied'] is True
for path in sorted(set(dependencies + pages)):
    if path in pages:
        assert (SITE / path).read_text(encoding='utf-8') == (NEW / path).read_text(encoding='utf-8'), path
    else:
        assert (SITE / path).read_bytes() == (NEW / path).read_bytes(), path
for page in pages:
    if page == 'index.html':
        continue
    source = (SITE / page).read_text(encoding='utf-8')
    rendered = (NEW / Path(page).stem / 'index.html').read_text(encoding='utf-8')
    base = '<base href="/nthu/' + page + '">'
    assert base in rendered, page
    # The build's only route transformation is the clean-route base insertion.
    assert rendered.replace('\n  ' + base, '', 1) == source, page

copy = json.loads((OUT.parent / 'release-20261021/site-source-copy-final.json').read_text(encoding='utf-8'))
for item in copy['items']:
    assert sha(SITE / item['path']) == item['sha256'], item['path']
    assert sha(REPO / 'site' / item['path']) == item['sha256'], item['path']

report = {
    'created_at_utc': datetime.now(timezone.utc).isoformat(),
    'status': 'verified; exact old-public replacement authorized by parent task',
    'workspace': str(WORK), 'old_root': str(OLD), 'new_root': str(NEW),
    'source_copy_report': 'aerosense-wiki/audit/release-20261021/site-source-copy-final.json',
    'source_copy_report_sha256': sha(OUT.parent / 'release-20261021/site-source-copy-final.json'),
    'source_files_verified': len(copy['items']), 'source_copy_actions': copy['actions'],
    'publication_dependencies': len(dependencies),
    'old_files_count': len(old), 'old_bytes': sum(x['bytes'] for x in old),
    'new_files_count': len(new), 'new_bytes': sum(x['bytes'] for x in new),
    'new_html_files': 67, 'root_pages': len(pages), 'clean_routes': len(expected_routes),
    'exact_dependencies_and_html': True, 'source_site_exact_sha': True,
    'html_normalization': 'Root HTML content exact after platform newline normalization; routes add only the reviewed base element.',
    'no_reparse_points': True, 'scope': 'Only old public files; upload-staging and all pyc excluded.',
    'old_files': old, 'new_files': new,
}
(OUT / 'public-refresh-plan.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k not in ('old_files','new_files')}, ensure_ascii=True, indent=2))
