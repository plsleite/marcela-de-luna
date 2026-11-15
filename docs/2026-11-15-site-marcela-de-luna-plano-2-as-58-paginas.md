# Site Marcela de Luna — Plano 2: as 58 páginas

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Estender a "Travessia" do computador das 6 páginas do piloto a todo o portfólio: as 29 obras, os dois trechos de "Detalhes", a série Entre Nós e o verso final.

**Architecture:** O motor do piloto fica como está: scroll nativo → linha do tempo → câmera; texto real no DOM; telas em three.js. Entram três peças novas, todas funções puras do scroll: planos para os closes e o verso, um trilho que desloca a câmera de lado para atravessar a última pintura de cada série e o último close, e um cartão final que gira para mostrar o verso. Antes disso, `main.js` é dividido em módulos, sem mudar comportamento.

**Tech Stack:** o do Plano 1 (módulos ES sem build, three.js 0.187.0, GSAP 3.15.1, Lenis 1.3.27; testes com `node --test`).

**Spec:** `docs/2026-11-14-site-marcela-de-luna-design.md` (seções 5.1, 5.3 e 6). Ajustes de 15/11: `docs/2026-11-15-ajustes-do-piloto.md`. Pendências herdadas: `docs/pendencias-do-piloto.md`.

**Alcance:** etapa 4 da seção 7 do desenho. Celular, acabamento e publicação ficam para planos seguintes.

## Global Constraints

- Conteúdo: somente o do PDF, na ordem do PDF, salvo a música. Grafia "DÚVIDEI" mantida. Idioma: português.
- Nenhuma URL remota em tempo de execução. Nada de `npm install`. Nenhum `git push`. O PDF nunca entra no repositório.
- Arquivos temporários grandes ficam em `~/Library/Caches/marcela-de-luna-site/`.
- As pinturas nunca recebem tinta do pincel. A luz rasante altera só a luminância, em no máximo ±12%.
- O scroll é o nativo da página; nada pode impedir o visitante de rolar. Exceções: a roda e a pinça com uma tela ampliada, e a roda até 400 ms depois de sair. O ímã nunca age contra um gesto em curso.
- `desmontar()` em `site/js/main.js` é o caminho único de saída para a página base: tudo o que for criado se registra com `aoDesmontar`.
- A câmera tem um dono por quadro: scroll (com trilho e paralaxe), ampliação ou a volta dela.
- A página base (sem a classe `travessia`) continua mostrando todo o conteúdo, agora das 58 páginas.
- Vocabulário: **ampliar** = clicar na tela em foco (`mergulho` no código); **viajar** = ir a outra parada (`irPara`); **vulto** = tela que não é da parada em foco.
- Lógica que pode ser pura vai para `site/js/core/` com teste.
- Testes: `node --test tests/*.test.mjs` e `/usr/bin/python3 -m unittest discover -s tools -p "test_*.py"`.
- Conferência visual: `sh tools/preview-sync.sh`, depois o servidor `site` do `.claude/launch.json` (porta 4173). Com o painel de navegador oculto, a animação só anda depois de uma captura de tela.

## Review Focus

1. **Viagem longa** (da capa ao verso pela fileira ou pela tecla End): chega com a parada em foco, sem plano preto ou vazio pelo caminho, sem erro, e sem baixar as imagens das paradas atravessadas. → Tarefa 4.
2. **Recarregar em pontos fundos** (no meio de um trecho de "Detalhes", durante o giro final, no verso): reabre no mesmo ponto, com a câmera e o cartão no estado certo. → Tarefas 5 e 6.
3. **Rolar para trás:** voltar do verso desfaz o giro; voltar do primeiro close atravessa de volta a pintura; nada depende do sentido do scroll. → Tarefas 5 e 6.
4. **Janela baixa** (1280×700) com a fileira completa: todas as marcas cabem sem rolagem interna, e a marca do trecho de "Detalhes" fica como atual em qualquer close do trecho. → Tarefa 3.
5. **Memória:** depois de ir ao fim e voltar ao topo, só as telas da janela de carregamento têm textura definitiva; as demais voltaram à miniatura. → Tarefa 4.

## Estrutura de arquivos

