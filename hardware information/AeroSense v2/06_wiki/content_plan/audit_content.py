"""Audit this editorial package; no network or outside-folder writes."""
from pathlib import Path
import hashlib,json,re
P=Path(__file__).resolve().parent
ROOT=P.parents[1]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
pages=[]
for name in ('hardware','model','description'):
 p=ROOT/'08_reference/site_context/current_pages'/f'{name}.html'
 t=p.read_text(encoding='utf-8')
 pages.append(dict(page=name,local_source=str(p.relative_to(ROOT)),url=f'https://pinche567.github.io/iGEM-2026-wiki/{name}.html',sha256=sha(p),anchors=[dict(id=m.group(1),line=t[:m.start()].count('\n')+1) for m in re.finditer(r'\bid="([^"]+)"',t)],snapshot_only=True))
mapping=[
 dict(draft='Hardware_Sections',website_page='hardware.html',official_route='/hardware',replace_existing=['hardware-architecture','optical-question','well-floor-results','gas-path-results','mechanical-package','electronics-bridge','cost-and-reproduction','validation-boundary'],preserve=['navigation','references','historical Engineering Cycles 1–3'],new_ids=['hardware-status','hardware-build','hardware-optics','hardware-gas','hardware-operation','hardware-validation']),
 dict(draft='Model_Sections',website_page='model.html',official_route='/model',insert_before='aerosense-bridge',update_navigation=True,preserve=['network','training-evaluation','performance','reproduce','limitations'],new_ids=['physical-models','optical-transport','detector-interference','gas-and-liquid-transport','model-to-build','molecular-hypotheses']),
 dict(draft='Description_Sections',website_page='description.html',official_route='/description',insert_before='evidence-ladder',reconcile_existing=['read','decode','is-and-is-not'],preserve=['established prior-work citations','actual wet-lab results and their original evidence'],new_ids=['aerosense-system-scope','aerosense-model-scope','aerosense-current-boundary'])]
figures=[
 dict(source='02_simulation/optics/figures/02_floor_maps.png',main='model#optical-transport',hardware='hardware#hardware-optics',purpose='Directional irradiance and finite-detector collection, not normalized fluence'),
 dict(source='02_simulation/optics/figures/03_well_transfer.png',main='model#optical-transport',hardware='hardware#hardware-optics',purpose='LED versus biological source-well contributions'),
 dict(source='02_simulation/optics/figures/05_frequency_recovery.png',main='model#detector-interference',purpose='Ideal, conditional received, overlay, residual'),
 dict(source='02_simulation/optics/figures/09_interference_metrics.png',main='model#detector-interference',purpose='Four-channel bias and error-inclusive SINR'),
 dict(source='02_simulation/optics/figures/10_interference_sweep.png',main='model#detector-interference',purpose='Assumed ambient/noise and MC leakage sensitivity'),
 dict(source='02_simulation/optics/optical_slow_motion.mp4',main='model#detector-interference',purpose='Synchronized illustration; not photon-flight-time measurement'),
 dict(source='02_simulation/airflow/figures/design_comparison.png',main='model#gas-and-liquid-transport',hardware='hardware#hardware-gas',purpose='Selected shelf and distribution tradeoff'),
 dict(source='02_simulation/airflow/figures/operating_delivery.png',main='model#gas-and-liquid-transport',hardware='hardware#hardware-gas',purpose='Fixed-CAD flow/diffusivity operating-point comparison'),
 dict(source='02_simulation/airflow/figures/operating_pareto.png',main='model#gas-and-liquid-transport',purpose='Speed versus arrival tradeoff; no weighted optimum'),
 dict(source='02_simulation/airflow/operating_sweep_3d.html',main='model#gas-and-liquid-transport',purpose='Interactive parameter view; concentration/delivery only')]
audit=dict(date='2026-10-05',scope='Editorial drafts only; no live publication, new experiment or docking result.',pages=pages,repository=dict(url='https://github.com/PinChe567/iGEM-2026-wiki',commit='ca8b47014315f4ffe4431a3b04874816410cafcf',recursive_tree_entries=1201,truncated=False,default_branch_files_match_HTTP_snapshots_after_newline_normalization=True,docking_filename_search='dock|obp|vina|pdb|ligand|receptor; one unrelated docker-compose match, no project docking result found',important_limit='This does not search unprovided private repositories or prove no docking was performed elsewhere.'),integration=mapping,local_link_rewrites=dict(draft_MD='Rewrite Hardware_Sections_LANG.md#id, Model_Sections_LANG.md#id and Description_Sections_LANG.md#id to corresponding integrated page#id.',package_assets='../../PATH currently resolves from content_plan to chatgpt version/PATH. If copying to 06_wiki root, use ../PATH; official publication requires mapping to the approved uploaded/archived URL.',appendix='Root workflow creates the appendix index; keep methods/key results on main pages and link detailed file records.',language='Choose one official page language and retain linked EN/ZH downloads; do not concatenate duplicate IDs from both language drafts into one document.'),figure_placement=figures,policy_boundary='2026 Special Awards criteria verified; current Team Wiki policy body inaccessible in web tool. primary_refs.json distinguishes the 2025 handbook fallback. Do not claim an external-content pass or a new 2026 exception.')
(P/'page_audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
checks=[]
for f in sorted(P.glob('*.md')):
 for link in re.findall(r'\]\(([^)]+)\)',f.read_text(encoding='utf-8')):
  if link.startswith(('https://','http://')):continue
  path,_,anchor=link.partition('#');target=(f.parent/path).resolve();ok=target.exists();anchor_ok=True
  if ok and anchor and target.suffix=='.md':anchor_ok=f'id="{anchor}"' in target.read_text(encoding='utf-8')
  checks.append(dict(file=f.name,target=link,exists=ok,anchor_valid=anchor_ok))
assert all(x['exists'] and x['anchor_valid'] for x in checks),[x for x in checks if not x['exists'] or not x['anchor_valid']]
assert all((ROOT/x['source']).exists() for x in figures)
report=dict(passed=True,date='2026-10-06',local_link_count=len(checks),links=checks,figure_targets_exist=True,English_Chinese_pairs=all((P/(stem+'_EN.md')).exists() and (P/(stem+'_ZH.md')).exists() for stem in ['README','Placement_Plan','Hardware_Sections','Model_Sections','Description_Sections','Docking_OBP_Evidence','Appendix_Contents']),document_SHA256={f.name:sha(f) for f in sorted(P.glob('*.md'))},scope='Local file/anchor/provenance checks. Not browser deployment, scientific rerun, or current-policy compliance certification.')
(P/'content_validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k not in ['links','document_SHA256']},indent=2))
