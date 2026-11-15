#!/bin/sh
# Copia site/ para fora do OneDrive, de onde o servidor de conferência consegue ler.
# Rode a partir da raiz do projeto, antes de cada conferência no navegador.
set -e
CACHE="$HOME/Library/Caches/marcela-de-luna-site"
DEST="$CACHE/preview"
mkdir -p "$DEST"
rsync -a --delete site/ "$DEST/"
cp tools/servidor.py "$CACHE/servidor.py"
echo "preview atualizado em $DEST"
