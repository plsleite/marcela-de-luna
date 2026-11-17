# Medição do pincel com mouse de alta taxa (16/11/2026)

O Pedro relatou que, com um mouse de jogo (1.000 posições por segundo ou mais), a pincelada arrasta atrás do cursor quando ele mexe o mouse depressa, no Safari e no Chrome, na tela retina e no monitor de 3440×1440; com o trackpad, não. Este documento registra a medição feita antes de qualquer correção.

## A hipótese

O site trata cada posição do ponteiro na hora em que ela chega (tinta, raio contra as telas, letras dos títulos). Com muitas posições por quadro, esse trabalho encheria o quadro, os movimentos fariam fila e o traço mostraria onde o mouse estava alguns quadros atrás.

## Como foi medido

Ferramenta: `tools/medir-pincel.sh` prepara, na cópia de conferência (fora de `site/`), a página `medir.html`: o mesmo site, com um relógio controlado e contadores em volta de `tinta.pintar`, das barreiras (`forca`), de `palco.telaSob` e de `preenchimento.tocar` (`tools/medicao/`). No console, `await __medir.rodar({ taxa, agrupar })` simula um trajeto rápido e curvo (até cerca de 4.100 px/s) por 300 quadros a 60 por segundo e devolve, por quadro (`__medir.ultimo.porQuadro`) e em média: posições e eventos que chegaram, tempo em cada trabalho, tempo total de script e a distância entre o último carimbo e a última posição do ponteiro. "Solto" é um evento por posição; "agrupado" é um evento por quadro com as posições em `getCoalescedEvents` (como o Chrome entrega). Janela de 1440×900, densidade 1, no painel de navegador do aplicativo (motor do Chrome), neste MacBook.

## Números (médias por quadro, em milissegundos; um quadro a 60 por segundo dura 16,7 ms)

Na parada "Pesquisa Artística" (título com letras que se pintam, duas telas, parágrafos):

| posições por segundo | entrega | posições por quadro | script total | só os eventos | tinta (com barreiras) | raio | letras | ponta atrás do cursor (média / pior) | largura média do traço |
|---|---|---|---|---|---|---|---|---|---|
| 125 | solto | 2 | 2,2 | 0,15 | 0,06 | 0,01 | 0,07 | 13,7 px / 20,0 px | 30 px |
| 125 | agrupado | 2 | 2,0 | 0,06 | 0,04 | 0,00 | 0,01 | 13,7 px / 20,0 px | 30 px |
| 1.000 | solto | 17 | 2,5 | 0,34 | 0,06 | 0,02 | 0,16 | 4,3 px / 8,1 px | 30 px |
| 1.000 | agrupado | 17 | 2,0 | 0,06 | 0,04 | 0,00 | 0,01 | 4,3 px / 8,1 px | 30 px |
| 8.000 | solto | 133 | 2,7 | 1,15 | 0,06 | 0,11 | 0,49 | 3,2 px / 6,3 px | 45 px |
| 8.000 | agrupado | 133 | 1,7 | 0,09 | 0,06 | 0,00 | 0,01 | 3,2 px / 6,3 px | 45 px |

Na capa (sem letras para pintar), o script total ficou entre 0,9 e 1,5 ms por quadro em todos os casos, e os eventos entre 0,04 e 0,60 ms. Com o instante dos eventos arredondado para milissegundos inteiros (como o Safari informa), os números não mudaram.

Quadros isolados de 17 a 31 ms apareceram em todas as taxas, inclusive a 125: não dependem do mouse (são da pintura de uma letra ou da coleta de lixo do navegador).

## O que a medição prova

- **A hipótese não se confirmou.** O trabalho por posição é pequeno: mesmo a 8.000 posições por segundo, uma a uma, os três trabalhos somam cerca de 1,2 ms num quadro de 16,7 ms. De 125 para 8.000 o script cresce 0,5 ms por quadro. Não há como isso formar fila.
- **A ponta do traço fica mais perto do cursor com o mouse rápido, não mais longe.** O traço vai sempre até o meio do último trecho entre duas posições; com 125 posições por segundo o trecho é longo (14 px de distância em média, 20 no pior caso); com 1.000 ou mais, é curto (3 a 8 px).
- **Um defeito de aparência acima de 1.000 posições por segundo.** A velocidade do gesto é calculada com um intervalo mínimo de 1 ms entre posições. A 8.000 por segundo o intervalo real é 0,125 ms, a velocidade sai até 8 vezes menor e o traço rápido deixa de afinar e secar: fica com 45 px de largura média em vez de 30. Não é atraso, mas é uma diferença no desenho para quem tem esse tipo de mouse. A 1.000 por segundo o traço sai igual ao de um mouse comum.

## O que a medição não prova

