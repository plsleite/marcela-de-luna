# Ajustes da segunda rodada, pedidos pelo Pedro (15/11/2026)

Doze mudanças no modo "Travessia", decididas depois da sessão de uso do site com as 58 páginas. Desenho de referência: `docs/2026-11-14-site-marcela-de-luna-design.md`. Rodada anterior: `docs/2026-11-15-ajustes-do-piloto.md`.

## O que fica como está

Brancura do vulto, legenda ao lado da base, ritmo e tamanho dos closes, velocidade do giro e tamanho do verso, abertura de "Entre Nós" com a imagem inteira à direita, obras quadradas mais perto do centro, paralaxe, força da luz, duração e cores da pincelada, pesos da fonte, abertura do site. Nenhum erro encontrado no Safari.

## Vocabulário

- **Ampliar:** clicar na tela em foco (no código, `mergulho`).
- **Viajar:** clicar numa tela ao longe (`irPara`).
- **Vulto:** tela à frente, quase branca, que ganha cor com o ponteiro sobre ela.
- **Close:** cada página dos dois trechos de "Detalhes" (tipo `detalhe`).
- **Marca de destaque:** o anel sobre uma obra ampliada que abre o close daquele trecho.

## Restrições que continuam valendo

- Conteúdo só do PDF, salvo a música e os rótulos de interface. Idioma: português. "DÚVIDEI" não se corrige.
- Nenhuma URL remota em tempo de execução. Sem `npm install`. Sem `git push`.
- As pinturas nunca recebem tinta do pincel. A luz rasante altera só a luminância.
- O scroll é o nativo da página. Nada pode impedir o visitante de rolar; as exceções são as da rodada anterior.
- `desmontar()` em `site/js/main.js` é o caminho único de saída para a página base: tudo o que for criado se registra para encerramento.
- A página base (sem a classe `travessia`) não muda.
- Lógica nova que puder ser pura vai para `site/js/core/` com teste em `tests/`.
- `site/js/main.js` não cresce: o que entrar nele sai em módulo de `site/js/travessia/`.

## B1. Ímã com sentido

Hoje o ímã leva à parada de foco mais próximo: é preciso rolar metade do caminho para avançar, e uma rolada curta devolve o visitante à mesma tela.

- Nova constante `IMA.limiar = 0.25` em `site/js/config.js`.
- `alvoDoIma(linha, vh, { folga, origem, limiar })` em `site/js/core/ima.js`. `origem` é o `vh` em que a página estava parada quando o gesto começou. Sejam `a` e `b` as paradas vizinhas com `a.foco ≤ vh ≤ b.foco` e `f = (vh − a.foco) / (b.foco − a.foco)`:
  - `vh > origem` (descendo): alvo `b.foco` se `f ≥ limiar`, senão `a.foco`.
  - `vh < origem` (subindo): alvo `a.foco` se `1 − f ≥ limiar`, senão `b.foco`.
  - sem `origem`, ou `vh === origem`: a parada mais próxima, como hoje.
  - antes do primeiro foco e depois do último: o extremo. A menos de `folga` do alvo: `null`.
- `site/js/ui/ima.js` guarda `origem` quando o gesto começa com a página parada, e a renova a cada chegada do ímã.
- Duração, curva, espera e cancelamento não mudam.
- Testes em `tests/ima.test.mjs`: parado em "Foyer", descer 20 vh volta a "Foyer"; descer 26 vh vai a "A Dança é por Ela"; de "A Dança é por Ela", subir 26 vh vai a "Foyer"; entre dois closes (45 vh), descer 12 vh já avança; descer 60 vh e voltar a 20 vh sem parar devolve à origem; sem `origem`, o resultado é o de hoje.

## B2. Fim do trilho

O Pedro não gostou da câmera atravessando a pintura: quer a mesma transição do resto do site.

- A câmera volta a andar em linha reta em todo o percurso: sai `site/js/core/trilho.js`, `tests/trilho.test.mjs`, `TRILHO_FOLGA_TEXTO` e todo uso de `trilho` e `textoVale` em `site/js/main.js` e `site/js/ui/legendas.js`.
- Os textos de todas as paradas voltam a valer pelas frações de sempre (`emFoco`, 0,3; legenda de obra, 0,16). "DETALHES" entra como qualquer título.
- O clique no meio do giro final continua viajando para o foco da parada (`noMeioDoGiro`).

