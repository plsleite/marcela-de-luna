# Pendências deixadas pelo piloto

Achados das revisões do Plano 1 que não bloqueiam a validação do piloto. Cada um está no plano em que deve ser tratado.

## Antes de estender o site (arquitetura)

- Tirar `montarTravessia` de `site/js/main.js`: carregamento, luz, pincel e roteamento em módulos próprios.
- Levar a máquina de `texturas` para código testável.
- Testes de integração inexistentes: desmontagem, resize, ciclo do mergulho, roteamento de clique, `irPara`, cache de texturas, orquestração da abertura.
- Testes que não exercitam o produto: `fatorDeLuz` e `revelacao` são gêmeos em JS dos shaders; "config" e "ABERTURA: valores do brief" comparam constantes com elas mesmas.
- O teste de conteúdo prova "nada a mais", não "nada a menos"; confere só 2 das 29 dimensões e não a ordem dos títulos.

## Extensão às 58 páginas

- `planosDoStop` devolve `[]` para `detalhe` e `verso`: falta posicioná-los.
- Legenda das obras de duas telas: a partir de foco + 18 vh a tela B passa por cima dela (invisível hoje porque "Intervalo" é a última parada).
- `marcasDaFileira` gera uma marca por close; o desenho pede uma por trecho de "Detalhes".
- Viagem longa: `carregarJanela` dispara a cada parada atravessada, sem cancelar downloads.
- Resize no meio de uma viagem de navegação cancela a viagem e deixa o visitante entre duas paradas.
- Viagem interrompida pela barra de rolagem só se desfaz depois de 250 ms.
- `criarLinha` com tipo desconhecido gera `NaN` em silêncio; `planosDoStop` falha sem dizer qual parada.
- `larguraPara` sem tolerância: `p03-a` pede 1288 px e baixa a de 2560.
- Cor de acento frágil: `p02-a` tem croma 0,157 contra limiar 0,15 (regenerar pode trocar a tinta de rosa para azul); limiar repetido em `extract.py` e `pincel.js`.
- `docs/closes.md` linha 5 diz "só certeza visual", mas a ligação 53 → Dentro é "boa"; o teste dos closes não exige `tela` inteiro ≥ 0.
- Composição, depois do retorno do Pedro: legenda da parada anterior aparece por instantes; primeira tela de "Intervalo" perto do cabeçalho; ficha do mergulho encosta na pintura em janela quadrada.

## Ajustes de 15/11/2026 (ímã, som, ampliação)

- Ímã: se a barra de rolagem for solta sem o evento chegar à página, o ímã só volta a agir quando o mouse se mexe; um clique cujo alvo seja o `<html>` arma o ímã sem a página ter rolado; espaço com o foco no botão de som também arma.
- Ímã: arrasto real da barra de rolagem e toque real não foram testados (só eventos simulados).
- Ampliação: a classe do cursor "fora da tela" só é recalculada ao mover o mouse; com um close aberto o cursor mostra `zoom-out`, mas o clique só recolhe o close.
- Som: erros do `play()` que não sejam recusa de autoplay são engolidos sem registro; ao ligar pelo botão a música entra em 0,6 s (a subida de 3 s vale só para o primeiro gesto); rótulo de ação junto com `aria-pressed` pode soar como estado duplo em leitor de tela.
- Realce do vulto: um raio e um `filter` novo a cada quadro, mesmo com o mouse parado.
- Gravação de "O Cisne": confirmar os direitos antes de publicar.
- Em janela muito baixa (cerca de 320 px de altura), a legenda não encolhe com a cena e volta a encostar no vulto da tela seguinte: a fonte da legenda deveria acompanhar a altura da janela.
- A música tem grande variação de volume (trechos suaves bem mais baixos que os fortes); se os trechos suaves sumirem em caixas de notebook, aplicar uma compressão leve ao arquivo.

## Conceito de celular

- `resize` encerra a abertura (a barra de endereço do celular dispara `resize`).
- Mergulho em toque paisagem: arrastar rola a página e fecha o mergulho.
- "PORTFÓLIO" cortado na página base do celular.
- `ImageBitmap` mantido na memória depois do envio à GPU.
- Abrir o mergulho só é possível com mouse; falta teclado e toque.
- Música no iPad e no iPhone: `HTMLMediaElement.volume` é somente leitura (fica em 1), então não há a subida gradual de 3 s nem a transição de 0,6 s do botão; a música entra e sai de uma vez. O arquivo já tem volume baixo (cerca de −25,6 LUFS), para soar como fundo mesmo em volume 1.

## Acabamento

- Acessibilidade: nome e subtítulos somem se `background-clip: text` ou a textura falharem (falta `@supports`; vale também para `forced-colors` e impressão); `<dl>` sem `dt`/`dd` na ficha; `alt` repetido nas obras de duas telas; links de paradas fora de foco continuam focáveis; marcas de close focáveis enquanto invisíveis; interface do mergulho sem `role="dialog"`; conferir `alt` de `<img>` sem `src` em leitor de tela.
- Botão "ver com movimento" na versão sem animação (previsto no desenho).
- Entre o início do carregamento e o fim dos `import()` a página fica branca, sem traço e sem teto de tempo.
- Pincel: ritmo de sumiço linear (8 s numa passada, 10 s sobreposta); tinta visível através de tela translúcida na faixa de 1,5 a 3 de distância; halo da luz elíptico. Aguardam as respostas do Pedro no roteiro.
- Pincelada rosa da fileira com opacidade 0,5 fica clara.
- Raycast a cada movimento do ponteiro.
- Falha de carga em `main.js` sem teste nem conferência no navegador.
- Roteiro: `tools/abrir-piloto.sh` não distingue outro programa na mesma porta e sai sem mensagem se o servidor morrer.

## Publicação

- Cabeçalhos de cache ou versão nos módulos: um `config.js` antigo em cache quebra a página depois de uma atualização.
- 129 MB de WebP no histórico do git (84 MB na largura 2560): avaliar qualidade e tamanho da maior largura.
- A capa de 640 px é baixada mais de uma vez sem cache.
- `window.__site` e `?lento` continuam no código de produção.
- Campo `mini` de `images.json` (cerca de 30 KB) nunca é lido.
- `site/vendor/three.module.min.js` teve o import editado à mão (`./three.core.min.js`): registrar num README de vendor; o teste de vendor não pega `import("https://…")` nem confere os alvos do import map.
- Falha de `fetch` de textura fica guardada em cache como rejeição.

## A conferir pelo Pedro (não verificado por agentes)

- O site em Safari, inclusive a pinça no mergulho (implementada por leitura; se o Safari também mandar roda com Ctrl, o zoom pode dobrar).
- Fluidez real num notebook, do topo ao fim.
- A página simples com "Reduzir movimento" ligado.
