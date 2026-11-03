"""One-run, four-channel time-series analysis with explicit observation gaps.

No odor classifier is trained here. Similarity percentages are clipped Pearson
correlations multiplied by 100, not class probabilities or calibrated confidence.
Every receptor is aggregated over the same observed temporal supports; separate
per-receptor peak picking and interpolation across missing data are prohibited.
"""
from __future__ import annotations

import copy
import hashlib
import json
import math

import odor_pattern as pattern

SCHEMA = "aerosense-odor-session-request-1"
MAX_RECORDS = 300
AMBIGUITY_MARGIN = .05
SIMILARITY_SEMANTICS = {
    "formula": "100 * max(0, Pearson r)",
    "label": "Pattern similarity (%)",
    "isProbability": False, "isCalibratedConfidence": False,
    "sumsTo100": False, "negativeCorrelationDisplayedAsZero": True,
    "ambiguousMarginPercentagePoints": AMBIGUITY_MARGIN * 100,
    "ambiguityThresholdIsHeuristic": True,
}


def _fail(code):
    raise ValueError(code)


def _hash(value):
    try:
        raw = json.dumps(value, ensure_ascii=False, sort_keys=True,
                         separators=(",", ":"), allow_nan=False).encode("utf-8")
    except (TypeError, ValueError, OverflowError):
        _fail("nonfinite_or_invalid_session_data")
    return hashlib.sha256(raw).hexdigest()


def _core(r):
    """Validate context even for an invalid sampling window; don't splice runs."""
    if not isinstance(r, dict):
        _fail("invalid_session_record")
    for key in ("id", "sessionId", "deviceId", "bootId", "firmwareRevision",
                "acquisitionSignature"):
        if not pattern._text(r.get(key)):
            _fail("session_metadata_required")
    if r.get("mode") != "hardware":
        _fail("hardware_measurement_required")
    if type(r.get("ledMask")) is not int or r["ledMask"] != 15:
        _fail("session_requires_all_LEDs")
    if type(r.get("dutyPercent")) is not int or not 1 <= r["dutyPercent"] <= 50:
        _fail("invalid_dutyPercent")
    if (type(r.get("sampleRateHz")) is not int or r["sampleRateHz"] != 4000
            or r.get("frequenciesHz") != pattern.FREQUENCIES):
        _fail("session_acquisition_settings_mismatch")
    if (type(r.get("processingSchema")) is not int or r["processingSchema"] != 2
            or r.get("iqConvention") != "I_cos_Q_sin_peak_V"):
        _fail("session_processing_schema_mismatch")
    if not r["acquisitionSignature"].endswith(f"_duty{r['dutyPercent']}_mask15"):
        _fail("acquisition_signature_mismatch")
    if (not pattern._number(r.get("deviceTimeMs"))
            or not 0 <= r["deviceTimeMs"] <= 2**53):
        _fail("invalid_session_timestamp")
    if type(r.get("blockIndex")) is not int or not 1 <= r["blockIndex"] <= 1000000:
        _fail("session_block_index_required")
    mode = r.get("acquisitionMode", "interval")
    if mode not in ("interval", "continuous"):
        _fail("invalid_acquisition_mode")
    if not isinstance(r.get("conditionTag", ""), str) or len(r.get("conditionTag", "").encode("utf-8")) > 240:
        _fail("invalid_sample_label")
    if "plannedBlocks" in r and (type(r["plannedBlocks"]) is not int or not 1 <= r["plannedBlocks"] <= MAX_RECORDS):
        _fail("invalid_planned_blocks")
    if "periodSec" in r and (type(r["periodSec"]) is not int
                             or not (r["periodSec"] == 2 if mode == "continuous" else 5 <= r["periodSec"] <= 3600)):
        _fail("invalid_session_period")
    if mode == "continuous":
        if (type(r.get("continuousSegment")) is not int or r["continuousSegment"] < 1
                or not pattern._number(r.get("gapBeforeUs")) or r["gapBeforeUs"] < -50
                or not pattern._number(r.get("windowStartDeviceTimeMs"))
                or not pattern._number(r.get("windowEndDeviceTimeMs"))):
            _fail("continuous_window_metadata_required")
        start, end = r["windowStartDeviceTimeMs"], r["windowEndDeviceTimeMs"]
        if not 0 <= start <= end <= 2**53 or abs((start + end)/2-r["deviceTimeMs"]) > .1:
            _fail("continuous_window_timestamp_mismatch")
    # A partial/invalid block is allowed as a gap point. Actual samples therefore
    # do not form part of the session identity; nominal acquisition is 8000/4kHz.
    return (r["sessionId"], r["deviceId"], r["bootId"], r["firmwareRevision"],
            r.get("firmware"), r["processingSchema"], r["iqConvention"],
            r["sampleRateHz"], r["dutyPercent"], r["ledMask"],
            tuple(r["frequenciesHz"]), r["acquisitionSignature"],
            mode, r.get("conditionTag", ""), r.get("periodSec"), r.get("plannedBlocks"))