## B3. Um só vulto à frente, inclusive nos closes

Medido hoje: do foco de "Dúvidei" (e de "Cartografia do Íntimo"), o primeiro close fica a 18,15 un. com 26% de brancura (abaixo de `realce`, então o ponteiro não muda nada) e o segundo ainda aparece (24,45 un., alfa 0,98). De um close, o próximo aparece com as cores inteiras (14,30 un.) e mais dois atrás dele.

Regra: do foco de qualquer parada, vê-se uma única tela à frente, a primeira da parada seguinte, em vulto com realce.

- `VISIBILIDADE_DETALHE` em `site/js/config.js` passa a `{ ...VISIBILIDADE, surge: [2.0, 3.6], branco: [10, 14], some: [18.6, 20.4] }`. Resultado esperado: a 14,30 un. brancura 0,92 e alfa 1; a 18,15 un. brancura 0,92 e alfa 1; a 20,60 un. e além, alfa 0.
- **Lado dos closes** (`planosDoStop`, `site/js/core/camera.js`): em cada trecho, o último close fica do lado oposto ao da primeira tela da parada seguinte, e os anteriores alternam a partir dele. Com os dados atuais: no primeiro trecho (16 closes, seguido de "Entre Nós" com a imagem em x = 2,45) o último fica à esquerda e o primeiro à direita; o segundo trecho (8 closes, seguido do verso) não muda. As alturas `DETALHE.ys` não mudam.
- Função pura nova `fracaoVisivel(alvo, naFrente)` em `site/js/core/projecao.js`: fração da área do retângulo `alvo` que não é coberta pelos retângulos de `naFrente`.
- Teste com os dados reais (janela 1440×900): nas transições "Dúvidei" → primeiro close, entre closes consecutivos dos dois trechos, último close → "Entre Nós" e "Cartografia do Íntimo" → primeiro close, a primeira tela da parada seguinte tem brancura ≥ 0,9, alfa 1 e pelo menos 40% da área fora das telas da parada em foco; e nenhuma tela de parada mais adiante tem alfa > 0,05.
- Conferência no navegador: em cada uma dessas transições, o ponteiro sobre o vulto dá o realce e o cursor `pointer`, e o clique viaja.

## B4. Vulto do verso

Nada indica que depois do último close existe o verso.

- Com o último close em foco, aparece um vulto com a imagem do verso, do lado oposto ao do close: `x = −2,2`, `y = 0`, altura `VERSO.altura`, no `z` do foco do verso. É uma tela a mais (`criarTela` com `VISIBILIDADE`), que usa só a miniatura e não entra no carregamento.
- Opacidade do vulto: `1 − smoothstep(focoFrente + 2, focoFrente + 14, vh)`. Ele some quando o giro começa e nunca chega a ganhar cor.
- O vulto reage como os outros: realce com o ponteiro, cursor `pointer`, e o clique viaja para o verso (o giro acontece no caminho). Não barra clique nem pincel com opacidade 0.
- A conta da opacidade vai para `site/js/core/final.js`, com teste: 1 no foco do último close, 0 a partir de `focoFrente + 14`, 0 no foco do verso.
- A montagem do cartão final e do vulto sai de `main.js` para `site/js/travessia/cartao.js` (pendência antiga).

## B5. Acento cortado nas letras pintadas

Em "ENTRE NÓS", a letra pintada perde o topo do acento: a pintura da letra só preenche a caixa da linha, e o acento fica acima dela.

- Em `site/css/travessia.css`, a caixa de `.titulo-secao .letra` ganha folga em cima e embaixo (padding com margem negativa igual), sem mudar a posição das letras nem o espaçamento do título, e a posição do fundo é compensada.
- Conferir no navegador, com as letras pintadas: "ENTRE NÓS", "PESQUISA ARTÍSTICA" e "A BAILARINA", antes e depois, sem deslocamento de 1 px no título.

