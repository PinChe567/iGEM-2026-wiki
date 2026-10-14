"""Reproduce the AeroSense spectral-alignment figures from the supplied CSVs.

Requires Python 3.10+, numpy and matplotlib. Put this script beside its five
input CSV files. Run `python replot_spectra.py`. Chinese output uses Microsoft
JhengHei on Windows, or an explicit --font-cjk path on other systems.

GCaMP6f samples are approximate digitization of Dana et al. (2019), Supplementary
Fig. 1, calcium-bound traces; see spectral-provenance.json for source/calibration.
The curves stop at digitized endpoints. The LED trace remains a Gaussian model.
No source measurement or simulation is modified by this plotting script.
"""
from pathlib import Path
import argparse, csv
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--font-cjk',help='CJK font file for Traditional Chinese figures')
parser.add_argument('--output',help='Output directory; defaults to script directory')
args=parser.parse_args()
HERE=Path(__file__).resolve().parent
OUT=Path(args.output) if args.output else HERE
OUT.mkdir(parents=True,exist_ok=True)
cjk_font=args.font_cjk
if not cjk_font:
 for candidate in ['C:/Windows/Fonts/msjh.ttc','/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc','/System/Library/Fonts/PingFang.ttc']:
  if Path(candidate).exists():
   cjk_font=candidate
   break
if not cjk_font: print('No CJK font found; producing English figures. Pass --font-cjk for Chinese.')
ex_s=np.loadtxt(HERE/'gcamp6f_ca_bound_excitation_digitized.csv',delimiter=',',skiprows=1)
em_s=np.loadtxt(HERE/'gcamp6f_ca_bound_emission_digitized.csv',delimiter=',',skiprows=1)
lee=np.genfromtxt(HERE/'lee101_official_spectrum.csv',delimiter=',',names=True)
pd=np.genfromtxt(HERE/'VEMD5060X01_typical_response.csv',delimiter=',',names=True)
model=np.genfromtxt(HERE/'filter_comparison_spectra.csv',delimiter=',',names=True)
from matplotlib.font_manager import FontProperties
EN_FONT=FontProperties(family='DejaVu Sans')
ZH_FONT=FontProperties(fname=cjk_font) if cjk_font else EN_FONT
translations={
 'Spectral alignment':'光譜配置', 'Excite and collect':'激發與螢光收集',
 'Filter and detector':'濾光片與偵測器', 'Relative intensity':'相對強度',
 'Wavelength (nm)':'波長（nm）', 'Transmission (%)':'穿透率（%）',
 'Responsivity (A/W)':'響應度（A/W）',
 'LED model: 468 nm, 25 nm FWHM':'LED 模型：468 nm，半高全寬 25 nm',
 'GCaMP6f +Ca²⁺: excitation':'GCaMP6f 結合鈣離子：激發',
 'GCaMP6f +Ca²⁺: emission':'GCaMP6f 結合鈣離子：放射',
 'LEE 101: one layer':'LEE 101：一層', 'LEE 101: two layers (T²)':'LEE 101：兩層（T²）',
 'VEMD5060X01: typical response':'VEMD5060X01：典型響應',
 'GCaMP6f: digitized Dana et al. (2019), Supplementary Fig. 1. LED: current model input.':'GCaMP6f：數位化 Dana 等人（2019）補充圖 1；LED：現行模型輸入。',
 'LEE: manufacturer samples. PD: digitized typical response. Two layers: calculated T².':'LEE：原廠取樣值；PD：數位化典型曲線；兩層濾片：以 T² 計算。'
}
plt.rcParams.update({'svg.fonttype':'path','font.size':12,'axes.labelcolor':'#19374d','xtick.color':'#415c6e','ytick.color':'#415c6e','axes.edgecolor':'#9db6c6','axes.spines.top':False,'axes.spines.right':False,'savefig.facecolor':'white'})
for lang in (['en','zh-Hant'] if cjk_font else ['en']):
 font=ZH_FONT if lang=='zh-Hant' else EN_FONT
 def text(s):return translations.get(s,s) if lang=='zh-Hant' else s
 fig,axes=plt.subplots(2,1,figsize=(11.8,8.9),dpi=180,sharex=True)
 fig.subplots_adjust(left=.10,right=.88,bottom=.16,top=.90,hspace=.36)
 fig.suptitle(text('Spectral alignment'),fontproperties=font,fontsize=23,fontweight='bold',color='#173b54',x=.10,ha='left',y=.975)
 a=axes[0]
 a.plot(model['wavelength_nm'],model['assumed_LED_power_density']/model['assumed_LED_power_density'].max(),color='#2478c7',lw=2.5,ls=(0,(5,2)),label=text('LED model: 468 nm, 25 nm FWHM'))
 a.plot(ex_s[:,0],ex_s[:,1],color='#178b78',lw=2.5,ls=(0,(2.5,1.8)),label=text('GCaMP6f +Ca²⁺: excitation'))
 a.plot(em_s[:,0],em_s[:,1],color='#55a836',lw=2.8,label=text('GCaMP6f +Ca²⁺: emission'))
 a.set_title('A  '+text('Excite and collect'),loc='left',fontproperties=font,fontsize=15,fontweight='bold',pad=12)
 a.set_ylim(0,1.08);a.set_ylabel(text('Relative intensity'),fontproperties=font,fontsize=12)
 a.legend(loc='upper right',frameon=False,prop=font,fontsize=11,labelspacing=.8)
 a.tick_params(labelbottom=True)
 b=axes[1]
 b.plot(lee['wavelength_nm'],lee['transmission_percent'],color='#d28a18',lw=2.8,label=text('LEE 101: one layer'))
 b.plot(lee['wavelength_nm'],lee['transmission_percent']**2/100,color='#ab6513',lw=2.4,ls=(0,(5,2)),label=text('LEE 101: two layers (T²)'))
 b.set_title('B  '+text('Filter and detector'),loc='left',fontproperties=font,fontsize=15,fontweight='bold',pad=12)
 b.set_ylim(0,105);b.set_ylabel(text('Transmission (%)'),fontproperties=font,fontsize=12)
 right=b.twinx();right.spines['right'].set_visible(True);right.spines['top'].set_visible(False)
 right.plot(pd['wavelength_nm'],pd['typical_responsivity_A_W'],color='#76549e',lw=2.2,label=text('VEMD5060X01: typical response'))
 right.set_ylim(0,.60);right.set_ylabel(text('Responsivity (A/W)'),fontproperties=font,fontsize=12,color='#76549e');right.tick_params(axis='y',colors='#76549e')
 lines,labels=b.get_legend_handles_labels();rr,ll=right.get_legend_handles_labels();b.legend(lines+rr,labels+ll,loc='upper left',frameon=False,prop=font,labelspacing=.8)
 for ax in axes:
  ax.set_xlim(400,700);ax.set_xticks(np.arange(400,701,50));ax.grid(axis='y',color='#dce7ed',lw=.7);ax.set_axisbelow(True)
  for wavelength in [470,520]:ax.axvline(wavelength,color='#c4d4df',lw=.8,ls=(0,(2,3)),zorder=0)
 b.set_xlabel(text('Wavelength (nm)'),fontproperties=font,fontsize=13,labelpad=8)
 fig.text(.10,.075,text('GCaMP6f: digitized Dana et al. (2019), Supplementary Fig. 1. LED: current model input.'),fontproperties=font,fontsize=10,color='#526b7d')
 fig.text(.10,.048,text('LEE: manufacturer samples. PD: digitized typical response. Two layers: calculated T².'),fontproperties=font,fontsize=10,color='#526b7d')
 for suffix in ['svg','png']:fig.savefig(OUT/f'spectral-alignment-{lang}.{suffix}')
 plt.close(fig)

