"""Open the existing UI with the local odor backend; no third-party dependencies."""
from pathlib import Path
import argparse
import getpass
import os
import re
import sys
import threading
import webbrowser

ROOT = Path(__file__).resolve().parent
sys.path[:0] = [str(ROOT / "server"), str(ROOT / "analysis")]
from server import Store, make_handler, ThreadingHTTPServer, DeviceBridge, odor_status


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--device-url", default="http://192.168.4.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--offline", action="store_true", help="Analyze imported reports without contacting a board")
    parser.add_argument("--no-browser", action="store_true")
    parser.add_argument("--check", action="store_true", help="Check installed reference data without connecting")
    args = parser.parse_args()
    if args.check:
        from odor_pattern import get_model_status
        reference = get_model_status()
        print("Reference JSON readable; backend imports OK.")
        print(reference)
        return
    key = os.environ.get("AEROSENSE_BOARD_KEY")
    # Read only the existing board key, never display or copy the private config.
    config = ROOT / "firmware/src/aerosense_config.h"
    if not key and config.exists():
        match = re.search(r'^\s*#define\s+API_KEY\s+"([^"\r\n]+)"', config.read_text(encoding="utf-8"), re.M)
        if match and not match[1].startswith("replace-"):
            key = match[1]
    if not key:
        key = getpass.getpass("Existing board API_KEY (input hidden): ")
    if not key:
        parser.error("An API key is required.")
    bridge = None if args.offline else DeviceBridge(args.device_url, key)
    server = ThreadingHTTPServer(("127.0.0.1", args.port),
                                make_handler(Store(":memory:"), key, key, bridge))
    url = f"http://127.0.0.1:{args.port}/"
    print(f"Open {url} and use your existing board API_KEY.")
    print("Exploratory four-receptor comparison; frozen SNN weights are not installed.")
    print("Connect this computer to the AeroSense Wi-Fi. Keep this window open.")
    if not args.no_browser:
        threading.Timer(0.3, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