## B6. Definição do traço de tinta

A tinta é desenhada num alvo com metade da resolução do canvas. Na tela retina isso dá um ponto de tinta por ponto de tela; num monitor de densidade 1 (3440×1440), cada ponto de tinta ocupa 2×2 pixels.

- Função pura `tamanhoDoAlvo(larguraCss, alturaCss, razaoDePixels, teto = 8_300_000)` em `site/js/core/pincel.js`: pontos de tinta por ponto de tela = `max(1, razaoDePixels / 2)`; se `w·h` passar do teto, reduz os dois lados na mesma proporção. `site/js/gl/tinta.js` usa essa função em `redimensionar()`.
- Testes: (1440, 900, 2) → 1440×900; (3440, 1440, 1) → 3440×1440; (1280, 720, 1) → 1280×720; (5120, 2880, 1) → `w·h ≤ teto` com a mesma proporção.
- **Curva:** entre posições do mouse, os carimbos seguem uma curva em vez de segmentos retos (Bézier quadrática entre os pontos médios, com a posição do mouse como controle), com a direção de cada carimbo tangente à curva. Função pura `carimbosNaCurva(a, controle, b, passo)` em `site/js/core/pincel.js`, com teste: três pontos alinhados dão o mesmo espaçamento de `carimbosEntre`; a distância entre carimbos vizinhos fica entre 0,5 e 1,5 do passo; os pontos estão sobre a curva.
- `pointermove` usa `getCoalescedEvents()` quando existir.
- A largura, a textura das cerdas, a cor e o tempo de sumiço não mudam. O traço termina onde o mouse está (o último trecho não fica para trás com o mouse parado).
- Custo: registrar o tempo de quadro com tinta viva antes e depois, numa janela de 3440×1440 com densidade 1. A medição do painel de navegador não vale como prova de fluidez; a conferência final é do Pedro, no monitor dele.

## B7. Controles protegidos da tinta

- O nome "MARCELA DE LUNA", o botão de som (com o texto do convite), a fileira (na largura da lente aberta) e a linha "DETALHES" das legendas barram a tinta: força 0 dentro do retângulo com 10 px de margem, subindo até a força cheia em 24 px. A margem e a rampa contam a partir da borda do carimbo, não do centro (decisão R2, abaixo).
- Usa o mecanismo de obstáculos que já existe em `site/js/travessia/pincel.js` (`forcaSobreTexto`).
- Conferir: passar o mouse sobre cada controle não deixa tinta sob ele nem atrás do texto.

## B8. Botão de som: lugar novo e convite

- **Lugar:** canto superior esquerdo, na linha do nome. Na capa (nome oculto), o botão fica na margem esquerda, no lugar do nome. Fora da capa, fica 18 px à direita do nome. A troca é uma transição de 0,5 s, sem salto. Com uma tela ampliada, continua visível e utilizável na posição "à direita do nome", sem encostar no botão "voltar".
- **Convite:** enquanto a música ainda não tocou nesta visita e a escolha guardada não é `desligado`, o botão mostra, à direita das barras, o texto "LIGAR O SOM" (mesma tipografia do nome), e as barras ondulam devagar e baixas (entre 0,25 e 0,55 da altura, ciclo de 2,4 s). Quando a música começa, o texto some em 0,6 s e ficam só as barras, como hoje. Com a escolha `desligado`, só as barras baixas e paradas.
- O primeiro clique ou tecla em qualquer ponto continua iniciando a música. Nenhum pop-up.
- Função pura em `site/js/core/som.js`: `convite({ escolha, tocou })` → `escolha !== 'desligado' && !tocou`, com teste.
- `aria-label` e `aria-pressed` não mudam; o texto do convite é `aria-hidden`.

## B9. Fileira contraída, com lente