- **O que o navegador faz por conta própria a cada movimento real** (descobrir o que está sob o cursor, reavaliar o `:hover`): movimentos simulados não passam por isso.
- **O Safari**: a simulação rodou só no motor do Chrome.
- **O atraso entre o desenho e a tela.** O cursor é desenhado pelo sistema, direto na tela; o que a página desenha passa pelo navegador e pelo compositor e chega um a três quadros depois (17 a 50 ms). A 4.000 px/s, cada quadro de espera são 67 px de distância entre o cursor e a ponta do traço; a 10.000 px/s, 167 px. Esse atraso existe com qualquer mouse e com o trackpad, cresce com a velocidade da mão e não pode ser medido de dentro da página.
- **O custo de desenho na placa de vídeo** na tela retina e em 3440×1440 (não depende da taxa do mouse: o número de carimbos por quadro é o mesmo).

## Leitura

O mais provável é que o arrasto que o Pedro vê seja o atraso entre o desenho e a tela, que fica visível porque o mouse de jogo atravessa a tela muito mais depressa que o trackpad, e não a taxa de posições. Para confirmar com o mouse dele, `sh tools/medir-ao-vivo.sh` abre no Safari e no Chrome a página `ao-vivo.html`, com um painel que mostra, nos quadros em que o mouse se moveu: o intervalo entre quadros, os movimentos e as posições por quadro, a idade de cada movimento ao ser tratado (se houver fila, esse número passa muito de um quadro), o tempo dos três trabalhos, a distância da ponta do traço ao cursor e a velocidade máxima. Se os quadros continuarem no ritmo normal e a idade ficar abaixo de um quadro, não há fila: o que resta é o atraso da tela.

## Medição ao vivo com o mouse do Pedro (16/11/2026)

Quatro capturas do painel de `ao-vivo.html`, na capa, mexendo o mouse depressa (300 quadros com movimento em cada uma):

| navegador | intervalo entre quadros (média / pior) | movimentos por quadro | posições por quadro (média / máx.) | idade do movimento (média / pior) | tinta + raio + letras (média / pior) | ponta atrás do cursor (média / pior) | velocidade máxima |
|---|---|---|---|---|---|---|---|
| Chrome | 4,5 ms / 22,7 ms | 1 | 1,0 / 3 | 5,4 ms / 12,3 ms | 0,1 ms / 0,4 ms | 9,5 px / 29,9 px | 19.999 px/s |
| Chrome | 4,3 ms / 6,2 ms | 1 | 1,0 / 1 | 6,3 ms / 11,6 ms | 0,1 ms / 0,3 ms | 17,9 px / 101,4 px | 45.365 px/s |
| Safari | 16,8 ms / 53,0 ms | 1 | 2,0 / 3 | 6,2 ms / 102,0 ms | 0,2 ms / 2,0 ms | 16,5 px / 64,9 px | 12.491 px/s |
| Safari | 16,7 ms / 18,0 ms | 1 | 2,0 / 3 | 19,5 ms / 106,0 ms | 0,1 ms / 1,0 ms | 16,4 px / 51,4 px | 10.339 px/s |

O que isso mostra:

- **Não chegam mil posições por segundo à página.** O Chrome entrega um movimento por quadro com uma posição (cerca de 230 por segundo, num monitor de cerca de 240 quadros por segundo); o Safari, um movimento por quadro com duas posições (cerca de 120 por segundo). O sistema e o navegador já juntam as posições do mouse antes de entregá-las. Processar o ponteiro uma vez por quadro não mudaria nada: já é assim.
- **O trabalho do site é desprezível**: 0,1 a 0,2 ms por quadro. Os quadros seguem no ritmo da tela. Não há fila.
- **O que distingue o mouse é a velocidade**: 10.000 a 45.000 px/s (a tela inteira em um décimo de segundo). Entre uma posição e a seguinte o cursor anda de 90 a 200 px.
- **A parte do atraso que é do site**: o traço vai só até o meio do último trecho entre duas posições (para a curva não fazer quinas) e só fecha até o cursor depois de 90 ms com o mouse parado (`FECHO`, `site/js/gl/tinta.js`). Com trechos de 90 a 200 px, a ponta fica de 50 a 100 px atrás no pior caso, e, quando o mouse freia de repente, esse pedaço só aparece 90 ms depois. Com o trackpad os trechos são curtos e o dedo desacelera aos poucos: o mesmo mecanismo não se vê.
- **A parte que não é do site**: cada movimento chega à página com 5 a 20 ms de idade, e o desenho ainda leva um ou mais quadros até a tela. A 12.000 px/s no Safari, cada quadro de espera são cerca de 200 px.
- O defeito da largura acima de 1.000 posições por segundo não aparece neste computador (a página nunca recebe tantas); pode aparecer em outros sistemas.

