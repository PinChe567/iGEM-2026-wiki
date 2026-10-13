#!/usr/bin/env python3
"""Render audited P2 tables as scientific figures; requires matplotlib and numpy.
Run analyze_plate_p2.py first. No values are imputed, rescaled by gain, or fitted.
"""
import argparse
import csv
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap, TwoSlopeNorm
from matplotlib.patches import Rectangle

TEAL, DARK, GREY, ORANGE = "#087987", "#083e46", "#697779", "#b96036"
plt.rcParams.update({"font.family":"DejaVu Sans", "font.size":10,
    "axes.labelcolor":DARK, "text.color":DARK, "xtick.color":DARK,
    "ytick.color":DARK, "axes.edgecolor":"#b8cece", "axes.spines.top":False,
    "axes.spines.right":False, "axes.titleweight":"bold", "svg.fonttype":"none",
    "savefig.facecolor":"white", "figure.facecolor":"white"})


def read(path):
    with path.open(encoding="utf-8",newline="") as f:
        return list(csv.DictReader(f))


def save(fig,out,name):
    for suffix in ("svg","png"):
        fig.savefig(out/f"{name}.{suffix}",dpi=180,bbox_inches="tight",pad_inches=.18,
                    metadata={"Creator":"AeroSense: plot_plate_p2.py"} if suffix=="svg" else {})
    plt.close(fig)


def condition_comparison(bywell, out):
    """Compare all A/H wells without pooling them or implying paired samples."""
    labels = [bywell[f"A{c:02d}"]["condition"].replace("+", " + ") for c in range(1,13)]
    all_values=[100*float(bywell[f"{r}{c:02d}"]["dF_test_retained"]) for r in "AH" for c in range(1,13)]
    xmin=10*np.floor(min(all_values)/10)-2
    xmax=10*np.ceil(max(all_values)/10)+2
    # A/H are separate wells. Deliberately do not connect the observations.
    for mobile in (False, True):
        fig, ax = plt.subplots(figsize=(5.25, 8.6) if mobile else (10.5, 6.6))
        fig.subplots_adjust(left=.32 if mobile else .25, right=.965,
                            top=.77 if mobile else .78, bottom=.13 if mobile else .15)
        fig.text(.045 if mobile else .055,.956,"VUAA1 and buffer across the plate",
                 fontsize=14 if mobile else 20,weight="bold")
        fig.text(.045 if mobile else .055,.909,"Peak test excursion above each well’s F₀b",
                 fontsize=9.3 if mobile else 11,color=GREY)
        for c in range(1,13):
            if c%2:
                ax.axhspan(c-1-.5,c-1+.5,color="#f0f8f8",zorder=0)
        for row, color, marker, label, offset in [
            ("A",TEAL,"o","VUAA1 (A wells)",-.12),
            ("H",ORANGE,"D","Buffer only (H wells)",.12)]:
            vals=[100*float(bywell[f"{row}{c:02d}"]["dF_test_retained"]) for c in range(1,13)]
            ax.scatter(vals,np.arange(12)+offset,s=46 if mobile else 60,color=color,
                       marker=marker,label=label,zorder=3,edgecolors="white",linewidths=.7)
        ax.axvline(0,color="#adc8ca",lw=1,zorder=1)
        ax.set(ylim=(11.7,-.7),xlim=(xmin,xmax),xticks=np.arange(xmin+2,xmax,10),yticks=range(12),yticklabels=labels,
               xlabel="Test excursion (%)")
        ax.tick_params(axis="y",length=0,labelsize=8.3 if mobile else 10,pad=8)
        ax.tick_params(axis="x",labelsize=9)
        ax.spines["left"].set_visible(False)
        ax.grid(axis="x",color="#deebeb",lw=.7)
        for well, dy in [("A11",-.12),("A12",-.12),("H10",.12)]:
            val=100*float(bywell[well]["dF_test_retained"])
            ax.annotate(f"{val:.2f}",(val,int(well[1:])-1+dy),xytext=(5,-2),
                        textcoords="offset points",fontsize=8.2 if mobile else 9.5,
                        color=TEAL if well[0]=="A" else ORANGE,weight="bold")
        ax.legend(loc="lower left",bbox_to_anchor=(-.01,1.01),frameon=False,
                  ncol=1 if mobile else 2,fontsize=9.4,handletextpad=.5,columnspacing=2)
        fig.text(.045 if mobile else .055,.045,
                 "Each point is one well on one plate.\nVUAA1 and buffer are separate wells; gain is unreported." if mobile else
                 "Each point is one well on one plate. VUAA1 and buffer are separate wells; numeric gain is unreported.",
                 fontsize=8.3 if mobile else 9.5,color=GREY,linespacing=1.55)
        save(fig,out,"plate-p2-condition-comparison"+("-mobile" if mobile else ""))