- **Em repouso:** cada marca é um traço curto (8 × 1,5 px, opacidade 0,45) e o passo é `max(6, 0,45 · passoDaFileira)` px; a separação entre grupos cai na mesma proporção. A marca da parada atual continua mais comprida e na sua cor.
- **Com o ponteiro na faixa da fileira** (72 px a partir da borda direita, na altura da coluna): as marcas próximas crescem até o formato atual (pincelada de 14 × 4 px, passo `passoDaFileira`). A marca sob o ponteiro não sai do lugar.
- Constantes em `config.js`: `FILEIRA = { repouso: 0.45, passoMin: 6, raio: 3 }` (`raio` em passos cheios).
- Função pura `lente(centros, yCursor, { passo, passoCheio, raio })` em `site/js/core/navegacao.js` → `[{ y, fator }]`. Com `R = raio · passoCheio`, `d = centro − yCursor` e `k = passoCheio / passo − 1`: `y = centro + k · sinal(d) · g(|d|)`, com `g(d) = d/2 + (R / 2π) · sen(π d / R)` para `d ≤ R` e `R/2` além; `fator = cos²(π d / 2R)` dentro de `R` e 0 fora.
- Testes: sem cursor, identidade e fator 0; marca sob o cursor mantém `y` e tem fator 1; a ordem das marcas se conserva; vizinhas do cursor ficam a cerca de `passoCheio` uma da outra (5% de tolerância); marcas além de `R` se deslocam exatamente `k · R/2`.
- O título da marca sob o ponteiro aparece como hoje. Com foco de teclado, a marca focada faz o papel do cursor. Em aparelho sem ponteiro fino (`hover: none`), a fileira fica no formato cheio de hoje.
- A lente entra e sai em 0,25 s. Com a lente aberta, a coluna continua inteira dentro da janela em 1440×900, 1280×700 e 1024×768.

## B10. Marcas de destaque mais visíveis

- **Na legenda da obra** (travessia): nas obras que têm close ligado, entra abaixo da ficha uma linha "DETALHES" com um anel pequeno antes do texto. É um botão: amplia a obra, como o clique na pintura. Nas obras de duas telas, amplia a tela que tem o close (a primeira, se as duas tiverem).
- A legenda cresce uma linha: a posição continua calculada por `site/js/core/legenda.js`; conferir que nenhuma legenda cobre tela da própria parada nem o vulto em 1440×900, 1024×768 e 900×900.
- **Na obra ampliada:** a marca passa de 30 para 44 px, com anel de 20 px e um ponto cheio de 6 px no centro (branco, com o filete escuro de hoje). Ao entrar, três anéis se expandem em sequência (2,2 s no total); depois ela respira como hoje.
- Sem animação com movimento reduzido (regra que já existe).

## B11. Imagens: tudo baixado em segundo plano

A pintura em foco já usa a largura que a tela comporta, e a ampliação usa a maior. O limite de telas nítidas ao mesmo tempo é de memória de vídeo (as 65 na maior largura ocupariam cerca de 2,9 GB) e continua. O que muda é o download: hoje ele só começa quando a parada entra na janela de carregamento.

- Depois que a abertura termina, o site baixa em segundo plano os arquivos de todas as telas, na largura que a tela pede (a mesma conta de `larguraPara`), e guarda os bytes em memória (Blob), sem decodificar. Volume: 12 MB (largura 640), 38 MB (1280) ou 85 MB (maior largura), conforme a tela.
- Ordem: da parada atual até o fim, depois da atual para trás. Dois downloads por vez, com prioridade baixa. Um pedido da janela de carregamento passa na frente e reaproveita um download já em curso do mesmo arquivo.
- A maior largura da tela em foco e da seguinte também entra na reserva, para a ampliação abrir sem espera.
- Não roda com `navigator.connection.saveData` ligado.
- Módulo novo `site/js/core/reserva.js`: `criarReserva({ buscar, simultaneos = 2 })` → `{ pedir(url), enfileirar(urls), tem(url), encerrar() }`, com `buscar(url, { sinal, prioridade })` injetado. `site/js/gl/texturas.js` passa a pedir os bytes à reserva. Fila em `filaDeReserva(stops, atual)` (`site/js/core/janela.js`).
- **Falha de download** (pendência antiga): o arquivo sai da reserva e do cache de texturas, e a próxima aproximação tenta de novo.
- **Troca suave** (pendência antiga): a passagem da miniatura para a imagem nítida esmaece em 0,35 s, em vez de trocar de uma vez.
- Testes (com `buscar` falso): nunca mais de dois downloads ao mesmo tempo; a ordem da fila; `pedir` de um arquivo em curso devolve a mesma promessa; falha remove a entrada e um novo `pedir` baixa de novo; `encerrar` aborta os que estão em curso e esvazia a fila; `filaDeReserva` do meio vai até o fim e depois volta.
- Conferir no navegador: depois de 30 s parado na capa (rede local), apertar End não mostra tela borrada na chegada; nenhum pedido a outro domínio. As telas do caminho de uma viagem longa continuam na miniatura (decisão R4, abaixo).