long=[]
def add_series(name,array,unit,basis):
 for x,y in array:long.append([name,float(x),float(y),unit,basis])
add_series('GCaMP6f_Ca_bound_excitation',ex_s,'relative fluorescence','Dana2019 SupplFig1 raster digitization')
add_series('GCaMP6f_Ca_bound_emission',em_s,'relative fluorescence','Dana2019 SupplFig1 raster digitization')
add_series('LED_model',np.column_stack((model['wavelength_nm'],model['assumed_LED_power_density']/model['assumed_LED_power_density'].max())),'relative intensity','Gaussian model:468nm peak,25nm FWHM')
add_series('LEE101_one_layer',np.column_stack((lee['wavelength_nm'],lee['transmission_percent'])),'percent','manufacturer numeric samples')
add_series('LEE101_two_layers',np.column_stack((lee['wavelength_nm'],lee['transmission_percent']**2/100)),'percent','computed squared single-layer transmission')
add_series('VEMD5060X01',np.column_stack((pd['wavelength_nm'],pd['typical_responsivity_A_W'])),'A/W','manufacturer typical graph vector digitization and950nm normalization')
with (OUT/'spectral-alignment-data.csv').open('w',newline='',encoding='utf8') as stream:
 writer=csv.writer(stream);writer.writerow(['series','wavelength_nm','value','unit','basis']);writer.writerows(long)

print('Wrote spectral figures and plot-data CSV to',OUT)
