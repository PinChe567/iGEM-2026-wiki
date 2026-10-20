"""Compare the unchanged design simulation with the recorded single-well response.

Run: python analyze_optical_validation.py
Inputs are the adjacent archived source tables. Dependencies: numpy, scipy,
matplotlib. No optical parameters are fitted to the measurement.
"""
import csv
import json
import argparse
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import Normalize
import numpy as np
from scipy.stats import pearsonr, spearmanr

SOURCE = Path(__file__).resolve().parent
OUT = SOURCE
CHANNELS = ["D1", "D2", "D3", "D4"]
REGISTRATION = ["SW", "SE", "NE", "NW"]


def write_csv(name, rows):
    with (OUT / name).open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def correlation(a, b):
    return {"pearson_r": float(pearsonr(a, b).statistic),
            "spearman_rho": float(spearmanr(a, b).statistic)}


def heatmap(ax, values, title, xlabel, ylabel, bound, digits=1):
    im = ax.imshow(values, cmap="RdBu_r", norm=Normalize(-bound, bound))
    ax.set_xticks(range(4), CHANNELS)
    ax.set_yticks(range(4), CHANNELS)
    ax.set_xlabel(xlabel, labelpad=8)
    ax.set_ylabel(ylabel, labelpad=8)
    ax.set_title(title, pad=14, fontsize=12)
    for i in range(4):
        for j in range(4):
            ax.text(j, i, f"{values[i, j]:.{digits}f}", ha="center", va="center",
                    color="white" if abs(values[i, j]) > .66 * bound else "#183449",
                    fontsize=11.5, fontweight="bold" if i == j else "normal")
    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.tick_params(length=0, pad=7)
    return im


def save(fig, basename):
    for ext in ["svg", "png"]:
        fig.savefig(OUT / f"{basename}.{ext}", dpi=200,
                    facecolor="white", bbox_inches="tight",
                    metadata={"Creator": "AeroSense optical-validation analysis"}
                    if ext == "svg" else None)
    plt.close(fig)


