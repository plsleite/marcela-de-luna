# Pendências deixadas pelo piloto

Achados das revisões do Plano 1 e do Plano 2 (extensão às 58 páginas) que não bloqueiam a validação do site. Cada um está no plano em que deve ser tratado. Itens resolvidos pelo Plano 2 saíram desta lista em 15/11/2026.

## Arquitetura e testes

- `montarTravessia` continua em `site/js/main.js` (431 linhas): carregamento, luz e pincel já saíram para `site/js/travessia/`, e a decisão do clique para `core/clique.js`, mas a montagem das telas, o cartão final, a paralaxe e o laço do quadro seguem ali; avaliar nova divisão.
- Levar a máquina de `texturas` para código testável.
- Testes de integração inexistentes: desmontagem, resize, ciclo do mergulho, roteamento de clique, `irPara`, cache de texturas, orquestração da abertura.
- Módulos de `site/js/travessia/` (carregamento, luz, pincel) sem teste automático: dependem de DOM e WebGL.
- Testes que não exercitam o produto: `fatorDeLuz` e `revelacao` são gêmeos em JS dos shaders; "config" e "ABERTURA: valores do brief" comparam constantes com elas mesmas.
- O teste de conteúdo prova "nada a mais", não "nada a menos"; confere só 2 das 29 dimensões e não a ordem dos títulos (a conferência de 15/11 fez a comparação completa por script, fora da suíte).
- Sem asserção direta de `DETALHE` e `VERSO` em `config.js` (só o `surge` de `VISIBILIDADE_DETALHE` é conferido).
- O teste de dados reais não afirma `|x| + largura/2 ≤ 3,8` em todas as obras de uma tela; em `planosDoStop`, `3,8 − largura/2` fica negativo para largura > 7,6 e inverte o lado da obra.
- O teste de `janelaDeViagem` (0 → 3) não prova que as paradas do meio ficam de fora.
- O teste do trilho não faz varredura de continuidade; `xDaTela` não dá erro explícito se faltar o plano 0 de uma parada.
- `smoothstep` duplicada em três arquivos (`core/abertura.js`, `core/trilho.js` e `core/final.js`), e `clamp01` em `core/abertura.js` e `core/trilho.js`; `textoVale` mora no módulo do trilho, que é de câmera.
- `com-legenda` é posta em qualquer parada, não só nas obras.
- Comentário longo no cabeçalho de `ui/preenchimento.js` (linhas 1 a 3).
- `main.js` com cerca de 430 linhas: `cartao`, `moverCartao` e `emFocoParaClique` caberiam em `travessia/cartao.js`, com o predicado do clique em `core/clique.js` e teste.
- O contrato de `mesh.userData` (`plano`, `perto`, `surge`, `alcance`, `luzNeutra`, `deCostas`) é escrito em dois arquivos e lido em quatro, sem um lugar que o descreva.
- `travessia/carregamento.js` sem teste: um teste em Node com `texturas` e `gsap` falsos fixaria que a tela liberada volta à miniatura, que a imagem ampliada nunca é liberada e que uma textura tardia não é aplicada depois de `ativo() === false`.

## Depois da extensão às 58 páginas

- Resize no meio de uma viagem de navegação cancela a viagem e deixa o visitante entre duas paradas.
- Viagem interrompida pela barra de rolagem só se desfaz depois de 250 ms (o `ate` da viagem: duração + 250 ms).
- Viagens encadeadas: `aoPartir` usa o `indiceAtual` do meio do voo; `aoChegar` não dispara se a viagem for zerada antes do primeiro quadro.
- Tecla End durante a abertura pede a capa em outra largura (1280 além da 640); a capa não fica sem imagem (conferido em 15/11).
- `texturas.miniaturas` usa `Promise.all`: uma miniatura que falhe derruba todas e vaza as já criadas (usar `allSettled` e descartar pelo closure).
- Miniatura → textura nítida troca de uma vez, sem esmaecer.
- Downloads em curso não são cancelados quando a parada sai da janela: a textura é descartada ao chegar.
- `criarLinha` com tipo desconhecido gera `NaN` em silêncio; `planosDoStop` devolve `[]` para tipo desconhecido sem dizer qual parada.
- Giro final: `uRelevo` cai a 0 de uma vez ao entrar no giro; `luzNeutra` e `deCostas` não são reescritos com uma tela ampliada; o obstáculo do pincel é a caixa envolvente do trapézio (sobra uma cunha sem tinta fora da tela durante o giro).
- Ampliação do verso com zoom alto: a tira da assinatura encosta na borda de baixo.
- Textos das paradas só valem com o trilho em 0 (`TRILHO_FOLGA_TEXTO`): "DETALHES" entra só cerca de 2 vh antes do foco do primeiro close; aguarda a resposta do Pedro no roteiro.
- Cor de acento frágil: `p02-a` tem croma 0,157 contra limiar 0,15 (regenerar pode trocar a tinta de rosa para azul); limiar repetido em `extract.py` e `pincel.js`.
- `docs/closes.md` linha 5 diz "só certeza visual", mas a ligação 53 → Dentro é "boa"; o teste dos closes não exige `tela` inteiro ≥ 0.
- Composição, depois do retorno do Pedro: legenda da parada anterior aparece por instantes; primeira tela de "Intervalo" perto do cabeçalho (e a primeira tela das obras de duas telas passa sobre "MARCELA DE LUNA" por volta de foco + 15 vh); ficha do mergulho encosta na pintura em janela quadrada; abertura de "Entre Nós" com a imagem inteira à direita (no PDF ela sai pelo topo); "Impermanência" e "Íntima" mais perto do centro para caber na janela.
- Legenda de "Cartografia do Íntimo" fica a cerca de 16 px do close que aparece atrás em 1280×700 (cerca de 29 px em 1440×900): não encosta, mas é o caso mais justo.

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
- "PORTFÓLIO" cortado na página base (no celular e também no computador, quando a travessia cai na página base).
- `ImageBitmap` mantido na memória depois do envio à GPU.
- Abrir o mergulho só é possível com mouse; falta teclado e toque.
- Música no iPad e no iPhone: `HTMLMediaElement.volume` é somente leitura (fica em 1), então não há a subida gradual de 3 s nem a transição de 0,6 s do botão; a música entra e sai de uma vez. O arquivo já tem volume baixo (cerca de −25,6 LUFS), para soar como fundo mesmo em volume 1.

