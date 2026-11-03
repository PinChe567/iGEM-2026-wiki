"""Auditable, exploratory four-channel pattern comparison; no trained classifier.

Only original, gain-valid P2 rows are used. Augmented copies are NOT independent
training observations. Hardware features and P2 dF_corr have different timing
and blank treatment, so similarity never constitutes odor identification.
Standard library only; raw I/Q records, not client-computed features, are inputs.
"""
from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path
import statistics

RECEPTORS = ["Or22a", "Or35a", "Or85b", "Or98a"]
FREQUENCIES = [41, 67, 89, 113]
ADC_LSB = 2.5 / 65536
MIN_BLOCKS = 5
REFERENCE_PATH = Path(__file__).with_name("odor_reference.json")
P2_SOURCE_SHA256 = "1509f308f365ca7f70c967fa8a004380cb48a8a4da004c4b845bace0eb65b2d1"


def _fail(code):
    raise ValueError(code)


def _number(value):
    if type(value) not in (int, float):
        return False
    try:
        return math.isfinite(value)
    except OverflowError:
        # JSON integers are arbitrary precision in Python. A huge integer is
        # invalid acquisition data, not an internal server error.
        return False


def _text(value):
    return isinstance(value, str) and bool(value.strip()) and len(value) <= 512


def _mean(values):
    return statistics.fmean(values)


def _sd(values):
    return statistics.stdev(values)


def _vector(value):
    return isinstance(value, list) and len(value) == 4 and all(_number(x) for x in value)


def _record(r, mask):
    if not isinstance(r, dict):
        _fail("invalid_measurement")
    if r.get("mode") != "hardware":
        _fail("hardware_measurement_required")
    if r.get("valid") is not True or r.get("error") or r.get("timingFault"):
        _fail("invalid_measurement")
    if type(r.get("samples")) is not int or r["samples"] != 8000:
        _fail("complete_8000_sample_block_required")
    if type(r.get("sampleRateHz")) is not int or r["sampleRateHz"] != 4000:
        _fail("sample_rate_mismatch")
    if type(r.get("ledMask")) is not int or r["ledMask"] != mask:
        _fail("dark_requires_all_LEDs_off" if mask == 0 else "normalization_requires_all_LEDs")
    if r.get("frequenciesHz") != FREQUENCIES or not _vector(r["frequenciesHz"]):
        _fail("frequency_order_mismatch")
    if type(r.get("dutyPercent")) is not int or not 1 <= r["dutyPercent"] <= 50:
        _fail("invalid_dutyPercent")
    if type(r.get("railSamples")) is not int or r["railSamples"] != 0:
        _fail("ADC_rail")
    for key in ("lowRailSamples", "highRailSamples"):
        if key in r and (type(r[key]) is not int or r[key] != 0):
            _fail("ADC_rail")
    lo, hi = r.get("adcMin"), r.get("adcMax")
    if type(lo) is not int or type(hi) is not int or not 32 <= lo <= hi <= 65503:
        _fail("invalid_ADC_range")
    if lo == hi or r.get("adcConstant") is True:
        _fail("ADC_constant")
    if not _number(r.get("maxIntervalErrorUs")) or not 0 <= r["maxIntervalErrorUs"] <= 50:
        _fail("sample_jitter")
    if "rmsIntervalErrorUs" in r and (
        not _number(r["rmsIntervalErrorUs"]) or not 0 <= r["rmsIntervalErrorUs"] <= 50
    ):
        _fail("sample_jitter")
    for key in ("inPhaseV", "quadratureV", "amplitudeV"):
        if not _vector(r.get(key)) or any(abs(x) > 5 for x in r[key]):
            _fail("four_finite_voltage_channels_required")
    if any(x < 0 for x in r["amplitudeV"]):
        _fail("invalid_amplitude")
    for i, q, a in zip(r["inPhaseV"], r["quadratureV"], r["amplitudeV"]):
        # Firmware JSON rounds exported values; tolerate serialization error,
        # while ensuring amplitude metadata cannot contradict authoritative I/Q.
        if not math.isclose(math.hypot(i, q), a, rel_tol=1e-4, abs_tol=1e-7):
            _fail("amplitude_IQ_mismatch")
    if any(not _text(r.get(k)) for k in
           ("id", "deviceId", "bootId", "firmwareRevision", "acquisitionSignature")):
        _fail("firmware_metadata_required")
    if type(r.get("processingSchema")) is not int or r["processingSchema"] != 2:
        _fail("processing_schema_mismatch")
    if r.get("iqConvention") != "I_cos_Q_sin_peak_V":
        _fail("iq_convention_mismatch")
    if not _number(r.get("deviceTimeMs")) or r["deviceTimeMs"] < 0:
        _fail("invalid_device_timestamp")
    suffix = f"_duty{r['dutyPercent']}_mask{mask}"
    if not r["acquisitionSignature"].endswith(suffix):
        _fail("acquisition_signature_mismatch")
    return r


