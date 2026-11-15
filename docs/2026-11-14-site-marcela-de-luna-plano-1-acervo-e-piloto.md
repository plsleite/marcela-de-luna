# Site Marcela de Luna — Plano 1: acervo e piloto no computador

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extrair todo o acervo do PDF e entregar o piloto "Travessia" no computador (capa, Pesquisa Artística, abertura de A Bailarina e as três primeiras obras), pronto para o Pedro validar.

**Architecture:** Site estático em `site/`, sem etapa de build. Uma página com texto real no DOM e um `<canvas>` fixo em three.js; o scroll nativo (suavizado por Lenis) vira posição numa linha do tempo, que move a câmera e liga as legendas. A lógica (linha do tempo, câmera, janela de carregamento, zoom, pincel) fica em módulos puros testados com `node --test`; o que é visual é conferido no navegador pelo gancho `window.__site`.

**Tech Stack:** HTML/CSS/JS em módulos ES (import map), three.js 0.187.0, GSAP 3.15.1, Lenis 1.3.27, fonte Outfit variável 5.3.0; Python 3.9 + Pillow 11.3 (`/usr/bin/python3`) e `pdftoppm`/`pdfimages`/`pdftotext` para o acervo; Node 22 só para testes.

**Spec:** `docs/2026-11-14-site-marcela-de-luna-design.md`

**Alcance:** etapas 1 e 2 da seção 7 do desenho. Extensão às 58 páginas, conceito de celular, acabamento (inclui o botão "ver com movimento") e publicação ficam para planos seguintes, escritos depois da validação do piloto.

## Global Constraints

- Conteúdo: somente o do PDF, na ordem do PDF. Grafia "DÚVIDEI" mantida. Idioma: português.
- Nenhuma URL remota em tempo de execução: bibliotecas em `site/vendor/`, fonte em `site/fonts/`. O site roda sem internet.
- Nada de `npm install` nem `node_modules` dentro da pasta do projeto (OneDrive).
- Arquivos temporários grandes (páginas rasterizadas) ficam em `~/Library/Caches/marcela-de-luna-site/`, nunca na pasta do projeto.
- O PDF nunca entra no repositório (`*.pdf` no `.gitignore`). Nenhum `git push` neste plano.
- Fundo `#ffffff`. As pinturas nunca recebem tinta do pincel. A luz rasante altera só a luminância, em no máximo ±12%.
- O scroll é o nativo da página; nada pode impedir o visitante de rolar.
- `<meta name="robots" content="noindex, nofollow">` no `index.html`.
- Todo texto é texto real no DOM. `alt` das imagens de obra: `"{TÍTULO}, acrílica sobre tela, {dimensões}, 2026"`.
- Navegadores: Safari e Chrome atuais. Neste plano, tela de toque na vertical, movimento reduzido ou falta de WebGL mostram a página base (Tarefa 6).
- Testes: `node --test tests/` e `/usr/bin/python3 -m unittest discover -s tools -p "test_*.py"`.
- Conferência visual: servidor `site` do `.claude/launch.json` (porta 4173), console sem erros.

## Review Focus

1. **Recarregar no meio da página** (o navegador restaura o scroll): o site deve iniciar na parada certa, sem repetir a abertura por cima do conteúdo. → Tarefa 10.
2. **Salto rápido** (clique na navegação, arrasto da barra de rolagem) para telas ainda não carregadas: deve aparecer a cor dominante ou a miniatura, nunca plano preto, vazio ou erro. → Tarefa 7.
3. **Redimensionar a janela**, inclusive muito larga ou estreita: canvas, câmera e legendas se ajustam; nenhuma tela fica cortada no foco. → Tarefa 7.
4. **WebGL indisponível ou contexto perdido:** cai na página base, não em tela branca. → Tarefa 7.
5. **Rolar, usar o teclado ou clicar na navegação durante o mergulho:** sai do mergulho e devolve ao mesmo ponto, sem estado preso. → Tarefa 11.

## Estrutura de arquivos

```
.claude/launch.json            servidor de conferência
.gitignore
tools/extract.py               rasteriza, recorta, gera WebP e images.json
tools/crops.json               recorte de cada imagem (feito à mão, conferido)
tools/pdf-text.txt             saída de pdftotext, base do teste de conteúdo
tools/test_extract.py
site/index.html
site/css/base.css              tipografia, página base
site/css/travessia.css         modo imersivo
site/fonts/outfit-latin-wght-normal.woff2
site/vendor/                   three.module.min.js, three.core.min.js, gsap.mjs, lenis.mjs
site/assets/img/{id}-{largura}.webp
site/data/content.json         paradas na ordem do PDF
site/data/images.json          dimensões, cor, miniatura e larguras de cada imagem
site/js/config.js              constantes
site/js/core/timeline.js       scroll → parada
site/js/core/camera.js         posição da câmera e dos planos
site/js/core/janela.js         o que carregar e em que largura
site/js/core/mergulho.js       zoom e arrasto
site/js/core/pincel.js         carimbos entre dois pontos
site/js/ui/base.js             HTML das paradas
site/js/ui/legendas.js         liga legendas e textos pela parada em foco
site/js/ui/preenchimento.js    letras que se enchem de tinta
site/js/ui/abertura.js         carregamento e revelação da capa
site/js/ui/mergulho-ui.js      ficha, voltar, marcas dos closes
site/js/ui/navegacao.js        fileira de pinceladas, teclado, cabeçalho
site/js/gl/palco.js            renderer, cena, câmera, laço
site/js/gl/tela.js             plano de pintura e seu shader
site/js/gl/texturas.js         carregamento progressivo
site/js/gl/tinta.js            camada do pincel
site/js/main.js
tests/*.test.mjs
```

---

### Task 1: Repositório, bibliotecas e fonte

**Files:**
- Create: `.claude/launch.json`, `site/vendor/*`, `site/fonts/outfit-latin-wght-normal.woff2`, `site/index.html`, `site/js/main.js`, `tests/vendor.test.mjs` (`.gitignore` e o repositório já existem)