def correction_mobile(bywell, out):
    selected=["A11","A12","H03","H10","H11"]
    labels=["A11  ORCO · VUAA1","A12  Untransfected · VUAA1","H03  Or42a + ORCO · buffer",
            "H10  Or35a + ORCO · buffer","H11  ORCO · buffer"]
    fig,axs=plt.subplots(5,1,figsize=(5.25,10.4),sharex=True)
    fig.subplots_adjust(left=.13,right=.92,top=.84,bottom=.09,hspace=.72)
    fig.text(.055,.966,"The correction, separated",size=16,weight="bold")
    fig.text(.055,.925,"Earlier buffer, test and corrected difference",size=9.5,color=GREY)
    for ax,well,label in zip(axs,selected,labels):
        ax.set_title(label,loc="left",fontsize=10.2,pad=7)
        for i,(key,color,marker,name) in enumerate([
                ("dF_blank_computed",GREY,"s","Earlier buffer (%)"),
                ("dF_test_computed",ORANGE,"^","Test (%)"),
                ("dF_corr_computed",TEAL,"o","Corrected (pp)")]):
            val=100*float(bywell[well][key])
            ax.scatter(val,i,color=color,marker=marker,s=36,zorder=3,label=name)
            ax.text(val+1.7,i,f"{val:+.2f}",va="center",color=color,size=8.5)
        ax.set(xlim=(-36,57),ylim=(2.65,-.65),yticks=[],xticks=[-30,0,30])
        ax.axvline(0,color="#b8cece",lw=.8)
        ax.spines["left"].set_visible(False)
        ax.grid(axis="x",color="#e4eeee")
    handles,legend=axs[0].get_legend_handles_labels()
    fig.legend(handles,legend,loc="upper left",bbox_to_anchor=(.06,.903),ncol=3,
               fontsize=8.2,frameon=False,handletextpad=.25,columnspacing=.7)
    axs[-1].set_xlabel("Excursion (%) / corrected difference (pp)",fontsize=9.1)
    fig.text(.055,.018,"Single-well summaries. pp = percentage points.\nNo replicate uncertainty or response threshold is estimated.",
             fontsize=8.5,color=GREY,linespacing=1.5)
    save(fig,out,"plate-p2-correction-components-mobile")


