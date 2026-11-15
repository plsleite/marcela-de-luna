#!/bin/sh
# Abre o piloto no navegador. Rode a partir da raiz do projeto:  sh tools/abrir-piloto.sh
# Copia o site para fora do OneDrive, sobe o servidor local (sem cache) e abre o navegador.
# Fica rodando até você apertar Ctrl+C. Para usar outra porta:  PORTA=4188 sh tools/abrir-piloto.sh
PORTA="${PORTA:-4173}"
ENDERECO="http://localhost:$PORTA"
CACHE="$HOME/Library/Caches/marcela-de-luna-site"

if [ ! -f tools/preview-sync.sh ]; then
  echo "Rode este comando a partir da pasta do projeto (onde ficam as pastas site e tools)."
  exit 1
fi

sh tools/preview-sync.sh || exit 1

# Porta ocupada: provavelmente o piloto já está aberto. Só abre o navegador.
if lsof -nP -iTCP:"$PORTA" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "A porta $PORTA já está em uso (o piloto talvez já esteja rodando)."
  echo "Só vou abrir o navegador em $ENDERECO."
  open "$ENDERECO"
  exit 0
fi

cd "$CACHE/preview" || exit 1
python3 ../servidor.py "$PORTA" &
SERVIDOR=$!
trap 'kill "$SERVIDOR" 2>/dev/null; echo; echo "Piloto encerrado."; exit 0' INT TERM

sleep 1
if ! kill -0 "$SERVIDOR" 2>/dev/null; then
  echo "O servidor não subiu. Veja a mensagem acima."
  exit 1
fi

echo "Piloto em $ENDERECO (Ctrl+C para encerrar)."
open "$ENDERECO"
wait "$SERVIDOR"