## B12. Documentos

- `docs/piloto-roteiro.md`: nova seção "O que mudou na segunda rodada", com os passos para o Pedro conferir cada item e o que só ele pode conferir (traço no monitor externo, ímã com a roda de verdade, convite do som, lente da fileira).
- `docs/pendencias-do-piloto.md`: saem os itens resolvidos (trilho, falha de `fetch` em cache, troca miniatura → nítida, divisão do cartão); entram os achados das revisões.
- `docs/2026-11-14-site-marcela-de-luna-design.md`: seções da câmera, da navegação e do som atualizadas.

## Ordem de execução

Uma tarefa por vez, cada uma com revisão antes da seguinte, e uma revisão final do conjunto.

1. B2 e B3: fim do trilho, visibilidade e lado dos closes.
2. B4: vulto do verso e `travessia/cartao.js`.
3. B1: ímã com sentido.
4. B5, B6 e B7: acento, definição do traço e controles protegidos.
5. B8: botão de som.
6. B9: fileira com lente.
7. B10: marcas de destaque.
8. B11: reserva de imagens.
9. B12: documentos e conferência geral no navegador.

## Conferência no navegador

Antes de cada conferência: `sh tools/preview-sync.sh`; servidor `site` na porta 4173. Com o painel de navegador oculto, a animação só anda depois de uma captura de tela.

Regressão a cada tarefa: abertura, pincel, letras com tinta, ampliar e fechar, close em "A Dança é por Ela", fileira, setas, giro final, redimensionar, `loseContext`, nenhum erro no console.

Testes: `node --test tests/*.test.mjs` e `/usr/bin/python3 -m unittest discover -s tools -p "test_*.py"`.

## Decisões durante a execução

- **R1 (B7).** A proteção da tinta foi feita de forma genérica na tarefa 4: todo elemento com o atributo `data-barra-tinta` barra a tinta. As tarefas seguintes marcaram os seus controles novos (convite do som, barreira da fileira, linha "DETALHES").
- **R2 (B7).** A margem de 10 px e a rampa de 24 px contam a partir da borda do carimbo (distância do centro menos a meia largura do pincel), porque, contadas do centro, as cerdas ainda passavam sob o controle. A zona sem tinta ficou cerca de 23 px maior.
- **R3 (B10).** A legenda desce o mínimo para não cobrir o vulto da parada seguinte: "Cartografia do Íntimo" fica 33, 62 e 69 px abaixo da base da pintura em 1440×900, 1024×768 e 900×900; "Dúvidei", 29 e 36 px em 1024×768 e 900×900. Reversível em `core/legenda.js`.
- **R4 (B11).** Numa viagem longa, as telas do caminho continuam na miniatura e só a chegada é nítida: deixar nítidas as ~24 paradas por segundo do voo estouraria o limite de memória de vídeo, que continua. Alternativa, se o Pedro pedir: carregar numa largura menor a parada por onde se passa.
- **R5 (B8).** O nome e o botão de som ganham o fundo branco translúcido da ficha da obra ampliada (`rgb(255 255 255 / 0.86)`), para continuarem legíveis sobre os closes da esquerda, onde a pintura chega ao canto superior esquerdo; sobre o branco o fundo não aparece. O fundo fica num pseudo-elemento, para não mudar a posição do texto, a área de clique nem a distância de 18 px entre o nome e o botão; na capa o botão fica sem fundo, porque ali ele encosta no alto da pintura. Se o Pedro não gostar, é uma regra de CSS (`travessia.css`).
