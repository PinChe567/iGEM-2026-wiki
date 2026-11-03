"""Independent HTTP bridge and odor-analysis integration checks.

The device is a local HTTP fixture. No PCB, biological measurement, or trained
classifier performance is simulated or claimed by a passing test.
"""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import sys
import threading
import time
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
sys.path[:0] = [str(ROOT / "server"), str(ROOT / "analysis")]
from server import DeviceBridge, Store, make_handler


def synthetic_analysis_payload(measured=False):
    """Exact reference-shaped I/Q fixture; not fabricated experimental evidence."""
    def record(index, values, mask=15):
        return {
            "id": "analysis-fixture-" + str(index), "mode": "hardware",
            "valid": True, "samples": 8000, "sampleRateHz": 4000,
            "ledMask": mask, "dutyPercent": 25, "frequenciesHz": [41, 67, 89, 113],
            "railSamples": 0, "adcMin": 1000, "adcMax": 20000,
            "maxIntervalErrorUs": 0, "deviceId": "D", "bootId": "B",
            "firmware": "AeroSense", "firmwareRevision": "r1",
            "processingSchema": 2, "iqConvention": "I_cos_Q_sin_peak_V",
            "acquisitionSignature": f"DDS4k_IQ8000_ADC2p5V_v2_adc2_41_67_89_113_duty25_mask{mask}",
            "deviceTimeMs": index * 5000,
            "inPhaseV": list(values), "quadratureV": [0] * 4,
            "amplitudeV": [abs(v) for v in values],
        }
    reference_pattern = [-.0094, .013, .0212, .0103]
    baseline = [record(i, [.1] * 4) for i in range(11, 16)]
    payload = {
        "record": record(100, [.001 + .099 * (1 + x) for x in reference_pattern]),
        "calibration": {
            "dark": [record(i, [.001] * 4, 0) for i in range(1, 6)],
            "baseline": baseline,
            "reference": [],
        },
        "receptorOrder": ["Or22a", "Or35a", "Or85b", "Or98a"],
    }
    if measured:
        payload["calibration"]["dark"] = []
        for row in baseline:
            row.update(captureCorrectionId="correction-fixture", captureContext="fixed-optics")
        payload["measuredCalibration"] = {
            "version": "measured-complex-1", "id": "correction-fixture",
            "context": "fixed-optics", "enabled": True, "tauSec": 2,
            "blank": [record(i, [.001] * 4) for i in range(1, 6)],
            "phase": [record(i, [.05] * 4) for i in range(31, 36)],
        }
    return payload, reference_pattern


class FakeDevice:
    """Strictly records the host-to-device request, including its credentials."""

    def __init__(self):
        self.requests = []
        self.reply_error = None
        self.delay = 0
        self.malformed_status = False
        self.record = {
            "id": "fixture-boot-1",
            "mode": "hardware",
            "valid": True,
            "samples": 8000,
            "sampleRateHz": 4000,
            "frequenciesHz": [41, 67, 89, 113],
            "ledMask": 15,
            "dutyPercent": 25,
            "inPhaseV": [.02, .03, .04, .05],
            "quadratureV": [0, 0, 0, 0],
            "amplitudeV": [.02, .03, .04, .05],
            "adcMin": 100,
            "adcMax": 200,
            "railSamples": 0,
            "maxIntervalErrorUs": 0,
            "deviceId": "fixture-device",
            "bootId": "fixture-boot",
            "deviceTimeMs": 5000,
            "firmware": "AeroSense",
            "processingSchema": 2,
            "iqConvention": "I_cos_Q_sin_peak_V",
            "acquisitionSignature": "fixture-mask15-duty25",
        }
        self.raw = b"record_id,sample,time_us,adc_counts,voltage_V\nfixture-boot-1,0,0,100,0.003814697\n"
        owner = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *_args):
                pass

            def send_reply(self, status, body, content_type="application/json"):
                raw = json.dumps(body).encode() if isinstance(body, (dict, list)) else body
                self.send_response(status)
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(len(raw)))
                self.end_headers()
                try:
                    self.wfile.write(raw)
                except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
                    pass

            def receive(self):
                raw = self.rfile.read(int(self.headers.get("Content-Length", "0")))
                owner.requests.append({
                    "method": self.command,
                    "path": self.path,
                    "ui_key": self.headers.get("X-Aero-Key"),
                    "device_key": self.headers.get("X-Device-Key"),
                    "body": json.loads(raw) if raw else None,
                })
                if self.headers.get("X-Aero-Key") != "fixture-board-key":
                    self.send_reply(401, {"error": "authentication_required"})
                    return
                if owner.delay:
                    time.sleep(owner.delay)
                if owner.reply_error:
                    self.send_reply(*owner.reply_error)
                    return
                route = self.path.split("?", 1)[0]
                if self.command == "GET" and route == "/api/status":
                    if owner.malformed_status:
                        self.send_reply(200, b"not-json")
                        return
                    self.send_reply(200, {
                        "mode": "hardware",
                        "state": "idle",
                        "remaining": 0,
                        "rawAvailable": True,
                        "rawRecordId": owner.record["id"],
                        "adcDiagnosticVersion": 1,
                        "latest": owner.record,
                    })
                elif self.command == "GET" and route == "/api/history":
                    self.send_reply(200, [owner.record])
                elif self.command == "GET" and route == "/api/raw.csv":
                    self.send_reply(200, owner.raw, "text/csv")
                elif self.command == "POST" and route == "/api/command":
                    self.send_reply(200, {"ok": True})
                else:
                    self.send_reply(404, {"error": "not_found"})

            do_GET = receive
            do_POST = receive

        self.http = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.thread = threading.Thread(target=self.http.serve_forever, daemon=True)
        self.thread.start()
        self.url = "http://127.0.0.1:" + str(self.http.server_port)

    def close(self):
        self.http.shutdown()
        self.http.server_close()
        self.thread.join(timeout=2)


class BridgeIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.device = FakeDevice()
        self.bridge = DeviceBridge(self.device.url, "fixture-board-key", timeout=.5)
        self.store = Store(":memory:", False)
        self.host = ThreadingHTTPServer(
            ("127.0.0.1", 0),
            make_handler(self.store, "fixture-host-key", "fixture-relay-key", bridge=self.bridge),
        )
        self.thread = threading.Thread(target=self.host.serve_forever, daemon=True)
        self.thread.start()
        self.url = "http://127.0.0.1:" + str(self.host.server_port)

    def tearDown(self):
        self.host.shutdown()
        self.host.server_close()
        self.thread.join(timeout=2)
        self.store.db.close()
        self.device.close()

    def request(self, path, body=None, key="fixture-host-key", raw=None):
        data = raw if raw is not None else json.dumps(body).encode() if body is not None else None
        request = Request(
            self.url + path,
            data=data,
            headers={"X-Aero-Key": key, "Content-Type": "application/json"},
        )
        try:
            response = urlopen(request, timeout=3)
        except HTTPError as error:
            response = error
        with response:
            content = response.read()
            content_type = response.headers.get("Content-Type", "")
            result = json.loads(content) if content_type.startswith("application/json") else content
            return response.status, result, content_type

    def test_status_preserves_direct_device_capabilities_and_adds_model_metadata(self):
        code, status, _ = self.request("/api/status")
        self.assertEqual(code, 200)
        self.assertEqual(status["state"], "idle")
        self.assertEqual(status["mode"], "hardware")
        self.assertEqual(status["latest"], self.device.record)
        self.assertTrue(status["rawAvailable"])
        self.assertEqual(status["adcDiagnosticVersion"], 1)
        self.assertNotIn("reportedDeviceStatus", status)
        self.assertIn("odorBackend", status)
        self.assertEqual(self.device.requests[-1]["ui_key"], "fixture-board-key")
        self.assertIsNone(self.device.requests[-1]["device_key"])
        self.assertNotIn("fixture-board-key", json.dumps(status))

    def test_history_preserves_device_payload(self):
        code, records, _ = self.request("/api/history")
        self.assertEqual(code, 200)
        self.assertEqual(records, [self.device.record])
        self.assertEqual(self.device.requests[-1]["path"], "/api/history")

    def test_raw_query_and_bytes_are_preserved(self):
        path = "/api/raw.csv?id=fixture%2Fboot%2B1&purpose=raw"
        code, content, content_type = self.request(path)
        self.assertEqual(code, 200)
        self.assertEqual(content, self.device.raw)
        self.assertTrue(content_type.startswith("text/csv"))
        self.assertEqual(self.device.requests[-1]["path"], path)

    def test_command_and_adc_diagnostic_are_forwarded_without_rewriting(self):
        commands = [
            {"action": "start", "blocks": 2, "periodSec": 60,
             "dutyPercent": 25, "ledMask": 15, "conditionTag": "測試"},
            {"action": "stop"},
            {"action": "pause"},
            {"action": "resume"},
            {"action": "diagnoseAdc", "conditionTag": "ADC_room"},
        ]
        for command in commands:
            with self.subTest(action=command["action"]):
                code, reply, _ = self.request("/api/command", command)
                self.assertEqual((code, reply), (200, {"ok": True}))
                sent = self.device.requests[-1]
                self.assertEqual(sent["method"], "POST")
                self.assertEqual(sent["path"], "/api/command")
                self.assertEqual(sent["body"], command)
                self.assertEqual(sent["ui_key"], "fixture-board-key")

    def test_ui_authentication_prevents_forwarding(self):
        for path, body in [
            ("/api/status", None),
            ("/api/history", None),
            ("/api/raw.csv?id=fixture-boot-1", None),
            ("/api/command", {"action": "start"}),
            ("/api/predict", {"record": self.device.record}),
        ]:
            with self.subTest(path=path):
                code, result, _ = self.request(path, body, key="fixture-board-key")
                self.assertEqual(code, 401)
                self.assertEqual(result["error"], "authentication_required")
        self.assertEqual(self.device.requests, [])

    def test_upstream_client_errors_are_preserved(self):
        for code, error in [(401, "authentication_required"), (409, "busy")]:
            with self.subTest(status=code):
                self.device.reply_error = (code, {"error": error})
                actual, result, _ = self.request("/api/command", {"action": "start"})
                self.assertEqual(actual, code)
                self.assertEqual(result, {"error": error})

    def test_unknown_routes_are_not_sent_to_device(self):
        for path in ["/api/not-a-route", "/api/another/path"]:
            code, result, _ = self.request(path)
            self.assertEqual(code, 404)
            self.assertEqual(result["error"], "not_found")
        self.assertEqual(self.device.requests, [])

    def test_bridge_itself_rejects_route_and_method_escape(self):
        for method, path in [
            ("GET", "http://127.0.0.1/api/status"),
            ("GET", "//127.0.0.1/api/status"),
            ("GET", "/api/status#hidden"),
            ("GET", "/api/command"),
            ("POST", "/api/status"),
            ("DELETE", "/api/command"),
            ("GET", "/api/device/poll"),
        ]:
            with self.subTest(method=method, path=path):
                with self.assertRaises(ValueError):
                    self.bridge.request(method, path)
        self.assertEqual(self.device.requests, [])

    def test_bridge_configuration_requires_origin_and_board_key(self):
        for url, key in [
            ("ftp://127.0.0.1", "key"),
            ("http://", "key"),
            ("http://username:password@127.0.0.1", "key"),
            ("http://127.0.0.1/base", "key"),
            ("http://127.0.0.1?query=value", "key"),
            ("http://127.0.0.1#fragment", "key"),
            ("http://127.0.0.1", ""),
        ]:
            with self.subTest(url=url):
                with self.assertRaises(ValueError):
                    DeviceBridge(url, key)

    def test_malformed_command_bodies_do_not_reach_device(self):
        for raw in [b'{"action":', b"[]", b"null", b"123", b'{"action":"start"}' + b" " * 2_000_000]:
            with self.subTest(size=len(raw)):
                code, result, _ = self.request("/api/command", raw=raw)
                self.assertEqual(code, 400)
                self.assertIn("error", result)
        self.assertEqual(self.device.requests, [])

    def test_malformed_device_status_returns_machine_readable_failure(self):
        self.device.malformed_status = True
        code, result, _ = self.request("/api/status")
        self.assertGreaterEqual(code, 500)
        self.assertLess(code, 600)
        self.assertIn("error", result)

    def test_device_timeout_is_bounded_and_returns_json(self):
        self.device.delay = 1.2
        started = time.monotonic()
        code, result, content_type = self.request("/api/status")
        self.assertLess(time.monotonic() - started, 2)
        self.assertGreaterEqual(code, 500)
        self.assertLess(code, 600)
        self.assertTrue(content_type.startswith("application/json"))
        self.assertIn("error", result)

    def test_predict_is_local_in_bridge_mode(self):
        payload = {"integrationProbe": "local-analysis", "record": self.device.record}
        expected = {"status": "fixture-analysis", "sourceRecordId": self.device.record["id"]}
        with patch("server.analyze_pattern", return_value=expected) as analyze:
            code, result, _ = self.request("/api/predict", payload)
        self.assertEqual(code, 200)
        self.assertEqual(result, expected)
        analyze.assert_called_once_with(payload)
        self.assertEqual(self.device.requests, [])

    def test_real_pattern_analysis_and_measured_correction_work_over_http(self):
        for measured in (False, True):
            with self.subTest(measured=measured):
                payload, expected_features = synthetic_analysis_payload(measured)
                # The backend must derive features from raw measurements, not trust these.
                payload["features"] = [100, -100, 100, -100]
                code, result, _ = self.request("/api/predict", payload)
                self.assertEqual(code, 200, result)
                self.assertEqual(result["status"], "exploratory_similarity")
                self.assertIsNone(result["identifiedOdor"])
                self.assertIs(result["validated"], False)
                self.assertNotIn("probabilities", result)
                self.assertEqual(result["nearestReference"]["compound"], "3-octanol")
                self.assertAlmostEqual(result["nearestReference"]["pearsonR"], 1, places=12)
                self.assertEqual(result["provenance"]["recordId"], payload["record"]["id"])
                self.assertEqual(result["receptorOrder"], payload["receptorOrder"])
                for actual, expected in zip(result["features"], expected_features):
                    self.assertAlmostEqual(actual, expected, places=12)
                if measured:
                    self.assertIs(result["normalization"]["darkSubtractedSeparately"], False)
        self.assertEqual(self.device.requests, [])

    def test_invalid_sample_is_rejected_over_http_even_if_it_has_valid_true(self):
        for mutation, expected_error in [
            ({"adcMin": 32767, "adcMax": 32767}, "ADC_constant"),
            ({"mode": "demo"}, "hardware_measurement_required"),
            ({"samples": 1}, "complete_8000_sample_block_required"),
            ({"railSamples": 1}, "ADC_rail"),
            ({"maxIntervalErrorUs": 51}, "sample_jitter"),
        ]:
            with self.subTest(mutation=mutation):
                payload, _ = synthetic_analysis_payload()
                payload["record"].update(mutation)
                code, result, _ = self.request("/api/predict", payload)
                self.assertEqual(code, 400)
                self.assertEqual(result["error"], expected_error)
        self.assertEqual(self.device.requests, [])

    def test_zero_response_does_not_identify_or_select_an_odor(self):
        payload, _ = synthetic_analysis_payload()
        payload["record"]["inPhaseV"] = [.1] * 4
        payload["record"]["amplitudeV"] = [.1] * 4
        code, result, _ = self.request("/api/predict", payload)
        self.assertEqual(code, 200)
        self.assertEqual(result["status"], "insufficient_signal")
        self.assertIsNone(result["nearestReference"])
        self.assertIsNone(result["identifiedOdor"])
        self.assertTrue(all(row["pearsonR"] is None for row in result["scores"]))
        self.assertEqual(self.device.requests, [])

    def test_large_uniform_response_with_sub_noise_pattern_is_not_ranked_as_informative(self):
        payload, _ = synthetic_analysis_payload()
        features = [.2, .200001, .199999, .2]
        values = [.001 + .099 * (1 + x) for x in features]
        payload["record"]["inPhaseV"] = values
        payload["record"]["amplitudeV"] = list(values)
        code, result, _ = self.request("/api/predict", payload)
        self.assertEqual(code, 200)
        self.assertEqual(result["status"], "insufficient_signal")
        self.assertIsNone(result["nearestReference"])
        self.assertIsNone(result["literatureReference"]["nearestReference"])
        self.assertIsNone(result["identifiedOdor"])
        # A high r can occur numerically even though the channel differences
        # are far below one ADC LSB; the nomination guard is the tested behavior.
        self.assertGreater(max(row["pearsonR"] for row in result["scores"]), .98)


if __name__ == "__main__":
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(BridgeIntegrationTests)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    evidence = ROOT / "evidence" / "odor_integration_tests.json"
    evidence.parent.mkdir(exist_ok=True)
    evidence.write_text(json.dumps({
        "passed": result.wasSuccessful(),
        "tests": result.testsRun,
        "failures": len(result.failures),
        "errors": len(result.errors),
        "method": "Local HTTP device fixture; no PCB or biological performance tested",
    }, indent=2) + "\n", encoding="utf-8")
    sys.exit(not result.wasSuccessful())
