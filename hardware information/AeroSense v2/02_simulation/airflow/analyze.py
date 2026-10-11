"""Rebuild validation, design selection and bilingual findings from saved solves."""
from pathlib import Path
import csv,json
import numpy as np
import run_flow as f
from plot_and_video import BG,TEXT,MUTED,TEAL,GOLD,GRID,font
from PIL import Image,ImageDraw
P=Path(__file__).resolve().parent
def read(tag):return json.loads((P/'results'/f'{tag}.json').read_text())
def main():
 rows=[read(f'{k}_dx0.4') for k in f.CASES];chosen='shelf_w8_e0p2';grid=[]
 for dx in [.4,.3,.2]:
  a=read(f'open_dx{dx:g}');b=read(f'{chosen}_dx{dx:g}')
  grid.append(dict(dx_mm=dx,open_J_N=a['worst_mouth_downward_momentum_N'],shelf_J_N=b['worst_mouth_downward_momentum_N'],J_ratio=b['worst_mouth_downward_momentum_N']/a['worst_mouth_downward_momentum_N'],open_P95_mm_s=a['worst_near_liquid_p95_mm_s'],shelf_P95_mm_s=b['worst_near_liquid_p95_mm_s'],speed_ratio=b['worst_near_liquid_p95_mm_s']/a['worst_near_liquid_p95_mm_s'],open_pressure_Pa=a['dp_at_1mLmin_Pa'],shelf_pressure_Pa=b['dp_at_1mLmin_Pa'],open_flux_CV=a['mouth_flux_CV'],shelf_flux_CV=b['mouth_flux_CV']))
 with (P/'mesh_refinement.csv').open('w',newline='') as o:w=csv.DictWriter(o,list(grid[0]));w.writeheader();w.writerows(grid)
 a=read('open_dx0.3_near1mLmin');b=read(chosen+'_dx0.3_near1mLmin')
 confirm=dict(open_actual_Q_mL_min=a['Q_actual_mL_min'],shelf_actual_Q_mL_min=b['Q_actual_mL_min'],shelf_Re=b['port_Re_actual'],shelf_relative_density_range=b['relative_density_range'],J_ratio=b['worst_mouth_downward_momentum_N']/a['worst_mouth_downward_momentum_N'],speed_ratio=b['worst_near_liquid_p95_mm_s']/a['worst_near_liquid_p95_mm_s'],tau=.55,dx_mm=.3,note='Separate near-operating-flow solves; metrics normalized by <6.5% to 1 mL/min. Changing tau also changes stair-step boundary error, so this is not a pure isolated inertia experiment.')
 nr=np.load(P/'results/tube_dx0.3_numpy_field.npz');cr=np.load(P/'results/tube_dx0.3_field.npz');error=float(np.linalg.norm(nr['velocity_m_s']-cr['velocity_m_s'])/np.linalg.norm(nr['velocity_m_s']))
 allres=[json.loads(x.read_text()) for x in (P/'results').glob('*.json')]
 checks=dict(all_run_count=len(allres),screening_case_count=len(rows),all_declared_converged=all(r['converged'] for r in allres),max_final_mass_imbalance=max(r['last_residual']['mass_flux_imbalance'] for r in allres),max_final_velocity_change=max(r['last_residual']['velocity_relative_change_over_200_steps'] for r in allres),Csharp_vs_numpy_velocity_relative_L2=error,tube_flow_error_tau08=read('tube_dx0.3')['tube_Q_relative_error'],tube_flow_error_tau055=read('tube_dx0.3_tau055')['tube_Q_relative_error'],grid_independence_established=False,operating_flow_confirmation=confirm)
 (P/'validation.json').write_text(json.dumps(checks,indent=2))
 selection=dict(selected_case=chosen,status='selected engineering prototype candidate; not a global optimum or biologically validated design',CAD_solid_box_mm=dict(minimum=[-7.4,-4,58.2],maximum=[-.2,4,59.4]),geometry=f.GEOM,geometry_source='geometry_and_cases.json',configuration=f.CASES[chosen],mesh_refinement=grid,operating_flow_confirmation=confirm,decision='Minimize extra parts and inaccessible surfaces; reduce well-mouth downward momentum compared with open plenum without major pressure penalty. Accept worsened gas-circulation symmetry. Do not claim lowest near-liquid velocity or improved cell survival.',unsupported_claims=['turbulence','sterility','no cross-well gas communication','cell protection','odor concentration uniformity','grid-independent absolute local velocity'])
 (P/'selection.json').write_text(json.dumps(selection,indent=2))
 im=Image.new('RGB',(1700,860),BG);d=ImageDraw.Draw(im);d.text((60,35),'Mesh sensitivity',font=font(40,True),fill=TEXT)
 for pane,(key,title) in enumerate([('J_ratio','Downward momentum ratio'),('speed_ratio','Near-liquid P95 speed ratio')]):
  x0=100+pane*820;y0=215;w=620;h=500;d.text((x0,135),chr(65+pane)+'  '+title,font=font(27,True),fill=TEXT)
  for val in [0,.25,.5,.75,1]:
   yy=y0+h*(1-val/1.1);d.line((x0,yy,x0+w,yy),fill=GRID,width=2);d.text((x0-40,yy-12),f'{val:.2f}',font=font(20),fill=MUTED)
  pts=[]
  for i,r in enumerate(grid):
   xx=x0+70+i*240;yy=y0+h*(1-r[key]/1.1);pts.append((xx,yy));d.text((xx-24,y0+h+17),str(r['dx_mm']),font=font(25),fill=TEXT);d.text((xx-30,yy-40),f'{r[key]:.3f}',font=font(22,True),fill=TEAL)
  d.line(pts,fill=TEAL,width=5)
  for xx,yy in pts:d.ellipse((xx-7,yy-7,xx+7,yy+7),fill=TEAL)
  d.text((x0+160,y0+h+62),'Grid spacing [mm]',font=font(25),fill=MUTED)
 im.save(P/'figures/mesh_and_tradeoff.png',dpi=(300,300))
 finest=read(chosen+'_dx0.2');gas_volume=finest['gas_volume_voxel_uL'];bulk_time=gas_volume/1000*60
 zh=f'''# 氣流設計分析

## 結論與列印幾何

採用「入口下方寬導流台階」，case `{chosen}`，整合在氣蓋左側壁，台階本身不增加列印件或螺絲；確保井口密封壓縮所需的可拆壓板另計於八件操作列印件。這是兼顧流向、可清洗與低零件數的原型候選，不能稱為全域最佳或已證實保護細胞。

導流台階實體座標：X = −7.4 至 −0.2 mm；Y = −4 至 +4 mm；Z = 58.2 至 59.4 mm。共同氣室 X ±7.4、Y ±6.0、Z 57.3–62.5 mm。進出氣口內徑2.4 mm，中心 Y=0、Z=60.8 mm，末端 X=±18 mm。局部氣蓋頂厚1.5 mm至Z64，外層上蓋板另延伸至Z66；CFD內頂仍為Z62.5。壓板實體Z56.1–57.3，四個4×2.8 mm孔；上方周邊密封片Z57.3–57.9，中央氣體仍從57.3開始，蓋體下緣57.9。壓板可拆洗，因此操作件數增為八件。四井中心(±3.3,±2.65)，液體截面4.0×2.8 mm，內底Z43，井頂55.5；100 µL液面Z51.9286 mm。氣體共同、液體分開。

## 為何不選直立擋板

真正目標是避開朝向液面的集中氣流，並非製造亂流。1 mL/min時入口Re約0.589，本模型屬低Re層流；重新轉向不等於湍流。18個實際CFD幾何包含無擋板、12孔板、9個直立牆、3個L形罩、4個水平台階。直立牆阻擋水平入口後，把部分流量轉向下方，最差井口向下動量反而增加。L形罩也未優於無擋板。寬而較長的水平台階在三個網格皆降低此方向性指標，而且無封閉上層暗腔。

## 結果及代價

所有數值指氣體，不是培養液內細胞的剪力。井口下方1 mm的最差井向下動量代理值為 ρ Σ max(−uz,0)² ΔA；近液面速度P95取液面上0.6–1.4 mm的氣體。相對無擋板，台階的動量指標在0.4、0.3、0.2 mm網格分別降低30.9%、30.1%、36.1%。三個網格皆支持改善方向，但絕對局部數值仍對網格敏感；沒有完成網格獨立性證明。

| 最細0.2 mm網格，換算1 mL/min | 無擋板 | 選定台階 |
|---|---:|---:|
| 最差井口向下動量代理值，N | {grid[-1]['open_J_N']:.4g} | {grid[-1]['shelf_J_N']:.4g} |
| 最差井近液面速度P95，mm/s | {grid[-1]['open_P95_mm_s']:.6f} | {grid[-1]['shelf_P95_mm_s']:.6f} |
| 氣蓋內壓差，Pa | {grid[-1]['open_pressure_Pa']:.6f} | {grid[-1]['shelf_pressure_Pa']:.6f} |
| 四井向下循環通量CV | {grid[-1]['open_flux_CV']:.4f} | {grid[-1]['shelf_flux_CV']:.4f} |

台階改善方向性指標，但四井氣體循環的對稱性變差。這個CV不是氣味濃度CV；沒有模擬濃度，不能宣稱四井暴露一致或不一致。最細網格的近液面速度降低約20.1%，仍不能轉換成細胞保護或暴露均勻性的證據。孔板在粗網格可降低近液面速度更多，也降低井口向下動量，但形成不易清潔的上層空間。設計選擇明確包含製造與清潔取捨，並非把所有指標都說成改善。

## 數值驗證

自寫三維D3Q19 BGK格子波茲曼法，雙精度；τ=0.8篩選，ρ=1.2 kg/m³、μ=1.8×10⁻⁵ Pa·s。固體與固定液面皆為半格反彈無滑移，入口／出口非平衡外推定壓。每200步檢查速度相對改變<2×10⁻⁵、進出口質量不平衡<0.2%，連續三次才算收斂。{checks['all_run_count']}次求解均達宣告標準；最大末次質量不平衡{checks['max_final_mass_imbalance']*100:.4f}%。C#與NumPy管流速度相對L2差{error:.3g}。圓管Hagen–Poiseuille流量誤差在τ0.8為{checks['tube_flow_error_tau08']*100:.2f}%，τ0.55為{checks['tube_flow_error_tau055']*100:.2f}%。這些是數值檢查，不是儀器實驗驗證。

篩選使用小壓差求解，再依低Re線性近似換算至1 mL/min。另以τ0.55實際算出無擋板{a['Q_actual_mL_min']:.4f}、台階{b['Q_actual_mL_min']:.4f} mL/min；台階Re={b['port_Re_actual']:.3f}，相對密度差約{b['relative_density_range']*100:.3f}%。這兩次實际流量很接近，動量比為{confirm['J_ratio']:.3f}，支持導流效果方向相同。更改τ也改變階梯壁面誤差，因此不可說差異全部來自慣性。

三個網格未建立局部指標的網格獨立性，禁止把末位小數當精準預測。沒有氣味傳輸、溶入培養液、蒸發、液面變形、細胞損傷或濾器管路模型。氣蓋內壓差不能用來選泵；外部濾器可能主導阻力。入口絕對壓力、呼吸／溫控與細胞相容性仍須實驗。

最細網格的氣體空間體積約{gas_volume/1000:.3f} mL；在1 mL/min時，單純V/Q約{bulk_time:.1f}秒。這只是整體體積／流量尺度，不是四井濃度達穩態的時間，也不代表這段時間即可完成一次生物量測。量測視窗2秒與完整氣味暴露時間必須分開設定。

## 圖、影片和重現

`figures/design_comparison.png`呈現18組比較；`figures/velocity_sections.png`有入口與井截面；`figures/mesh_and_tradeoff.png`展示網格敏感性。`airflow_comparison.mp4`以無擋板、孔板、選定台階並排呈現實際保存速度場的RK2示蹤轨跡。60秒物理時間壓縮成20秒播放，400個示蹤點先分布在入口與氣室，出口點回置入口。它不是氣味分子擴散、不是即時非穩態CFD，也不是細胞運動。影片不描繪湍流。

依README重建求解器與圖表；原始JSON、NPZ、收斂CSV在`results/`。`selection.json`是CAD決策及座標依據，`geometry_and_cases.json`記錄每個掃描幾何，`mesh_refinement.csv`與`validation.json`可供審稿核對。

## 短期實驗

先只用水做漏氣／漏液與流量設定；不要把染色液流場當氣體流場的等效驗證。選定氣蓋與同幾何無台階對照，在同一流量測試讀值穩定性、四井反應時間／幅度的差異，每次保持液量、溫度、細胞批次相同。若沒有氣體濃度感測器，應表述為「整機暴露反應比較」，不可寫成已量測局部氣速或已驗證CFD。兩週內以確認沒有明顯非對稱偏差為優先；不必追求複雜流場量測。

## 參考方法

Guo, Zheng & Shi (2002), non-equilibrium extrapolation pressure boundaries: https://cpb.iphy.ac.cn/en/article/doi/10.1088/1009-1963/11/4/310 。Nash et al., boundary-condition comparison and curved-wall accuracy: https://arxiv.org/abs/1211.0205 。本程式是自寫實作，引用方法不等於作者驗證本程式。
'''
 en=f'''# Airflow design analysis

## Decision and geometry

The selected engineering prototype is the wide inlet shelf (`{chosen}`), integrated into the left gas-cap wall. The shelf adds no component or fastener; the separate compression plate required for sealing is included in the eight-part assembly. It is a practical trade-off, not a global optimum or a biologically validated protective device.

Shelf solid: X −7.4 to −0.2 mm, Y −4 to +4 mm, Z 58.2 to 59.4 mm. Common plenum X±7.4, Y±6.0, Z 57.3–62.5 mm. Both horizontal ports: ID 2.4 mm, Y=0, Z=60.8, end X=±18 mm. The local cap roof is 1.5 mm thick to Z64, and the outer lid panel continues to Z66; the CFD inner roof remains Z62.5. A removable compression plate occupies Z56.1–57.3 with four 4×2.8 mm openings; the upper perimeter gasket spans Z57.3–57.9 while the center remains gas. The cap lower edge is 57.9. This sealing design requires eight operating prints. Four liquid cavities center (±3.3,±2.65), cross-section 4×2.8 mm, floor Z43, rim Z55.5. A 100 µL fill gives surface Z51.9286 mm. Shared gas; separate liquids.

## What was compared

The objective is to avoid concentrated flow directed toward the liquid, not to create turbulence. Port Re≈0.589 at 1 mL/min; directional redistribution is laminar. Eighteen actual CFD geometries cover an open plenum, an adapted 12-hole plate, nine vertical walls, three L-shaped hoods, and four shelves. Vertical walls redirected part of the inlet flow downward and increased the worst-well downward-momentum proxy. The wide shelf reduced this proxy on all three grids while remaining open and accessible for cleaning.

## Results and trade-offs

The directional metric is the maximum across wells of ρΣmax(−uz,0)²ΔA at a plane 1 mm below the rim. Near-liquid gas speed P95 is evaluated 0.6–1.4 mm above the fixed liquid surface. Neither is stress on submerged cells.

| At 1 mL/min, finest 0.2 mm grid | Open plenum | Selected shelf |
|---|---:|---:|
| Worst-well downward-momentum proxy, N | {grid[-1]['open_J_N']:.4g} | {grid[-1]['shelf_J_N']:.4g} |
| Worst-well near-liquid P95 speed, mm/s | {grid[-1]['open_P95_mm_s']:.6f} | {grid[-1]['shelf_P95_mm_s']:.6f} |
| Internal pressure drop, Pa | {grid[-1]['open_pressure_Pa']:.6f} | {grid[-1]['shelf_pressure_Pa']:.6f} |
| CV of downward gas-circulation flux across wells | {grid[-1]['open_flux_CV']:.4f} | {grid[-1]['shelf_flux_CV']:.4f} |

The momentum reduction is 30.9%, 30.1%, and 36.1% on 0.4, 0.3, and 0.2 mm grids, respectively. All three grids support the direction of improvement, while absolute local quantities remain grid sensitive. Near-liquid P95 decreases by 20.1% on the finest grid; this is not evidence of cell protection or uniform exposure. Gas-circulation symmetry worsens. This CV is not an odor-concentration CV; concentration was not solved. The perforated plate reduces near-liquid speed more on the coarse grid, and reduces mouth momentum, but creates a less accessible upper cavity. The selected design therefore includes an explicit cleanability/part-count trade-off.

## Numerical method and checks

Custom double-precision 3D D3Q19 BGK lattice-Boltzmann implementation; screening τ=0.8, air ρ=1.2 kg/m³ and μ=1.8e−5 Pa·s. Halfway bounce-back on rigid walls and stationary liquid surfaces; non-equilibrium-extrapolation pressure terminals. Convergence requires relative velocity change over 200 steps <2e−5 and inlet/outlet mass imbalance <0.2%, for three consecutive reports. All {checks['all_run_count']} solves meet these declared criteria; maximum final imbalance is {checks['max_final_mass_imbalance']*100:.4f}%. C# versus NumPy tube-field relative L2 difference is {error:.3g}. Hagen–Poiseuille tube-flow errors are {checks['tube_flow_error_tau08']*100:.2f}% at τ=0.8 and {checks['tube_flow_error_tau055']*100:.2f}% at τ=0.55. Numerical benchmarks are not experimental device validation.

Screening fields were solved at small pressure forcing and Stokes-normalized to 1 mL/min. Separate τ=0.55 runs actually produced {a['Q_actual_mL_min']:.4f} mL/min (open) and {b['Q_actual_mL_min']:.4f} mL/min (shelf); shelf Re={b['port_Re_actual']:.3f}, relative density range {b['relative_density_range']*100:.3f}%. Their normalized momentum ratio is {confirm['J_ratio']:.3f}, supporting the same directional trend near the intended operating flow. Changing τ also changes staircase-boundary error, so this is not an isolated inertia study.

Local metrics are not grid independent. No odor transport/dissolution, evaporation, moving liquid, cell injury, external filter or tubing is modeled. Internal pressure drop must not be used alone to size a pump. There is no prediction of sterility, cell viability, receptor activation or uniform exposure.

The finest-grid gas volume is approximately {gas_volume/1000:.3f} mL. At 1 mL/min, V/Q is {bulk_time:.1f} seconds. This is only a bulk volume/flow scale, not a well-concentration equilibration time or a complete biological measurement duration. Keep the 2-second acquisition window distinct from the full odor-exposure duration.

## Figures, video and reproduction

`figures/design_comparison.png`: 18-case screening. `figures/velocity_sections.png`: inlet and well sections. `figures/mesh_and_tradeoff.png`: grid sensitivity. `airflow_comparison.mp4`: three-case RK2 tracer visualization from saved steady velocity fields; 60 physical seconds in 20 playback seconds. Four hundred markers begin in the inlet and gas spaces; exited markers are reinjected. It is not transient CFD, molecular diffusion or cell motion, and does not depict turbulence. The raw JSON/NPZ/convergence CSV files are in `results/`; geometry, selection and verification are machine-readable.

## Short experimental check

First use water-only wells to check leakage and establish external flow. Do not interpret a dyed-liquid flow experiment as equivalent to this gas CFD. Compare the selected cap and an otherwise identical no-shelf control at the same flow, liquid volume, temperature and cell batch. Record baseline stability and per-well response timing/amplitude. Without local gas-concentration or velocity instrumentation, describe this as a whole-system exposure comparison, not a validated velocity-field measurement. Detecting a large inter-well asymmetry is a reasonable two-week priority; elaborate flow visualization is unnecessary.

## Method references

Guo, Zheng & Shi (2002), non-equilibrium extrapolation: https://cpb.iphy.ac.cn/en/article/doi/10.1088/1009-1963/11/4/310 . Nash et al., boundary-condition and curved-wall accuracy comparison: https://arxiv.org/abs/1211.0205 . The implementation is custom; citing these methods does not imply those authors validated this code.
'''
 (P/'Airflow_Analysis_ZH.md').write_text(zh,encoding='utf-8');(P/'Airflow_Analysis_EN.md').write_text(en,encoding='utf-8')
 if (P/'gas_transport_summary.json').exists() and (P/'hole_sweep_summary.json').exists():
  from publication_notes import create
  create()
 print(json.dumps(checks,indent=2))
if __name__=='__main__':main()
