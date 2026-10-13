#!/usr/bin/env python3
"""Recompute the AeroSense P2 pilot from unmodified instrument CSV exports.

Python >=3.10, standard library only. Run from the extracted package:
    python analyze_plate_p2.py --input raw --reported reported --output derived

Each condition has ONE well. Longitudinal readings are not replicates.
No hypothesis tests, confidence intervals, response calls or LOD are estimated.
"""
from __future__ import annotations
import argparse
import csv
import hashlib
import json
import math
import re
import statistics as st
from datetime import datetime
from pathlib import Path

VERSION = "1.0.0"
STAGES = ("F0a", "blank", "F0b", "test")
CONDITIONS = ["Or7a+ORCO", "Or19a+ORCO", "Or42a+ORCO", "Or98a+ORCO",
              "Or22a+ORCO", "Or67a+ORCO", "Or67b+ORCO", "Or59b+ORCO",
              "Or85b+ORCO", "Or35a+ORCO", "ORCO only", "untransfected"]
COMPOUNDS = dict(zip("ABCDEFGH", ["VUAA1", "ethyl propionate", "isopentyl acetate",
                                 "3-octanol", "benzaldehyde", "2-heptanone",
                                 "valeric acid", "buffer only"]))


def write_csv(path, rows):
    assert rows
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)


def read_csv(path):
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def peak3(values):
    means = [st.mean(values[i:i+3]) for i in range(len(values)-2)]
    j = max(range(len(means)), key=means.__getitem__)
    return means[j], (j+1)*12  # center of the earliest maximum window


def pair_flag(row, phase):
    if row == "B" or (row == "C" and phase in ("F0a", "blank")):
        return "exclude: source-reported gain mismatch; numeric gain absent"
    return "retained exploratory: numeric gain absent"


