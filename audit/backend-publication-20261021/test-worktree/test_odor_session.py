"""Analytic full-run fixtures, gap handling and HTTP route regression tests."""
import copy
import http.client
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import threading
import unittest

from test_odor_pattern import legacy_payload, measured_payload, record

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "analysis"))
sys.path.insert(0, str(ROOT / "server"))
import odor_session as session


def session_payload(vectors=None, continuous=False):
    vectors = vectors or [[.0098, .0227, .007, .0128]] * 5
    p = legacy_payload()
    p.pop("record")
    p["schema"] = session.SCHEMA
    p["records"] = []
    for index, vec in enumerate(vectors):
        r = record(20+index, [.001+.1*(1+x) for x in vec])
        r.update(sessionId="run-1", blockIndex=index+1, plannedBlocks=len(vectors),
                 conditionTag="cells-one", periodSec=2 if continuous else 5,
                 acquisitionMode="continuous" if continuous else "interval")
        if continuous:
            r["deviceTimeMs"] = 101000+index*2000
            r.update(windowStartDeviceTimeMs=r["deviceTimeMs"]-999.875,
                     windowEndDeviceTimeMs=r["deviceTimeMs"]+999.875,
                     gapBeforeUs=0, continuousSegment=1, sessionInterrupted=False)
        p["records"].append(r)
    return p


