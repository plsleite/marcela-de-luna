#!/bin/sh
# Copia site/ para fora do OneDrive, de onde o servidor de conferência consegue ler.
# Rode a partir da raiz do projeto, antes de cada conferência no navegador.
set -e
DEST="$HOME/Library/Caches/marcela-de-luna-site/preview"
mkdir -p "$DEST"
rsync -a --delete site/ "$DEST/"
echo "preview atualizado em $DEST"
