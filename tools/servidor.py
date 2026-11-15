"""Servidor local de conferência: serve a pasta atual sem cache.

Sem isto o navegador reaproveita módulos JS antigos depois de uma alteração
(o http.server padrão não envia Cache-Control). Uso: python3 servidor.py 4173
"""
import http.server
import sys


class SemCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    porta = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    http.server.ThreadingHTTPServer(("127.0.0.1", porta), SemCache).serve_forever()
