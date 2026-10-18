"""Servidor local de desarrollo: igual que `python3 -m http.server`, pero sin caché.

Así el navegador siempre carga la versión más reciente de cada archivo al recargar.
Uso: python3 serve.py  (abre http://localhost:5500)
"""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PORT = 5500


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    handler = partial(NoCacheHandler, directory=str(Path(__file__).parent))
    print(f"Aaa-rriba en http://localhost:{PORT}  (Ctrl+C para detener)")
    ThreadingHTTPServer(("", PORT), handler).serve_forever()
