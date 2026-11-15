# Pendências deixadas pelo piloto

Achados das revisões do Plano 1, do Plano 2 (extensão às 58 páginas) e das duas rodadas de ajustes de 15/11/2026 que não bloqueiam a validação do site. Cada um está no plano em que deve ser tratado. Itens resolvidos pelo Plano 2 saíram desta lista em 15/11/2026; os resolvidos pela segunda rodada de ajustes saíram em 15/11/2026, ao fim dela (o trilho e `textoVale`, a falha de `fetch` guardada em cache, a troca miniatura → nítida sem esmaecer e a divisão do cartão para `travessia/cartao.js`).

Números de referência ao fim da segunda rodada: `site/js/main.js` com 387 linhas; 143 testes em `node --test tests/*.test.mjs` e 7 em `/usr/bin/python3 -m unittest discover -s tools -p "test_*.py"`, todos passando.

## Arquitetura e testes

- `montarTravessia` continua em `site/js/main.js` (387 linhas): carregamento, luz, pincel e o cartão final já saíram para `site/js/travessia/`, e a decisão do clique para `core/clique.js`, mas a montagem das telas, a paralaxe e o laço do quadro seguem ali.
- Levar a máquina de `texturas` para código testável.
- Testes de integração inexistentes: desmontagem, resize, ciclo do mergulho, roteamento de clique, `irPara`, cache de texturas, orquestração da abertura.
- Módulos de `site/js/travessia/` (carregamento, luz, pincel, cartão) sem teste automático: dependem de DOM e WebGL. `montarCartao` (`travessia/cartao.js`) também não tem teste unitário.
- Testes que não exercitam o produto: `fatorDeLuz` e `revelacao` são gêmeos em JS dos shaders; "config" e "ABERTURA: valores do brief" comparam constantes com elas mesmas.
- `core/vulto.js` (brancura e alfa por distância) espelha o fragment shader de `gl/tela.js`, mas nenhum teste amarra os dois: se o shader mudar, o teste de "um só vulto à frente" continua passando com a conta velha.
- O teste de conteúdo prova "nada a mais", não "nada a menos"; confere só 2 das 29 dimensões e não a ordem dos títulos (a conferência de 15/11 fez a comparação completa por script, fora da suíte).
- Sem asserção direta de `DETALHE` e de `VERSO.altura` em `config.js` (`VISIBILIDADE_DETALHE` passou a ser conferida inteira; de `VERSO.vulto`, o teste confere só o lado).
- O teste de dados reais não afirma `|x| + largura/2 ≤ 3,8` em todas as obras de uma tela; em `planosDoStop`, `3,8 − largura/2` fica negativo para largura > 7,6 e inverte o lado da obra.
- `planosDoStop` (`core/camera.js`) dá `x = NaN` em silêncio para um close sem o argumento `lado`; hoje o único chamador sempre passa o lado. Falta também, em `ladosDosDetalhes`, o comentário que diz que a parada seguinte a um trecho nunca é um close (é o que evita a dependência circular).
- O comentário de `DETALHE`/`VERSO` em `config.js` supõe o último close à direita (o vulto do verso fica em x = −2,2); só um teste trava essa premissa.
- `smoothstep` duplicada em três arquivos (`core/abertura.js`, `core/final.js` e `core/vulto.js`), e `clamp01` em `core/abertura.js` e `core/vulto.js`.
- `com-legenda` é posta em qualquer parada, não só nas obras (os closes a recebem, mas não têm legenda).
- Comentário longo no cabeçalho de `ui/preenchimento.js` (linhas 1 a 3).
- Ao fechar uma ampliação, `ui/mergulho-ui.js` segura em 0 a opacidade das telas mais próximas que `surge[1]`, mas o shader só garante alfa 0 abaixo de `surge[0]`: uma tela entre os dois valores apareceria de uma vez no fim da volta. Nenhuma tela dos dados atuais cai nessa faixa.
- O contrato de `mesh.userData` (`plano`, `perto`, `surge`, `alcance`, `luzNeutra`, `deCostas`, `vulto`) é escrito em três arquivos e lido em quatro, sem um lugar que o descreva.
- `travessia/carregamento.js` sem teste: um teste em Node com `texturas` e `gsap` falsos fixaria que a tela liberada volta à miniatura, que a imagem ampliada nunca é liberada, que uma textura tardia não é aplicada depois de `ativo() === false` e que a troca suave só acontece sobre a miniatura.
- `emFocoParaClique(vh, mesh = null)` (`travessia/cartao.js`) tem dois contratos num só nome: sem malha, responde pela parada em foco; com a malha do vulto do verso, sempre `null`.
- `tests/ima.test.mjs` lê `content.json` por caminho relativo à pasta de onde o teste roda, tem uma asserção repetida e um espaço sobrando. `core/ima.js` compara `vh === origem` sem tolerância. A máquina de estado de `ui/ima.js` (quando a origem é gravada, renovada e apagada) não tem teste automático.
- `ui/som.js`: a guarda de `aoGesto` para evento cujo alvo não é um nó (um `keydown` disparado em `window`) não tem teste; o comentário de cabeçalho tem quebras de linha irregulares.
- `ui/lente.js`: falta um teste com centro em exatamente cursor ± R (continuidade da lente na borda do raio); a caixa e os centros guardados ficam velhos se a altura da fileira mudar sem `resize`; um `blur` da janela não zera o ponteiro, então a lente pode ficar aberta até o próximo movimento.
- `ui/navegacao.js` lê `lista.offsetTop` a cada quadro enquanto a lente se move (uma leitura de leiaute por quadro).
- `core/legenda.js`: o laço do `evitar` (a legenda desce para não cobrir o vulto) não confere o resultado no fim nem tem teste com vários vultos ao mesmo tempo.
- `criarLegendas` lança erro se chamada sem o terceiro argumento; `ampliar()` (`ui/mergulho-ui.js`) falha em silêncio se `destino()` recusar a ampliação.
- Reserva: sem teste do limite de dois downloads com promoção e falha misturadas; dois `carregarJanela` durante um download que falha dão dois `console.error` (já era assim antes da reserva).
- Comentários fora do lugar ou imprecisos: `gl/texturas.js:21` (o comentário de `opcoes` está acima de `urlDe`); `travessia/carregamento.js:115` calcula a maior largura com índice −1 quando a lista está vazia; em `main.js:327`, `som.carregar` e `iniciarReserva` ficam no mesmo `then` (uma falha de um impediria o outro).
- `travessia.css:42`: a margem vertical negativa da folga do acento só funciona porque `.letra` é `inline`; falta um comentário que diga isso.

