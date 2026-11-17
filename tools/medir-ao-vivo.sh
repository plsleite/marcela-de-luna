#!/bin/sh
# Abre a medição ao vivo do pincel no Safari e no Chrome (painel com os números do mouse de
# verdade). Rode da raiz do projeto:  sh tools/medir-ao-vivo.sh   (Ctrl+C para encerrar)
PORTA=4173
CACHE="$HOME/Library/Caches/marcela-de-luna-site"
sh tools/medir-pincel.sh || exit 1
SERVIDOR=""
if ! lsof -nP -iTCP:"$PORTA" -sTCP:LISTEN >/dev/null 2>&1; then
  (cd "$CACHE/preview" && exec python3 ../servidor.py "$PORTA") &
  SERVIDOR=$!
  sleep 1
fi
open -a Safari "http://localhost:$PORTA/ao-vivo.html"
open -a "Google Chrome" "http://localhost:$PORTA/ao-vivo.html"
if [ -n "$SERVIDOR" ]; then
  trap 'kill "$SERVIDOR" 2>/dev/null; echo; echo "Medição encerrada."; exit 0' INT TERM
  echo "Medição aberta (Ctrl+C para encerrar)."
  wait "$SERVIDOR"
fi