def _calibration(payload, records):
    cal = payload.get("calibration")
    if not isinstance(cal, dict):
        _fail("calibration_required")
    correction = payload.get("measuredCalibration")
    if correction is not None and (not isinstance(correction, dict)
                                  or type(correction.get("enabled")) is not bool):
        _fail("invalid_measured_calibration")
    measured = bool(correction and correction["enabled"])
    if measured:
        if (correction.get("version") != "measured-complex-1"
                or not pattern._text(correction.get("id"))
                or not pattern._text(correction.get("context"))):
            _fail("correction_context_required")
        groups = [(pattern._rows(correction, "blank", 5), 15),
                  (pattern._rows(correction, "phase", 5), 15)]
    else:
        groups = [(pattern._rows(cal, "dark", 5), 0)]
    baseline = pattern._rows(cal, "baseline", 5)
    reference = pattern._rows(cal, "reference")
    groups += [(baseline, 15), (reference, 15)]
    if any(not isinstance(r, dict) for rows, mask in groups for r in rows):
        _fail("invalid_calibration_records")
    if measured and any(r.get("captureCorrectionId") != correction["id"]
                        or r.get("captureContext") != correction["context"]
                        for r in baseline + reference):
        _fail("correction_recollect_living_baseline")
    refs = [pattern._record(r, mask) for rows, mask in groups for r in rows]
    if len({r["id"] for r in refs}) != len(refs):
        _fail("sample_or_calibration_record_reused")
    # The raw session can include incomplete windows. Compare its nominal
    # acquisition signature against full, valid calibration windows explicitly.
    nominal = {**records[0], "samples": 8000}
    if any(pattern._signature(r) != pattern._signature(nominal) for r in refs):
        _fail("calibration_conditions_changed")
    all_records = refs + records
    if len({r["id"] for r in all_records}) != len(all_records):
        _fail("sample_or_calibration_record_reused")
    times = sorted(r["deviceTimeMs"] for r in refs)
    if any(b - a < 1999 for a, b in zip(times, times[1:])):
        _fail("overlapping_calibration_blocks")
    # One frozen calibration must precede the run. Later calibration cannot be
    # retroactively selected to improve the apparent response pattern.
    if any(records[0]["deviceTimeMs"] - a["deviceTimeMs"] < 1999 for a in refs):
        _fail("session_calibration_must_precede_response")
    return cal, correction


def _scores(vector, rows, informative):
    out = []
    for row in rows:
        r = pattern._pearson(vector, row["values"]) if vector is not None else None
        out.append({
            "compound": row["compound"], "role": row["role"],
            "pearsonR": r,
            "cosineSimilarity": pattern._cosine(vector, row["values"]) if vector is not None else None,
            "similarityPercent": 100 * max(0, r) if informative and r is not None else None,
            "referenceVector": row["values"][:],
            **({"sources": row["sources"]} if "sources" in row else {}),
        })
    return sorted(out, key=lambda x: x["pearsonR"] if x["pearsonR"] is not None else -2,
                  reverse=True)