## Depois da extensão às 58 páginas

- Resize no meio de uma viagem de navegação cancela a viagem e deixa o visitante entre duas paradas.
- Viagem interrompida pela barra de rolagem só se desfaz depois de 250 ms (o `ate` da viagem: duração + 250 ms).
- Viagens encadeadas: `aoPartir` usa o `indiceAtual` do meio do voo; `aoChegar` não dispara se a viagem for zerada antes do primeiro quadro.
- Tecla End durante a abertura pede a capa em outra largura (1280 além da 640); a capa não fica sem imagem (conferido em 15/11).
- `texturas.miniaturas` usa `Promise.all`: uma miniatura que falhe derruba todas e vaza as já criadas (usar `allSettled` e descartar pelo closure).
- Downloads de fundo em curso não são abortados quando a fila é refeita: terminam e, se o arquivo saiu da lista, são soltos ao terminar (no máximo dois). Um download pedido pela janela que reaproveita um download de fundo continua com prioridade baixa (`core/reserva.js:43`).
- Arquivo que baixa mas não decodifica (`createImageBitmap` falha) fica preso na reserva (`gl/texturas.js:40-42`): a entrada deveria ser solta também no erro de decodificação.
- Falha de download: o arquivo sai da reserva, mas no cache de texturas a entrada só sai quando a parada deixa a janela (uma tentativa por aproximação, sem laço). Enquanto isso a tela fica na miniatura.
- Depois de um resize que muda a largura, a fila da reserva é refeita e um arquivo já baixado em outra largura pode ser baixado de novo se a janela voltar a ela.
- Viagem longa (End a partir da capa): as telas do caminho passam na miniatura; só a chegada é nítida (decisão R4 da segunda rodada). Alternativa, se o Pedro pedir: carregar numa largura menor (640) a parada por onde se passa, com o que já está na reserva, e medir a fluidez fora do painel.
- `criarLinha` com tipo desconhecido gera `NaN` em silêncio; `planosDoStop` devolve `[]` para tipo desconhecido sem dizer qual parada.
- Giro final: `uRelevo` cai a 0 de uma vez ao entrar no giro; `luzNeutra` e `deCostas` não são reescritos com uma tela ampliada; o obstáculo do pincel é a caixa envolvente do trapézio (sobra uma cunha sem tinta fora da tela durante o giro).
- Ampliação do verso com zoom alto: a tira da assinatura encosta na borda de baixo.
- Cor de acento frágil: `p02-a` tem croma 0,157 contra limiar 0,15 (regenerar pode trocar a tinta de rosa para azul); limiar repetido em `extract.py` e `pincel.js`.
- `docs/closes.md` linha 5 diz "só certeza visual", mas a ligação 53 → Dentro é "boa"; o teste dos closes não exige `tela` inteiro ≥ 0.
- Composição, depois do retorno do Pedro: legenda da parada anterior aparece por instantes; primeira tela de "Intervalo" perto do cabeçalho (e a primeira tela das obras de duas telas passa sobre "MARCELA DE LUNA" por volta de foco + 15 vh); ficha do mergulho encosta na pintura em janela quadrada; abertura de "Entre Nós" com a imagem inteira à direita (no PDF ela sai pelo topo); "Impermanência" e "Íntima" mais perto do centro para caber na janela.
- Composição, achado na conferência da segunda rodada: os closes da esquerda (por exemplo o 14º e o 16º do primeiro trecho, em 1440×900) chegam ao canto superior esquerdo; o nome já encostava neles, e agora o botão de som (as barras, e o texto "LIGAR O SOM" enquanto o convite aparece) fica por cima da pintura, escuro sobre escuro. Importa porque o botão perde contraste exatamente onde o visitante passa mais depressa.
- Legendas que descem para não cobrir o vulto (decisão R3 da segunda rodada): "Cartografia do Íntimo" fica 33 px abaixo da base da pintura em 1440×900, 62 px em 1024×768 e 69 px em 900×900; "Dúvidei", 29 px em 1024×768 e 36 px em 900×900. Reversível em `core/legenda.js`, se o Pedro preferir outra solução (por exemplo afastar para o lado).