def main():
    global OUT
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, default=SOURCE,
                        help="Write reproduced outputs here; input tables stay beside the script.")
    OUT = parser.parse_args().output_dir
    OUT.mkdir(parents=True, exist_ok=True)
    source = json.loads((SOURCE / "simulation-source.json").read_text(encoding="utf-8"))
    order = [source["row_order"].index(name) for name in REGISTRATION]
    columns = [source["column_order"].index(name) for name in REGISTRATION]
    sim_raw = np.asarray(source["LED_by_well_nW"])[np.ix_(order, columns)]
    records = list(csv.DictReader((SOURCE / "measurement-source.csv").open(encoding="utf-8")))
    measured_raw = np.empty((4, 4))
    for row in records:
        measured_raw[CHANNELS.index(row["readout_channel"]),
                     CHANNELS.index(row["loaded_source"])] = float(row["signed_response_mV"])
    sim = 100 * sim_raw / sim_raw.sum(axis=1, keepdims=True)
    measured = 100 * measured_raw / measured_raw.sum(axis=1, keepdims=True)
    assert np.allclose(sim.sum(axis=1), 100)
    assert np.allclose(measured.sum(axis=1), 100)
    for row in records:
        assert np.isclose(measured[CHANNELS.index(row["readout_channel"]),
                                  CHANNELS.index(row["loaded_source"])],
                          float(row["row_fraction_percent"]))
    # Historical cross-channel row correlations remain available as an archive.
    pattern = np.array([[correlation(a, b)["pearson_r"] for b in measured] for a in sim])
    # Compare the same D_i in both directions. Source-column correlations must
    # use the raw matrices: normalizing rows first would rescale each channel
    # differently and change the source's observed distribution across channels.
    directions = []
    for direction in ["source_to_channels", "sources_to_channel"]:
        for i, channel in enumerate(CHANNELS):
            a, b = ((sim_raw[:, i], measured_raw[:, i])
                    if direction == "source_to_channels"
                    else (sim_raw[i, :], measured_raw[i, :]))
            directions.append(dict(
                direction=direction, well_or_channel=channel, n_positions=4,
                simulation_input="original collected power (nW)",
                measurement_input="original signed readout response (mV)",
                **correlation(a, b)))
    directional_pattern = np.array([r["pearson_r"] for r in directions]).reshape(2, 4)
    difference = measured - sim
    mean_absolute_difference = np.mean(np.abs(difference), axis=1)
    # Preserve the removed range-scaled comparison as a reproducible archive.
    # It used one global min/max transform, not per-row or per-cell fitting.
    a_min, a_max = float(sim.min()), float(sim.max())
    b_min, b_max = float(measured.min()), float(measured.max())
    assert a_max > a_min and b_max > b_min
    scaled_b = a_min + (measured - b_min) / (b_max - b_min) * (a_max - a_min)
    scaled_difference = 100 * (scaled_b - sim) / (a_max - a_min)
    paired_pearson = float(pearsonr(sim.ravel(), measured.ravel()).statistic)
    rows = []
    for i, channel in enumerate(CHANNELS):
        for j, source_well in enumerate(CHANNELS):
            rows.append(dict(channel=channel, source=source_well,
                             simulation_power_nW=float(sim_raw[i, j]),
                             measured_signed_mV=float(measured_raw[i, j]),
                             simulation_row_percent=float(sim[i, j]),
                             measured_row_percent=float(measured[i, j])))
    write_csv("canonical-matrices.csv", rows)
    write_csv("channel-pattern-correlations.csv", [
        dict(simulated_channel=CHANNELS[i], measured_channel=CHANNELS[j],
             n_source_positions=4, **correlation(sim[i], measured[j]))
        for i in range(4) for j in range(4)])
    write_csv("same-channel-directional-correlations.csv", directions)
    write_csv("difference-matrix.csv", [
        dict(readout_channel=CHANNELS[i], source_well=CHANNELS[j],
             simulation_row_percent=float(sim[i, j]),
             measured_row_percent=float(measured[i, j]),
             difference_percentage_points=float(difference[i, j]),
             absolute_difference_percentage_points=float(abs(difference[i, j])))
        for i in range(4) for j in range(4)])
    distribution_rows = [
        dict(readout_channel=CHANNELS[i], n_source_positions=4,
             mean_absolute_difference_percentage_points=float(mean_absolute_difference[i]),
             metric="mean across source wells of abs(measured row percent - simulated row percent)")
        for i in range(4)]
    write_csv("readout-distribution-difference.csv", distribution_rows)
    write_csv("paired-response-comparison.csv", [
        dict(readout_channel=CHANNELS[i], source_well=CHANNELS[j],
             simulation_A_row_percent=float(sim[i, j]),
             measurement_B_row_percent=float(measured[i, j]),
             globally_scaled_B=float(scaled_b[i, j]),
             scaled_difference_percent_of_A_range=float(scaled_difference[i, j]))
        for i in range(4) for j in range(4)])
    write_csv("paired-response-values.csv", [
        dict(readout_channel=CHANNELS[i], source_well=CHANNELS[j],
             simulation_A_row_percent=float(sim[i, j]),
             measurement_B_row_percent=float(measured[i, j]),
             is_same_well=bool(i == j))
        for i in range(4) for j in range(4)])
    metrics = []
    for label, mask in [("all_16_cells", np.ones((4, 4), dtype=bool)),
                        ("off_diagonal_12_cells", ~np.eye(4, dtype=bool)),
                        ("diagonal_4_cells", np.eye(4, dtype=bool))]:
        metrics.append(dict(comparison=label, n_matrix_entries=int(mask.sum()),
                            **correlation(sim[mask], measured[mask])))
    write_csv("global-correlations.csv", metrics)
    ranks = []
    for i, channel in enumerate(CHANNELS):
        nonown = [j for j in range(4) if j != i]
        sj = max(nonown, key=lambda j: sim[i, j])
        mj = max(nonown, key=lambda j: measured[i, j])
        ranks.append(dict(channel=channel, same_well_simulation_percent=float(sim[i, i]),
                          same_well_measurement_percent=float(measured[i, i]),
                          strongest_nonown_simulation_source=CHANNELS[sj],
                          strongest_nonown_measurement_source=CHANNELS[mj],
                          strongest_nonown_simulation_percent=float(sim[i, sj]),
                          strongest_nonown_measurement_percent=float(measured[i, mj]),
                          **correlation(sim[i], measured[i])))
    write_csv("channel-comparison.csv", ranks)
    summary = dict(canonical_model="original floor-layer optical design model",
                   units="row-normalized signed response percent",
                   normalization="100 * cell / signed row sum",
                   global_correlations=metrics, channels=ranks,
                   primary_heatmap="canonical simulation and measurement matrices, unchanged",
                   primary_comparison=dict(
                       layout="three-panel row: A simulation, B measurement, C paired scatter",
                       panel_C=dict(pearson_r=paired_pearson, n_corresponding_entries=16,
                                    x="A: displayed simulated row percentages",
                                    y="B: displayed measured signed row percentages",
                                    inferential_p_values_reported=False,
                                    off_diagonal_pearson_r=float(pearsonr(
                                        sim[~np.eye(4, dtype=bool)],
                                        measured[~np.eye(4, dtype=bool)]).statistic),
                                    n_off_diagonal_entries=12)),
                   historical_scaled_comparison=dict(
                           A_min=a_min, A_max=a_max, B_min=b_min, B_max=b_max,
                           scale=(a_max-a_min)/(b_max-b_min),
                           offset=a_min-b_min*(a_max-a_min)/(b_max-b_min),
                           B_prime_formula="A_min + (B - B_min) / (B_max - B_min) * (A_max - A_min)",
                           D_formula="100 * (B_prime - A) / (A_max - A_min)",
                           units="percent of A global range",
                           shape=[4, 4], values=scaled_difference.tolist(),
                           status="Historical only; removed from the primary figure.",
                           interpretation="Signed spatial difference after removing one global offset and range; not raw percentage-point residuals."),
                   historical_comparisons=dict(
                       mean_absolute_difference=distribution_rows,
                       status="Prior row MAE, directional correlations and cross-channel correlations remain archived; not the current primary figure."),
                   directional_correlations=directions,
                   directional_heatmap_pearson_r=directional_pattern.tolist(),
                   n_source_positions_per_pattern=4,
                   inferential_p_values_reported=False,
                   caveat="Panel C pairs all 16 original A/B values, including negative measured entries. "
                          "Matrix entries share rows and measurements; correlation is descriptive, not an independent-sample validation. "
                          "The four strong same-well entries drive much of the association; off-diagonal Pearson r is 0.257. "
                          "This does not establish leakage-pattern or response-magnitude agreement. "
                          "Source conditions and electronic effects still differ.")
    (OUT / "summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 11,
                         "axes.labelcolor": "#183449", "text.color": "#183449"})
    fig, ax = plt.subplots(figsize=(5.8, 5.1), layout="constrained")
    im = heatmap(ax, sim, "Design simulation · floor-layer source",
                 "Fluorescent source well", "LED / readout channel", 100)
    fig.colorbar(im, ax=ax, shrink=.82, label="Row-normalized response (%)",
                 ticks=[-100, -50, 0, 50, 100])
    save(fig, "canonical-simulation")
    fig, axs = plt.subplots(1, 3, figsize=(14.8, 4.8), layout="constrained",
                            gridspec_kw={"width_ratios": [1, 1, 1.3]})
    im = heatmap(axs[0], sim, "SIMULATION",
                 "Fluorescent source well", "LED / readout channel", 100)
    heatmap(axs[1], measured, "MEASUREMENT",
            "Fluorescent source well", "Readout channel", 100)
    fig.colorbar(im, ax=axs[:2], shrink=.88, label="Row-normalized response (%)",
                 ticks=[-100, -50, 0, 50, 100])
    colors = ["#246680", "#bb6843", "#5a8a65", "#9162a0"]
    for i, channel in enumerate(CHANNELS):
        axs[2].scatter(sim[i], measured[i], s=55, color=colors[i], label=channel,
                       edgecolors="white", linewidths=.7, zorder=3)
    axs[2].plot([-5, 100], [-5, 100], color="#8a989f", lw=1,
                linestyle="--", zorder=1)
    axs[2].set(xlim=(-5, 100), ylim=(-8, 100),
               xlabel="Simulation A (%)", ylabel="Measurement B (%)")
    axs[2].set_title("PAIRED RESPONSES", pad=14, fontsize=12)
    axs[2].text(.04, .96, f"Pearson r = {paired_pearson:.3f}\n16 corresponding entries",
                transform=axs[2].transAxes, va="top", fontsize=12,
                bbox=dict(facecolor="white", edgecolor="none", alpha=.9))
    axs[2].legend(title="Readout channel", ncol=2, loc="lower right",
                   frameon=False, fontsize=10.5, title_fontsize=10.5)
    axs[2].grid(alpha=.15)
    axs[2].spines[["top", "right"]].set_visible(False)
    for ax, letter in zip(axs, ["A", "B", "C"]):
        ax.text(-.08, 1.10, letter, transform=ax.transAxes,
                fontsize=16, fontweight="bold", va="top")
    save(fig, "simulation-measurement-paired-comparison")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