## Acabamento

- Acessibilidade: nome e subtítulos somem se `background-clip: text` ou a textura falharem (falta `@supports`; vale também para `forced-colors` e impressão); `<dl>` sem `dt`/`dd` na ficha; `alt` repetido nas obras de duas telas; links de paradas fora de foco continuam focáveis; marcas de close focáveis enquanto invisíveis; interface do mergulho sem `role="dialog"`; conferir `alt` de `<img>` sem `src` em leitor de tela.
- Acessibilidade: os dois botões "DETALHES" da fileira têm o mesmo `aria-label`; os 24 closes têm todos `alt="DETALHES"`.
- A fileira não cabe inteira abaixo de cerca de 490 px de altura de janela.
- Botão "ver com movimento" na versão sem animação (previsto no desenho).
- Entre o início do carregamento e o fim dos `import()` a página fica branca, sem traço e sem teto de tempo.
- Depois de cair na página base (perda do contexto WebGL), recarregar volta à capa com a abertura: a posição salva no modo base é descartada (`posicaoRestaurada` exige o mesmo modo).
- Pincel: ritmo de sumiço linear (8 s numa passada, 10 s sobreposta); tinta visível através de tela translúcida na faixa de 1,5 a 3 de distância; halo da luz elíptico. Aguardam as respostas do Pedro no roteiro.
- Pincelada rosa da fileira com opacidade 0,5 fica clara.
- Raycast a cada movimento do ponteiro.
- Falha de carga em `main.js` sem teste nem conferência no navegador.
- Roteiro: `tools/abrir-piloto.sh` não distingue outro programa na mesma porta e sai sem mensagem se o servidor morrer.
- O trilho também vale durante uma viagem longa (desvio lateral de até 2,4 un. no meio do voo); avaliar com o retorno do Pedro.
- A imagem da pág. 40 tem a borda direita em 3,9 un., cerca de 9 px sob a coluna da fileira em 1440×900.

## Publicação

- Cabeçalhos de cache ou versão nos módulos: um `config.js` antigo em cache quebra a página depois de uma atualização.
- 129 MB de WebP no histórico do git (84 MB na largura 2560): avaliar qualidade e tamanho da maior largura.
- A capa de 640 px é baixada duas vezes na carga (pelo CSS e pela textura, 235 KB cada); medido em 15/11: 1,61 MB transferidos até a capa chegar (limite: 2 MB).
- `window.__site` e `?lento` continuam no código de produção.
- `site/vendor/three.module.min.js` teve o import editado à mão (`./three.core.min.js`): registrar num README de vendor; o teste de vendor não pega `import("https://…")` nem confere os alvos do import map.
- Falha de `fetch` de textura fica guardada em cache como rejeição.
- Com as miniaturas, essa falha de `fetch` em cache deixa uma pintura borrada em foco até ela sair da janela; tratar antes de publicar.

## A conferir pelo Pedro (não verificado por agentes)

- O site em Safari, inclusive a pinça no mergulho (implementada por leitura; se o Safari também mandar roda com Ctrl, o zoom pode dobrar).
- Fluidez real num notebook, do topo ao fim, com a rolagem contínua pelos closes e pelo giro final.
- O ímã nos closes com a roda e o trackpad de verdade.
- Arrastar a barra de rolagem no meio de uma viagem longa.
- A música ao longo de todo o percurso, inclusive nas viagens longas.
- A página simples com "Reduzir movimento" ligado.