## Ajustes de 15/11/2026 (ímã, som, ampliação, fileira, marcas)

- Ímã: se a barra de rolagem for solta sem o evento chegar à página, o ímã só volta a agir quando o mouse se mexe; um clique cujo alvo seja o `<html>` arma o ímã sem a página ter rolado; espaço com o foco no botão de som também arma.
- Ímã: arrasto real da barra de rolagem, toque real, roda real e trackpad real não foram testados (só eventos simulados); o limiar de 25% foi conferido só com roda simulada.
- Ampliação: a classe do cursor "fora da tela" só é recalculada ao mover o mouse; com um close aberto o cursor mostra `zoom-out`, mas o clique só recolhe o close.
- Ampliação pela linha "DETALHES" (achado na conferência da segunda rodada): ao fechar com Esc ou "voltar", o foco volta ao botão "DETALHES" da legenda, e a barra de espaço, então, amplia a obra de novo em vez de levar à parada seguinte. Passos: em "A Dança é por Ela", clicar em "DETALHES", apertar Esc, apertar a barra de espaço. Esperado: a parada seguinte (como a seta para baixo faz). Visto: a obra ampliada outra vez.
- Ampliação: `fechar()` do pincel ainda deposita um último trecho de tinta ao entrar no mergulho (chamar `tinta.romper()` ao ampliar).
- Linha "DETALHES": o alvo de clique tem cerca de 26 px de altura; a transição de 0,2 s do anel não é desligada com movimento reduzido.
- Fileira: em repouso, a área da barreira de tinta (`.navegacao-barreira`) é maior que a coluna, porque cobre a extensão da lente aberta; a tinta para antes da coluna mesmo quando a lente está fechada.
- Fileira: um clique feito no mesmo quadro de um salto do ponteiro dentro da lente aberta usa o desenho do quadro anterior e pode cair na marca vizinha. Só aconteceu com o ponteiro teletransportado pela ferramenta de conferência; com um mouse de verdade, que passa por todos os pontos, não deve acontecer.
- Fileira: em aparelho sem ponteiro fino (`hover: none`) a fileira fica no formato cheio e não cabe em janela baixa (740×400 mede 492 px).
- Som: erros do `play()` que não sejam recusa de autoplay são engolidos sem registro; ao ligar pelo botão a música entra em 0,6 s (a subida de 3 s vale só para o primeiro gesto); rótulo de ação junto com `aria-pressed` pode soar como estado duplo em leitor de tela.
- Som: sem `.topo-nome` no momento de `criarBotao`, vale a largura de reserva de 9rem; a transição de 0,5 s de `left` também anima as mudanças de largura do nome no resize. `body:has(.mergulho) .som` provavelmente é redundante (há `html.mergulhando`). `navegacao.js` calcula `emFoco(...) !== capa?.id` duas vezes por quadro.
- Pincel: nas quinas dos controles a barreira usa o retângulo alargado, mais contido que a distância euclidiana (lado conservador: um pouco menos de tinta nos cantos). `gl/tinta.js:225`: `uTexel` fica menor que um texel quando o teto de pixels corta o alvo (usar `max(escala, 1) / w`).
- Pincel: telas com opacidade 0 não barram mais a tinta (mudança da segunda rodada); durante a abertura, as telas ainda ocultas do fundo deixam de ser obstáculo. A revisão confirmou que nenhuma pintura visível fica desprotegida.
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
- A reserva de imagens não tem limite próprio de memória: na maior largura ela guarda até cerca de 85 MB de bytes. No celular isso precisa de outra conta.

