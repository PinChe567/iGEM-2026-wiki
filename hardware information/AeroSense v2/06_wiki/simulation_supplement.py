"""Render current simulation and workflow links; no change to printable inventory."""
from pathlib import Path
import html,json

def section(root,lang):
    en=lang=='EN';T=lambda z,e:e if en else z
    def link(path,label):return f'<a href="{html.escape(path)}">{html.escape(label)}</a>'
    op=json.loads((root/'02_simulation/airflow/operating_sweep_summary.json').read_text())
    c=op['chosen_conditional_point'];fine=op['numerical_checks']['selected_point_grid']['worst_t90_s']
    blocks=['<section id="transport-and-signal"><h2>'+T('模擬、實測校正與最小驗證流程','Simulation, measured correction and a focused validation workflow')+'</h2>']
    blocks.append('<p>'+T('氣體速度、氣相濃度及PD訊號是不同物理量。所有圖有獨立雙語說明；本頁保留模型假設，不把計算結果說成細胞實驗。','Gas velocity, gas concentration and detector signal are different observables. Every figure has separate bilingual notes; computed outcomes are not presented as cell experiments.')+'</p>')
    blocks.append('<p>'+link('../02_simulation/INDEX_'+lang+'.html',T('完整圖、影片與互動圖總覽','Complete figures, movies and interactive gallery'))+'</p>')
    entries=[('optics',T('光學訊號與干擾','Optical signals and interference'),[(f'Figure_Guide_{lang}.md',T('逐圖方法與結果','Figure methods and results')),(f'Analysis_{lang}.md',T('完整光學分析','Full optical analysis'))]),('airflow',T('固定STL的流量選擇','Operating flow for the fixed STL'),[(f'Flow_Operation_{lang}.md',T('條件式操作點與一個泵的配置','Conditional operating point and one-pump arrangement')),('operating_sweep_3d.html',T('21組流量／擴散係數互動圖','21-condition flow/diffusivity explorer')),(f'Figure_Guide_{lang}.md',T('逐圖說明','Figure notes'))]),('membrane',T('技術附錄：液體／薄膜敏感性','Technical appendix: liquid and membrane sensitivity'),[(f'Analysis_{lang}.md',T('條件式傳質假設與限制','Conditional transport assumptions and limits')),(f'Figure_Guide_{lang}.md',T('傳質圖說','Transport figure notes'))])]
    for folder,label,files in entries:
        blocks.append('<h3>'+label+'</h3><div class="downloads">')
        for filename,label in files:
            if (root/'02_simulation'/folder/filename).exists():blocks.append(link('../02_simulation/'+folder+'/'+filename,label))
        blocks.append('</div>')
    blocks.append('<p>'+T(f'固定平台的候選流量為{c["Q_mL_min"]:g} mL/min，最慢氣相t90約{c["worst_t90_s"]:.2f}秒、細網格{fine:.2f}秒；1 mL/min舊結果仍是基準。這些時間只指液面上方氣體，不能當作底部細胞或GCaMP反應時間。',f'The fixed-shelf candidate is {c["Q_mL_min"]:g} mL/min, with worst gas t90≈{c["worst_t90_s"]:.2f} s and a refined-grid value of {fine:.2f} s; earlier 1-mL/min results remain the baseline. These times concern gas above the liquid, not bottom-cell or GCaMP response.')+'</p>')
    blocks.append('<div class="downloads">'+link('../03_software/guides/Measured_Correction_'+lang+'.md',T('以實測I/Q空白校正','Measured I/Q blank correction'))+link('../07_validation/Validation_Plan_'+lang+'.md',T('必要預檢後的一個標準品實驗','One standard-solution experiment after essential preflight'))+'</div>')
    blocks.append('<p class="note">'+T('每井100 µL、細胞貼附井底的設計條件不變。液體傳輸、PDMS或蛋白輔助捕捉等機制需分開驗證；疏水PDMS也不能直接當成水蒸氣阻隔膜。本資料沒有細胞反應、生物相容性或使用者滿意度的實測結果。','The100-µL well and bottom-adherent-cell design remain unchanged. Liquid transport, PDMS and protein-assisted capture require separate validation; hydrophobic PDMS is not automatically a water-vapor barrier. No measured cell response, material compatibility or user satisfaction is claimed.')+'</p></section>')
    return ''.join(blocks)