def _signature(r):
    # DARK necessarily uses mask 0; remove only the verified trailing mask,
    # retaining the acquisition implementation prefix, duty and firmware rev.
    acquisition = r["acquisitionSignature"].rsplit("_mask", 1)[0]
    return (
        r["mode"], r["deviceId"], r["bootId"], r["firmwareRevision"],
        r.get("firmware"), r["processingSchema"], r["iqConvention"],
        r["sampleRateHz"], r["samples"], r["dutyPercent"],
        tuple(r["frequenciesHz"]), acquisition,
    )


def _rows(cal, key, minimum=0):
    rows = cal.get(key)
    if not isinstance(rows, list) or len(rows) > 1000:
        _fail("invalid_calibration_records")
    if len(rows) < minimum:
        _fail("need_5_" + key)
    return rows


def _check_all(record, groups):
    all_records = [record]
    for rows, mask in groups:
        all_records.extend(_record(r, mask) for r in rows)
    if len({r["id"] for r in all_records}) != len(all_records):
        _fail("sample_or_calibration_record_reused")
    sig = _signature(record)
    if any(_signature(r) != sig for r in all_records):
        _fail("calibration_conditions_changed")
    # Firmware deviceTimeMs is the acquisition midpoint. Blocks are two seconds;
    # duplicated or overlapping captures cannot count as independent references.
    times = sorted(r["deviceTimeMs"] for r in all_records)
    if any(b - a < 1999 for a, b in zip(times, times[1:])):
        _fail("overlapping_acquisition_blocks")


def _legacy(record, cal):
    dark = _rows(cal, "dark", MIN_BLOCKS)
    baseline = _rows(cal, "baseline", MIN_BLOCKS)
    reference = _rows(cal, "reference")
    _check_all(record, [(dark, 0), (baseline, 15), (reference, 15)])
    channels = []
    for j in range(4):
        di = _mean([r["inPhaseV"][j] for r in dark])
        dq = _mean([r["quadratureV"][j] for r in dark])
        def amplitude(r):
            return math.hypot(r["inPhaseV"][j] - di, r["quadratureV"][j] - dq)
        ys = [amplitude(r) for r in baseline]
        f0 = _mean(ys)
        noise = max(_sd([r["inPhaseV"][j] for r in dark]),
                    _sd([r["quadratureV"][j] for r in dark]), ADC_LSB)
        if not f0 > 5 * noise:
            _fail("baseline_below_noise")
        delta = amplitude(record) - f0
        ref, ref_error = None, None
        if len(reference) >= MIN_BLOCKS:
            denom = _mean([amplitude(r) for r in reference]) - f0
            if abs(denom) > 5 * noise:
                ref = delta / denom
            else:
                ref_error = "reference_response_below_noise"
        channels.append({
            "channel": j + 1, "F0_V": f0, "deltaFOverF0": delta / f0,
            "deltaF_V": delta, "noise_V": noise,
            # UI normalization uses dark noise; an additional conservative
            # signal gate also considers variability of the living baseline.
            "signalNoise_V": max(noise, _sd(ys)),
            "referenceNormalized": ref, "referenceError": ref_error,
        })
    return {
        "method": "complex dark subtraction; (F-F0)/F0; no optical unmixing",
        "channels": channels, "darkIds": [r["id"] for r in dark],
        "baselineIds": [r["id"] for r in baseline],
        "referenceIds": [r["id"] for r in reference], "recordId": record["id"],
    }