```
site/js/main.js                    orquestra: dados, modo, montagem, laço, desmontagem
site/js/travessia/carregamento.js  NOVO  texturas: aplicar, janela, largura máxima da ampliação
site/js/travessia/luz.js           NOVO  luz rasante e realce dos vultos
site/js/travessia/pincel.js        NOVO  montagem do pincel e das letras com tinta
site/js/core/camera.js             planos de detalhe e verso; índice por tipo
site/js/core/trilho.js             NOVO  deslocamento lateral da câmera em função do scroll
site/js/core/final.js              NOVO  cartão final (último close ↔ verso)
site/js/core/janela.js             tolerância de largura; janela de viagem; tela na vista
site/js/core/navegacao.js          marcas por trecho; marca atual; passo da fileira
site/js/core/timeline.js           emFoco com fração
site/js/core/clique.js             detalhe e verso ampliam
site/js/gl/tela.js                 alcance de visibilidade por tela
site/js/gl/texturas.js             miniaturas
site/js/ui/navegacao.js, legendas.js, site/css/travessia.css
tests/*.test.mjs
```

---

### Task 1: Dividir `main.js` sem mudar comportamento

**Files:**
- Create: `site/js/travessia/carregamento.js`, `site/js/travessia/luz.js`, `site/js/travessia/pincel.js`
- Modify: `site/js/main.js`

**Interfaces:**
- Produces:
  - `criarCarregamento({ linha, stops, images, telas, texturas, gsap, retanguloNoFoco, ativo }) → { aplicar(id, tex, esmaecer = true), carregarJanela(indice), fixarMaxima(id | null) }` — o que hoje são `aplicar`, `carregarJanela`, `imagemDoMergulho` e `larguraMaxima` em `montarTravessia`. `ativo` é `() => boolean`.
  - `criarLuz({ palco, telas, linha, pontoNaTela, vale }) → { quadro(dt, vh), encerrar() }` — `aplicarLuz` e `aplicarRealce` com os seus ouvintes de mouse. `vale` é `() => boolean` (abertura terminada, sem tela ampliada, fora da volta).
  - `montarPincel({ palco, raiz, telas, porId, images, estado, criarTinta, criarPreenchimento, retanguloProjetado }) → { tinta, preenchimento, limparObstaculos(), encerrar() }`.

- [ ] **Step 1: Registrar o comportamento atual** — `node --test tests/*.test.mjs` → 84 passam. No navegador, anotar para comparar depois: `scrollY` e `__site.estado` em cada uma das seis paradas; abertura; pincel; ampliar e fechar; fileira; `loseContext`.
- [ ] **Step 2: Mover o código** para os três módulos, sem alterar lógica, nomes de classes CSS nem ordem de registro em `aoDesmontar`. `main.js` passa a importar os módulos com os demais `import()` dinâmicos e fica com menos de 320 linhas.
- [ ] **Step 3: Conferir** — testes: 84 passam. Navegador: os mesmos valores do Step 1; console sem erros; `desmontar()` por `loseContext` cai na página base com o scroll funcionando.
- [ ] **Step 4: Commit** — `git commit -m "refactor: main.js dividido em carregamento, luz e pincel"`

---

### Task 2: Planos dos closes e do verso, alcance por tela, clique

**Files:**
- Modify: `site/js/config.js`, `site/js/core/camera.js`, `site/js/core/clique.js`, `site/js/gl/tela.js`, `site/js/gl/palco.js`, `site/js/travessia/pincel.js`, `tests/core.test.mjs`, `tests/clique.test.mjs`

**Interfaces:**
- Produces:
  - `config.js`: `DETALHE = { altura: 6.2, x: 1.5, ys: [0.2, -0.25, 0.1] }`; `VERSO = { altura: 4.6 }`; `VISIBILIDADE_DETALHE = { branco: [15, 24], some: [24, 30] }` (os demais campos vêm de `VISIBILIDADE`).
  - `camera.js`: `indicesPorTipo(stops) → Map<id, number>` — para `obra`, o contador das obras na ordem da lista; para `detalhe`, a posição dentro do trecho (sequência de paradas `detalhe` consecutivas), começando em 0; para os demais, 0.
  - `planosDoStop(stop, indice, images, linha)`: `detalhe` → um plano com `x = (indice par ? −1 : +1) · DETALHE.x`, `y = DETALHE.ys[indice % 3]`, `altura = DETALHE.altura`; `verso` → `{ x: 0, y: 0, altura: VERSO.altura }`. Capa, obra, texto e abertura não mudam.
  - `criarTela(plano, info)`: `info.visibilidade` (padrão `VISIBILIDADE`) vira os uniformes `uBranco` e `uSome` (vec2), no lugar das constantes interpoladas; `mesh.userData.alcance = some[1]`.
  - `destinoDoClique`: `detalhe` e `verso` em foco também devolvem `'mergulho'`.

