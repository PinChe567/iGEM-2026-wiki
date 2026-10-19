"""Move authored breadcrumbs below their hero without changing content or links."""
from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[1]
report=[]
hero=re.compile(r'(<header\b[^>]*class="[^"]*(?:page-hero|members-intro|learn-hero|lm-hero|credits-intro)[^"]*"[^>]*>)(.*?)(</header>)',re.S)
crumb=re.compile(r'<nav\b[^>]*aria-label="Breadcrumb"[^>]*>.*?</nav>',re.S)
for p in [*root.glob('*.html'),*root.glob('learning-platform/*.html')]:
    s=p.read_text(encoding='utf-8')
    moved=[]
    def relocate(m):
        body=m.group(2); n=crumb.search(body)
        if not n:return m.group(0)
        nav=n.group(0)
        if 'class=' not in nav.split('>',1)[0]:nav=nav.replace('<nav','<nav class="page-breadcrumb"',1)
        moved.append(nav)
        return m.group(1)+body[:n.start()]+body[n.end():]+m.group(3)+'\n        '+nav
    out=hero.sub(relocate,s)
    if moved:
        p.write_text(out,encoding='utf-8');report.append({'page':str(p.relative_to(root)),'moved':len(moved)})
report_path=root/'reports/review-v25/breadcrumb-relocation.json'
if report:report_path.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(f'Moved breadcrumbs below the hero on {len(report)} pages')
