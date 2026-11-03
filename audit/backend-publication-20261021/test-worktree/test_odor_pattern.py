"""Independent analytic fixtures and JS parity for exploratory odor backend."""
import copy
import json
import math
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "analysis"))
import odor_pattern as op


def record(index, values, mask=15, q=None):
    q = [0.0] * 4 if q is None else q
    return {
        "id": f"block-{index}", "mode": "hardware", "valid": True,
        "samples": 8000, "sampleRateHz": 4000, "ledMask": mask,
        "dutyPercent": 25, "frequenciesHz": [41, 67, 89, 113],
        "railSamples": 0, "adcMin": 1000, "adcMax": 20000,
        "maxIntervalErrorUs": 0, "rmsIntervalErrorUs": 0,
        "deviceId": "test-device", "bootId": "boot-1",
        "firmware": "AeroSense", "firmwareRevision": "test-r1",
        "processingSchema": 2, "iqConvention": "I_cos_Q_sin_peak_V",
        "deviceTimeMs": 1000 + index * 5000,
        "acquisitionSignature": f"DDS4k_IQ8000_ADC2p5V_v2_adc2_41_67_89_113_duty25_mask{mask}",
        "inPhaseV": list(values), "quadratureV": list(q),
        "amplitudeV": [math.hypot(i, v) for i, v in zip(values, q)],
    }


def legacy_payload(features=(-.0094, .013, .0212, .0103)):
    return {
        "receptorOrder": op.RECEPTORS[:],
        "record": record(20, [.001 + .1 * (1 + x) for x in features]),
        "calibration": {
            "dark": [record(k, [.001] * 4, 0) for k in range(5)],
            "baseline": [record(k, [.101] * 4) for k in range(5, 10)],
            "reference": [],
        },
    }


def measured_payload(features=(-.0094, .013, .0212, .0103)):
    # Rotate channel-specific complex phasors away from the real axis. Signed
    # projection after subtracting LED-on blank still gives exact .1*(1+x).
    angles = [.3, -.7, 1.2, 2.1]
    blank_i, blank_q = [.012, -.007, .005, .02], [.004, .008, -.009, -.001]
    def rotated(index, amplitudes):
        return record(index,
                      [b + a * math.cos(t) for b, a, t in zip(blank_i, amplitudes, angles)],
                      q=[b + a * math.sin(t) for b, a, t in zip(blank_q, amplitudes, angles)])
    baseline = [rotated(k, [.1] * 4) for k in range(10, 15)]
    for r in baseline:
        r.update(captureCorrectionId="corr-1", captureContext="cells-A")
    return {
        "receptorOrder": op.RECEPTORS[:],
        "record": rotated(20, [.1 * (1 + x) for x in features]),
        "calibration": {"dark": [], "baseline": baseline, "reference": []},
        "measuredCalibration": {
            "version": "measured-complex-1", "id": "corr-1",
            "context": "cells-A", "enabled": True, "tauSec": 120,
            "blank": [record(k, blank_i, q=blank_q) for k in range(5)],
            "phase": [rotated(k, [.2] * 4) for k in range(5, 10)],
        },
    }


