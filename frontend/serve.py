#!/usr/bin/env python3
"""Dev server: static frontend + /api proxy to the backend (stdlib only)."""
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

FRONTEND_DIR = os.path.dirname(os.path.abspath(__file__))
API_UPSTREAM = os.environ.get("API_URL", "http://127.0.0.1:8000")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def _proxy(self):
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else None
        req = Request(API_UPSTREAM + self.path, data=body, method=self.command)
        content_type = self.headers.get("Content-Type")
        if body is not None and content_type:
            req.add_header("Content-Type", content_type)
        try:
            with urlopen(req, timeout=30) as resp:
                self._send_response(resp.status, resp.read(), resp.headers.get("Content-Type"))
        except HTTPError as e:
            self._send_response(e.code, e.read(), e.headers.get("Content-Type"))
        except URLError:
            msg = f'{{"detail":"API no responde en {API_UPSTREAM} — arranca uvicorn en :8000"}}'.encode()
            self._send_response(502, msg, "application/json")

    def _send_response(self, status, data, content_type):
        self.send_response(status)
        self.send_header("Content-Type", content_type or "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path.startswith("/api/"):
            self._proxy()
        else:
            super().do_GET()

    def do_POST(self):
        self._proxy()

    def log_message(self, fmt, *args):
        sys.stderr.write("[serve] %s\n" % (fmt % args))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"Frontend + API proxy: http://localhost:{port}  (proxy -> {API_UPSTREAM})")
    server.serve_forever()


if __name__ == "__main__":
    main()