## Acabamento

- Acessibilidade: nome e subtítulos somem se `background-clip: text` ou a textura falharem (falta `@supports`; vale também para `forced-colors` e impressão); `<dl>` sem `dt`/`dd` na ficha; `alt` repetido nas obras de duas telas; links de paradas fora de foco continuam focáveis; marcas de close focáveis enquanto invisíveis; interface do mergulho sem `role="dialog"`; conferir `alt` de `<img>` sem `src` em leitor de tela.
- Acessibilidade: os dois botões "DETALHES" da fileira têm o mesmo `aria-label`; os 24 closes têm todos `alt="DETALHES"`.
- A fileira contraída cabe em janelas bem mais baixas que antes; no formato cheio (aparelhos sem ponteiro fino) ela não cabe abaixo de cerca de 490 px de altura de janela.
- Botão "ver com movimento" na versão sem animação (previsto no desenho).
- Entre o início do carregamento e o fim dos `import()` a página fica branca, sem traço e sem teto de tempo.
- Depois de cair na página base (perda do contexto WebGL), recarregar volta à capa com a abertura: a posição salva no modo base é descartada (`posicaoRestaurada` exige o mesmo modo). Visto de novo na conferência da segunda rodada.
- Pincel: ritmo de sumiço linear (8 s numa passada, 10 s sobreposta); tinta visível através de tela translúcida na faixa de 1,5 a 3 de distância; halo da luz elíptico. Aguardam as respostas do Pedro no roteiro.
- Pincel: o relevo da tinta num monitor de densidade 1 passa a ser medido a 1 px (antes 2 px), como já era na tela retina; o Pedro confere no monitor dele.
- Pincelada da fileira: em repouso, opacidade 0,45; aberta, 0,5. A rosa fica clara.
- Raycast a cada movimento do ponteiro.
- Falha de carga em `main.js` sem teste nem conferência no navegador.
- Roteiro: `tools/abrir-piloto.sh` não distingue outro programa na mesma porta e sai sem mensagem se o servidor morrer.
- A imagem da pág. 40 tem a borda direita em 3,9 un., cerca de 9 px sob a coluna da fileira em 1440×900.

## Publicação

- Cabeçalhos de cache ou versão nos módulos: um `config.js` antigo em cache quebra a página depois de uma atualização.
- 129 MB de WebP no histórico do git (84 MB na largura 2560): avaliar qualidade e tamanho da maior largura. A reserva baixa, depois da abertura, de 12 MB (largura 640) a 85 MB (maior largura) por visita, conforme a janela; em 1440×900 foram 38,3 MB.
- A capa de 640 px é baixada duas vezes na carga (pelo CSS e pela textura, 235 KB cada); medido em 15/11: 1,61 MB transferidos até a capa chegar (limite: 2 MB).
- `window.__site` e `?lento` continuam no código de produção.
- `site/vendor/three.module.min.js` teve o import editado à mão (`./three.core.min.js`): registrar num README de vendor; o teste de vendor não pega `import("https://…")` nem confere os alvos do import map.

## A conferir pelo Pedro (não verificado por agentes)

- O site em Safari, inclusive a pinça no mergulho (implementada por leitura; se o Safari também mandar roda com Ctrl, o zoom pode dobrar), a lente da fileira, o pulso da marca, o botão de som e a tinta junto aos controles.
- Fluidez real num notebook, do topo ao fim, com a rolagem contínua pelos closes e pelo giro final.
- O traço de tinta no monitor externo de 3440×1440: definição, curva, textura das cerdas e fluidez com tinta viva (a medida em bancada não prova fluidez).
- O ímã com a roda e o trackpad de verdade, inclusive o limiar de 25% e os closes.
- A entrada e a saída da lente e o pulso da marca de destaque vistos em movimento (medidos, não vistos).
- O convite "LIGAR O SOM", a primeira entrada da música e a música ao longo de todo o percurso, inclusive nas viagens longas.
- Arrastar a barra de rolagem no meio de uma viagem longa.
- A página simples com "Reduzir movimento" ligado.
