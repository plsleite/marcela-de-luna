# Ajustes da terceira rodada, pedidos pelo Pedro (15/11/2026)

Duas mudanças no modo "Travessia", vindas das respostas do Pedro às perguntas da segunda rodada (`docs/piloto-roteiro.md`). Rodada anterior: `docs/2026-11-15-ajustes-segunda-rodada.md`.

## Respostas do Pedro à segunda rodada

Ímã, lente da fileira, marca de destaque, linha "DETALHES", lado dos closes e legenda deslocada: está bom. Viagem longa com as telas do caminho borradas: fica como está, por ora. Fundo translúcido atrás do nome e do botão de som: fica bem, mas falta no botão de som na capa. Traço no monitor externo, fluidez, ímã com a roda, lente, pulso da marca e Safari: conferidos por ele, sem problema. Pendente com a Marcela: se ela quer alguma alteração na lente.

## Restrições que continuam valendo

- Conteúdo só do PDF, salvo a música e os rótulos de interface. Idioma: português.
- Nenhuma URL remota em tempo de execução. Sem `npm install`. Sem `git push`.
- O scroll é o nativo da página; as exceções são a roda e a pinça com uma tela ampliada.
- `desmontar()` em `site/js/main.js` é o caminho único de saída para a página base: tudo o que for criado se registra para encerramento.
- A página base (sem a classe `travessia`) não muda.
- Lógica nova que puder ser pura vai para `site/js/core/` com teste em `tests/`.
- `site/js/main.js` não cresce.

## C1. O convite do som não encosta na pintura da capa

No MacBook de 14" (janela de cerca de 1512×828), o texto "LIGAR O SOM" fica sobre o canto superior esquerdo da pintura da capa: a linha do botão está a cerca de 40 px do alto da janela e a pintura começa a cerca de 37 px.

- **Folga para a linha do botão.** A pintura da capa passa de altura 4,6 e y 0 para **altura 4,5 e y −0,05** (`planosDoStop`, `site/js/core/camera.js`): 2% menor, com a borda de baixo onde estava (2,25 + 0,05 = 2,30) e toda a folga aberta em cima. Os valores vão para `site/js/config.js` (`CAPA = { x: -2.0, y: -0.05, altura: 4.5 }`). (Corrigido na execução: o pedido dizia y −0,03, que não dava a folga exigida; ver "Decisões durante a execução".)
- Resultado exigido, medido no navegador com a abertura terminada: a linha de base do texto do convite fica acima do topo da pintura da capa por pelo menos 10 px em 1512×828 e em 1440×900, e por pelo menos 5 px em 1280×700.
- "PORTFÓLIO", o nome, o ano, o contato e o rodapé da capa continuam alinhados com a pintura como hoje (eles seguem o retângulo projetado da tela); a abertura (pinceladas que revelam a capa) continua cobrindo a pintura inteira; a página base não muda.
- **Fundo também na capa.** O fundo branco translúcido do botão de som (`.som::before`, `site/css/travessia.css`) passa a valer também na capa. Com a folga acima ele fica sobre o branco e não aparece; numa janela baixa, em que o botão ainda toque a pintura, ele mantém o texto legível.
- Testes: os de `planosDoStop` e os que usam o plano da capa, atualizados para os valores novos.

## C2. Zoom e arrasto no close aberto pela marca de destaque

Hoje o close aberto pela marca é uma imagem que ocupa a janela, sem zoom: a roda e a pinça são ignoradas enquanto ele está aberto (`aoRodar` e `aoPinca` em `site/js/ui/mergulho-ui.js` saem cedo com `m.detalhe`). Não há razão para isso além de ele ter nascido como uma vista simples.