- [ ] **Step 1: Escrever os testes**

```js
// tests/core.test.mjs — acrescentar
const S = [{id:'c',tipo:'capa'},{id:'o1',tipo:'obra'},{id:'o2',tipo:'obra'},{id:'d1',tipo:'detalhe'},{id:'d2',tipo:'detalhe'},
  {id:'a',tipo:'abertura'},{id:'o3',tipo:'obra'},{id:'e1',tipo:'detalhe'},{id:'v',tipo:'verso'}];
const ind = indicesPorTipo(S);
assert.deepEqual(['o1','o2','o3'].map(i => ind.get(i)), [0, 1, 2]);
assert.deepEqual(['d1','d2','e1'].map(i => ind.get(i)), [0, 1, 0]);
assert.equal(ind.get('c'), 0); assert.equal(ind.get('v'), 0);
const img = { w: { w: 2250, h: 4000 } };
const linhaD = criarLinha([{id:'c',tipo:'capa'},{id:'d',tipo:'detalhe',imagens:['w']},{id:'v',tipo:'verso',imagens:['w']}]);
const [d0] = planosDoStop({id:'d',tipo:'detalhe',imagens:['w']}, 0, img, linhaD);
assert.deepEqual([d0.x, d0.y, d0.altura], [-1.5, 0.2, 6.2]);
assert.ok(Math.abs(d0.largura - 6.2 * 2250 / 4000) < 1e-9);
const [dd] = planosDoStop({id:'d',tipo:'detalhe',imagens:['w']}, 1, img, linhaD);
assert.deepEqual([dd.x, dd.y], [1.5, -0.25]);
assert.equal(planosDoStop({id:'d',tipo:'detalhe',imagens:['w']}, 5, img, linhaD)[0].y, 0.1);
const [pv] = planosDoStop({id:'v',tipo:'verso',imagens:['w']}, 0, img, linhaD);
assert.deepEqual([pv.x, pv.y, pv.altura], [0, 0, 4.6]);
// tests/clique.test.mjs — acrescentar
for (const tipo of ['detalhe', 'verso'])
  assert.equal(destinoDoClique({ parada:{id:'x',tipo}, emFoco:'x', aberturaPronta:true, mergulhoAberto:false, viajando:false }), 'mergulho');
```
O teste existente que espera `[]` para `detalhe` e `verso` com os dados reais passa a esperar um plano por parada.

- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar** conforme as interfaces. Em `palco.telaSob` e nos obstáculos do pincel, o limite de distância passa a ser `mesh.userData.alcance`.
- [ ] **Step 4: Rodar** → PASS. No navegador (piloto ainda com 6 páginas): nenhuma diferença visível; console sem erros.
- [ ] **Step 5: Commit** — `git commit -m "feat: planos de closes e verso, alcance de visibilidade por tela"`

---

### Task 3: Ligar as 58 paradas

**Files:**
- Modify: `site/js/config.js` (remover `PILOTO_ULTIMA_PAGINA`), `site/js/main.js`, `site/js/core/navegacao.js`, `site/js/core/timeline.js`, `site/js/ui/navegacao.js`, `site/js/ui/legendas.js`, `site/js/ui/preenchimento.js`, `site/css/travessia.css`, `site/data/content.json` (só `planos` da pág. 40), `tests/navegacao.test.mjs`, `tests/core.test.mjs`

