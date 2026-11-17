#!/bin/sh
# Prepara a medição do pincel na cópia de conferência: atualiza o preview e cria medir.html,
# a mesma página com o relógio controlado e os contadores de tools/medicao/ (nada disso entra
# em site/). Rode da raiz do projeto e abra http://localhost:4173/medir.html (simulação, pelo
# console), http://localhost:4173/ao-vivo.html (painel com os números do mouse de verdade) ou
# http://localhost:4173/controle.html (o mesmo painel numa página em branco, sem o site).
set -e
sh tools/preview-sync.sh
DEST="$HOME/Library/Caches/marcela-de-luna-site/preview"
mkdir -p "$DEST/__medir"
cp tools/medicao/*.js "$DEST/__medir/"
sed -e 's|"imports": {|"imports": { "./js/gl/tinta.js": "./__medir/tinta.js", "./js/ui/preenchimento.js": "./__medir/preenchimento.js", "./js/gl/palco.js": "./__medir/palco.js",|' \
    -e 's|<script type="module" src="./js/main.js">|<script src="./__medir/medir.js"></script><script type="module" src="./js/main.js">|' \
    site/index.html > "$DEST/medir.html"
sed -e 's|<script type="module" src="./js/main.js">|<script src="./__medir/ao-vivo.js"></script><script type="module" src="./js/main.js">|' \
    "$DEST/medir.html" > "$DEST/ao-vivo.html"
cp tools/medicao/controle.html "$DEST/controle.html"
grep -q '__medir/ao-vivo.js' "$DEST/ao-vivo.html"
grep -q '__medir/medir.js' "$DEST/medir.html" && grep -q '__medir/tinta.js' "$DEST/medir.html"
echo "medição pronta: http://localhost:4173/medir.html e http://localhost:4173/ao-vivo.html"
