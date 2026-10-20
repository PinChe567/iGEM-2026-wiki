"""Plot the additivity check plainly, without recomputing or changing source data.
Run this script from any directory. Input: sibling additivity_check.csv.
"""
from pathlib import Path
import csv,json,hashlib
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

OUT=Path(__file__).resolve().parent

def main():
    source=OUT/'additivity_check.csv'
    source_hash=hashlib.sha256(source.read_bytes()).hexdigest()
    rows=list(csv.DictReader(source.open(encoding='utf-8')))
    assert [r['channel'] for r in rows]==['D1','D2','D3','D4']
    measured=np.array([100*float(r['uniform10_measured_mV'])/float(r['sum_isolated10_mV']) for r in rows])
    stored=np.array([100*float(r['uniform_to_additive_ratio']) for r in rows])
    np.testing.assert_allclose(measured,stored,rtol=1e-12,atol=1e-12)
    x=np.arange(4);width=.55
    plt.rcParams.update({'font.family':'sans-serif','font.sans-serif':['Arial','DejaVu Sans'],'font.size':13,
       'axes.spines.top':False,'axes.spines.right':False,'axes.labelcolor':'#233845','text.color':'#233845','svg.fonttype':'none'})
    fig,ax=plt.subplots(figsize=(11.2,5.9),layout='constrained')
    ax.axhline(100,color='#7e929e',ls='--',lw=1.8,label='Sum of single-well controls (100%)',zorder=2)
    actual=ax.bar(x,measured,width=width,color='#276c83',label='All four wells measured together',zorder=3)
    for bar,value in zip(actual,measured):
        ax.text(bar.get_x()+bar.get_width()/2,value+2.3,f'{value:.1f}%',ha='center',va='bottom',fontsize=15,weight='bold',color='#1c5267')
    ax.set(xticks=x,xticklabels=[r['channel'] for r in rows],ylim=(0,114),yticks=[0,25,50,75,100],ylabel='Relative signal (%)',xlabel='Readout channel')
    ax.set_title('Predicted and measured four-well signals',fontsize=18,weight='bold',pad=58)
    ax.legend(loc='lower center',bbox_to_anchor=(.5,1.01),ncol=2,frameon=False,fontsize=12,handlelength=1.5,columnspacing=2.0)
    ax.grid(axis='y',alpha=.16);ax.set_axisbelow(True)
    ax.text(.5,-.17,'If the separate signals added directly, each bar would reach the 100% line.',transform=ax.transAxes,ha='center',va='top',fontsize=12,color='#4a626e')
    fig.savefig(OUT/'single-well-additivity.svg',bbox_inches='tight',metadata={'Date':None})
    fig.savefig(OUT/'single-well-additivity.png',dpi=180,bbox_inches='tight');plt.close(fig)
    metadata=dict(source='additivity_check.csv',source_sha256=source_hash,
       formula='100 * uniform10_measured_mV / sum_isolated10_mV',
       interpretation='Relative measured readout signal, not concentration recovery or accuracy.',
       reference='For each readout, the sum of four separate blank-corrected single-well 10 uM controls is defined as 100%.',
       phase_projection='Each complex vector is projected onto the readout\'s own-source phase, as already recorded in additivity_check.csv.',
       conditions='Single-source control: one 100 uL 10 uM fluorescein well and three 100 uL DDW wells. Uniform measurement: four 100 uL 10 uM fluorescein wells.',
       values=[dict(channel=r['channel'],predicted_sum_percent=100.0,measured_percent=float(v),sum_isolated10_mV=float(r['sum_isolated10_mV']),uniform10_measured_mV=float(r['uniform10_measured_mV'])) for r,v in zip(rows,measured)])
    (OUT/'single-well-additivity-metadata.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
    assert hashlib.sha256(source.read_bytes()).hexdigest()==source_hash
    print(json.dumps(metadata['values'],indent=2))

if __name__=='__main__':main()
