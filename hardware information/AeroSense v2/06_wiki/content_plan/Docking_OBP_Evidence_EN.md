# Docking and the proposed capture protein

## Audit status

On 2026-10-05, the inspected release contained no project docking structures, PDBQT files, ligand files, poses or run logs. The complete public repository tree at `ca8b47014315f4ffe4431a3b04874816410cafcf` contained 1,201 entries and no matching docking/OBP/Vina/PDB records; the one `docker-compose.yml` match was unrelated. This is a scoped search, not proof that the team has never performed docking elsewhere. The current Model/Description pages do not identify a specific OBP or provide docking results.

“OBP” alone cannot establish which molecule the team means. Before describing a capture protein as a component, record its species, exact name and accession, complete sequence, intended construct, structural source/chain and any modifications. If OBP means odorant-binding protein here, keep that putative capture role distinct from the OR/Orco sensing complex and GCaMP reporter. Do not infer the protein from the target odor or select an unrelated published example as if it were the team's construct.

## What docking can contribute

Docking may help formulate a candidate binding pose or prioritize a small set of protein–ligand hypotheses under a declared preparation and scoring method. It does not measure Kd, receptor activation, transport rate or cell response. The [Vina FAQ](https://autodock-vina.readthedocs.io/en/latest/faq.html?highlight=exhaustiveness) recommends target-specific evaluation with known actives or a bound ligand where available. The [official tutorial](https://autodock-vina.readthedocs.io/en/stable/docking_basic.html) illustrates stochastic-search/exhaustiveness effects and warns against comparing different scoring functions directly. These sources describe methodology; their example scores are not AeroSense results.

No real protein–ligand ranking, energy or affinity is supplied in this package because the required inputs/results are absent. A plausible molecular image is not a substitute for a traceable computation.

## Minimum publishable record if existing results are supplied

| Record | Required content |
|---|---|
| Biological question | Exact protein and ligand, why that pair is relevant to this interface, what decision the result can influence |
| Protein input | Accession/sequence, structure source and date, chain, modeled or experimental status, confidence/coverage, missing regions and preparation choices |
| Ligand input | Identity, stereochemistry, source, protonation/tautomer assumptions and prepared coordinate file |
| Run configuration | Software/scoring/version, search-box center/size in Å, seeds, exhaustiveness, flexible parts, waters/cofactors and preparation versions |
| Raw outputs | Full log, all retained poses and scores, failure records; not only the best screenshot |
| Checks | Repeated-seed stability, contact/plausibility inspection, redocking or known controls if available; disclose when no validation structure exists |
| Interpretation | Score ranking within the declared setup; no conversion into measured Kd or an activation claim |
| Reproduction | License, hashes, environment, one runnable command and an example output from that command |

Put the short question, method, supported conclusion and uncertainty on Model. Put the raw inputs/logs/poses, complete score tables and reproduction script in the appendix. Put any actual receptor-response or binding experiment on the experimental Results page with its protocol; link rather than conflate the two.

## Capture does not automatically mean faster delivery

As an illustrative single-site equilibrium hypothesis only, bound ligand would be `B = B_total × C_free / (Kd + C_free)`. This separates free and bound pools; it is not fitted to a selected OBP and has not been used to generate the gas-CFD results. Binding could change total uptake, buffering, release and memory. A favorable docking score alone cannot establish which effect dominates at the cell interface. Do not calculate a numerical Kd from a docking score and then treat it as a measured transport parameter.

The current gas model ends at an interface concentration and does not include capture-protein chemistry. The detailed liquid boundary case omits protein facilitation and mixing by design. A protein-enhanced mechanism may motivate a new model, but it needs its own identity, parameters and independent evidence. No added protein, film or purchased component is required by the current mechanical release.

## Bounded next step

First recover any existing project inputs and identify the exact proposed protein and target VOC. If those do not exist, keep this item as a future hypothesis and prioritize the already specified hardware blank/reference and gas-interface tests. If they do exist, re-run a small, controlled docking comparison and show the entire record; test uptake/release separately before connecting docking to a claim of improved cell exposure. No new wet-lab outcome is asserted here.