**Interfaces:**
- Consumes: Tarefa 2.
- Produces:
  - `main.js` monta todas as paradas; as telas de `detalhe` usam `VISIBILIDADE_DETALHE`.
  - `emFoco(linha, vh, fracao = 0.3)`.
  - `marcasDaFileira(stops, images) → [{ ids, id, titulo, forma, cor, novoGrupo }]`: uma marca por parada, exceto os closes — cada trecho de "Detalhes" vira uma marca só (`id` = o primeiro close, `ids` = todos os do trecho, `titulo: 'DETALHES'`, `forma: 'traco'`). O verso é um traço com `titulo` igual ao `nome` da capa.
  - `marcaAtual(marcas, id) → índice` da marca cujo `ids` contém `id`.
  - `passoDaFileira(alturaDaJanela, n) → px`: `min(24, max(12, (alturaDaJanela − 160) / n))`.

- [ ] **Step 1: Escrever os testes**

```js
// tests/navegacao.test.mjs — com o content.json e o images.json reais
const marcas = marcasDaFileira(stops, images);
assert.equal(marcas.length, 36);                       // 1 capa + 1 texto + 2 aberturas + 29 obras + 2 trechos + 1 verso
const det = marcas.filter(m => m.titulo === 'DETALHES');
assert.deepEqual(det.map(m => m.ids.length), [16, 8]);
assert.equal(det[0].id, 'detalhes-1-01'); assert.equal(det[0].forma, 'traco');
assert.equal(marcas.at(-1).id, 'verso'); assert.equal(marcas.at(-1).titulo, 'MARCELA DE LUNA');
assert.equal(marcas[marcaAtual(marcas, 'detalhes-1-09')].id, 'detalhes-1-01');
assert.equal(marcas[marcaAtual(marcas, 'duvidei')].id, 'duvidei');
assert.equal(passoDaFileira(900, 36), (900 - 160) / 36);
assert.equal(passoDaFileira(700, 36), 15);
assert.equal(passoDaFileira(500, 36), 12);
assert.equal(passoDaFileira(1200, 6), 24);
// tests/core.test.mjs
assert.equal(emFoco(linha, 280, 0.16), null);          // linha do teste existente: o1 tem foco 260 e dur 100
assert.equal(emFoco(linha, 280), 'o1');
assert.equal(emFoco(linha, 270, 0.16), 'o1');
```

- [ ] **Step 2: Rodar e ver falhar; implementar as funções puras; rodar** → PASS.

- [ ] **Step 3: Montar tudo**
  - `main.js`: sem filtro de páginas; `indicesPorTipo` alimenta `planosDoStop`.
  - Fileira: usa `marcaAtual`; a altura de cada marca é `passoDaFileira(innerHeight, marcas.length)`, recalculada no `resize`; sem rolagem interna.
  - Legendas: a legenda de obra só aparece com `emFoco(linha, vh, 0.16)` (classe `com-legenda`); os textos das demais paradas seguem com 0,3.
  - "DETALHES": título branco sobre o primeiro close de cada trecho, no canto inferior esquerdo da tela, sem sair da janela. Fica fora das letras com tinta (`preenchimento.js`), como o título da capa.
  - `planos` da pág. 40 em `content.json`: ajustar para a composição do PDF (imagem acima à direita do título, texto embaixo), como foi feito nas págs. 2 e 3.

- [ ] **Step 4: Conferir no navegador** (1440×900 e 1280×700)
  - Do topo ao fim só com scroll: 58 paradas na ordem do PDF; `__site.estado.id` da última é `verso`.
  - Cada obra de Entre Nós em foco: tela inteira, legenda ao lado da base.
  - Closes: grandes, alternando de lado; o seguinte aparece em cor atrás do atual.
  - **Review Focus 4:** em 1280×700 as 36 marcas cabem sem rolagem; em qualquer close do primeiro trecho, a marca "DETALHES" é a atual.
  - Clicar num close em foco amplia e mostra a imagem inteira; "voltar" devolve ao mesmo ponto.
  - Página base (`loseContext`): as 58 páginas, legíveis.

- [ ] **Step 5: Commit** — `git commit -m "feat: as 58 paradas na travessia"`

---

### Task 4: Carregamento em escala

**Files:**
- Modify: `site/js/core/janela.js`, `site/js/gl/texturas.js`, `site/js/travessia/carregamento.js`, `site/js/ui/navegacao.js`, `site/js/main.js`, `tests/core.test.mjs`