- Com um close aberto, **a roda e a pinça aproximam e afastam** a imagem em torno do ponteiro (o ponto sob o ponteiro não sai do lugar), e **arrastar move** a imagem, com os mesmos gestos, a mesma sensibilidade e os mesmos limites da tela ampliada (`ZOOM_MIN` = 1, `ZOOM_MAX` = 6, constantes `RODA` e `PINCA`; no Safari, os eventos `gesturestart`/`gesturechange`/`gestureend`).
- A imagem nunca se solta da janela: no zoom 1 ela fica centrada, como hoje; com zoom, o arrasto para quando a borda da imagem chega ao centro da janela (a mesma regra de folga da tela ampliada, se ela se aplicar; senão, a borda da imagem não passa do centro da janela).
- **Sair:** um clique sem arrasto (limiar de 6 px que já existe) recolhe o close, em qualquer zoom; Esc recolhe; no zoom 1, rolar a roda para baixo num gesto novo recolhe o close e o resto do gesto é engolido (a mesma regra com que a tela ampliada fecha), sem fechar também a ampliação da tela nem rolar a página.
- O recolhimento parte da posição e do zoom em que a imagem está e volta à marca, sem salto. Abrir de novo começa no zoom 1.
- Cursor: `zoom-out` no zoom 1 (como hoje); com zoom, `grab`, e `grabbing` durante o arrasto.
- Redimensionar a janela com o close ampliado: a imagem volta ao zoom 1 ou continua dentro dos limites, sem ficar fora da janela.
- A conta (zoom em torno de um ponto, limites do arrasto) é função pura em `site/js/core/` com teste: reaproveite `aplicarZoom` e `arrastar` de `core/mergulho.js` se o modelo servir; senão, funções novas no mesmo módulo. Testes: o ponto sob o cursor fica fixo ao aproximar; o zoom respeita 1 e 6; no zoom 1 a posição é a centrada; o arrasto respeita o limite nas quatro direções.
- Nada muda na tela ampliada (zoom, arrasto, saída) nem na abertura do close a partir da marca.

## C3. Documentos

- `docs/piloto-roteiro.md`: seção curta "O que mudou na terceira rodada", com o que conferir (o convite na capa no MacBook de 14"; zoom, arrasto e saída no close) e as respostas do Pedro à segunda rodada registradas em uma linha cada.
- `docs/pendencias-do-piloto.md`: saem os itens resolvidos; entram os achados da revisão.
- `docs/2026-11-14-site-marcela-de-luna-design.md`: valores da capa e o zoom do close.

## Conferência no navegador

Antes de cada conferência: `sh tools/preview-sync.sh`; servidor `site` na porta 4173. Com o painel de navegador oculto, a animação só anda depois de uma captura de tela.

Regressão: abertura; ampliar e fechar a capa e uma obra (clique, "voltar", Esc, clique fora, roda para baixo); zoom e arrasto na tela ampliada; close em "A Dança é por Ela" pela marca; botão de som na capa, fora da capa e com uma tela ampliada; nenhum erro no console.

Testes: `node --test tests/*.test.mjs` e `/usr/bin/python3 -m unittest discover -s tools -p "test_*.py"`.

## Decisões durante a execução

- **y da capa em −0,05, não −0,03.** Com y −0,03 a folga medida foi de 7,2 px em 1512×828 e 3 px em 1280×700, abaixo do exigido (a conta deste documento estava errada). Com altura 4,5 e y −0,05, a borda de baixo da pintura fica exatamente onde estava com altura 4,6 e y 0, e a folga inteira se abre em cima. Medido com a abertura terminada (linha de base do convite → alto da pintura): 10 px em 1512×828, 24 px em 1440×900 e 6 px em 1280×700. A borda de baixo e a base de "PORTFÓLIO" ficaram no mesmo px de antes nas três janelas.
- **Limite do arrasto do close.** Vale a regra da tela ampliada: no zoom 1 a imagem fica centrada; num eixo em que ela ainda cabe na janela, fica no meio; senão a borda da imagem para na borda da janela (não no centro).
- **Saída pela roda no close.** Rolar para baixo no zoom 1, num gesto novo, recolhe o close e engole o resto do gesto por até 400 ms, como a saída da tela ampliada. Depois disso, uma inércia ainda no mesmo gesto pode afastar a tela ampliada que estiver aproximada; nunca a fecha.