def _measured(record, cal, correction):
    if correction.get("version") != "measured-complex-1":
        _fail("correction_version_mismatch")
    if not _text(correction.get("id")) or not _text(correction.get("context")):
        _fail("correction_context_required")
    blank = _rows(correction, "blank", MIN_BLOCKS)
    phase = _rows(correction, "phase", MIN_BLOCKS)
    baseline = _rows(cal, "baseline", MIN_BLOCKS)
    reference = _rows(cal, "reference")
    # Historical electronic DARK records are not subtracted or required here:
    # measured LED-on blank already includes the electronic contribution.
    _check_all(record, [(blank, 15), (phase, 15), (baseline, 15), (reference, 15)])
    if any(r.get("captureCorrectionId") != correction["id"]
           or r.get("captureContext") != correction["context"]
           for r in baseline + reference):
        _fail("correction_recollect_living_baseline")
    channels = []
    for j in range(4):
        bi = _mean([r["inPhaseV"][j] for r in blank])
        bq = _mean([r["quadratureV"][j] for r in blank])
        ri = _mean([r["inPhaseV"][j] for r in phase]) - bi
        rq = _mean([r["quadratureV"][j] for r in phase]) - bq
        rm = math.hypot(ri, rq)
        blank_sd = math.hypot(_sd([r["inPhaseV"][j] for r in blank]),
                             _sd([r["quadratureV"][j] for r in blank]))
        phase_sd = math.hypot(_sd([r["inPhaseV"][j] for r in phase]),
                             _sd([r["quadratureV"][j] for r in phase]))
        uncertainty = max(ADC_LSB, math.hypot(blank_sd / math.sqrt(len(blank)),
                                            phase_sd / math.sqrt(len(phase))))
        if not rm > 5 * uncertainty:
            _fail("correction_phase_reference_below_noise")
        ui, uq = ri / rm, rq / rm
        def projection(r):
            return (r["inPhaseV"][j] - bi) * ui + (r["quadratureV"][j] - bq) * uq
        ys = [projection(r) for r in baseline]
        f0 = _mean(ys)
        projected_blank_sd = _sd([r["inPhaseV"][j] * ui + r["quadratureV"][j] * uq
                                 for r in blank])
        noise = max(_sd(ys), projected_blank_sd, ADC_LSB)
        if not f0 > 5 * noise:
            _fail("baseline_below_noise")
        delta = projection(record) - f0
        i, q = record["inPhaseV"][j] - bi, record["quadratureV"][j] - bq
        deviation = math.degrees(math.atan2(q * ui - i * uq, i * ui + q * uq))
        phase_warning = (
            "phase_deviation_gt_15deg"
            if math.hypot(i, q) > 5 * max(blank_sd, ADC_LSB) and abs(deviation) > 15
            else None
        )
        ref, ref_error = None, None
        if len(reference) >= MIN_BLOCKS:
            ry = [projection(r) for r in reference]
            denom = _mean(ry) - f0
            if abs(denom) > 5 * max(noise, _sd(ry)):
                ref = delta / denom
            else:
                ref_error = "reference_response_below_noise"
        channels.append({
            "channel": j + 1, "F0_V": f0, "deltaFOverF0": delta / f0,
            "deltaF_V": delta, "noise_V": noise, "signalNoise_V": noise,
            "referenceNormalized": ref, "referenceError": ref_error,
            "phaseUnit": [ui, uq], "phaseDeviationDeg": deviation,
            "warning": phase_warning,
        })
    return {
        "method": "measured LED-on blank; fixed fluorescence-reference phase; unsmoothed signed projection; (F-F0)/F0",
        "channels": channels, "calibrationId": correction["id"],
        "context": correction["context"], "darkSubtractedSeparately": False,
        "blankIds": [r["id"] for r in blank], "phaseIds": [r["id"] for r in phase],
        "baselineIds": [r["id"] for r in baseline],
        "referenceIds": [r["id"] for r in reference], "recordId": record["id"],
    }