def _comparison(scores, informative):
    finite = [r for r in scores if r["pearsonR"] is not None]
    margin = finite[0]["pearsonR"] - finite[1]["pearsonR"] if len(finite) >= 2 else None
    if not informative or not finite or finite[0]["pearsonR"] <= 0:
        status = "no_differentiable_pattern"
    elif margin is None or margin <= AMBIGUITY_MARGIN:
        status = "ambiguous"
    else:
        status = "exploratory_similarity"
    return {
        "status": status,
        "nearestReference": finite[0] if status == "exploratory_similarity" else None,
        "comparisonMargin": margin if informative else None,
        "comparisonMarginPercentagePoints": margin * 100 if informative and margin is not None else None,
        "ambiguousCandidates": [r["compound"] for r in finite
                                if finite[0]["pearsonR"] - r["pearsonR"] <= AMBIGUITY_MARGIN]
                                if status == "ambiguous" else [],
        "identifiedOdor": None, "validated": False,
    }


def analyze_session(payload):
    if not isinstance(payload, dict) or payload.get("schema") != SCHEMA:
        _fail("session_schema_mismatch")
    if payload.get("receptorOrder") != pattern.RECEPTORS:
        _fail("receptor_order_mismatch")
    records = payload.get("records")
    if not isinstance(records, list) or not 1 <= len(records) <= MAX_RECORDS:
        _fail("session_requires_1_to_300_records")
    core = _core(records[0])
    if any(_core(r) != core for r in records[1:]):
        _fail("mixed_session_context")
    if len({r["id"] for r in records}) != len(records):
        _fail("duplicate_session_record")
    if any(b["blockIndex"] <= a["blockIndex"]
           or b["deviceTimeMs"] <= a["deviceTimeMs"]
           or b.get("continuousSegment", 1) < a.get("continuousSegment", 1)
           for a, b in zip(records, records[1:])):
        _fail("session_records_must_be_ordered_and_nonoverlapping")
    if records[-1]["deviceTimeMs"] - records[0]["deviceTimeMs"] > 604800000:
        _fail("session_duration_exceeds_7_days")
    cal, correction = _calibration(payload, records)
    frozen = {"calibration": copy.deepcopy(cal),
              "measuredCalibration": copy.deepcopy(correction)}
    calibration_digest = _hash(frozen)
    origin = records[0]["deviceTimeMs"]
    times = [(r["deviceTimeMs"] - origin) / 1000 for r in records]
    # New continuous records expose inclusive first/last sample timestamps.
    # Extend the final timestamp by one sample interval for a half-open support.
    supports = [((r["windowStartDeviceTimeMs"]-origin)/1000,
                 (r["windowEndDeviceTimeMs"]+.25-origin)/1000)
                if r.get("acquisitionMode") == "continuous" else (t-1, t+1)
                for r, t in zip(records, times)]
    if any(b[0] < a[1]-.000051 for a, b in zip(supports, supports[1:])):
        _fail("overlapping_session_observation_supports")
    # The last sample's nominal 250-us support can overlap the next actual
    # sample by <=50 us of accepted jitter. Clip that tiny boundary once so
    # duration coverage cannot exceed 100%; never bridge a positive gap.
    supports = [(a, min(b, supports[i+1][0]) if i+1 < len(supports) else b)
                for i, (a, b) in enumerate(supports)]
    lower, upper = supports[0][0], supports[-1][1]
    stimulus = payload.get("stimulusTimeMs")
    if stimulus is not None and (not pattern._number(stimulus)
                                or not origin + lower * 1000 <= stimulus <= origin + upper * 1000):
        _fail("stimulus_timestamp_outside_session")
    requested = payload.get("responseWindow")
    if requested is None:
        start = max(lower, (stimulus - origin) / 1000) if stimulus is not None else lower
        end = upper
    else:
        if (not isinstance(requested, dict) or not pattern._number(requested.get("startSec"))
                or not pattern._number(requested.get("endSec"))):
            _fail("invalid_response_window")
        start, end = requested["startSec"], requested["endSec"]
    if not lower <= start < end <= upper:
        _fail("response_window_outside_session")
    if stimulus is not None and start < (stimulus - origin) / 1000:
        _fail("response_window_precedes_declared_stimulus")
    features, errors, normalization, results = [], [], [], []
    fatal_calibration_errors = {
        "baseline_below_noise", "correction_phase_reference_below_noise",
        "correction_recollect_living_baseline", "calibration_conditions_changed",
    }
    for raw in records:
        try:
            if raw.get("acquisitionMode") == "continuous" and raw.get("samples") == 8000:
                span = raw["windowEndDeviceTimeMs"] - raw["windowStartDeviceTimeMs"]
                if abs(span-1999.75) > 1:
                    raise ValueError("continuous_window_duration_mismatch")
            result = pattern.analyze({"record": raw, "receptorOrder": pattern.RECEPTORS,
                                      "calibration": cal, "measuredCalibration": correction})
            if any(c.get("warning") == "phase_deviation_gt_15deg"
                   for c in result["normalization"]["channels"]):
                raise ValueError("phase_deviation_gt_15deg")
            features.append(result["features"])
            errors.append(None)
            normalization.append(result["normalization"])
            results.append(result)
        except ValueError as exc:
            if str(exc) in fatal_calibration_errors:
                raise
            features.append(None)
            errors.append(str(exc))
            normalization.append(None)
            results.append(None)
    weights = [max(0.0, min(bounds[1], end) - max(bounds[0], start))
               if value is not None else 0.0 for bounds, value in zip(supports, features)]
    observed = math.fsum(weights)
    vector = [math.fsum(w * f[j] for w, f in zip(weights, features) if f is not None) / observed
              for j in range(4)] if observed > 0 else None
    quality = {"signalGuardPassed": False, "patternContrastGuardPassed": False,
               "guardMultiplier": 5, "validatedDetectionLimit": False}
    if vector is not None:
        # Do not divide the calibration noise by sqrt(number of windows): these
        # windows share cells, instrument drift and calibration, not independent
        # biological replicates. Use the largest per-window normalized noise.
        noise = [max(n["channels"][j]["signalNoise_V"] / n["channels"][j]["F0_V"]
                     for n, w in zip(normalization, weights) if n is not None and w > 0)
                 for j in range(4)]
        contrast = math.sqrt(math.fsum((v - pattern._mean(vector))**2 for v in vector))
        contrast_noise = math.sqrt(.75 * math.fsum(n*n for n in noise))
        quality.update(signalGuardPassed=any(abs(v) > 5*n for v, n in zip(vector, noise)),
                       patternContrastGuardPassed=contrast > 5*contrast_noise,
                       centeredFeatureNorm=contrast, centeredNoiseScale=contrast_noise,
                       normalizedNoise=noise)
    informative = quality["signalGuardPassed"] and quality["patternContrastGuardPassed"]
    data, digest = pattern._load_reference()
    primary_scores = _scores(vector, data["literatureReference"]["odors"], informative)
    p2_scores = _scores(vector, data["odors"], informative)
    controls = _scores(vector, data["controls"], informative)
    primary = {"source": "DoOR", "scores": primary_scores,
               **_comparison(primary_scores, informative),
               "warnings": data["literatureReference"]["warnings"],
               "provenance": {k: v for k, v in data["literatureReference"].items()
                              if k not in ("odors", "warnings")}}
    diagnostics = {"source": "P2", "scores": p2_scores,
                   **_comparison(p2_scores, informative), "controls": controls,
                   "provenance": data["source"]}
    gaps = []
    for i in range(1, len(records)):
        if (supports[i][0]-supports[i-1][1] > .000001
                or records[i]["blockIndex"] != records[i-1]["blockIndex"] + 1
                or records[i].get("continuousSegment") != records[i-1].get("continuousSegment")):
            gaps.append({"afterRecordId": records[i-1]["id"], "beforeRecordId": records[i]["id"],
                         "startSec": supports[i-1][1], "endSec": supports[i][0],
                         "missingBlockCount": records[i]["blockIndex"]-records[i-1]["blockIndex"]-1})
    warnings = [
        "exploratory_similarity_not_odor_probability_or_identification",
        "same_time_window_and_weights_used_for_all_four_receptors",
        "unobserved_time_and_invalid_windows_not_interpolated",
        "windows_share_cells_and_calibration_not_independent_biological_replicates",
        "frequency_channels_are_not_independently_unmixed_wells",
        "P2_and_DoOR_are_different_assays_and_not_hardware_training_data",
        "five_percentage_point_ambiguity_margin_is_a_heuristic_not_confidence",
    ]
    if stimulus is None:
        warnings.append("whole_session_not_stimulus_aligned" if requested is None else "selected_window_without_declared_stimulus")
    if any(e is not None for e in errors):
        warnings.append("invalid_windows_retained_as_null_gaps")
    if gaps:
        warnings.append("session_contains_unobserved_intervals")
    if records[0]["blockIndex"] != 1 or (type(records[0].get("plannedBlocks")) is int
                                        and records[-1]["blockIndex"] != records[0]["plannedBlocks"]):
        warnings.append("incomplete_session_records")
    if any(r.get("sessionInterrupted") is True for r in records):
        warnings.append("session_was_interrupted")
    if not informative:
        warnings.append("no_differentiable_pattern")
    return {
        "schema": "aerosense-odor-session-1", "status": primary["status"],
        "identifiedOdor": None, "validated": False,
        "sessionId": records[0]["sessionId"], "receptorOrder": pattern.RECEPTORS[:],
        "recordCount": len(records), "validRecordCount": sum(v is not None for v in features),
        "curve": {"timeSec": times, "timeOriginDeviceMs": origin,
                  "timeMeaning": "seconds relative to first acquisition midpoint",
                  "features": features, "recordIds": [r["id"] for r in records],
                  "blockIndices": [r["blockIndex"] for r in records],
                  "valid": [v is not None for v in features], "errors": errors,
                  "gaps": gaps, "observationSupportsSec": supports,
                  "continuousSegments": [r.get("continuousSegment") for r in records],
                  "gapBeforeUs": [r.get("gapBeforeUs") for r in records],
                  "units": "deltaF/F0", "windowDurationSec": 2},
        "aggregate": {"method": "duration-weighted mean of valid observed block supports; same support for every channel",
                      "features": vector, "window": {"startSec": start, "endSec": end},
                      "stimulusTimeMs": stimulus, "observedDurationSec": observed,
                      "requestedDurationSec": end-start,
                      "coverageFraction": observed/(end-start),
                      "windowWeightsSec": weights, "quality": quality,
                      "literatureReference": primary, "p2Diagnostics": diagnostics},
        "similaritySemantics": SIMILARITY_SEMANTICS.copy(),
        "calibrationSnapshot": frozen,
        "provenance": {"calibrationSha256": calibration_digest,
                       "referenceBundleSha256": digest, "sourceRequestSha256": _hash(payload),
                       "sourceRecordIds": [r["id"] for r in records],
                       "deviceId": records[0]["deviceId"], "bootId": records[0]["bootId"],
                       "firmwareRevision": records[0]["firmwareRevision"],
                       "acquisitionSignature": records[0]["acquisitionSignature"]},
        "warnings": warnings,
    }
