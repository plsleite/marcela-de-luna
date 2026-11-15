# Ajustes do piloto pedidos pelo Pedro (15/11/2026)

Seis mudanças no modo "Travessia" do site, decididas depois da primeira sessão de uso. O desenho já foi atualizado: `docs/2026-11-14-site-marcela-de-luna-design.md`, seções 2, 3, 5.3 e 6.

## Vocabulário

- **Ampliar:** clicar na tela em foco; a câmera avança até ela ocupar a janela (no código, `mergulho`).
- **Viajar:** clicar numa tela ao longe; a câmera vai até a parada dela (`irPara`).
- **Vulto:** tela que não pertence à parada em foco.

## Restrições que continuam valendo

- Conteúdo só do PDF, salvo a música. Idioma: português.
- Nenhuma URL remota em tempo de execução. Sem `npm install`. Sem `git push`.
- As pinturas nunca recebem tinta do pincel. A luz rasante altera só a luminância.
- O scroll é o nativo da página. Nada pode impedir o visitante de rolar; as exceções são a roda e a pinça com uma tela ampliada, e a roda até 400 ms depois de sair.
- `desmontar()` em `site/js/main.js` é o caminho único de saída para a página base: tudo o que for criado se registra para encerramento.
- A página base (sem a classe `travessia`) não muda.
- Lógica nova que puder ser pura vai para `site/js/core/` com teste em `tests/`.

## A1. Ampliar também a capa e os recortes

- `destinoDoClique` (`site/js/core/clique.js`): tela da parada em foco devolve `'mergulho'` para os tipos `obra`, `capa`, `texto` e `abertura`. Tela ao longe continua `'viagem'`. Durante a abertura, `null`.
- Interface ao ampliar: nas obras, título e ficha, como hoje. Na capa e nos recortes, nenhuma legenda: só o botão "voltar". Nenhum bloco vazio no DOM.
- Os textos da parada (título, nome, contato, parágrafos) somem enquanto a tela está ampliada e voltam ao sair.
- Testes: atualizar `tests/clique.test.mjs` (capa, texto e abertura em foco → `'mergulho'`).

## A2. Clicar fora fecha

- Com uma tela ampliada, um clique em qualquer ponto que não seja a tela ampliada nem um controle (botão "voltar", marca de close) chama `fecharMergulho()`, com a volta animada de sempre.
- Arrasto não é clique: vale o limiar de 6 px que já existe.
- Com um close aberto, o clique fora do close fecha primeiro o close (comportamento atual); um segundo clique fora da tela fecha a ampliação.
- Cursor fora da tela ampliada: `zoom-out`.
- O clique que fecha não pode ser interpretado em seguida como clique numa tela ao longe (não viaja).

## A3. Ímã do scroll

- Constantes em `site/js/config.js`: `IMA = { espera: 160, duracaoMin: 0.45, duracaoMax: 0.9, folga: 0.5 }` (`espera` em ms; durações em s; `folga` em vh).
- Quando não chega entrada de scroll há `espera` ms e a página está parada, a câmera desliza até o `foco` da parada mais próxima (em vh). Se a distância for menor que `folga`, não faz nada.
- Duração: `duracaoMin` até 20 vh de distância, crescendo linearmente até `duracaoMax` em 80 vh ou mais. Curva de saída suave.
- Qualquer entrada (roda em qualquer sentido, toque, tecla, arrasto da barra de rolagem) cancela o deslize no mesmo instante, sem somar impulso herdado e sem contenção. A página fica onde o visitante a levou e o ímã só volta a agir depois de nova espera.
- O ímã não age: durante a abertura, com uma tela ampliada ou saindo dela, durante uma viagem de navegação, nem antes da primeira entrada de scroll do visitante depois da carga.
- Funções puras em `site/js/core/` com teste: a parada mais próxima de um `vh` (empate → a de menor índice) e a duração do deslize.
- Conferir que o ímã não briga com a restauração de posição na carga nem com a correção do `resize`.

## A4. Vulto quase branco, com realce ao passar o mouse

- Em `site/js/config.js`, `VISIBILIDADE.branco` passa de `[14, 28]` para `[10.5, 17]`, e entram `VISIBILIDADE.residuo = 0.08`, `VISIBILIDADE.some = [22, 28]` e `VISIBILIDADE.realce = 0.63`.
- No shader de `site/js/gl/tela.js`: a brancura é `smoothstep(10.5, 17, dist) · (1 − residuo)`, ou seja, o vulto conserva 8% da pintura; o alfa cai a zero entre 22 e 28 de distância. Em foco (até 10,5 de distância, o que inclui a segunda tela das obras de duas telas, a 9,5) a pintura fica inteira.
- Novo uniforme `uRealce` (0..1): `branco = mix(branco, min(branco, realce), uRealce)`. Com o ponteiro sobre um vulto (`palco.telaSob`), o `uRealce` dessa tela vai a 1 em cerca de 200 ms e volta a 0 ao sair. Só vultos reagem; a tela da parada em foco não muda.
- O cursor continua `pointer` sobre um vulto clicável.
- Todo código que usa as distâncias de visibilidade (palco, pincel) continua lendo de `VISIBILIDADE`.
- O realce não vale com uma tela ampliada nem durante a abertura.