def _cosine(x, y):
    nx, ny = math.sqrt(math.fsum(v*v for v in x)), math.sqrt(math.fsum(v*v for v in y))
    if nx <= 1e-12 or ny <= 1e-12:
        return None
    return max(-1.0, min(1.0, math.fsum(a*b for a, b in zip(x, y)) / (nx*ny)))


def _pearson(x, y):
    return _cosine([v - _mean(x) for v in x], [v - _mean(y) for v in y])


def _load_reference():
    raw = REFERENCE_PATH.read_bytes()
    data = json.loads(raw)
    if (data.get("schema") != "aerosense-p2-reference-1"
            or data.get("receptorOrder") != RECEPTORS
            or data.get("source", {}).get("sha256") != P2_SOURCE_SHA256):
        _fail("reference_bundle_invalid")
    for name, count in (("odors", 4), ("controls", 2)):
        if not isinstance(data.get(name), list) or len(data[name]) != count:
            _fail("reference_bundle_invalid")
        for row in data[name]:
            if not _vector(row.get("values")) or row.get("status") != "ok":
                _fail("reference_bundle_invalid")
    literature = data.get("literatureReference")
    if (not isinstance(literature, dict) or literature.get("receptorOrder") != RECEPTORS
            or len(literature.get("odors", [])) != 4
            or any(not _vector(row.get("values")) for row in literature["odors"])):
        _fail("reference_bundle_invalid")
    return data, hashlib.sha256(raw).hexdigest()


def get_model_status():
    data, digest = _load_reference()
    return {
        "status": "exploratory_reference_comparison",
        "trainedModelInstalled": False, "validated": False,
        "receptorOrder": RECEPTORS[:], "referenceCount": len(data["odors"]),
        "referenceSha256": digest,
        "note": "Original P2 and separate DoOR reference patterns; no supplied trained weights or fitted preprocessing.",
    }