**Interfaces:**
- Produces: import map com os nomes `three`, `gsap`, `lenis`; servidor `site` na porta 4173.

- [ ] **Step 1: Criar o repositório com os objetos fora do OneDrive**

```bash
mkdir -p ~/.gitdirs && git init --separate-git-dir ~/.gitdirs/marcela-de-luna-site.git
```
`.gitignore`: `*.pdf`, `.DS_Store`, `__pycache__/`.

- [ ] **Step 2: Escrever o teste**

```js
// tests/vendor.test.mjs
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const arquivos = ['three.module.min.js','three.core.min.js','gsap.mjs','lenis.mjs'];
test('bibliotecas locais, sem importação remota', () => {
  for (const a of arquivos) {
    const txt = readFileSync(`site/vendor/${a}`, 'utf8');
    assert.ok(txt.length > 10000, a);
    assert.doesNotMatch(txt, /from\s*["']https?:/, a);
  }
});
test('fonte e index sem URL remota', () => {
  assert.ok(existsSync('site/fonts/outfit-latin-wght-normal.woff2'));
  const html = readFileSync('site/index.html', 'utf8');
  assert.doesNotMatch(html, /(src|href)=["']https?:/);
  assert.match(html, /name="robots" content="noindex, nofollow"/);
});
```

- [ ] **Step 3: Rodar e ver falhar** — `node --test tests/` → FAIL (arquivos ausentes).

- [ ] **Step 4: Baixar as bibliotecas e a fonte, com versão fixa**

De `https://cdn.jsdelivr.net/npm/`: `three@0.187.0/build/three.module.min.js`, `three@0.187.0/build/three.core.min.js` (mesmo nome, pois o primeiro importa `./three.core.min.js`), `gsap@3.15.1/+esm` → `gsap.mjs`, `lenis@1.3.27/dist/lenis.mjs`, `@fontsource-variable/outfit@5.3.0/files/outfit-latin-wght-normal.woff2`. Se `gsap.mjs` trouxer importação absoluta, baixar o alvo para `site/vendor/` e corrigir o caminho.

- [ ] **Step 5: Criar `site/index.html` e `.claude/launch.json`**

`index.html`: `lang="pt-BR"`, título "Marcela de Luna — Portfólio 2026", meta robots, import map (`three`→`./vendor/three.module.min.js`, `gsap`→`./vendor/gsap.mjs`, `lenis`→`./vendor/lenis.mjs`), `<canvas id="gl">`, `<main id="paradas">`, `<script type="module" src="./js/main.js">`. `main.js` provisório importa as três e faz `console.log` das versões.
`launch.json`: configuração `site`, `python3 -m http.server 4173 --directory site`, porta 4173.