def run(data,out):
    out.mkdir(parents=True,exist_ok=True)
    rows=read(data/"plate-p2-well-summary.csv")
    bywell={r["well"]:r for r in rows}
    condition_comparison(bywell,out)
    correction_mobile(bywell,out)
    times=read(data/"plate-p2-timeseries.csv")
    def values(well,stage="test",normalized=True):
        r=[x for x in times if x["well"]==well and x["stage"]==stage]
        return [float(x["time_within_run_s"]) for x in r], [float(x["relative_to_paired_baseline"])*100 if normalized else float(x["fluorescence_RFU"]) for x in r]
    fig,axs=plt.subplots(1,2,figsize=(12.2,5.8))
    fig.subplots_adjust(left=.075,right=.985,top=.77,bottom=.32,wspace=.22)
    fig.text(.075,.945,"A rise worth testing again",size=22,weight="bold")
    fig.text(.075,.886,"Plate P2  /  10–11 October 2026  /  one well per condition",size=10.5,color=GREY)
    for ax,row,title in zip(axs,"AH",["VUAA1 · row A · nominal 50 µM","Buffer-only second addition · row H"]):
        ax.set_title(title,loc="left",pad=16,size=12)
        ax.axhline(0,color="#bed4d5",lw=1,ls=(0,(3,3)))
        for col,color,label in [(11,TEAL,"ORCO only"),(12,GREY,"Untransfected"),(10,ORANGE,"Or35a + ORCO")]:
            t,v=values(f"{row}{col:02d}")
            ax.plot(t,v,color=color,lw=2,marker="o",ms=3.2,label=f"{row}{col:02d}  {label}")
        ax.set(xlim=(-3,173),ylim=(-10,42),xticks=[0,48,96,144,168],xlabel="Time from first post-addition reading (s)")
        ax.grid(axis="y",color="#edf3f3",lw=.8)
        ax.legend(frameon=False,loc="upper left",bbox_to_anchor=(-.01,-.25),fontsize=9,ncol=1,handlelength=2)
    axs[0].set_ylabel("Fluorescence relative to paired F₀b (%)")
    axs[1].set_ylabel("Fluorescence relative to paired F₀b (%)")
    fig.text(.075,.028,"Points are repeated readings of the same well, not replicates. Addition-to-read delay and numeric gain are unreported.",size=9,color=GREY)
    save(fig,out,"plate-p2-vuaa1-and-buffer-traces")

    # A separate, genuinely stacked layout preserves legibility on narrow screens.
    fig,axs=plt.subplots(2,1,figsize=(4.9,8.8))
    fig.subplots_adjust(left=.17,right=.97,top=.85,bottom=.19,hspace=.65)
    fig.text(.075,.972,"One pilot, two comparisons",size=16,weight="bold")
    fig.text(.075,.931,"P2 · one well per condition\nNominal VUAA1 concentration from source report",size=8.8,color=GREY,linespacing=1.5)
    for ax,row,title in zip(axs,"AH",["VUAA1 · row A · nominal 50 µM","Buffer only · row H"]):
        ax.set_title(title,loc="left",pad=12,size=11)
        ax.axhline(0,color="#bed4d5",lw=1,ls=(0,(3,3)))
        for col,color,label in [(11,TEAL,"ORCO only"),(12,GREY,"Untransfected"),(10,ORANGE,"Or35a + ORCO")]:
            t,v=values(f"{row}{col:02d}")
            ax.plot(t,v,color=color,lw=1.9,marker="o",ms=3,label=label)
        ax.set(xlim=(-3,173),ylim=(-10,42),xticks=[0,48,96,144],xlabel="Time from first test reading (s)",ylabel="Relative to F₀b (%)")
        ax.grid(axis="y",color="#edf3f3",lw=.8)
    handles,labels=axs[0].get_legend_handles_labels()
    fig.legend(handles,labels,loc="lower left",bbox_to_anchor=(.135,.062),frameon=False,fontsize=10)
    fig.text(.075,.017,"Each curve is one well. No replicate uncertainty is estimated.\nNumeric gain and addition-to-read delays are unavailable.",size=8.4,color=GREY,linespacing=1.6)
    save(fig,out,"plate-p2-vuaa1-and-buffer-traces-mobile")

    fig,ax=plt.subplots(figsize=(12.2,5.3))
    fig.subplots_adjust(left=.225,right=.925,bottom=.28,top=.77)
    fig.text(.065,.946,"The correction changes the story",size=22,weight="bold")
    fig.text(.065,.882,"The corrected metric is the test excursion minus the earlier buffer excursion.",size=10.5,color=GREY)
    selected=["A11","A12","H03","H10","H11"]
    labels=["A11  ORCO · VUAA1","A12  Untransfected · VUAA1","H03  Or42a + ORCO · buffer","H10  Or35a + ORCO · buffer","H11  ORCO · buffer"]
    for k,(key,color,label) in enumerate([("dF_blank_computed",GREY,"Earlier buffer excursion"),("dF_test_computed",ORANGE,"Test excursion"),("dF_corr_computed",TEAL,"Corrected metric")]):
        y=np.arange(len(selected))+(k-1)*.20
        x=[100*float(bywell[w][key]) for w in selected]
        ax.scatter(x,y,color=color,s=48,label=label,zorder=3,marker=["s","^","o"][k])
        for xv,yv in zip(x,y):
            ax.text(xv+1.1,yv,f"{xv:+.2f}",va="center",fontsize=8.5,color=color)
    ax.axvline(0,color="#bdd1d2",lw=1)
    ax.set(yticks=range(len(selected)),yticklabels=labels,xlim=(-36,54),xticks=[-30,-15,0,15,30,45],
           xlabel="Excursion (%) or corrected difference (percentage points)")
    ax.invert_yaxis()
    ax.grid(axis="y",color="#eef3f3")
    ax.legend(frameon=False,loc="upper left",bbox_to_anchor=(-.21,-.24),ncol=3,fontsize=9)
    fig.text(.065,.025,"Each marker is one well-level summary. No uncertainty interval or response classification is inferred.",size=9,color=GREY)
    save(fig,out,"plate-p2-correction-components")

    matrix=np.full((8,12),np.nan)
    for r in rows:
        if r["dF_corr_retained"]!="": matrix[ord(r["row"])-65,int(r["column"])-1]=float(r["dF_corr_retained"])
    fig,ax=plt.subplots(figsize=(13,6.5))
    fig.subplots_adjust(left=.215,right=.915,top=.76,bottom=.26)
    fig.text(.065,.95,"A response map with two unresolved rows",size=22,weight="bold")
    fig.text(.065,.891,"Exploratory corrected metrics  /  one well per cell condition × stimulus",size=10.5,color=GREY)
    cmap=LinearSegmentedColormap.from_list("response",["#b96036","#fffefd",TEAL])
    im=ax.imshow(np.ma.masked_invalid(matrix),cmap=cmap,norm=TwoSlopeNorm(0,-.45,.45),aspect="auto")
    names=["Or7a","Or19a","Or42a","Or98a","Or22a","Or67a","Or67b","Or59b","Or85b","Or35a","ORCO\nonly","Untrans-\nfected"]
    ax.set(xticks=range(12),xticklabels=names,yticks=range(8),yticklabels=["A  VUAA1","B  Ethyl propionate","C  Isopentyl acetate","D  3-octanol","E  Benzaldehyde","F  2-heptanone","G  Valeric acid","H  Buffer only"])
    ax.tick_params(axis="both",length=0,pad=9,labelsize=9)
    for y in range(8):
        for x in range(12):
            if np.isnan(matrix[y,x]):
                ax.add_patch(Rectangle((x-.5,y-.5),1,1,facecolor="#f0f3f3",edgecolor="#dbe3e3",hatch="///",lw=.4))
                ax.text(x,y,"—",ha="center",va="center",color=GREY,size=9)
            else:
                v=matrix[y,x]
                ax.text(x,y,f"{v:+.2f}",ha="center",va="center",color="white" if abs(v)>.25 else DARK,size=8.4)
    ax.set_xticks(np.arange(-.5,12,1),minor=True); ax.set_yticks(np.arange(-.5,8,1),minor=True)
    ax.grid(which="minor",color="white",lw=1);ax.tick_params(which="minor",bottom=False,left=False)
    ax.axvline(9.5,color=DARK,lw=1.5)
    cb=fig.colorbar(im,ax=ax,fraction=.033,pad=.028)
    cb.set_label("Corrected metric, ΔFtest − ΔFbuffer",fontsize=9)
    cb.set_ticks([-.45,-.3,-.15,0,.15,.3,.45])
    fig.text(.215,.145,"First ten columns also contain ORCO. Hatched cells are excluded from the corrected comparison.",size=9,color=GREY)
    fig.text(.065,.066,"B: both baseline–response pairs have reported gain mismatch. C: the first pair has reported gain mismatch.",size=9,color=GREY)
    fig.text(.065,.026,"Color is a calculated metric, not a positive/negative call. Buffer-only H03 and H10 exceed all retained VOC metrics.",size=9,color=GREY)
    save(fig,out,"plate-p2-corrected-response-map")

    fig,axs=plt.subplots(4,2,figsize=(12.2,12.7))
    fig.subplots_adjust(left=.08,right=.97,top=.89,bottom=.12,hspace=.72,wspace=.24)
    fig.text(.08,.963,"Every stimulus, with its controls",size=22,weight="bold")
    fig.text(.08,.93,"Unnormalized instrument readings · second-addition test runs · independent y-scales",size=10.5,color=GREY)
    for ax,row in zip(axs.flat,"ABCDEFGH"):
        for col,color,label in [(11,TEAL,"ORCO only"),(12,GREY,"Untransfected"),(10,ORANGE,"Or35a + ORCO")]:
            t,v=values(f"{row}{col:02d}",normalized=False)
            ax.plot(t,v,color=color,lw=1.4,marker="o",ms=2.5,label=label)
        note=" · test pair excluded" if row=="B" else " · correction excluded" if row=="C" else ""
        stimulus=next(x["stimulus"] for x in rows if x["row"]==row)
        ax.set_title(f"{row}  {stimulus}{note}",loc="left",fontsize=10)
        ax.set(xlabel="Time within test run (s)",ylabel="Fluorescence (RFU)",xticks=[0,48,96,144,168])
        ax.grid(axis="y",color="#edf3f3");ax.ticklabel_format(axis="y",style="plain",useOffset=False)
    handles,labels=axs.flat[0].get_legend_handles_labels()
    fig.legend(handles,labels,loc="lower center",bbox_to_anchor=(.5,.025),ncol=3,frameon=False)
    fig.text(.08,.011,"RFU amplitudes across rows cannot be compared without gain metadata. All 96 wells and four stages are in the tidy CSV.",fontsize=9,color=GREY)
    save(fig,out,"plate-p2-control-raw-kinetics")


if __name__=="__main__":
    root=Path(__file__).resolve().parent
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--data",type=Path,default=root/"derived")
    p.add_argument("--output",type=Path,default=root/"figures")
    a=p.parse_args();run(a.data,a.output)