def analyze(payload):
    """Validate full acquisition context, recompute features, return similarities.

    receptorOrder is an explicit physical D1..D4 assignment assertion. The
    software cannot verify which cells a user physically loaded into each well.
    """
    if not isinstance(payload, dict):
        _fail("object_required")
    if payload.get("receptorOrder") != RECEPTORS:
        _fail("receptor_order_mismatch")
    record = _record(payload.get("record"), 15)
    cal = payload.get("calibration")
    if not isinstance(cal, dict):
        _fail("calibration_required")
    correction = payload.get("measuredCalibration")
    if correction is not None and not isinstance(correction, dict):
        _fail("invalid_measured_calibration")
    if correction is not None and type(correction.get("enabled")) is not bool:
        _fail("invalid_measured_calibration")
    normalization = (
        _measured(record, cal, correction) if correction and correction["enabled"]
        else _legacy(record, cal)
    )
    features = [r["deltaFOverF0"] for r in normalization["channels"]]
    data, reference_digest = _load_reference()
    def score(row):
        return {
            "compound": row["compound"], "role": row["role"],
            "pearsonR": _pearson(features, row["values"]),
            "cosineSimilarity": _cosine(features, row["values"]),
            "referenceVector": row["values"][:],
        }
    scores = sorted([score(row) for row in data["odors"]],
                    key=lambda r: (r["pearsonR"] is not None,
                                   r["pearsonR"] if r["pearsonR"] is not None else -2),
                    reverse=True)
    controls = [score(row) for row in data["controls"]]
    signal = any(abs(r["deltaF_V"]) > 5 * r["signalNoise_V"]
                 for r in normalization["channels"])
    # Pearson discards a shared offset: even a large uniform response can yield
    # |r| near 1 from differences far below ADC/noise resolution. Require that
    # some cross-channel contrast survives a separate, conservative guard.
    # For centering P=I-11'/4, trace(P diag(sigma^2) P)=3/4 sum(sigma^2).
    # This is an internal noise-scale check, NOT an assay-validated statistical
    # test; channel covariance, optical mixing and biological noise are unknown.
    centered = [v - _mean(features) for v in features]
    contrast = math.sqrt(math.fsum(v*v for v in centered))
    normalized_noise = [r["signalNoise_V"] / r["F0_V"]
                        for r in normalization["channels"]]
    contrast_noise = math.sqrt(.75 * math.fsum(v*v for v in normalized_noise))
    contrast_passes = contrast > 5 * contrast_noise
    informative = signal and contrast_passes and scores[0]["pearsonR"] is not None
    warnings = [
        "not_a_trained_or_validated_odor_classifier",
        "P2_reference_has_one_independent_well_per_odor_receptor",
        "P2_reference_signals_and_controls_do_not_establish_odor_specificity",
        "hardware_deltaFOverF0_does_not_match_P2_blank_corrected_3_cycle_peak_feature",
        "hardware_2_second_block_does_not_match_P2_12_second_cycles_and_response_window",
        "frequency_channels_are_not_independently_unmixed_wells",
        "D1_D4_physical_receptor_assignment_must_match_receptorOrder",
        "four_receptor_similarity_is_not_probability_or_statistical_significance",
        "nearest_reference_is_only_among_four_available_valid_P2_odors",
        "signal_gate_5_times_noise_is_an_internal_guard_not_validated_detection_limit",
    ]
    if not signal:
        warnings.append("response_below_internal_signal_guard")
    if not contrast_passes:
        warnings.append("pattern_contrast_below_internal_noise_guard")
    if scores[0]["pearsonR"] is None:
        warnings.append("constant_or_zero_pattern_has_no_pearson_correlation")
    if any(r.get("warning") for r in normalization["channels"]):
        warnings.append("phase_deviation_gt_15deg")
        informative = False
    literature = data["literatureReference"]
    literature_scores = sorted(
        [{**score(row), "sources": row["sources"]} for row in literature["odors"]],
        key=lambda r: (r["pearsonR"] is not None,
                       r["pearsonR"] if r["pearsonR"] is not None else -2),
        reverse=True,
    )
    # These are separately scored normalized literature vectors. Their scale
    # must never be pooled with the P2 cell assay or used for calibration.
    literature_result = {
        "scores": literature_scores,
        "nearestReference": literature_scores[0] if informative else None,
        "provenance": {k: v for k, v in literature.items() if k not in ("odors", "warnings")},
        "warnings": literature["warnings"],
        "identifiedOdor": None, "validated": False,
    }
    return {
        "schema": "aerosense-odor-pattern-1",
        "status": "exploratory_similarity" if informative else "insufficient_signal",
        "identifiedOdor": None, "validated": False, "features": features,
        "featureKind": "hardware_deltaFOverF0_LED_channels",
        "receptorOrder": RECEPTORS[:],
        "mapping": [{"channel": f"D{j+1}", "receptor": receptor,
                     "frequencyHz": FREQUENCIES[j]} for j, receptor in enumerate(RECEPTORS)],
        "normalization": normalization,
        "quality": {
            "signalGuardPassed": signal, "patternContrastGuardPassed": contrast_passes,
            "centeredFeatureNorm": contrast, "centeredNoiseScale": contrast_noise,
            "guardMultiplier": 5, "validatedDetectionLimit": False,
        },
        "nearestReference": scores[0] if informative else None,
        "scores": scores, "controls": controls,
        "literatureReference": literature_result,
        "provenance": {
            **data["source"], "referenceBundleSha256": reference_digest,
            "excludedReferences": data["excluded"],
            "recordId": record["id"], "deviceId": record["deviceId"],
            "bootId": record["bootId"], "firmwareRevision": record["firmwareRevision"],
            "acquisitionSignature": record["acquisitionSignature"],
            "referenceFeatureKind": "plate_reader_dF_corr",
        },
        "warnings": warnings,
    }