- [ ] **Step 6: Conferir** — `node --test tests/` → PASS. Abrir o servidor `site`: console mostra as três versões, sem erros.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "chore: estrutura, bibliotecas e fonte"`

---

### Task 2: Extração das imagens

**Files:**
- Create: `tools/extract.py`, `tools/test_extract.py`, `tools/crops.json`, `site/assets/img/*`, `site/data/images.json`

**Interfaces:**
- Produces: `site/data/images.json` = `{ "<id>": { "w": int, "h": int, "cor": "#rrggbb", "mini": "data:image/webp;base64,…", "larguras": [640,1280,2560] } }`; arquivos `site/assets/img/<id>-<largura>.webp`. Ids `pNN-a`, `pNN-b`, de cima para baixo na página. Total: **65 imagens** (pág. 1: 1; pág. 2: 2; pág. 3: 1; págs. 4–23: 26; págs. 24–39: 16; pág. 40: 1; págs. 41–49: 9; págs. 50–57: 8; pág. 58: 1).

- [ ] **Step 1: Escrever os testes**

```python
# tools/test_extract.py
import unittest
from PIL import Image
from extract import caixa_nao_branca, cor_dominante, larguras_para, recortar

class T(unittest.TestCase):
    def test_caixa(self):
        im = Image.new('RGB', (100, 200), 'white'); im.paste((20, 30, 90), (10, 20, 60, 120))
        self.assertEqual(caixa_nao_branca(im), (10, 20, 60, 120))
    def test_cor(self):
        self.assertEqual(cor_dominante(Image.new('RGB', (8, 8), (26, 28, 58))), '#1a1c3a')
    def test_larguras(self):
        self.assertEqual(larguras_para(3000), [640, 1280, 2560])
        self.assertEqual(larguras_para(1800), [640, 1280, 1800])
        self.assertEqual(larguras_para(500), [500])
    def test_recortar_por_fracao(self):
        im = Image.new('RGB', (1000, 2000), 'white')
        self.assertEqual(recortar(im, [0.1, 0.25, 0.6, 0.75]).size, (500, 1000))
```

- [ ] **Step 2: Rodar e ver falhar** — `/usr/bin/python3 -m unittest discover -s tools -p "test_*.py"` → FAIL (módulo ausente).

- [ ] **Step 3: Implementar `tools/extract.py`**

Funções: `caixa_nao_branca(im, limiar=245) -> (x0,y0,x1,y1)`; `cor_dominante(im) -> str` (cor mais frequente após quantizar em 8 cores, ignorando branco acima do limiar); `larguras_para(w) -> list[int]` (640, 1280, 2560, trocando a última pela largura real quando a fonte for menor); `recortar(im, rect) -> Image` (rect em frações da página).
Comandos:
- `extract.py texto` → grava `tools/pdf-text.txt` com `pdftotext -layout`.
- `extract.py propor` → rasteriza cada página (`pdftoppm -jpeg -jpegopt quality=95`, 300 dpi; 150 dpi nas págs. 24–39 e 50–57) no cache `~/Library/Caches/marcela-de-luna-site/` e grava em `tools/crops.json` a caixa não branca de cada página como `{"pNN-a": {"pagina": N, "rect": [x0,y0,x1,y1]}}`.
- `extract.py gerar` → para cada entrada de `crops.json`, recorta e grava os WebP (qualidade 82), a miniatura de 24 px em base64 e `site/data/images.json`.
Entrada alternativa em `crops.json` para imagem com letras por cima: `{"pagina": N, "fonte": "embutida", "indice": I, "rot": 0|90|180|270, "rect": [...]}`, em que `indice` é o número da imagem em `pdfimages -list` e `rect` é fração da foto já girada.

- [ ] **Step 4: Rodar os testes** → PASS.

- [ ] **Step 5: Gerar e corrigir os recortes à mão**

Rodar `texto`, `propor`. Editar `crops.json`:
- Págs. 6, 7, 12, 14, 15, 16 (duas telas em diagonal) e pág. 2 (dois recortes): separar em `-a` e `-b`.
- Págs. 2, 3, 40 e todas as de obra: o recorte cobre só a pintura, sem título, fio ou texto.
- Págs. 1, 24 e 50 têm letras brancas por cima ("PORTFÓLIO", "DETALHES"): usar `"fonte": "embutida"` (índices 0, 37 e 65), com giro e recorte que reproduzam o enquadramento da página.
Rodar `gerar`.

- [ ] **Step 6: Conferir**

`python3 -c "import json;d=json.load(open('site/data/images.json'));print(len(d))"` → `65`. Montar uma folha de contato com as 65 imagens na largura 640 e olhar uma a uma: nenhuma faixa branca na borda, nenhum texto dentro da imagem, nenhuma tela cortada, `p01-a`, `p24-a` e `p50-a` sem letras.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: extração e otimização do acervo"`

---

### Task 3: Arquivo de conteúdo

**Files:**
- Create: `site/data/content.json`, `tests/content.test.mjs`

**Interfaces:**
- Consumes: `site/data/images.json`, `tools/pdf-text.txt`.
- Produces: `content.json` = `{ "stops": [Stop] }`, uma parada por página, em ordem. Campos comuns: `id`, `tipo` (`capa|texto|abertura|obra|detalhe|verso`), `pagina`. Por tipo:
  - `capa`: `imagens`, `titulo`, `nome`, `ano`, `contato: {rotulo, telefone, instagram, email}`, `rodape`.
  - `texto` e `abertura`: `titulo`, `subtitulo`, `paragrafos` (lista de parágrafos; cada um é lista de trechos `{t, b?}`), `planos: [{imagem, x, y, z, altura}]`; `abertura` tem `serie`.
  - `obra`: `serie`, `titulo` (caixa alta), `ficha: {tecnica, dimensoes, ano}`, `telas: [id]`, `closes: []` (preenchido na Tarefa 4).
  - `detalhe`: `imagens: [id]`, `titulo` só nas págs. 24 e 50.
  - `verso`: `imagens`.
  Ids de obra: título em minúsculas, sem acento, com hífens (`foyer-de-la-danse`, `a-danca-e-por-ela`, `l-inconnue`, `duvidei`). Demais: `capa`, `pesquisa-artistica`, `a-bailarina`, `entre-nos`, `detalhes-1-01`…`detalhes-1-16`, `detalhes-2-01`…`detalhes-2-08`, `verso`.

- [ ] **Step 1: Escrever o teste**

```js
// tests/content.test.mjs
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const { stops } = JSON.parse(readFileSync('site/data/content.json', 'utf8'));
const imgs = JSON.parse(readFileSync('site/data/images.json', 'utf8'));
const pdf = readFileSync('tools/pdf-text.txt', 'utf8').replace(/\s+/g, ' ');
const obras = stops.filter(s => s.tipo === 'obra');
const texto = s => s.paragrafos.map(p => p.map(x => x.t).join('')).join(' ');
const negrito = s => s.paragrafos.flat().filter(x => x.b).map(x => x.t).join(' ').replace(/\s+/g, ' ');

test('58 paradas na ordem das páginas', () => {
  assert.deepEqual(stops.map(s => s.pagina), Array.from({ length: 58 }, (_, i) => i + 1));
  assert.equal(new Set(stops.map(s => s.id)).size, 58);
});
test('obras e telas', () => {
  assert.equal(obras.length, 29);
  assert.equal(obras.filter(o => o.serie === 'a-bailarina').length, 20);
  assert.equal(obras.flatMap(o => o.telas).length, 35);
  assert.deepEqual(obras.filter(o => o.telas.length === 2).map(o => o.pagina), [6, 7, 12, 14, 15, 16]);
  for (const o of obras) { assert.equal(o.ficha.tecnica, 'acrílica sobre tela'); assert.equal(o.ficha.ano, '2026'); }
  assert.equal(stops[22].titulo, 'DÚVIDEI');
  assert.equal(stops[3].ficha.dimensoes, '30 x 40 cm');
  assert.equal(stops[10].ficha.dimensoes, '30 x 20 cm');
});
test('detalhes e verso', () => {
  assert.equal(stops.filter(s => s.tipo === 'detalhe').length, 24);
  assert.equal(stops[23].titulo, 'DETALHES'); assert.equal(stops[49].titulo, 'DETALHES');
  assert.equal(stops[57].tipo, 'verso');
});
test('todo texto extraível confere com o PDF', () => {
  for (const s of stops.filter(s => s.paragrafos))
    for (const p of s.paragrafos) assert.ok(pdf.includes(p.map(x => x.t).join('').replace(/\s+/g, ' ').trim()), s.id);
  for (const o of obras) assert.ok(pdf.includes(o.titulo), o.titulo);
});
test('subtítulos e negritos', () => {
  assert.equal(stops[1].subtitulo, 'A mulher como campo de investigação');
  assert.equal(stops[2].subtitulo, 'CORPO, MOVIMENTO E EXPRESSÃO');
  assert.equal(stops[39].subtitulo, 'FIGURA, IDENTIDADE E SUBJETIVIDADE');
  assert.equal(negrito(stops[1]), 'identidade, subjetividade, força, vulnerabilidade e transformação.');
  assert.equal(negrito(stops[2]), 'Para além da representação da dança, investigo a figura feminina como presença expressiva, atravessada por forças e vulnerabilidades.');
  assert.equal(negrito(stops[39]), 'A pintura torna-se um espaço de experimentação, no qual cor, matéria e gesto participam da construção de estados emocionais e dimensões interiores.');
  assert.equal(stops[1].paragrafos.length, 4);
});
test('capa', () => {
  const c = stops[0];
  assert.equal(c.titulo, 'PORTFÓLIO'); assert.equal(c.nome, 'MARCELA DE LUNA'); assert.equal(c.ano, '2026');
  assert.deepEqual(c.contato, { rotulo: 'PROJETOS | CONTATO', telefone: '+55 21 996602668', instagram: '@marceladeluna_art', email: 'marceladeluna.art@gmail.com' });
  assert.equal(c.rodape, 'PESQUISA ARTÍSTICA | PINTURA CONTEMPORÂNEA');
});
test('toda imagem citada existe e nenhuma sobra', () => {
  const usadas = stops.flatMap(s => [...(s.imagens ?? []), ...(s.telas ?? []), ...(s.planos ?? []).map(p => p.imagem)]);
  for (const id of usadas) assert.ok(imgs[id], id);
  assert.equal(new Set(usadas).size, 65);
});
```

- [ ] **Step 2: Rodar e ver falhar** — `node --test tests/content.test.mjs` → FAIL.

- [ ] **Step 3: Escrever `site/data/content.json`**

Títulos, fichas e parágrafos saem de `tools/pdf-text.txt`, com as quebras de linha desfeitas; títulos, dimensões e ordem conferidos pela seção 5.1 do desenho. Os `planos` das págs. 2, 3 e 40 recebem posições que reproduzam a composição do PDF em tela larga: imagens deslocadas à esquerda, coluna de texto à direita, usando as unidades da Tarefa 5 (`altura` entre 2,6 e 4,6; `x` entre −4 e 0; `z` entre 0 e −2 em relação à parada).

- [ ] **Step 4: Rodar** → PASS.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: conteúdo do portfólio em content.json"`

---

### Task 4: Ligar os closes às telas

**Files:**
- Modify: `site/data/content.json` (campo `closes` das obras)
- Modify: `tests/content.test.mjs`

**Interfaces:**
- Produces: em cada obra, `closes: [{ imagem: "pNN-a", tela: 0|1, x: 0..1, y: 0..1 }]` — `x`,`y` é o centro do close dentro da tela, origem no canto superior esquerdo.

- [ ] **Step 1: Acrescentar o teste**

```js
test('closes apontam para detalhes existentes, dentro da tela, sem repetição', () => {
  const det = new Set(stops.filter(s => s.tipo === 'detalhe').flatMap(s => s.imagens));
  const vistos = [];
  for (const o of obras) for (const c of o.closes) {
    assert.ok(det.has(c.imagem), c.imagem); assert.ok(c.tela < o.telas.length);
    assert.ok(c.x >= 0 && c.x <= 1 && c.y >= 0 && c.y <= 1); vistos.push(c.imagem);
  }
  assert.equal(new Set(vistos).size, vistos.length);
  assert.ok(vistos.length >= 8);
  assert.ok(obras.find(o => o.id === 'a-danca-e-por-ela').closes.length >= 1);
});
```

- [ ] **Step 2: Rodar e ver falhar.**

- [ ] **Step 3: Fazer a correspondência visual**

Para cada um dos 24 closes, comparar com as 35 telas (lado a lado, largura 1280) e registrar a obra, a tela e o centro. Pistas do desenho, a confirmar: 26 → Bastidores; 30 → A Dança é por Ela; 34 → Plena; 35 → Abstrata; 36 → Solitude; 37 → Alcance; 50 → L'Inconnue; 52 → Tensão; 55 → Cartografia do Íntimo; 56 → A Outra Margem. O close da pág. 28 é da pintura da capa e fica sem ligação. Close sem tela identificável com segurança fica sem ligação. Anotar em `docs/closes.md` a tabela final (close → obra, ou "sem ligação") para o Pedro conferir.

- [ ] **Step 4: Rodar** → PASS.

- [ ] **Step 5: Commit** — `git commit -am "feat: closes ligados às telas"`

---

### Task 5: Núcleo — linha do tempo, câmera e janela de carregamento

**Files:**
- Create: `site/js/config.js`, `site/js/core/timeline.js`, `site/js/core/camera.js`, `site/js/core/janela.js`, `tests/core.test.mjs`

**Interfaces:**
- Produces:
  - `config.js`: `PILOTO_ULTIMA_PAGINA = 6`; `DURACAO = { capa: 100, texto: 160, abertura: 140, obra: 100, detalhe: 45, verso: 100 }` (em vh de scroll); `UNIDADES_POR_VH = 0.14`; `DIST_FOCO = 8`; `FOV = 35`; `RELEVO = 0.12`.
  - `timeline.js`: `criarLinha(stops) → { total, itens: [{ id, tipo, dur, inicio, fim, foco }] }` (vh; `dur` = `DURACAO[tipo]`; `foco` = meio). A primeira parada começa já em foco: `inicio 0`, `foco 0`, `fim dur/2`. `situar(linha, vh) → { indice, id, local }` (`local` 0..1, com limites); `focoDe(linha, id) → vh`; `emFoco(linha, vh) → id | null` (parada com `|vh − foco| ≤ 0.3·dur`); `alturaDaPagina(linha) → vh` (= foco da última parada + 100, para que o fim do scroll coincida com o foco dela); `vizinho(linha, id, dir) → id` (para nas pontas).
  - `camera.js`: `zDaCamera(vh) → DIST_FOCO − vh·UNIDADES_POR_VH`; `zDoStop(linha, id) → −focoDe·UNIDADES_POR_VH`; `planosDoStop(stop, indiceDaObra, images, linha) → [{ imagem, x, y, z, altura, largura }]`.
    Regras de `planosDoStop`: obra de 1 tela → `altura 4`, `y 0`, `x −2.4` se `indiceDaObra` par, `+2.4` se ímpar; obra de 2 telas → A `{x −2.3, y +0.9, altura 2.6}`, B `{x +0.6, y −0.9, z −1.5 em relação à parada, altura 2.6}`; capa → `{x −3.2, y 0, altura 5.2}`; `texto`/`abertura` → `stop.planos`, com `z` somado ao da parada. `largura = altura · w/h` de `images.json`.
  - `janela.js`: `texturasNecessarias(linha, stops, indice, antes = 1, depois = 3) → Set<id>`; `larguraPara(larguraPx, dpr, larguras) → number` (menor largura ≥ `larguraPx·dpr`, ou a maior).

- [ ] **Step 1: Escrever os testes**

```js
// tests/core.test.mjs — valores essenciais (importar de site/js/core/*.js e site/js/config.js)
const stops = [{ id:'capa', tipo:'capa' }, { id:'t', tipo:'texto' }, { id:'o1', tipo:'obra', telas:['a'] }, { id:'o2', tipo:'obra', telas:['b','c'] }];
const linha = criarLinha(stops);
assert.equal(linha.total, 410);
assert.deepEqual(linha.itens[0], { id:'capa', tipo:'capa', dur:100, inicio:0, fim:50, foco:0 });
assert.deepEqual(linha.itens[1], { id:'t', tipo:'texto', dur:160, inicio:50, fim:210, foco:130 });
assert.deepEqual(situar(linha, 260), { indice: 2, id:'o1', local: 0.5 });
assert.equal(situar(linha, -50).id, 'capa'); assert.equal(situar(linha, 9999).id, 'o2');
assert.equal(focoDe(linha, 'o1'), 260);
assert.equal(emFoco(linha, 0), 'capa'); assert.equal(emFoco(linha, 260), 'o1'); assert.equal(emFoco(linha, 205), null);
assert.equal(alturaDaPagina(linha), 460);
assert.equal(vizinho(linha, 'capa', -1), 'capa'); assert.equal(vizinho(linha, 'o1', 1), 'o2');
// câmera: no foco, a câmera está a DIST_FOCO do plano
assert.ok(Math.abs(zDaCamera(260) - zDoStop(linha, 'o1') - 8) < 1e-9);
const images = { a:{w:3000,h:4000}, b:{w:2000,h:2000}, c:{w:2000,h:2000} };
const [p] = planosDoStop(stops[2], 0, images, linha);
assert.deepEqual([p.x, p.y, p.altura, p.largura], [-2.4, 0, 4, 3]);
assert.equal(planosDoStop(stops[2], 1, images, linha)[0].x, 2.4);
const [A, B] = planosDoStop(stops[3], 1, images, linha);
assert.equal(A.altura, 2.6); assert.equal(B.z - A.z, -1.5); assert.ok(A.y > B.y);
// janela
assert.deepEqual([...texturasNecessarias(linha, stops, 2, 1, 1)].sort(), ['a','b','c']);
assert.equal(larguraPara(500, 2, [640,1280,2560]), 1280);
assert.equal(larguraPara(2000, 2, [640,1280,2560]), 2560);
```

- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar os quatro módulos** conforme as assinaturas e regras acima.
- [ ] **Step 4: Rodar** → PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: linha do tempo, câmera e janela de carregamento"`

---

### Task 6: Página base

**Files:**
- Create: `site/js/ui/base.js`, `site/css/base.css`, `tests/base.test.mjs`
- Modify: `site/index.html`, `site/js/main.js`

**Interfaces:**
- Consumes: `content.json`, `images.json`.
- Produces: `htmlDaParada(stop, images) → string` (pura); `montarBase(raiz, stops, images)`. Cada parada vira `<section class="parada parada--{tipo}" id="{id}" data-id="{id}">`. Classes usadas depois: `.titulo-secao` (h1/h2 de capa, texto, abertura e "DETALHES"), `.subtitulo` e `.nome` (letras com tinta), `.legenda` (título de obra + fio + ficha), `.corpo` (parágrafos), `.tela` (cada `<img>`).

- [ ] **Step 1: Escrever o teste**

```js
// tests/base.test.mjs — sobre o content.json real
const h4 = htmlDaParada(stops[3], imgs);   // Foyer de la Danse
assert.match(h4, /<section class="parada parada--obra" id="foyer-de-la-danse"/);
assert.match(h4, /alt="FOYER DE LA DANSE, acrílica sobre tela, 30 x 40 cm, 2026"/);
assert.match(h4, /srcset="[^"]*p04-a-640\.webp 640w[^"]*p04-a-1280\.webp 1280w/);
assert.match(h4, /loading="lazy"/);
const h2 = htmlDaParada(stops[1], imgs);
assert.match(h2, /<strong>identidade, subjetividade, força, vulnerabilidade\s+e transformação\.<\/strong>/);
assert.equal((h2.match(/<p[ >]/g) ?? []).length, 4);
assert.match(htmlDaParada(stops[22], imgs), />DÚVIDEI</);
assert.match(htmlDaParada(stops[0], imgs), /href="mailto:marceladeluna\.art@gmail\.com"/);
assert.doesNotMatch(htmlDaParada(stops[0], imgs), /loading="lazy"/);
```

- [ ] **Step 2: Rodar e ver falhar.**

- [ ] **Step 3: Implementar `base.js` e `base.css`**

`base.css`: `@font-face` Outfit variável (100–900, `font-display: swap`); fundo `#fff`, texto `#000`; `.titulo-secao` peso 700, caixa alta, `clamp(3rem, 9vw, 9rem)`, entrelinha 0,9; `.subtitulo` e `.nome` peso 600 com `background-clip: text` usando `p01-a-640.webp`; `.legenda` centralizada, título peso 300 em caixa alta, fio de 1 px, três linhas pequenas peso 300; `.corpo` peso 300, `strong` peso 600; coluna de até 1100 px, imagens em `max-width: 100%`. Pesos finais ajustados por comparação com o PDF. Capa: telefone como texto, Instagram com link `https://www.instagram.com/marceladeluna_art`, e-mail com `mailto:`.
`main.js`: carrega os dois JSON, filtra `pagina <= PILOTO_ULTIMA_PAGINA`, chama `montarBase`.

- [ ] **Step 4: Rodar** → PASS.

- [ ] **Step 5: Conferir no navegador**

Servidor `site`: as 6 páginas do piloto aparecem empilhadas, legíveis, com fonte Outfit, negritos no lugar e o nome preenchido com tinta. Comparar com as páginas 1–6 do PDF.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: página base com o conteúdo do piloto"`

---

### Task 7: Palco, telas e travessia por scroll

**Files:**
- Create: `site/js/gl/palco.js`, `site/js/gl/tela.js`, `site/js/gl/texturas.js`, `site/js/ui/legendas.js`, `site/css/travessia.css`
- Modify: `site/js/main.js`, `site/index.html`

**Interfaces:**
- Consumes: Tarefas 5 e 6.
- Produces:
  - `criarPalco(canvas) → { cena, camera, renderer, aoQuadro(fn), redimensionar() }` ou `null` se não houver WebGL.
  - `criarTela(plano, info) → Mesh` com uniformes `uMapa`, `uCor`, `uTemMapa`, `uRevela` (0..1, padrão 1), `uLuz` (vec2 UV), `uRelevo`, `uOpacidade`; `mesh.userData = { imagem, stopId, indiceTela }`.
  - `criarTexturas(images) → { pedir(id, largura), liberarForaDe(conjunto) }`.
  - `criarLegendas(raiz, linha) → { atualizar(vh) }`: põe `.em-foco` na parada devolvida por `emFoco(linha, vh)`.
  - `window.__site = { linha, estado: { id, local, mergulho: null }, irPara(id) }`.
  - Classe `travessia` em `<html>` quando o modo imersivo está ativo.

- [ ] **Step 1: Ativação do modo**

`main.js`: ativa o modo imersivo só se `criarPalco` não devolver `null`, `matchMedia('(prefers-reduced-motion: reduce)')` for falso e não for `(pointer: coarse) and (orientation: portrait)`. Caso contrário, fica a página base. No evento `webglcontextlost`: remover a classe `travessia`, parar o laço e mostrar a página base.

- [ ] **Step 2: Scroll e câmera**

`travessia.css`: `#gl` fixo em tela cheia atrás do conteúdo; `main` com altura `alturaDaPagina(linha)` em vh; cada `.parada` fixa, em tela cheia, `opacity: 0`, `pointer-events: none`; `.em-foco` visível; `.tela` (as `<img>`) ocultas visualmente mas presentes para leitores de tela. Legenda da obra no lado oposto ao da tela; nas obras de duas telas, embaixo ao centro. Na capa, "PORTFÓLIO" fica em branco sobre a base da pintura, e nome, ano e contato à direita.
Lenis sobre o scroll nativo (`lerp 0.09`). A cada quadro: `vh = scrollY / innerHeight · 100`; `situacao = situar(linha, vh)`; `camera.position.z = zDaCamera(vh)`; `legendas.atualizar(vh)`. Câmera em perspectiva com `FOV`, olhando para −z.
Textos: quando uma parada `texto` ou `abertura` entra em foco, as linhas de `.corpo` sobem em sequência (cada linha é um grupo de palavras com o mesmo `offsetTop`; 60 ms entre linhas); os trechos em `<strong>` assentam por último, 300 ms depois da última linha. Ao sair de foco, tudo some junto.

- [ ] **Step 3: Telas e névoa**

Para cada parada do piloto, `planosDoStop` → `criarTela`. Shader: cor da textura (ou `uCor` enquanto não houver mapa), misturada ao branco conforme a distância à câmera (`smoothstep(22, 40, d)`), e opacidade caindo a 0 quando a tela fica a menos de 1,5 unidade da câmera. Sem iluminação da cena; espaço de cor sRGB.

- [ ] **Step 4: Carregamento progressivo**

A cada mudança de `indice`: `texturasNecessarias` → `pedir(id, larguraPara(larguraNaTelaPx, min(devicePixelRatio, 2), larguras))`; `liberarForaDe` descarta as demais. Enquanto a textura não chega, a tela mostra `uCor` (cor dominante).

- [ ] **Step 5: Conferir no navegador**

- Rolar do topo ao fim: a câmera avança, cada tela surge do branco, fica em foco ao lado da legenda e sai pela lateral; a pág. 6 mostra as duas telas em diagonal.
- No console: `__site.irPara('foyer-de-la-danse')`, depois `__site.estado.id === 'foyer-de-la-danse'` e `document.querySelector('#foyer-de-la-danse').classList.contains('em-foco')`.
- **Review Focus 2:** com a rede limitada no navegador, `__site.irPara('intervalo')` a partir do topo: as telas aparecem na cor dominante e depois ganham a imagem; nenhum plano preto, nenhum erro no console.
- **Review Focus 3:** redimensionar para 1024×600, 1440×900 e 2560×1080: em foco, a tela inteira fica visível e a legenda não a cobre.
- **Review Focus 4:** no console, `document.querySelector('#gl').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()`: a página base aparece, com todo o conteúdo.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: travessia por scroll com telas em profundidade"`

---

### Task 8: Paralaxe e luz rasante

**Files:**
- Modify: `site/js/gl/palco.js`, `site/js/gl/tela.js`, `site/js/main.js`

**Interfaces:**
- Produces: `palco.ponteiro = { x, y }` em −1..1, suavizado.

- [ ] **Step 1: Paralaxe** — o ponteiro suavizado (`lerp 0.06`) desloca a câmera em até ±0,35 unidade em x e ±0,2 em y, e gira até ±1,2°. Planos mais próximos se deslocam mais por perspectiva. Os blocos de texto das paradas em foco recebem deslocamento contrário de até 8 px.

- [ ] **Step 2: Luz rasante** — no shader da tela: relevo pelo gradiente de luminância da textura (diferenças em 4 vizinhos), luz na posição do cursor projetada no plano (`uLuz`), fator de luminância `1 + clamp(k, −RELEVO, +RELEVO)` multiplicando a cor. Sem alteração de matiz ou saturação.

- [ ] **Step 3: Conferir**

Mover o mouse sobre "A Dança é por Ela" em foco: as pinceladas ganham brilho e sombra que acompanham o cursor. Capturar a tela com o cursor em dois cantos opostos: a diferença existe, mas a cor média da tela muda menos de 3%. Com o mouse parado, nada treme.

- [ ] **Step 4: Commit** — `git commit -am "feat: paralaxe e luz rasante"`

---

### Task 9: Pincel e letras que se enchem de tinta

**Files:**
- Create: `site/js/core/pincel.js`, `site/js/gl/tinta.js`, `site/js/ui/preenchimento.js`, `tests/pincel.test.mjs`
- Modify: `site/js/main.js`, `site/css/travessia.css`

**Interfaces:**
- Produces: `carimbosEntre(a, b, passo) → [{ x, y, ang }]`; `criarTinta(palco) → { pintar(x, y, cor), ativa: boolean }`; `criarPreenchimento(raiz)`.

- [ ] **Step 1: Teste**

```js
const c = carimbosEntre({ x: 0, y: 0 }, { x: 10, y: 0 }, 2.5);
assert.equal(c.length, 4); assert.deepEqual(c.at(-1), { x: 10, y: 0, ang: 0 });
assert.equal(carimbosEntre({ x: 0, y: 0 }, { x: 1, y: 0 }, 2.5).length, 0);
assert.ok(Math.abs(carimbosEntre({ x: 0, y: 0 }, { x: 0, y: 5 }, 5)[0].ang - Math.PI / 2) < 1e-9);
```

- [ ] **Step 2: Rodar e ver falhar; implementar `pincel.js`; rodar** → PASS.

- [ ] **Step 3: Camada de tinta**

Alvo de renderização em meia resolução, desenhado como fundo da cena (antes das telas, sem teste de profundidade), de modo que telas e texto sempre fiquem por cima. A cada movimento do ponteiro: `carimbosEntre` com passo de 6 px e um carimbo de cerdas (textura gerada em canvas 2D na inicialização: riscos paralelos irregulares), girado por `ang`, largura de 46 px, na cor dominante (`cor` de `images.json`) da tela da parada atual. A cada quadro a camada perde opacidade de forma a sumir em cerca de 8 s. `ativa = false` durante o mergulho.

- [ ] **Step 4: Letras**

`preenchimento.js`: separa cada `.titulo-secao` (menos o da capa, que é branco sobre a pintura) em `<span>` por letra, mantendo o texto completo em `aria-label` do título e `aria-hidden` nos spans. Quando o ponteiro passa a menos de 40 px de uma letra, ela ganha `.pintada`: preto → textura de pintura por `background-clip: text`, revelada por uma máscara de pincelada em 450 ms. A letra permanece pintada.

- [ ] **Step 5: Conferir**

Mover o mouse no branco: rastro com textura de cerdas, na cor da tela vizinha, que some sozinho. Passar sobre uma tela: nenhuma tinta por cima dela. Passar sobre "PESQUISA ARTÍSTICA": as letras tocadas se enchem de pintura. O leitor de tela continua lendo o título inteiro (`aria-label`).

- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: pincel no fundo e letras com tinta"`

---

### Task 10: Abertura

**Files:**
- Create: `site/js/ui/abertura.js`
- Modify: `site/js/main.js`, `site/css/travessia.css`, `site/js/gl/tela.js`

**Interfaces:**
- Consumes: `uRevela` da tela da capa; `texturas.pedir`.
- Produces: `rodarAbertura({ palco, telaDaCapa, pronto }) → Promise` (`pronto` = promessa da fonte e da textura da capa em 1280).

- [ ] **Step 1: Carregamento** — enquanto `pronto` não resolve: tela branca com um traço de tinta horizontal (`scaleX` pela fração carregada: fonte, `content.json`, `images.json`, capa). Só esses recursos bloqueiam a abertura.

- [ ] **Step 2: Revelação** — `uRevela` de 0 a 1 em 1,6 s: a pintura da capa aparece por pinceladas diagonais (limiar sobre ruído alongado na direção do traço). Depois, "PORTFÓLIO" sobe letra a letra (40 ms de intervalo), "MARCELA DE LUNA" se enche de tinta, ano e contato entram por opacidade. O scroll fica livre desde o início; se o visitante rolar, a animação termina de imediato.

- [ ] **Step 3: Recarregamento no meio da página (Review Focus 1)** — se `scrollY > 0` na carga, não rodar a revelação: `uRevela = 1`, estados finais aplicados, só o traço de carregamento.

- [ ] **Step 4: Conferir**

- Carga do topo com cache limpo: traço, revelação, título; a capa está visível em menos de 3 s em conexão "Fast 4G" simulada.
- Rolar durante a revelação: nada trava, nada fica meio revelado.
- `__site.irPara('a-danca-e-por-ela')`, recarregar: abre direto nessa obra, em foco, sem a animação da capa por cima.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: abertura com revelação da capa"`

---

### Task 11: Mergulho na tela

**Files:**
- Create: `site/js/core/mergulho.js`, `site/js/ui/mergulho-ui.js`, `tests/mergulho.test.mjs`
- Modify: `site/js/main.js`, `site/css/travessia.css`, `site/index.html`

**Interfaces:**
- Produces: `aplicarZoom(estado, fator, cursor) → estado` e `arrastar(estado, dx, dy) → estado`, com `estado = { zoom, cx, cy }` (`zoom` 1..6; `cx`,`cy` = centro da vista em UV 0..1; a vista nunca sai da tela); `abrirMergulho(stopId, indiceTela)`, `fecharMergulho()`; `__site.estado.mergulho = { stopId, tela, close: null | id }`.

- [ ] **Step 1: Teste**

```js
let e = { zoom: 1, cx: .5, cy: .5 };
assert.deepEqual(aplicarZoom(e, 0.5, { x: .5, y: .5 }), e);            // não passa de 1
e = aplicarZoom(e, 2, { x: 1, y: 1 });                                  // aproxima no canto
assert.equal(e.zoom, 2); assert.equal(e.cx, .75); assert.equal(e.cy, .75);
assert.equal(aplicarZoom(e, 10, { x: .5, y: .5 }).zoom, 6);             // teto
assert.equal(arrastar(e, 1, 0).cx, .75);                                // não sai da tela
assert.equal(arrastar({ zoom: 2, cx: .5, cy: .5 }, -.1, 0).cx, .4);
```

- [ ] **Step 2: Rodar e ver falhar; implementar `mergulho.js`; rodar** → PASS.

- [ ] **Step 3: Entrada e saída**

Clique (por raycaster) na tela da parada em foco → `abrirMergulho`: guarda `scrollY`, GSAP leva a câmera em 0,9 s até a tela caber em 92% da janela, legendas somem, tinta desativada, textura trocada pela de 2560. Interface: título e ficha no canto, botão "voltar". Roda do mouse para cima aproxima no cursor e para baixo afasta (`aplicarZoom`); arrasto move (`arrastar`); pinça do trackpad (`ctrl` + roda) também aproxima.
Saída (`fecharMergulho`): Esc, "voltar", ou roda para baixo com `zoom === 1`. A câmera volta em 0,7 s para a posição do scroll guardado.

- [ ] **Step 4: Closes**

Para cada `close` da tela aberta: marca circular discreta (botão com `aria-label="Ver detalhe"`) posicionada projetando `x`,`y` na janela a cada quadro. Clique: um plano com a imagem do close cresce da marca até ocupar a janela (0,6 s); clique, Esc ou "voltar" o recolhe e devolve à tela.

- [ ] **Step 5: Saídas forçadas (Review Focus 5)** — tecla de navegação, clique na fileira de pinceladas ou `irPara` durante o mergulho: chama `fecharMergulho()` antes de agir. Scroll por barra de rolagem durante o mergulho: fecha sem animação e segue o scroll.

- [ ] **Step 6: Conferir**

- Clicar em "Foyer de la Danse" em foco: mergulha; ficha correta; zoom até ver a trama da tela; arrasto não mostra fundo branco além da borda.
- Em "A Dança é por Ela": a marca aparece sobre o rosto; clicar abre o close da pág. 30; Esc volta à tela; Esc de novo volta à travessia com `scrollY` igual ao de antes (diferença menor que 2 px).
- Durante o mergulho, `__site.irPara('capa')`: `__site.estado.mergulho === null` e a capa em foco.
- Clicar numa das duas telas de "Intervalo" abre a tela clicada.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: mergulho na tela com zoom e closes"`

---

### Task 12: Navegação rápida, teclado e cabeçalho

**Files:**
- Create: `site/js/ui/navegacao.js`
- Modify: `site/js/main.js`, `site/css/travessia.css`, `site/index.html`

**Interfaces:**
- Consumes: `linha`, `vizinho`, `focoDe`, `fecharMergulho`, raycaster do palco.
- Produces: `irPara(id)` definitivo: `lenis.scrollTo(focoDe(linha, id) · innerHeight / 100, { duration })`, com `duration` entre 0,8 e 2,4 s conforme a distância.

- [ ] **Step 1: Fileira de pinceladas** — `<nav aria-label="Obras">` na borda direita, centrada na vertical. Um `<button>` por parada do piloto: obras como pinceladas de 14×4 px na `cor` da primeira tela; capa, texto e abertura como traços finos pretos; espaço maior entre séries. A atual fica com 30 px de comprimento. Passar o mouse mostra o título em letras pequenas à esquerda da marca; `aria-label` com o título. Clique → `irPara`.

- [ ] **Step 2: Teclado** — `ArrowDown`, `PageDown` e espaço → `irPara(vizinho(+1))`; `ArrowUp`, `PageUp` e `Shift`+espaço → `vizinho(−1)`; `Home` → capa; `End` → última parada. Ignorar quando o foco estiver num link ou botão e a tecla for espaço.

- [ ] **Step 3: Tela ao longe e cabeçalho** — clique em tela que não é a da parada em foco → `irPara(stopId)`. O cursor vira `pointer` sobre qualquer tela. Cabeçalho fixo com "MARCELA DE LUNA" pequeno no canto superior esquerdo → `irPara('capa')`; oculto enquanto a capa está em foco.

- [ ] **Step 4: Conferir**

- Clicar na marca de "Intervalo": a câmera viaja em movimento contínuo e para com a obra em foco; a marca fica alongada.
- Seta para baixo seis vezes a partir da capa passa pelas seis paradas, na ordem; seta para cima volta.
- Com "Foyer de la Danse" em foco, clicar em "A Dança é por Ela" ao fundo leva até ela.
- Navegar só com Tab e Enter alcança todas as marcas.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: navegação rápida, teclado e cabeçalho"`

---

### Task 13: Conferência final do piloto

**Files:**
- Create: `docs/piloto-roteiro.md`

- [ ] **Step 1: Rodar tudo** — `node --test tests/` e `/usr/bin/python3 -m unittest discover -s tools -p "test_*.py"` → tudo PASS.

- [ ] **Step 2: Percorrer os cinco itens do Review Focus** em Chrome e em Safari, mais: do topo ao fim só com scroll, sem travar; texto das seis páginas conferido contra o PDF; console sem erros nem avisos de recurso remoto; aba de rede sem nenhum pedido a outro domínio.

- [ ] **Step 3: Medir** — gravação de desempenho rolando do topo ao fim num notebook: sem quedas sustentadas abaixo de 50 quadros por segundo. Peso transferido antes da capa aparecer: menos de 2 MB.

- [ ] **Step 4: Escrever `docs/piloto-roteiro.md`** — como abrir o piloto, o que experimentar em ordem (rolar, mover o mouse, pintar o fundo e os títulos, clicar numa tela, abrir um close, usar a fileira de pinceladas e as setas) e as perguntas para o Pedro: ritmo do scroll, força da paralaxe e da luz, duração da tinta, pesos da fonte, posição das legendas.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "docs: roteiro de validação do piloto"`