def run(input_dir, reported_dir, output_dir):
    output_dir.mkdir(parents=True, exist_ok=True)
    runs, manifest = {}, []
    mapping = {int(r["run_no"]): r for r in read_csv(input_dir / "00_filename_map.csv")}
    for path in sorted(input_dir.iterdir()):
        m = re.fullmatch(r"(\d+)_P2_([A-H])_(.+)_(F0a|F0b|blank|test)\.CSV", path.name)
        if not m:
            continue
        number, row, slug, stage = m.groups()
        number = int(number)
        assert number in range(904, 936)
        text = path.read_text(encoding="utf-8-sig")
        records = list(csv.reader(text.splitlines()))
        assert records[0][2] == f"Test run no.: {number}"
        assert records[3][0] == "ID1: P2" and records[3][1] == f"ID2: {row}_{stage}"
        stamp = datetime.strptime(records[1][1][6:] + " " + records[1][2][6:], "%m/%d/%Y %I:%M:%S %p")
        mapped = mapping[number]
        assert mapped["new_filename"] == path.name
        assert mapped["plate_row"] == row and mapped["stage"] == stage
        assert datetime.strptime(mapped["original_filename"][:17], "%y-%m-%d %H-%M-%S") == stamp
        wells = next(r[2:] for r in records if r and r[0] == "Well")
        assert wells == [f"{row}{i:02d}" for i in range(1, 13)]
        values = [r for r in records if r and r[0].startswith("Raw Data")]
        expected = 5 if stage.startswith("F0") else 15
        assert len(values) == expected and all(len(r) == 14 for r in values)
        times = [float(r[1]) for r in values]
        assert times == [i*12 for i in range(expected)]
        data = [[float(x) for x in r[2:]] for r in values]
        assert all(math.isfinite(x) and x > 0 for line in data for x in line)
        assert (row, stage) not in runs
        runs[row, stage] = dict(run=number, timestamp=stamp.isoformat(), filename=path.name,
                                protocol=records[1][0][11:], times=times, data=data)
        manifest.append(dict(filename=path.name, bytes=path.stat().st_size,
                             sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
    assert len(runs) == 32 and len(mapping) == 32
    tidy, summary, qc = [], [], []
    for row in COMPOUNDS:
        for stage in STAGES:
            r = runs[row, stage]
            for t, values in zip(r["times"], r["data"]):
                for col, v in enumerate(values, 1):
                    baseline_stage = "F0a" if stage in ("F0a", "blank") else "F0b"
                    f0 = st.mean(x[col-1] for x in runs[row, baseline_stage]["data"])
                    tidy.append(dict(plate="P2", row=row, well=f"{row}{col:02d}", column=col,
                        condition=CONDITIONS[col-1], stimulus=COMPOUNDS[row], stage=stage,
                        run=r["run"], run_start_local_unspecified_timezone=r["timestamp"],
                        time_within_run_s=t, fluorescence_RFU=v,
                        relative_to_paired_baseline=v/f0-1,
                        pair_status=pair_flag(row, stage), source_file=r["filename"]))
        for col in range(1, 13):
            series = {s: [a[col-1] for a in runs[row, s]["data"]] for s in STAGES}
            f0a, f0b = st.mean(series["F0a"]), st.mean(series["F0b"])
            pb, tb = peak3(series["blank"])
            pt, tt = peak3(series["test"])
            db, dt = pb/f0a-1, pt/f0b-1
            retained = row not in "BC"
            summary.append(dict(plate="P2", row=row, well=f"{row}{col:02d}", column=col,
                condition=CONDITIONS[col-1], stimulus=COMPOUNDS[row],
                nominal_final_concentration_uM=50 if row=="A" else "not reported" if row in "BCDEFG" else "not applicable",
                F0a_mean_RFU=f0a, F0b_mean_RFU=f0b, blank_peak3_RFU=pb, test_peak3_RFU=pt,
                blank_peak3_center_s=tb, test_peak3_center_s=tt,
                dF_blank_computed=db, dF_test_computed=dt, dF_corr_computed=dt-db,
                dF_blank_retained=db if row not in "BC" else "",
                dF_test_retained=dt if row!="B" else "",
                dF_corr_retained=dt-db if retained else "",
                corrected_metric_status="retained exploratory" if retained else "excluded: gain mismatch",
                test_first_RFU=series["test"][0], test_last_RFU=series["test"][-1],
                test_first_to_last_fraction=series["test"][-1]/series["test"][0]-1,
                wells_per_condition=1, independent_biological_repeats="not documented"))
        q = dict(row=row, stimulus=COMPOUNDS[row])
        for stage in STAGES:
            v=[a[11] for a in runs[row, stage]["data"]]
            q[f"untransfected_{stage}_first_RFU"]=v[0]
            q[f"untransfected_{stage}_mean_RFU"]=st.mean(v)
            q[f"untransfected_{stage}_median_RFU"]=st.median(v)
        for phase, base in [("blank", "F0a"), ("test", "F0b")]:
            ratios=[st.mean(a[c] for a in runs[row,phase]["data"])/st.mean(a[c] for a in runs[row,base]["data"]) for c in range(12)]
            q[f"median_across_12_wells_{phase}_mean_over_{base}_mean"]=st.median(ratios)
            q[f"{phase}_pair_status"]=pair_flag(row,phase)
        q["numeric_instrument_gain"]="not in supplied exports"
        qc.append(q)
    assert len(tidy)==3840 and len(summary)==96
    by_well={r["well"]:r for r in summary}
    audit=[]
    for supplied in read_csv(reported_dir / "01_per_well_results.csv"):
        calc=by_well[supplied["well"]]
        for source_key,key in {"F0a_mean":"F0a_mean_RFU", "F0b_mean":"F0b_mean_RFU", "dF_blank":"dF_blank_computed", "dF_test":"dF_test_computed", "dF_corr":"dF_corr_computed"}.items():
            if supplied[source_key] != "":
                diff=calc[key]-float(supplied[source_key])
                audit.append(dict(well=calc["well"], metric=source_key, supplied_value=supplied[source_key],
                                  recomputed_value=calc[key], difference=diff, matches_rounding=abs(diff)<=0.000051))
    assert all(x["matches_rounding"] for x in audit)
    # Diagnose source-QC labeling without silently replacing the source or guessing its ratio algorithm.
    reported_qc=read_csv(reported_dir / "04_gain_consistency_QC.csv")
    qc_audit=[]
    for source, calc in zip(reported_qc,qc):
        assert source["row"]==calc["row"]
        qc_audit.append(dict(row=source["row"],
            supplied_median_col12_F0a=float(source["median_col12_F0a"]),
            actual_first=calc["untransfected_F0a_first_RFU"], actual_mean=calc["untransfected_F0a_mean_RFU"],
            actual_median=calc["untransfected_F0a_median_RFU"],
            supplied_blank_ratio=float(source["ratio_blank_over_F0a"]),
            transparent_median_blank_mean_ratio=calc["median_across_12_wells_blank_mean_over_F0a_mean"],
            supplied_test_ratio=float(source["ratio_test_over_F0b"]),
            transparent_median_test_mean_ratio=calc["median_across_12_wells_test_mean_over_F0b_mean"]))
    neg=[r["dF_corr_retained"] for r in summary if r["column"]==12 and r["row"] not in "BC"]
    info=dict(analysis_version=VERSION, raw_files=32, wells=96, intensity_observations=len(tidy),
        retained_corrected_metrics=72, excluded_corrected_metrics=24,
        source_numeric_comparisons=len(audit), source_numeric_mismatches=0,
        first_run_start=min(r["timestamp"] for r in runs.values()),
        last_run_start=max(r["timestamp"] for r in runs.values()),
        raw_RFUs_min=min(r["fluorescence_RFU"] for r in tidy),
        raw_RFUs_max=max(r["fluorescence_RFU"] for r in tidy),
        exploratory_negative_well_count=6, exploratory_negative_SD=st.stdev(neg),
        source_3SD_recomputed=3*st.stdev(neg),
        threshold_policy="3SD is reproduced for audit only, not a validated detection limit or classifier; heterogeneous single wells.",
        normalization_policy="VUAA1 normalization omitted: single unvalidated denominators; source Or7a denominator is negative and reverses signs.",
        source_QC_issue="The supplied median_col12_F0a values equal first readings in 8/8 rows and differ from actual medians in 6/8 rows. Source ratio algorithm is not documented; transparent mean-ratio diagnostics are supplied separately.",
        inference_policy="No p values, confidence intervals, biological replicate claims or positive/negative calls.",
        key_wells={w:by_well[w] for w in ("A10","A11","A12","H03","H10","H11","H12")})
    write_csv(output_dir / "plate-p2-timeseries.csv", tidy)
    write_csv(output_dir / "plate-p2-well-summary.csv", summary)
    write_csv(output_dir / "plate-p2-run-qc.csv", qc)
    write_csv(output_dir / "plate-p2-source-number-audit.csv", audit)
    write_csv(output_dir / "plate-p2-source-qc-audit.csv", qc_audit)
    write_csv(output_dir / "plate-p2-raw-checksums.csv", manifest)
    (output_dir / "plate-p2-analysis-summary.json").write_text(json.dumps(info,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(json.dumps({k:info[k] for k in ("raw_files","wells","intensity_observations","source_numeric_comparisons","source_numeric_mismatches","source_3SD_recomputed")}))
    return info


if __name__ == "__main__":
    root=Path(__file__).resolve().parent
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input",type=Path,default=root/"raw")
    parser.add_argument("--reported",type=Path,default=root/"reported")
    parser.add_argument("--output",type=Path,default=root/"derived")
    args=parser.parse_args()
    run(args.input,args.reported,args.output)