## Comparação com o trackpad (17/11/2026)

O Pedro repetiu a medição ao vivo com o trackpad, que para ele nunca atrasa, por mais rápido que mexa:

| navegador | intervalo entre quadros | posições por quadro | idade do movimento (média / pior) | ponta atrás do cursor (média / pior) | velocidade máxima |
|---|---|---|---|---|---|
| Chrome | 4,4 ms | 1,0 | 9,0 ms / 15,0 ms | 15,2 px / 58,3 px | 23.879 px/s |
| Safari | 16,7 ms | 1,9 | 11,3 ms / 19,0 ms | 21,1 px / 72,3 px | 9.568 px/s |

**A comparação não confirma a leitura anterior.** Pelo painel, o trackpad chega às mesmas velocidades do mouse (9.500 a 24.000 px/s contra 10.000 a 45.000) e a ponta do traço fica à mesma distância do cursor (15 a 21 px em média, 58 a 72 no pior caso). A explicação "o mouse é mais rápido" não se sustenta: os números que o painel resume são iguais nos dois aparelhos, e mesmo assim só o mouse parece atrasar.

Continua de pé: não há fila, a página recebe um movimento por quadro e gasta 0,1 a 0,2 ms com ele. Cai: a velocidade como diferença entre os aparelhos. A diferença está em algo que as médias do painel não mostram (o ritmo em que as posições chegam, a freada, as viradas de direção). Por isso o painel ganhou uma gravação: as teclas M (mouse) e T (trackpad) gravam 6 s do gesto, posição a posição e quadro a quadro, e baixam `pincel-mouse-….json` e `pincel-trackpad-….json` para comparação.

## Gravação do gesto no Chrome (17/11/2026)

Duas gravações de 6 s no Chrome (janela de 1720×1289, densidade 1, quadros a cada 4,2 ms), uma com o mouse e uma com o trackpad:

- **As posições chegam no mesmo ritmo nos dois aparelhos**: 120 por segundo (uma a cada 8,3 ms, quadro sim, quadro não), sem agrupamento. O mouse de 1.000 Hz não entrega mais posições que o trackpad.
- **Velocidades parecidas** nesta gravação (mediana de 1.200 px/s no mouse e 1.900 no trackpad; 95% abaixo de 4.200 e 5.200).
- **A idade dos movimentos é a diferença.** No trackpad, cada movimento é tratado de 5 a 10 ms depois de acontecer, do começo ao fim. No mouse, no primeiro segundo e meio do gesto a idade cresce sem parar (22, 40, 50, 72, 78, 91 e até 107 ms, medida a cada 250 ms) e de repente volta a 3 ms, com um salto de 109 ms no relógio das posições; nos 4 s seguintes fica em 5 a 7 ms. Enquanto a idade cresce, as posições continuam chegando uma a cada 8,3 ms, nenhuma agrupada, e os quadros seguem a cada 4,2 ms.

Leitura: existe uma fila, mas ela se forma antes de as posições chegarem à página (no sistema ou no navegador), não no trabalho do site, que continua em 0,1 ms por quadro. Com 100 ms de idade a 3.000 px/s, o traço fica 300 px atrás do cursor: é o arrasto. O que esta gravação não diz: se a fila se forma por causa da página (o desenho a 240 quadros por segundo ocupando o navegador) ou em qualquer página com esse mouse, nem se ela volta a cada recomeço do gesto. Para separar as duas coisas, `controle.html` traz o mesmo painel numa página em branco, e a gravação passou a durar 20 s.

## Página de controle no Chrome (17/11/2026)

Gravações de 20 s na página em branco (`controle.html`, sem o site), com pausas no gesto:

- **Mouse**: a cada recomeço do movimento depois de uma pausa (quatro vezes em 20 s), a idade dos movimentos sobe em menos de um segundo até cerca de 100 ms (picos de 103, 104, 102 e 104 ms) e então volta de uma vez a 4 a 6 ms, onde fica enquanto o movimento continua. As posições chegam sempre a 120 por segundo, uma por vez, e os quadros a cada 4,2 ms.
- **Trackpad**: 4 a 9 ms do começo ao fim, com as mesmas pausas e velocidades até maiores.

**Conclusão: o atraso não é do site.** Ele aparece igual numa página em branco, só com o mouse e só no primeiro segundo de cada gesto: os movimentos já chegam atrasados ao navegador (ou saem atrasados dele) antes de qualquer código da página. O site desenha cada posição no mesmo quadro em que a recebe; não tem como desenhar uma posição que ainda não recebeu. Faltam as gravações do Safari, mas o painel do Safari já tinha mostrado o mesmo sinal com o mouse (idade de até 102 e 106 ms) e não com o trackpad (19 ms no pior caso).