## A5. Legenda colada à pintura

- A legenda de cada obra fica imediatamente ao lado da sua tela, do lado de dentro da janela, **alinhada pela base**: a borda inferior da legenda coincide com a borda inferior da tela, como uma etiqueta de museu. Distância horizontal entre a borda da tela e a legenda: 3,5% da largura da janela, com mínimo de 32 px. (Revisto em 15/11/2026: centralizada na vertical, a legenda sobrepunha o vulto da tela seguinte, que fica na faixa central da altura.)
- Tela à esquerda → legenda à direita dela. Tela à direita → legenda à esquerda dela.
- Obras de duas telas: legenda à direita da tela mais à direita, com a mesma distância, alinhada pela base do conjunto.
- A legenda nunca cobre uma tela da própria parada nem sai da janela; se sair por baixo ou em janela estreita, prevalece ficar dentro da janela.
- A conta é uma função pura em `site/js/core/legenda.js` (retângulos das telas, janela e tamanho da legenda → x, y), com teste em `tests/legenda.test.mjs`; `site/js/ui/legendas.js` só a aplica.

## A6. Música de fundo

- Arquivo: `site/assets/audio/o-cisne.mp3`. **O arquivo pode não existir ainda.** Se não carregar, o botão de som não aparece e nada mais muda; nenhum erro no console além do 404 do próprio pedido.
- Novo módulo `site/js/ui/som.js`, criado só no modo travessia e encerrado em `desmontar()`.
- O site abre em silêncio. No primeiro `pointerdown` ou `keydown` do visitante, a música começa, subindo de 0 ao volume 0,6 em 3 s, e toca em looping. O arquivo já tem volume baixo (cerca de −25,6 LUFS), porque no iPad o site não controla o volume.
- O arquivo só começa a ser baixado depois que a abertura termina.
- Botão discreto no canto superior direito: três barrinhas finas desenhadas em CSS, que oscilam com a música tocando e ficam paradas e baixas com o som desligado. `aria-label` "Desligar o som" ou "Ligar o som" e `aria-pressed`. Liga e desliga com transição de 0,6 s.
- A escolha fica em `localStorage` (`som` = `ligado` ou `desligado`). Se estiver `desligado`, a música não começa sozinha.
- A música pausa quando a aba fica oculta e retoma quando volta.
- O botão continua visível e utilizável com uma tela ampliada.
- Lógica de estado (deve tocar? com que volume-alvo?) em função pura com teste.
- Crédito da gravação: comentário no `index.html` e no topo de `som.js` (Alisa Weilerstein e Jason Yoder, Casa Branca, 2009; Wikimedia Commons).

## Conferência no navegador

Antes de cada conferência: `sh tools/preview-sync.sh`; servidor `site` na porta 4173. Com o painel de navegador oculto, a animação só anda depois de uma captura de tela.

- A1: clicar na pintura da capa e em cada recorte de "Pesquisa Artística" e "A Bailarina" amplia, sem legenda; "voltar" e Esc devolvem ao mesmo ponto.
- A2: com uma obra ampliada, clicar no branco fecha e devolve ao mesmo `scrollY`; arrastar no branco não fecha; clicar fora com um close aberto fecha só o close.
- A3: rolar e parar entre "Foyer" e "A Dança é por Ela": a página desliza até a mais próxima e `__site.estado.local` fica em 0,5; rolar de novo durante o deslize interrompe na hora; o ímã não age durante a abertura nem com uma tela ampliada.
- A4: com "Foyer" em foco, "A Dança é por Ela" ao fundo é quase branca; com o ponteiro sobre ela ganha o esmaecido e o cursor vira `pointer`; clicar viaja até ela.
- A5: em cada uma das três obras, a legenda fica ao lado da própria tela, sem vulto entre as duas; em 1440×900, 1024×768 e 900×900.
- A6: sem o arquivo, nenhum botão e nenhum erro além do 404; com um arquivo de teste, a música entra no primeiro clique, o botão liga e desliga, a escolha sobrevive a recarregar.
- Regressão: abertura, pincel, letras com tinta, close em "A Dança é por Ela", fileira, setas, redimensionar, `loseContext`.

Testes: `node --test tests/*.test.mjs` e `/usr/bin/python3 -m unittest discover -s tools -p "test_*.py"`.
