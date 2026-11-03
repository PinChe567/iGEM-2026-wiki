"""Build one row per plate compound x the 10 tuning-OR cell lines, holding dF_corr.

Derived from analysis/01_per_well_results.csv rather than copied from
02_matrix_dF_corr.csv, so the table is reproducible from the per-well source and
carries why a row is empty. Column order matches
dataset/outputs/door/door_6x10_wetlab_overlap.csv, so this table and the DoOR
submatrix can be compared or stacked directly.

Every cell is a single well -- the plate has no replicate wells -- so the
replicate count is 1 throughout and the `status` column is what says whether a
row carries numbers at all.
"""
import csv
from pathlib import Path

ORS = ["Or7a", "Or19a", "Or22a", "Or35a", "Or42a",
       "Or59b", "Or67a", "Or67b", "Or85b", "Or98a"]
ROLE = {"VUAA1": "positive_control", "Control": "negative_control"}
STATUS = {                      # from analysis/04_gain_consistency_QC.csv
    "ethyl propionate": "invalid_gain_changed",
    "isopentyl acetate": "invalid_blank_gain_changed",
}
HERE = Path(__file__).resolve().parent.parent

rows, order = {}, []
with open(HERE / "analysis/01_per_well_results.csv", encoding="utf-8-sig") as fh:
    for r in csv.DictReader(fh):
        cmpd, line = r["compound"], r["cell_line"]
        if cmpd not in rows:
            rows[cmpd] = {}
            order.append(cmpd)
        if line.endswith("+ORCO"):
            rows[cmpd][line[:-5]] = r["dF_corr"]

out = HERE / "analysis/06_odorant_receptor_dF_corr.csv"
with open(out, "w", newline="", encoding="utf-8") as fh:
    w = csv.writer(fh)
    w.writerow(["compound", "role", "status"] + ORS)
    for cmpd in order:
        w.writerow([cmpd, ROLE.get(cmpd, "odorant"), STATUS.get(cmpd, "ok")]
                   + [rows[cmpd].get(o, "") for o in ORS])

print(f"wrote {out.relative_to(HERE.parent)}")