class SessionTests(unittest.TestCase):
    def test_complete_continuous_run_and_percent_semantics(self):
        r = session.analyze_session(session_payload(continuous=True))
        self.assertEqual(r["recordCount"], 5)
        self.assertEqual(r["validRecordCount"], 5)
        self.assertEqual(r["curve"]["timeSec"], [0, 2, 4, 6, 8])
        self.assertEqual(r["curve"]["gaps"], [])
        self.assertAlmostEqual(r["aggregate"]["observedDurationSec"], 10)
        self.assertAlmostEqual(r["aggregate"]["coverageFraction"], 1)
        scores = r["aggregate"]["literatureReference"]["scores"]
        self.assertEqual(scores[0]["compound"], "benzaldehyde")
        self.assertAlmostEqual(scores[0]["similarityPercent"], 100)
        self.assertFalse(r["similaritySemantics"]["isProbability"])
        self.assertFalse(r["similaritySemantics"]["sumsTo100"])
        self.assertIsNone(r["identifiedOdor"])
        self.assertFalse(r["validated"])
        self.assertEqual(r["calibrationSnapshot"]["calibration"], session_payload()["calibration"])

    def test_aggregate_uses_same_window_not_per_receptor_peaks(self):
        vectors = [[.4, 0, 0, 0], [0, .3, 0, 0], [0, 0, .2, 0], [0, 0, 0, .1]]
        r = session.analyze_session(session_payload(vectors))
        for a, b in zip(r["aggregate"]["features"], [.1, .075, .05, .025]):
            self.assertAlmostEqual(a, b)
        self.assertNotEqual(r["aggregate"]["features"], [.4, .3, .2, .1])

    def test_selected_window_clips_actual_observation_duration(self):
        p = session_payload([[.1, .2, .3, .4], [.4, .3, .2, .1]])
        p["responseWindow"] = {"startSec": 0, "endSec": 6}
        r = session.analyze_session(p)
        self.assertEqual(r["aggregate"]["windowWeightsSec"], [1, 2])
        self.assertAlmostEqual(r["aggregate"]["features"][0], .3)
        self.assertAlmostEqual(r["aggregate"]["coverageFraction"], .5)

    def test_invalid_window_remains_gap_and_does_not_bias_mean(self):
        p = session_payload([[.1, .2, .3, .4], [2, 2, 2, 2], [.1, .2, .3, .4]], True)
        p["records"][1].update(valid=False, error="ADC_rail", adcMax=65535)
        r = session.analyze_session(p)
        self.assertEqual(r["recordCount"], 3)
        self.assertEqual(r["validRecordCount"], 2)
        self.assertIsNone(r["curve"]["features"][1])
        self.assertEqual(r["curve"]["valid"], [True, False, True])
        for a, b in zip(r["aggregate"]["windowWeightsSec"], [2, 0, 2]):
            self.assertAlmostEqual(a, b)
        self.assertAlmostEqual(r["aggregate"]["features"][0], .1)
        self.assertAlmostEqual(r["aggregate"]["coverageFraction"], 2/3)

    def test_all_invalid_windows_return_no_percentage(self):
        p = session_payload()
        for r in p["records"]:
            r.update(valid=False, error="sample_timing_or_overrun")
        r = session.analyze_session(p)
        self.assertIsNone(r["aggregate"]["features"])
        self.assertEqual(r["status"], "no_differentiable_pattern")
        self.assertTrue(all(s["similarityPercent"] is None
                            for s in r["aggregate"]["literatureReference"]["scores"]))

    def test_subnoise_contrast_never_gets_percentage(self):
        r = session.analyze_session(session_payload([[.2, .200001, .199999, .2]] * 10))
        self.assertEqual(r["status"], "no_differentiable_pattern")
        self.assertTrue(all(s["similarityPercent"] is None
                            for s in r["aggregate"]["literatureReference"]["scores"]))

    def test_close_door_patterns_are_ambiguous_not_forced_identity(self):
        r = session.analyze_session(session_payload([[.0337, .0434, .0676, .0592]] * 5))
        comparison = r["aggregate"]["literatureReference"]
        self.assertEqual(comparison["status"], "ambiguous")
        self.assertIsNone(comparison["nearestReference"])
        self.assertIn("2-heptanone", comparison["ambiguousCandidates"])
        self.assertIn("3-octanol", comparison["ambiguousCandidates"])
        self.assertLessEqual(comparison["comparisonMarginPercentagePoints"], 5)

    def test_mixed_sessions_context_order_and_duplicate_reject(self):
        for key, value in [("sessionId", "run-2"), ("bootId", "other"),
                           ("deviceId", "other"), ("firmwareRevision", "other"),
                           ("conditionTag", "other"), ("periodSec", 10),
                           ("plannedBlocks", 100), ("blockIndex", 1),
                           ("deviceTimeMs", 1000)]:
            with self.subTest(key=key):
                p = session_payload()
                p["records"][1][key] = value
                with self.assertRaises(ValueError):
                    session.analyze_session(p)
        p = session_payload()
        p["records"][1]["id"] = p["records"][0]["id"]
        with self.assertRaisesRegex(ValueError, "duplicate_session_record"):
            session.analyze_session(p)

    def test_freeze_calibration_before_response(self):
        p = session_payload()
        p["calibration"]["baseline"][0]["deviceTimeMs"] = 500000
        with self.assertRaisesRegex(ValueError, "session_calibration_must_precede_response"):
            session.analyze_session(p)
        p = session_payload()
        p["calibration"]["reference"] = [copy.deepcopy(p["records"][0])]
        with self.assertRaisesRegex(ValueError, "sample_or_calibration_record_reused"):
            session.analyze_session(p)

    def test_pause_gap_and_missing_window_remain_visible(self):
        p = session_payload(continuous=True)
        for raw in p["records"][2:]:
            for key in ["deviceTimeMs", "windowStartDeviceTimeMs", "windowEndDeviceTimeMs"]:
                raw[key] += 10000
            raw.update(continuousSegment=2, sessionInterrupted=True)
        p["records"][2]["gapBeforeUs"] = 10000000
        r = session.analyze_session(p)
        self.assertEqual(len(r["curve"]["gaps"]), 1)
        self.assertAlmostEqual(r["curve"]["gaps"][0]["endSec"]-r["curve"]["gaps"][0]["startSec"], 10)
        self.assertAlmostEqual(r["aggregate"]["coverageFraction"], .5)
        self.assertIn("session_was_interrupted", r["warnings"])

    def test_partial_invalid_last_window_retained(self):
        p = session_payload(continuous=True)
        last = p["records"][-1]
        last.update(valid=False, samples=2000, error="sample_timing_or_overrun")
        last["windowEndDeviceTimeMs"] = last["windowStartDeviceTimeMs"]+499.75
        last["deviceTimeMs"] = (last["windowStartDeviceTimeMs"]+last["windowEndDeviceTimeMs"])/2
        r = session.analyze_session(p)
        self.assertIsNone(r["curve"]["features"][-1])
        self.assertEqual(r["recordCount"], 5)

    def test_stimulus_window_and_invalid_giant_timestamp(self):
        p = session_payload()
        p["stimulusTimeMs"] = p["records"][1]["deviceTimeMs"]
        r = session.analyze_session(p)
        self.assertEqual(r["aggregate"]["window"]["startSec"], 5)
        p["responseWindow"] = {"startSec": 0, "endSec": 6}
        with self.assertRaisesRegex(ValueError, "precedes_declared_stimulus"):
            session.analyze_session(p)
        p = session_payload()
        p["records"][0]["deviceTimeMs"] = 10**400
        with self.assertRaises(ValueError):
            session.analyze_session(p)

    def test_all_json_finite_and_no_mutation(self):
        p = session_payload(continuous=True)
        before = copy.deepcopy(p)
        r = session.analyze_session(p)
        self.assertEqual(before, p)
        json.dumps(r, allow_nan=False)

    def test_measured_session_projection_preserves_analytic_vector(self):
        p = session_payload(continuous=True)
        measured = measured_payload()
        p["calibration"] = measured["calibration"]
        p["measuredCalibration"] = measured["measuredCalibration"]
        for raw in p["records"]:
            for key in ["inPhaseV", "quadratureV", "amplitudeV"]:
                raw[key] = measured["record"][key][:]
        r = session.analyze_session(p)
        for a, b in zip(r["aggregate"]["features"], [-.0094, .013, .0212, .0103]):
            self.assertAlmostEqual(a, b, places=12)
        self.assertEqual(r["calibrationSnapshot"]["measuredCalibration"]["id"], "corr-1")
        p["calibration"]["baseline"][0] = "malformed"
        with self.assertRaisesRegex(ValueError, "invalid_calibration_records"):
            session.analyze_session(p)


class SessionHTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location("odor_session_server_test", ROOT/"server/server.py")
        cls.server = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.server)
        cls.temp = tempfile.TemporaryDirectory()
        cls.store = cls.server.Store(str(Path(cls.temp.name)/"db.sqlite"))
        cls.http = cls.server.ThreadingHTTPServer(("127.0.0.1", 0),
                                                  cls.server.make_handler(cls.store, "ui", "device"))
        cls.thread = threading.Thread(target=cls.http.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown(); cls.http.server_close(); cls.thread.join()
        cls.store.db.close(); cls.temp.cleanup()

    def request(self, path, payload, key="ui"):
        conn = http.client.HTTPConnection("127.0.0.1", self.http.server_port, timeout=5)
        conn.request("POST", path, json.dumps(payload), {"X-Aero-Key": key, "Content-Type": "application/json"})
        res = conn.getresponse(); data = json.loads(res.read()); conn.close()
        return res.status, data

    def test_session_route_existing_pattern_and_auth(self):
        code, r = self.request("/api/predict-session", session_payload(continuous=True))
        self.assertEqual(code, 200)
        self.assertEqual(r["schema"], "aerosense-odor-session-1")
        self.assertEqual(self.request("/api/predict-session", session_payload(), "wrong")[0], 401)
        self.assertEqual(self.request("/api/predict", legacy_payload())[0], 200)

    def test_capped_body_and_300_records(self):
        p = session_payload([[.1, .2, .3, .4]] * 300)
        code, result = self.request("/api/predict-session", p)
        self.assertEqual(code, 200)
        self.assertEqual(result["recordCount"], 300)
        # The limit is checked from headers before reading a body. Do not send
        # megabytes into a socket the server has correctly closed already.
        conn = http.client.HTTPConnection("127.0.0.1", self.http.server_port, timeout=5)
        conn.putrequest("POST", "/api/predict-session")
        conn.putheader("X-Aero-Key", "ui")
        conn.putheader("Content-Length", "2097153")
        conn.endheaders()
        response = conn.getresponse()
        self.assertEqual(response.status, 400)
        self.assertEqual(json.loads(response.read())["error"], "invalid_body_size")
        conn.close()

    def test_continuous_command_validation(self):
        for duration in [9, 11, 121, True, 10.0]:
            with self.assertRaises(ValueError):
                self.store.command({"action": "start", "acquisitionMode": "continuous", "durationSec": duration})
        result = self.store.command({"action": "start", "acquisitionMode": "continuous", "durationSec": 120})
        self.assertEqual(result["periodSec"], 2)
        self.assertEqual(result["blocks"], 60)
        self.store.pending = None


if __name__ == "__main__":
    unittest.main()
