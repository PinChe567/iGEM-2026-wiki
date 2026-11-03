"""Same-origin bridge to an explicitly configured AeroSense board.

No firmware or device settings are changed. Only the existing UI routes are
forwarded, with the board key kept on the host. Requests are serialized because
the ESP32 uses a synchronous HTTP server.
"""
import json
import threading
import urllib.error
import urllib.parse
import urllib.request


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


class DeviceBridge:
    GET_ROUTES = {"/api/status", "/api/history", "/api/raw.csv"}
    POST_ROUTES = {"/api/command"}

    def __init__(self, base_url, api_key, timeout=5):
        url = urllib.parse.urlsplit(base_url)
        if (url.scheme not in ("http", "https") or not url.hostname
                or url.username or url.password or url.query or url.fragment
                or url.path not in ("", "/") or not api_key):
            raise ValueError("invalid_device_bridge_configuration")
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self.lock = threading.Lock()
        # Do not send a private board request through environment HTTP proxies.
        self.opener = urllib.request.build_opener(
            urllib.request.ProxyHandler({}), NoRedirect())

    def request(self, method, path, body=None):
        route = urllib.parse.urlsplit(path)
        allowed = self.GET_ROUTES if method == "GET" else self.POST_ROUTES if method == "POST" else set()
        if route.scheme or route.netloc or route.fragment or route.path not in allowed:
            raise ValueError("device_route_not_allowed")
        raw = None if body is None else json.dumps(body, allow_nan=False).encode()
        req = urllib.request.Request(
            self.base_url + path, data=raw, method=method,
            headers={"X-Aero-Key": self.api_key, "Content-Type": "application/json"})
        try:
            with self.lock:
                try:
                    response = self.opener.open(req, timeout=self.timeout)
                except urllib.error.HTTPError as exc:
                    response = exc
                with response:
                    data = response.read(4 * 1024 * 1024 + 1)
                    if len(data) > 4 * 1024 * 1024:
                        raise ValueError("device_response_too_large")
                    return response.status, data, response.headers.get("Content-Type", "application/json")
        except (OSError, urllib.error.URLError, ValueError):
            return 502, b'{"error":"device_unreachable_or_invalid_response"}', "application/json"