class OdorPatternTests(unittest.TestCase):
    def test_original_negative_values_and_exact_match(self):
        result = op.analyze(legacy_payload())
        for actual, expected in zip(result["features"], [-.0094, .013, .0212, .0103]):
            self.assertAlmostEqual(actual, expected, places=12)
        self.assertEqual(result["nearestReference"]["compound"], "3-octanol")
        self.assertAlmostEqual(result["scores"][0]["pearsonR"], 1)
        self.assertIsNone(result["identifiedOdor"])
        self.assertFalse(result["validated"])
        self.assertNotIn("probabilities", result)
        self.assertEqual({r["compound"] for r in result["controls"]}, {"VUAA1", "Control"})
        self.assertEqual(len(result["scores"]), 4)

    def test_measured_signed_projection_is_unsmoothed_and_not_double_subtracted(self):
        p = measured_payload()
        r = op.analyze(p)
        for actual, expected in zip(r["features"], [-.0094, .013, .0212, .0103]):
            self.assertAlmostEqual(actual, expected, places=12)
        self.assertFalse(r["normalization"]["darkSubtractedSeparately"])
        p["measuredCalibration"]["tauSec"] = 0
        self.assertEqual(op.analyze(p)["features"], r["features"])

    def test_js_normalization_parity(self):
        script = """
const fs=require('fs'),p=JSON.parse(fs.readFileSync(0,'utf8'));
const c=p.measuredCalibration;
const api=require(c?'./firmware/data/correction.js':'./firmware/data/calibration.js');
const r=c?api.normalize(p.record,p.calibration,c):api.normalize(p.record,p.calibration);
process.stdout.write(JSON.stringify(r));
"""
        for p in [legacy_payload(), measured_payload()]:
            out = subprocess.run(["node", "-e", script], input=json.dumps(p), text=True,
                                 cwd=ROOT, capture_output=True, check=True)
            js = json.loads(out.stdout)
            py = op.analyze(p)["normalization"]
            for a, b in zip(js["channels"], py["channels"]):
                self.assertAlmostEqual(a["F0_V"], b["F0_V"], places=12)
                self.assertAlmostEqual(a["deltaFOverF0"], b["deltaFOverF0"], places=12)
                self.assertAlmostEqual(a["noise_V"], b["noise_V"], places=12)

    def test_zero_and_constant_patterns_abstain(self):
        for vector in [[0] * 4, [.1] * 4]:
            r = op.analyze(legacy_payload(vector))
            self.assertEqual(r["status"], "insufficient_signal")
            self.assertIsNone(r["nearestReference"])
            self.assertIsNone(r["literatureReference"]["nearestReference"])
            self.assertTrue(all(x["pearsonR"] is None for x in r["scores"]))

    def test_low_signal_pattern_is_not_nearest_claim(self):
        r = op.analyze(legacy_payload([.00001, .00002, .00003, .00004]))
        self.assertEqual(r["status"], "insufficient_signal")
        self.assertIsNone(r["nearestReference"])

    def test_large_common_response_with_subnoise_contrast_abstains(self):
        for vector in [[1, 1 + 1e-10, 1, 1], [.2, .200001, .199999, .2]]:
            r = op.analyze(legacy_payload(vector))
            self.assertEqual(r["status"], "insufficient_signal")
            self.assertTrue(r["quality"]["signalGuardPassed"])
            self.assertFalse(r["quality"]["patternContrastGuardPassed"])
            self.assertIsNone(r["nearestReference"])
            self.assertIsNone(r["literatureReference"]["nearestReference"])
            self.assertIn("pattern_contrast_below_internal_noise_guard", r["warnings"])

    def test_posted_features_are_never_used(self):
        p = legacy_payload()
        expected = op.analyze(p)["features"]
        p["features"] = [100, 200, 300, 400]
        self.assertEqual(op.analyze(p)["features"], expected)

    def test_invalid_acquisitions_rejected(self):
        changes = [
            ("samples", 7999), ("sampleRateHz", 8000), ("mode", "demo"),
            ("adcMin", 20000), ("adcMax", 65535), ("railSamples", 1),
            ("maxIntervalErrorUs", 51), ("maxIntervalErrorUs", float("nan")),
            ("ledMask", 1), ("dutyPercent", True), ("processingSchema", True),
            ("firmwareRevision", ""), ("acquisitionSignature", "unversioned"),
            ("frequenciesHz", [67, 41, 89, 113]), ("adcConstant", True),
            ("inPhaseV", [True, .1, .1, .1]), ("quadratureV", [float("inf")] * 4),
            ("inPhaseV", [10**400, .1, .1, .1]), ("deviceTimeMs", 10**400),
            ("amplitudeV", [.9] * 4),
        ]
        for key, value in changes:
            with self.subTest(key=key, value=value):
                p = legacy_payload()
                p["record"][key] = value
                with self.assertRaises(ValueError):
                    op.analyze(p)

    def test_same_device_boot_revision_and_signature_required(self):
        for key, value in [("deviceId", "other"), ("bootId", "other"),
                           ("firmwareRevision", "other"),
                           ("acquisitionSignature", "OTHER_duty25_mask15")]:
            p = legacy_payload()
            p["calibration"]["baseline"][0][key] = value
            with self.assertRaisesRegex(ValueError, "calibration_conditions_changed"):
                op.analyze(p)

    def test_duplicates_and_overlapping_blocks_rejected(self):
        for kind in ["id", "time", "sample"]:
            p = legacy_payload()
            if kind == "id":
                p["calibration"]["baseline"][0]["id"] = p["calibration"]["dark"][0]["id"]
            elif kind == "time":
                p["record"]["deviceTimeMs"] = p["calibration"]["baseline"][0]["deviceTimeMs"] + 500
            else:
                p["calibration"]["reference"] = [copy.deepcopy(p["record"])]
            with self.assertRaises(ValueError):
                op.analyze(p)

    def test_weak_baseline_and_missing_references_rejected(self):
        p = legacy_payload()
        p["calibration"]["dark"].pop()
        with self.assertRaisesRegex(ValueError, "need_5_dark"):
            op.analyze(p)
        p = legacy_payload()
        p["calibration"]["baseline"] = [record(k, [.00101] * 4) for k in range(5, 10)]
        with self.assertRaisesRegex(ValueError, "baseline_below_noise"):
            op.analyze(p)

    def test_measured_context_and_phase_checks(self):
        p = measured_payload()
        p["calibration"]["baseline"][0]["captureContext"] = "other"
        with self.assertRaisesRegex(ValueError, "correction_recollect_living_baseline"):
            op.analyze(p)
        p = measured_payload()
        p["measuredCalibration"]["phase"] = [
            record(k, [.012, -.007, .005, .02], q=[.004, .008, -.009, -.001])
            for k in range(5, 10)]
        with self.assertRaisesRegex(ValueError, "correction_phase_reference_below_noise"):
            op.analyze(p)

    def test_receptor_order_and_json_finiteness(self):
        p = legacy_payload()
        p["receptorOrder"] = list(reversed(op.RECEPTORS))
        with self.assertRaisesRegex(ValueError, "receptor_order_mismatch"):
            op.analyze(p)
        for p in [legacy_payload(), measured_payload(), legacy_payload([0] * 4)]:
            json.dumps(op.analyze(p), allow_nan=False)

    def test_reference_provenance_and_literature_kept_separate(self):
        r = op.analyze(legacy_payload())
        self.assertEqual(r["provenance"]["sha256"], op.P2_SOURCE_SHA256)
        self.assertEqual(r["provenance"]["independentReplicatesPerOdorReceptor"], 1)
        self.assertEqual(len(r["provenance"]["excludedReferences"]), 2)
        literature = r["literatureReference"]
        self.assertEqual(literature["provenance"]["respondingUnits"][0], "Or22a+b")
        self.assertEqual(len(literature["scores"]), 4)
        self.assertIsNone(literature["identifiedOdor"])
        self.assertNotEqual(literature["scores"][0]["referenceVector"],
                            r["scores"][0]["referenceVector"])


if __name__ == "__main__":
    unittest.main()