**Interfaces:**
- Produces:
  - `larguraPara(larguraPx, dpr, larguras, tolerancia = 1.08)`: menor largura `l` com `l · tolerancia ≥ larguraPx · dpr`, ou a maior.
  - `janelaDeViagem(linha, stops, atual, destino) → Set<id>`: união de `texturasNecessarias` nos índices `atual` e `destino`.
  - `naVista(distancia, alcance) → boolean`: `distancia > −1 && distancia < alcance`.
  - `texturas.miniaturas() → Promise<Map<id, Texture>>`: uma textura por imagem a partir de `images[id].mini`.
  - `criarNavegacao({ …, aoPartir(indiceDestino), aoChegar() })`.
  - `carregamento.carregarConjunto(ids: Set<id>)`: pede as texturas do conjunto e libera as demais; `carregarJanela(indice)` passa a usá-la.

- [ ] **Step 1: Escrever os testes**

```js
assert.equal(larguraPara(644, 2, [640, 1280, 2560]), 1280);     // 1288 cabe em 1280 com 8% de folga
assert.equal(larguraPara(700, 2, [640, 1280, 2560]), 2560);
assert.equal(larguraPara(500, 2, [640, 1280, 2560]), 1280);
assert.equal(larguraPara(9999, 2, [640, 1280, 2560]), 2560);
// stops do teste existente: [capa, t, o1(a), o2(b,c)]
assert.deepEqual([...janelaDeViagem(linha, stops, 0, 3)].sort(), ['a', 'b', 'c']);
assert.equal(naVista(5, 28), true); assert.equal(naVista(-2, 28), false); assert.equal(naVista(28, 28), false);
```

- [ ] **Step 2: Rodar e ver falhar; implementar; rodar** → PASS.

- [ ] **Step 3: Miniaturas** — depois que a abertura começa, `miniaturas()` cria as 65 texturas; cada tela sem textura definitiva passa a mostrar a miniatura (`uMapa` = miniatura, `uTemMapa` = 1). A textura definitiva troca a miniatura; ao ser liberada, a tela volta à miniatura, não à cor chapada. A capa, durante a revelação da abertura, não mostra miniatura.

- [ ] **Step 4: Viagem** — enquanto `navegacao.viajando`, a mudança de índice não chama `carregarJanela`. `aoPartir(destino)` carrega `janelaDeViagem(atual, destino)`; `aoChegar()` (e a interrupção da viagem) carrega a janela da parada onde a página parou.

- [ ] **Step 5: Vista** — a cada quadro, `mesh.visible = naVista(camera.z − mesh.position.z, mesh.userData.alcance)`.

- [ ] **Step 6: Conferir no navegador**
  - **Review Focus 1:** na capa, tecla End: a câmera viaja até o verso; pelo caminho as telas aparecem como miniaturas borradas, nunca pretas nem vazias; ao chegar, o verso está em foco e nítido. Na aba de rede (`performance.getEntriesByType('resource')`), só entram imagens das janelas de partida e de chegada.
  - **Review Focus 5:** ir ao fim e voltar ao topo; contar as telas com textura definitiva (expor a contagem em `__site`): no máximo as da janela (1 antes, 3 depois).
  - Rolagem normal: as telas ganham nitidez antes de chegar ao foco.

- [ ] **Step 7: Commit** — `git commit -m "feat: miniaturas, janela de viagem e telas fora da vista"`

---

### Task 5: Trilho — atravessar a pintura e o último close

**Files:**
- Create: `site/js/core/trilho.js`, `tests/trilho.test.mjs`
- Modify: `site/js/main.js`

**Interfaces:**
- Consumes: `linha`, `stops`, posição `x` do plano de cada parada.
- Produces: `criarTrilho(linha, stops, xDaTela) → (vh) => x`. `xDaTela(id)` devolve o `x` do primeiro plano da parada.
  - **Entrada** (parada `obra` seguida de `detalhe`; `F` = foco da obra, `xt` = `xDaTela` da obra): chaves `(F+12, 0)`, `(F+50, xt)`, `(F+60, xt)`, `(foco do close, 0)`.
  - **Saída** (parada `detalhe` seguida de parada que não é `detalhe` nem `verso`; `F` = foco do close, `xt` = `xDaTela` do close): chaves `(F+8, 0)`, `(F+48, xt)`, `(F+60, xt)`, `(F+84, 0)`.
  - Entre chaves consecutivas `(v0, x0)` e `(v1, x1)`: `x0 · (1 − s) + x1 · s`, com `s = smoothstep(v0, v1, vh)`. Fora de qualquer trecho, 0. Em todo foco de parada, 0.

- [ ] **Step 1: Escrever o teste**

```js
// tests/trilho.test.mjs
const stops = [{id:'c',tipo:'capa'},{id:'o',tipo:'obra'},{id:'d1',tipo:'detalhe'},{id:'d2',tipo:'detalhe'},{id:'a',tipo:'abertura'}];
const linha = criarLinha(stops);            // focos: c 0, o 100, d1 172.5, d2 217.5, a 310
const x = { o: 2.4, d1: -1.5, d2: 1.5 };
const trilho = criarTrilho(linha, stops, id => x[id]);
for (const it of linha.itens) assert.equal(trilho(it.foco), 0, it.id);
assert.equal(trilho(112), 0); assert.equal(trilho(150), 2.4); assert.equal(trilho(157.14), 2.4); assert.equal(trilho(160), 2.4);
assert.ok(trilho(131) > 0 && trilho(131) < 2.4);
assert.ok(trilho(166) > 0 && trilho(166) < 2.4);
assert.equal(trilho(225.5), 0); assert.equal(trilho(265.5), 1.5); assert.equal(trilho(277.5), 1.5); assert.equal(trilho(301.5), 0);
assert.equal(trilho(-50), 0); assert.equal(trilho(9999), 0);
// sem "saída" quando o close é seguido do verso
const fim = [{id:'c',tipo:'capa'},{id:'d',tipo:'detalhe'},{id:'v',tipo:'verso'}];
const tf = criarTrilho(criarLinha(fim), fim, () => 1.5);
for (let vh = 0; vh < 300; vh += 7) assert.equal(tf(vh), 0);
```

- [ ] **Step 2: Rodar e ver falhar; implementar `core/trilho.js`; rodar** → PASS.
- [ ] **Step 3: Integrar** — `poseDoScroll` soma `trilho(vh)` ao `x` da câmera (a paralaxe continua por cima). A ampliação e a volta dela usam `poseDoScroll`, então herdam o trilho.
- [ ] **Step 4: Conferir no navegador**
  - De "Dúvidei" para o primeiro close: a câmera desliza para a pintura, ela cresce até tomar a janela, some, e do outro lado está o primeiro close com "DETALHES". O mesmo de "Cartografia do Íntimo" para o segundo trecho.
  - Do último close do primeiro trecho para "Entre Nós": o close toma a janela e se abre em branco; a abertura da série aparece.
  - **Review Focus 3:** rolando para trás, os mesmos trechos acontecem ao contrário, sem salto.
  - **Review Focus 2:** recarregar com a câmera dentro da pintura (por exemplo `scrollTo` no foco de "Dúvidei" + 55 vh): reabre no mesmo ponto.
  - Em cada parada em foco, legenda e tela continuam alinhadas (o trilho é 0 nos focos).
- [ ] **Step 5: Commit** — `git commit -m "feat: trilho da câmera atravessa a pintura e o último close"`

---

### Task 6: Final — o último close gira e mostra o verso

**Files:**
- Create: `site/js/core/final.js`, `tests/final.test.mjs`
- Modify: `site/js/main.js`, `site/js/travessia/luz.js`

**Interfaces:**
- Consumes: os planos do último `detalhe` (frente) e do `verso`, e os seus focos.
- Produces: `cartaoFinal(vh, { focoFrente, focoVerso, frente, verso }) → { x, y, z, altura, giro }`, com `frente` e `verso` = `{ x, y, altura }`.
  - `s = smoothstep(focoFrente + 6, focoVerso − 14, vh)`.
  - `x`, `y`, `altura` = `frente · (1 − s) + verso · s` (nesta forma, para os extremos saírem exatos).
  - `giro = π · s`.
  - `z = −clamp(vh, focoFrente, focoVerso) · UNIDADES_POR_VH` (o cartão acompanha a câmera entre os dois focos).

- [ ] **Step 1: Escrever o teste**

```js
// tests/final.test.mjs
const p = { focoFrente: 1000, focoVerso: 1072.5, frente: { x: 1.5, y: -0.25, altura: 6.2 }, verso: { x: 0, y: 0, altura: 4.6 } };
const a = cartaoFinal(1000, p);
assert.deepEqual([a.x, a.y, a.altura, a.giro], [1.5, -0.25, 6.2, 0]);
assert.ok(Math.abs(a.z - (-1000 * 0.14)) < 1e-9);
const b = cartaoFinal(1072.5, p);
assert.deepEqual([b.x, b.y, b.altura], [0, 0, 4.6]); assert.ok(Math.abs(b.giro - Math.PI) < 1e-9);
assert.ok(Math.abs(b.z - (-1072.5 * 0.14)) < 1e-9);
const m = cartaoFinal(1035, p);
assert.ok(m.giro > 0 && m.giro < Math.PI); assert.ok(m.altura < 6.2 && m.altura > 4.6);
assert.ok(Math.abs(m.z - (-1035 * 0.14)) < 1e-9);
assert.deepEqual(cartaoFinal(500, p), a);                                                          // antes: parado na frente
assert.ok(Math.abs(cartaoFinal(2000, p).giro - Math.PI) < 1e-9);                                    // depois: parado no verso
let anterior = -1; for (let vh = 1000; vh <= 1072.5; vh += 2.5) { const g = cartaoFinal(vh, p).giro; assert.ok(g >= anterior); anterior = g; }
```

- [ ] **Step 2: Rodar e ver falhar; implementar `core/final.js`; rodar** → PASS.
- [ ] **Step 3: Integrar** — só quando as duas últimas paradas são `detalhe` e `verso`. A cada quadro, a tela do último close recebe posição `(x, y, z)`, `rotation.y = giro` e escala `altura / frente.altura`; a tela do verso recebe a mesma posição, `rotation.y = giro − π` e escala `altura / verso.altura`. As duas com face única (a de trás não aparece). No foco do verso a tela dele fica com rotação 0. Com `0 < giro < π`, a luz rasante dessas duas telas fica neutra. Com uma tela ampliada, o cartão não se move.
- [ ] **Step 4: Conferir no navegador**
  - Do último close ao verso: o close se afasta do lado, centraliza, gira e mostra o verso assinado, que fica inteiro na janela.
  - **Review Focus 3:** rolando para trás, o giro se desfaz.
  - **Review Focus 2:** recarregar no meio do giro e no verso reabre no mesmo estado.
  - Clicar no verso em foco amplia; a assinatura fica legível com zoom.
  - O ímã para no último close e no verso, não no meio do giro.
- [ ] **Step 5: Commit** — `git commit -m "feat: o último close gira e mostra o verso"`

---

### Task 7: Conferência final e documentos

**Files:**
- Modify: `docs/piloto-roteiro.md`, `docs/pendencias-do-piloto.md`

- [ ] **Step 1: Rodar tudo** — as duas suítes passam.
- [ ] **Step 2: Percorrer os cinco itens do Review Focus** e mais: texto das 58 páginas no DOM igual ao de `tools/pdf-text.txt` e à seção 5.1 do desenho; os 18 closes ligados abrem pela marca na obra certa; música, pincel, letras com tinta, ímã e fileira ao longo de todo o percurso; console sem erros; nenhum pedido a outro domínio.
- [ ] **Step 3: Medir** — peso transferido até a capa aparecer (deve continuar abaixo de 2 MB); número de telas com textura definitiva ao longo de uma travessia completa.
- [ ] **Step 4: Atualizar o roteiro** — o site agora tem as 58 páginas; passos novos para os dois trechos de "Detalhes", a travessia pela pintura, o giro final e a viagem longa; perguntas para o Pedro: ritmo dos closes, tamanho dos closes, a travessia pela pintura, o giro. Tirar de `pendencias-do-piloto.md` o que este plano resolveu e registrar o que as revisões adiarem.
- [ ] **Step 5: Commit** — `git commit -m "docs: roteiro e pendências depois da extensão às 58 páginas"`
