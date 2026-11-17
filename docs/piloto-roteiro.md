# Roteiro do piloto

Este roteiro é para você, Pedro. Ele diz como abrir o piloto, o que experimentar e o que você precisa me dizer para o trabalho continuar. Não precisa saber programar.

Desde 15/11/2026 o site tem as 58 páginas do PDF, na ordem do PDF: a capa, a Pesquisa Artística, a abertura de A Bailarina e as suas 20 obras, o primeiro trecho de "Detalhes" (16 closes), a abertura de Entre Nós e as suas 9 obras, o segundo trecho de "Detalhes" (8 closes) e o verso da tela com a assinatura. Os passos das seções 1 a 6 foram escritos quando o piloto tinha só as seis primeiras páginas; eles continuam valendo, e a seção "O que entrou em 15/11/2026: as 58 páginas", logo abaixo, diz o que experimentar no resto. Os ajustes da segunda rodada, também de 15/11/2026, estão em "O que mudou na segunda rodada (15/11/2026)"; eles valem por cima de todas as seções. Os da terceira rodada estão em "O que mudou na terceira rodada (15/11/2026)" e valem por cima de tudo, inclusive da segunda rodada.

## O que mudou em 15/11/2026 (ajustes que você pediu)

Estas mudanças valem por cima do que os passos abaixo descrevem.

- **Ampliar a capa e os recortes.** Clicar na pintura da capa, nos dois recortes de "Pesquisa Artística" e no recorte de "A Bailarina" também amplia a imagem. Nesses casos não aparece legenda, só o botão "voltar".
- **Clicar fora fecha.** Com uma tela ampliada, clicar em qualquer ponto fora dela faz o mesmo que "voltar".
- **Ímã.** Quando você para de rolar, a página desliza sozinha até o ponto ideal da parada mais próxima. Rolar de novo interrompe na hora. (Mudou na segunda rodada: agora o ímã segue o sentido da rolada; veja "O que mudou na segunda rodada".)
- **Tela seguinte quase branca.** A tela que vem depois aparece só como um vulto claro. Ao passar o mouse, ela ganha um pouco de cor; clicar leva até ela.
- **Legenda ao lado da base da pintura**, como etiqueta de museu.
- **Música.** Um botão discreto de som fica no canto superior direito, e a música entra no primeiro clique ou tecla. (Mudou na segunda rodada: o botão passou para o canto esquerdo, ao lado do nome, com o convite "LIGAR O SOM".)

Perguntas novas: o ímã puxa no tempo certo, cedo demais ou tarde demais? O vulto está claro o bastante? A legenda ficou bem ao lado da base?

## O arrasto do pincel com o mouse de jogo (16 e 17/11/2026)

Você relatou que, com o mouse de jogo, a pincelada arrasta atrás do cursor. Medi antes de mexer, e **o site não mudou**: o pincel está exatamente como você aprovou. O relato completo, com todos os números, está em `docs/2026-11-16-medicao-do-pincel.md`.

O que as medições mostraram:

- O site gasta 0,1 a 0,2 ms por quadro com o ponteiro e desenha cada posição no mesmo quadro em que a recebe.
- Com o mouse, no monitor externo, as posições chegam ao navegador com até 105 ms de atraso no começo de cada gesto. Isso acontece igual numa página em branco, sem o site. Com o trackpad não acontece nunca.
- Você observou que na tela retina o mesmo mouse não atrasa.

Ou seja: a causa está na combinação mouse + monitor externo neste Mac, antes de o movimento chegar à página. O que vale experimentar, um item de cada vez, olhando a página de controle (`sh tools/medir-ao-vivo.sh` abre as páginas; a linha "idade do movimento" do painel deve ficar abaixo de 20 ms):

1. Em Ajustes do Sistema, Telas, baixar a taxa de atualização do monitor externo (para 120 ou 60 Hz) e repetir.
2. Fechar o programa da Logitech (G HUB) e repetir.
3. Se o mouse for sem fio, ligar pelo cabo ou trocar o receptor de porta, e repetir.
4. Experimentar outro mouse no monitor externo.

O que não pôde ser testado: a tela retina com gravação (só há a sua observação a olho), outros computadores e outros mouses. Se um visitante com um equipamento parecido notar o arrasto, a explicação provável é a mesma.

## O que mudou na terceira rodada (15/11/2026)

São duas mudanças vindas das suas respostas à segunda rodada e uma pedida por você em seguida (o traço na tela retina, passo 11). Elas valem por cima de todas as outras seções. Abra o site como na seção 1 e siga os passos na ordem.

### Suas respostas à segunda rodada

Registro aqui o que você respondeu, uma linha por pergunta.

- **Limiar do ímã** (pergunta 1): está bom.
- **Formato da lente** (pergunta 2): está bom; fica pendente perguntar à Marcela se ela quer alguma alteração.
- **O convite do som** (pergunta 3): no MacBook de 14" o convite ficava sobre a pintura da capa, e faltava ali o fundo translúcido (passos 1 e 2 abaixo).
- **A marca de destaque** (pergunta 4): está bom.
- **A linha "DETALHES"** (pergunta 5): está bom.
- **O lado dos closes** (pergunta 6): está bom.
- **As legendas deslocadas** (pergunta 7): está bom.
- **A viagem longa** (pergunta 8): fica como está, por ora.
- **O fundo atrás do nome e do botão** (pergunta 9): fica bem, mas faltava no botão de som na capa (passo 2 abaixo).
- **O que só você podia conferir:** o traço no monitor externo, a fluidez, o ímã com a roda, a lente, o pulso da marca e o Safari foram conferidos por você, sem problema; a música ao longo do site ficou sem resposta registrada.

### Os passos

1. **O convite do som acima da pintura da capa.** No MacBook de 14", recarregue a página no topo e espere a abertura terminar. O texto "LIGAR O SOM" deve ficar inteiro sobre o branco, acima do canto superior esquerdo da pintura, sem encostar nela. A pintura ficou um pouco menor (2%) e o alto dela desceu (cerca de 16 px nessa janela); a borda de baixo ficou onde estava. "PORTFÓLIO", o nome, o ano, o contato e o rodapé continuam alinhados com a pintura, e as pinceladas da abertura cobrem a pintura inteira.
2. **O fundo do botão na capa.** Ainda na capa, olhe o botão de som. Ele tem agora o mesmo fundo branco translúcido que já tinha fora da capa; sobre o branco, o fundo não aparece. Se você deixar a janela bem baixa, a pintura sobe até o botão, e o fundo mantém o convite legível sobre ela.
3. **O close abre como antes.** Vá a "A Dança é por Ela", pela fileira de marcas na borda direita (passe o mouse para ver o título e clique) ou rolando até a obra. Clique na pintura para ampliá-la e, com ela ampliada, clique na marca de destaque. O close cresce a partir da marca e ocupa a janela, como antes; o cursor é a lupa com o sinal de menos.
4. **Aproximar o close.** Com o close aberto, gire a roda para cima (ou faça a pinça no trackpad) com o ponteiro sobre um detalhe fora do centro. A imagem aproxima em torno do ponteiro: o detalhe sob ele não sai do lugar. O zoom vai até 6 vezes, como na tela ampliada, e o cursor vira a mãozinha.
5. **Arrastar o close.** Com o close aproximado, arraste a imagem. Ela acompanha o ponteiro, e o cursor vira a mão fechada durante o arrasto. Arraste até o fim em cada direção: a borda da imagem para na borda da janela. Enquanto a imagem for mais estreita (ou mais baixa) que a janela, ela fica centrada nesse sentido, com branco dos lados, e não anda nele; aproxime mais para que ela passe da janela. Soltar depois de um arrasto não fecha o close.
6. **Recolher pelo clique.** Com o close aproximado, clique sem arrastar. Ele volta à marca a partir do zoom e da posição em que estava, sem salto, e a tela ampliada continua aberta. Abra o close de novo: ele começa sem zoom.
7. **Recolher pelo Esc.** Abra o close, aproxime e aperte Esc. O close recolhe e a tela ampliada continua aberta. Um segundo Esc fecha a tela ampliada.
8. **Recolher pela roda.** Abra o close sem aproximar e role a roda para baixo. O close recolhe, a tela ampliada continua aberta e a página não rola. Se você tinha aproximado o close e afasta até o zoom 1 no mesmo gesto, ele não recolhe: é preciso parar e rolar para baixo de novo, como na tela ampliada.
9. **Mudar o tamanho da janela.** Com o close aproximado, mude o tamanho da janela. A imagem não sai da janela: onde ela é maior que a janela, a borda continua na borda da janela; onde é mais estreita, ela fica centrada, com branco dos lados.
10. **A tela ampliada não mudou.** Feche o close e confira na tela ampliada o zoom, o arrasto e as saídas de sempre (clique fora, "voltar", Esc e roda para baixo).
11. **O traço na tela do MacBook.** Na tela do próprio notebook (não no monitor externo), passe o mouse devagar e depois rápido no fundo branco, de perto. As bordas das cerdas devem estar mais nítidas que antes; a largura do traço e o desenho das cerdas (as listras claras e escuras, as falhas, as bordas ralas) são os mesmos. Pinte bastante e role pelo site com a tinta ainda viva: a rolagem e o movimento das telas devem continuar fluidos. No monitor externo nada muda.

### O que eu medi

Medidas no painel de navegador do meu ambiente, com a abertura terminada. A "folga" é a distância entre a linha de base do texto "LIGAR O SOM" e o alto da pintura da capa; positiva quando o texto fica acima da pintura.

- **1512×828 (o MacBook de 14"):** antes, −5,8 px (o texto ficava sobre a pintura); agora, 10 px. O pedido era pelo menos 10 px.
- **1440×900:** antes, 7 px; agora, 24 px. O pedido era pelo menos 10 px.
- **1280×700:** antes, −8 px; agora, 6 px. O pedido era pelo menos 5 px. Nessa janela o fundo do botão cobre cerca de 4 px do alto do canto da pintura.
- **A borda de baixo da pintura e "PORTFÓLIO".** Ficaram no mesmo lugar de antes nas três janelas (791, 848 e 669 px).
- **O close.** Com a imagem maior que a janela, o ponto sob o ponteiro ficou no mesmo lugar ao aproximar e afastar, pela roda e pela roda com Ctrl (a pinça do Chrome), com erro abaixo de 0,1 px. No zoom 6 o arrasto parou exatamente nas quatro bordas da janela. Enquanto a imagem ainda é mais estreita que a janela, ela fica centrada na horizontal, como a tela ampliada; aí só a altura acompanha o ponteiro.
- **O traço na tela retina.** Com densidade 2 emulada numa janela de 1512×860, o alvo da tinta passou de 1512×860 para 3024×1720 pontos, e a textura das cerdas de 64×40 para 128×80. No mesmo trajeto simulado, a largura do traço ficou igual (diferenças de até 1,5 px, dentro do borrão que a resolução de antes deixava nas bordas), a quantidade de tinta também (diferença abaixo de 0,5%), e a energia das bordas, que mede a nitidez, ficou cerca de 3,3 vezes maior. A textura nova, reduzida de volta a 64×40, é idêntica à de antes. Em densidade 1 o alvo, a textura e o relevo são os mesmos de antes, e a imagem do mesmo trajeto diferiu no máximo em 1/255 (a perda de opacidade entre um quadro e outro). Tinta só no branco, nunca sobre pintura; nenhum erro no console.
- **O custo da tinta na tela retina.** Numa bancada separada, que só reproduz as duas passadas de tela cheia da tinta (perda e exibição) em meia precisão, num canvas de 3024×1720, a mediana foi de 1,27 ms por quadro com o alvo de antes (1512×860) e de 1,82 ms com o novo (3024×1720): cerca de 0,55 ms a mais, num quadro de 16,7 ms. A memória dos dois alvos passou de cerca de 21 MB para 83 MB. Isso não prova fluidez: a bancada não inclui os carimbos nem o resto da cena, mede a placa do meu ambiente e não a do seu MacBook, e a densidade 2 foi só emulada. Quem decide é o passo 11.

O pedido dizia y −0,03; com esse valor a folga ficou em 7,2 px em 1512×828 e 3 px em 1280×700, abaixo do exigido. Por isso a pintura ficou em y −0,05: a borda de baixo não se mexe e toda a folga se abre em cima.

### O que só você pode conferir

1. **O convite na capa do MacBook de 14".** Veja se o texto "LIGAR O SOM" fica bem acima da pintura, com a folga medida acima.
2. **A pinça no Safari.** No Safari a pinça chega por outro caminho; eu não pude testá-la. Aproxime e afaste o close com a pinça do trackpad e veja se o detalhe sob o ponteiro fica no lugar.
3. **O trackpad de verdade.** Eu usei roda e arrasto simulados. Veja se aproximar, arrastar e recolher o close pelo trackpad parecem naturais.
4. **O traço na tela do MacBook** (passo 11). Eu só emulei a densidade 2. Veja se as cerdas ficaram mais nítidas sem mudar de desenho e se a rolagem continua fluida com tinta viva.
5. **A troca de monitor.** Abra o site num monitor, pinte um pouco e arraste a janela para o outro (do MacBook para o externo e de volta). Em cada um, as pinturas, os textos e o traço devem continuar nítidos, sem a página sair da parada em que estava. Eu só simulei a troca; não tenho dois monitores.

## O que mudou na segunda rodada (15/11/2026)

Estas são as doze mudanças que você pediu depois de usar o site com as 58 páginas. Elas valem por cima do que as seções seguintes descrevem; onde um passo antigo ficou falso, ele traz uma linha apontando para cá. Abra o site como na seção 1 e siga os passos na ordem: eles acompanham o caminho do topo ao fim.

### Os passos

1. **O botão de som na capa.** Recarregue a página no topo e espere a abertura terminar. No canto superior esquerdo, onde o nome fica nas outras paradas, você deve ver três barras baixas ondulando devagar e, à direita delas, o texto "LIGAR O SOM", na mesma letra do nome. Nenhuma janela pede nada.
2. **O botão de som fora da capa.** Role até a Pesquisa Artística. O nome "MARCELA DE LUNA" aparece no canto, e o botão desliza em meio segundo para a direita do nome, sem salto. Volte à capa (Home): ele desliza de volta para a margem.
3. **A música.** Clique em qualquer ponto vazio. A música começa, o texto "LIGAR O SOM" some em pouco mais de meio segundo e ficam só as barras, agora tocando. Clique no botão: o som desliga, as barras param baixas e o convite não volta. Recarregue: continua sem convite, porque a escolha ficou guardada. Clique no botão de novo para religar.
4. **A fileira contraída.** Olhe a borda direita: a fileira de marcas agora é uma coluna curta de traços finos, mais ou menos a metade da altura de antes. A marca da parada atual continua mais comprida e na sua cor.
5. **A lente da fileira.** Leve o mouse até a fileira. As marcas perto do ponteiro crescem até o tamanho de antes e se afastam umas das outras, como sob uma lupa; a marca sob o ponteiro não sai do lugar. Suba e desça devagar: a lente acompanha sem tremer. Tire o mouse: a fileira volta ao repouso em um quarto de segundo. Clique numa marca com a lente aberta: a câmera viaja até a parada escolhida.
6. **O ímã com rolada curta.** Com "Foyer de la Danse" em foco, dê uma rolada curta para baixo (cerca de um quarto do caminho até a obra seguinte) e solte. O ímã deve levar adiante, a "A Dança é por Ela". Uma rolada menor que isso devolve a "Foyer". Faça o mesmo para cima. Entre dois closes a rolada que avança é mais curta em distância, porque os closes ficam mais perto um do outro (45 vh em vez de 100 vh), mas a fração continua um quarto do caminho.
7. **A tinta longe dos controles.** Passe o pincel devagar em volta do nome, do botão de som (com e sem o convite), da fileira e da linha "DETALHES" de uma legenda. A tinta deve parar antes de cada um, sem deixar cerda por baixo nem atrás do texto.
8. **O acento de "NÓS".** Na abertura de Entre Nós, passe o pincel sobre "ENTRE NÓS". O acento do Ó deve ficar inteiro, pintado como o resto da letra. Faça o mesmo em "PESQUISA ARTÍSTICA" e "A BAILARINA": nenhuma letra deve mudar de lugar.
9. **A linha "DETALHES" na legenda.** Em "A Dança é por Ela", abaixo da ficha, há agora uma linha "DETALHES" com um anel pequeno antes do texto. Clique nela: a obra amplia, como no clique na pintura. As 18 obras que têm close mostram essa linha; as outras, não.
10. **A marca maior ao ampliar.** Com "A Dança é por Ela" ampliada, a marca de destaque aparece maior, com um ponto branco no centro. Logo depois de a tela abrir, três anéis se expandem um depois do outro (pouco mais de 2 segundos no total); depois a marca respira como antes. Clique nela: abre o close.
11. **Um só vulto antes dos closes.** Na fileira, vá a "Dúvidei". Colado ao lado esquerdo da pintura, e parcialmente atrás dela, deve aparecer um único vulto claro: o primeiro close. Passe o mouse sobre ele: ganha cor e o cursor vira a mãozinha. Clique: a câmera viaja até ele. Faça o mesmo em "Cartografia do Íntimo".
12. **Um só vulto entre os closes.** Em qualquer close, deve aparecer à frente um único vulto, o close seguinte, do outro lado. Nenhum close aparece em cores inteiras antes da hora, e não há uma fila de closes atrás.
13. **"Entre Nós" atrás do último close.** Vá ao 16º close do primeiro trecho (o último antes de Entre Nós). Ele fica à esquerda, e à direita aparece o vulto da imagem da abertura de Entre Nós. Clique no vulto: a câmera viaja até "Entre Nós".
14. **A câmera em linha reta.** Volte a "Dúvidei" e role devagar até o primeiro close e de volta. A câmera anda em linha reta, como no resto do site: não vai mais para o lado nem passa por dentro da pintura. O título e a ficha de "Dúvidei" ficam na tela até a obra sair de foco, como em qualquer obra, e "DETALHES" entra como qualquer título.
15. **O vulto do verso.** Vá ao último close do segundo trecho (o 8º). À esquerda aparece um vulto claro com a imagem do verso, a tela de costas com o chassi. Passe o mouse: ele ganha cor e o cursor vira a mãozinha. Role um pouco para baixo: o vulto some enquanto o giro ainda está no começo.
16. **O giro ao clicar no vulto.** Volte ao 8º close e clique no vulto do verso. A câmera viaja até o verso, e no caminho o close gira e mostra o verso, como quando você rola. Amplie o 8º close e feche: o vulto some enquanto a tela está ampliada e volta aos poucos depois, sem piscar.
17. **As imagens baixadas em segundo plano.** Recarregue no topo, espere a abertura terminar e deixe a página parada uns 30 segundos. Depois role por algumas obras e amplie uma delas: as pinturas que você vê paradas ou rolando devem estar nítidas, e a ampliação abre nítida sem espera. Quando uma pintura chega depois, ela passa do borrado ao nítido esmaecendo, sem troca brusca.
18. **A viagem longa.** Na capa, aperte End. A chegada ao verso deve estar nítida. As telas do caminho passam borradas; isso foi decidido durante a execução (veja "Decisões tomadas durante a execução", abaixo).

### O que eu medi

Medidas feitas no painel de navegador do meu ambiente, em janela de 1440×900, salvo onde está dito outra coisa.

- **Reserva das imagens.** Depois da abertura, o site baixou 63 arquivos em segundo plano, 38,3 MB, na largura que essa janela pede; com o que a abertura e a janela de carregamento já tinham pedido, foram 41,7 MB em 70 arquivos de imagem pedidos pelo site. (O registro do navegador mostra 71 imagens porque conta também a da capa em 640 px que o estilo da página base pede de novo.) Na rede local, a reserva terminou cerca de 0,1 s depois do fim da abertura. Ela também começa quando a página é recarregada no meio do site, sem abertura. Nenhum pedido foi a outro endereço.
- **Telas nítidas ao mesmo tempo.** O máximo foi de 7 das 65, durante a viagem com End (a janela da partida e a da chegada). O limite de memória de vídeo continua o de antes.
- **Altura da fileira.** Em repouso, a coluna mede 367 px em 1440×900 (antes, cerca de 800 px). Com a lente aberta na pior posição, ela vai de 235 a 665 px, dentro da janela. Em 1280×700 e 1024×768 a coluna também fica inteira dentro da janela.
- **A lente.** Medi a saída em 0,25 s e a entrada em 0,24 s, com o fator da marca sob o ponteiro indo de 1 a 0 e de volta sem saltos.
- **O botão de som.** A passagem da margem para a direita do nome levou 0,49 s, de 28,6 a 174,1 px, sem salto; a volta também. Fora da capa, as barras ficam a 18 px do nome. Com uma tela ampliada, o botão fica a 58 px do "voltar" e continua clicável.
- **A marca de destaque.** Os três anéis começam quando a tela termina de abrir, duram 0,9 s cada e se sucedem a cada 0,65 s; o último termina cerca de 2,2 s depois do primeiro.
- **O vulto do verso.** Ao ampliar o último close, ele some em 0,6 s; ao fechar, espera a volta terminar e reaparece em 0,6 s, sem salto.
- **O custo da tinta.** Numa bancada separada, que só reproduz as duas passadas de tela cheia da tinta, a mediana foi de 0,56 ms por quadro com o traço na resolução de antes e de 1,13 ms na resolução cheia de um monitor de 3440×1440 em densidade 1: cerca de 0,6 ms a mais, num quadro de 16,7 ms. Isso não prova fluidez: a bancada não inclui o resto da cena nem o seu monitor, e a densidade 1 foi só emulada. Na tela retina o custo não muda, porque o tamanho do traço já era esse.
- **O ímã.** Na roda simulada, a partir de "Foyer de la Danse", 20% do caminho volta e 30% avança; entre closes (45 vh de um ao outro), 15 vh de rolada avançam e 6 vh voltam. A regra é a mesma nos dois casos: avançar a partir de um quarto do caminho no sentido da rolada. A roda simulada passa pela suavização da rolagem, então esses totais são aproximados.
- **Legendas.** Em 1440×900, 1024×768 e 900×900, nenhuma das 29 legendas cobre a pintura da própria parada nem o vulto da seguinte.

### Decisões tomadas durante a execução

Estas decisões não estavam escritas no pedido. Se discordar de alguma, diga qual.

1. **A margem dos controles conta da borda do pincel.** O pedido dizia "10 px de margem e 24 px de rampa". Contados do centro do pincel, que tem 46 px de largura, as cerdas ainda passavam sob o controle. Por isso a margem passou a contar da borda do traço: a zona sem tinta em volta do nome, do botão de som, da fileira e da linha "DETALHES" ficou cerca de 23 px maior.
2. **Duas legendas descem um pouco para não cobrir o vulto.** A legenda de "Cartografia do Íntimo" cobriria o vulto do primeiro close; ela desce 33 px abaixo da base da pintura em 1440×900, 62 px em 1024×768 e 69 px em 900×900. A de "Dúvidei" desce 29 px em 1024×768 e 36 px em 900×900. As outras legendas continuam alinhadas pela base.
3. **Na viagem longa, só a chegada fica nítida.** O pedido dizia "nenhuma tela borrada no caminho". Uma viagem com End cruza umas 24 paradas por segundo; deixar todas nítidas pelo caminho estouraria o limite de memória de vídeo que você aceitou manter, e decodificar uma a uma no voo provavelmente travaria a viagem. As telas do caminho passam borradas, como antes; a chegada é nítida. A alternativa possível é carregar numa largura menor a parada por onde se passa, durante a viagem; ela precisa de medida de fluidez fora do meu ambiente.
4. **O primeiro trecho de closes trocou de lado.** Para que o vulto de "Entre Nós" aparecesse livre atrás do último close, o 16º close passou para a esquerda e, alternando a partir dele, o 1º close passou para a direita. Visto do foco de "Dúvidei", que também fica à direita, o vulto do 1º close aparece colado ao lado esquerdo da pintura e parcialmente atrás dela. O segundo trecho não mudou.
5. **Um fundo claro atrás do nome e do botão de som.** Nos closes que ficam à esquerda, a pintura chega ao canto superior esquerdo e o nome, as barras do som e o convite ficavam escuros sobre escuro. O nome e o botão ganharam o mesmo fundo branco translúcido da ficha da obra ampliada: sobre a pintura o texto continua legível; sobre o branco o fundo não aparece. Nada mudou de lugar. Na capa o botão ficava sem fundo, porque ali ele encostava no alto da pintura; na terceira rodada ele ganhou o fundo também na capa (veja "O que mudou na terceira rodada").

### Perguntas da segunda rodada

Para cada uma, responda "está bom", "mais" ou "menos", ou diga o que prefere.

1. **Limiar do ímã.** Avançar a partir de um quarto do caminho está bom, ou o ímã deveria avançar com menos (ou mais) rolada?
2. **Formato da lente.** A lente abre umas três marcas para cada lado do ponteiro. Está bom, ou prefere uma lente mais larga ou mais estreita, ou a fileira sempre cheia?
3. **O convite do som.** O texto "LIGAR O SOM" e o lugar dele, ao lado do nome, estão bons? Prefere outro texto, ou só as barras?
4. **A marca de destaque.** O tamanho novo e os três anéis ao abrir estão bons, ou chamam atenção demais (ou de menos)?
5. **A linha "DETALHES".** A linha na legenda ajuda a achar os closes? O texto e o anel estão bons?
6. **O lado dos closes.** No primeiro trecho, o 1º close agora fica do lado oposto ao de antes. Isso incomoda?
7. **As legendas deslocadas.** A legenda de "Cartografia do Íntimo" fica um pouco abaixo da base da pintura, para não cobrir o vulto. Isso incomoda, ou prefere que ela se afaste para o lado?
8. **A viagem longa.** As telas borradas no caminho de uma viagem com End incomodam? Se sim, vale tentar a alternativa da decisão 3.
9. **O fundo atrás do nome e do botão.** Sobre as pinturas, o fundo claro atrás do nome e do botão de som (decisão 5) fica bem, ou prefere outra saída?

### O que só você pode conferir

Estes pontos eu não consegui conferir de verdade no meu ambiente, onde o painel do navegador fica oculto e a animação só anda a pedido.

1. **O traço no monitor externo (3440×1440).** Compare o traço com o da tela do notebook: a definição (ele deve estar tão fino quanto na tela retina), a curva (sem quinas nos gestos rápidos) e a textura das cerdas, que eu só pude ver em densidade emulada. Diga se a textura mudou.
2. **A fluidez com tinta viva nesse monitor.** Pinte bastante no fundo enquanto rola. Se o movimento engasgar, avise.
3. **O ímã com a roda e o trackpad de verdade.** Eu só usei rolada simulada. Diga se a rolada curta avança quando você espera que avance, e se o trackpad, que solta a página aos poucos, não avança sem querer.
4. **A entrada e a saída da lente.** Eu medi os tempos, mas não vi o movimento. Diga se ele é macio e se a lente atrapalha ou ajuda a clicar.
5. **O pulso da marca.** Eu medi os anéis, mas não os vi se expandindo. Diga se o pulso fica bonito.
6. **O convite do som e a música.** Confira o convite, a primeira entrada da música e o botão ao longo do site, com o som do seu computador.
7. **O Safari.** Repita os passos desta seção no Safari, em especial a lente, o pulso, o botão de som e a tinta.

### O que eu encontrei na conferência

Estes pontos apareceram na conferência geral. Os dois foram tratados na correção final da rodada.

- **A barra de espaço depois da linha "DETALHES".** Se você amplia uma obra pela linha "DETALHES" e fecha com Esc ou "voltar", o foco do teclado volta para essa linha. Apertar a barra de espaço, então, amplia a obra de novo em vez de ir à parada seguinte. As setas continuam funcionando. *Corrigido: clicada com o mouse, a linha não guarda o foco, e a barra de espaço vai à parada seguinte; pelo teclado (Tab e Enter), o foco volta à linha ao fechar, como antes.*
- **O botão de som sobre os closes da esquerda.** Nos closes que ficam à esquerda (por exemplo o 14º e o 16º do primeiro trecho), a pintura chega ao canto superior esquerdo, e as barras do som, e o convite enquanto ele aparece, ficam por cima dela, escuras sobre escuro. O nome já encostava nesses closes antes desta rodada. *Tratado com um fundo branco translúcido atrás do nome e do botão (decisão 5).* Para conferir: vá ao 14º e ao 16º close do primeiro trecho e veja se o nome, as barras e o convite se leem bem sobre a pintura; depois vá a "A Dança é por Ela" e à capa, onde o canto é branco, e veja que nenhum retângulo aparece. Responda à pergunta 9.

## O que entrou em 15/11/2026: as 58 páginas

Se o site ainda não está aberto, siga primeiro a seção 1, mais abaixo. Para chegar depressa a uma parada, use a fileira de marcas na borda direita (passe o mouse para ver o título e clique) ou as setas do teclado, que andam uma parada por vez.

Algumas palavras deste trecho:

- **Close**: uma página de "Detalhes" do PDF, com um pedaço de uma pintura visto de muito perto. No site, cada close é uma tela grande, que alterna entre a esquerda e a direita. Parado, o close é mais alto que a janela e fica cortado em cima e embaixo; só ampliado (clicando nele) ele aparece inteiro.
- **Travessia pela pintura**: não existe mais. Na primeira versão das 58 páginas, a câmera passava por dentro da última pintura de cada série para entrar nos closes; na segunda rodada ela voltou a andar em linha reta, como no resto do site (veja "O que mudou na segunda rodada").
- **Giro final**: o último close do segundo trecho se vira como uma tela de verdade e mostra o verso, com a assinatura.

### Os dois trechos de "Detalhes"

1. Na fileira, clique na marca de DÚVIDEI (a última obra de A Bailarina). Espere a câmera parar.
2. Role devagar para baixo. A câmera anda em linha reta até o primeiro close, que já aparecia como vulto ao lado de "Dúvidei". (Até a segunda rodada, a câmera ia para o lado e passava por dentro da pintura; isso saiu.)
3. Continue rolando devagar. A palavra "DETALHES" aparece sobre o primeiro close quando ele chega, como qualquer título. Os closes seguintes vêm um atrás do outro, alternando de lado. Pare de rolar no meio do caminho entre dois closes: o ímã deve seguir o sentido da rolada (veja o passo 6 de "O que mudou na segunda rodada").
4. Olhe a fileira enquanto passa pelos closes. Há uma única marca "DETALHES" para o trecho inteiro, e ela fica comprida (marcada como atual) em qualquer close do trecho.
5. Passe o mouse no branco ao lado de um close. A tinta do pincel deve aparecer no branco e nunca sobre a pintura.
6. Clique num close parado. Ele amplia como uma obra, só com o botão "voltar". Saia com Esc.
7. Faça o mesmo com o segundo trecho: clique na marca de CARTOGRAFIA DO ÍNTIMO (a última obra de Entre Nós) e role até os 8 closes.

### A travessia pela pintura

Esta parte saiu na segunda rodada: a câmera não passa mais por dentro da pintura. Os passos que a substituem são o 11 e o 14 de "O que mudou na segunda rodada". Continua valendo conferir, em CARTOGRAFIA DO ÍNTIMO, se a legenda encosta no vulto do primeiro close (agora ela desce um pouco para não cobri-lo; veja a decisão 2 daquela seção).

### A saída do primeiro trecho para "Entre Nós"

1. Na fileira, clique na marca "DETALHES" do primeiro trecho. Ela leva ao primeiro close; aperte a seta para baixo 15 vezes para chegar ao último (o 16º).
2. Role devagar para baixo. A câmera anda em linha reta até a abertura de "Entre Nós", que já aparecia como vulto à direita do último close (segunda rodada; antes a câmera atravessava o close).
3. Role para cima devagar. O último close deve reaparecer primeiro claro, quase branco, e depois em cor, sem salto.

### O giro final e o verso

1. Na fileira, clique na marca de CARTOGRAFIA DO ÍNTIMO e role até o último close do segundo trecho (o 8º). Desde a segunda rodada, à esquerda dele aparece o vulto do verso (passos 15 e 16 de "O que mudou na segunda rodada").
2. Role devagar para baixo. O close vem para o centro, diminui um pouco e gira meia volta, como quando se vira uma tela na mão. Do outro lado aparece o verso: o chassi de madeira, a tela e a assinatura "MARCELA DE LUNA", que não deve aparecer espelhada.
3. Pare de rolar no meio do giro. O ímã deve levar ao verso ou de volta ao último close, nunca deixar a tela parada de perfil.
4. Clique no verso parado: ele amplia como as obras.
5. Role para cima: o giro deve se desfazer, até o close voltar ao seu lugar.
6. Recarregue a página no meio do giro e depois no verso (Cmd+R). Ela deve reabrir no mesmo ponto, com a tela no mesmo ângulo.

### A viagem longa

1. Volte à capa (clique em "MARCELA DE LUNA" no canto) e espere a abertura terminar.
2. Aperte a tecla End. A câmera viaja da capa até o verso em poucos segundos. Pelo caminho, as pinturas aparecem borradas; ao chegar, o verso deve estar nítido, em foco, e nunca deve aparecer uma tela preta ou um plano vazio. (Desde a segunda rodada o site baixa todas as imagens em segundo plano, mas só decodifica as da partida e da chegada; veja a decisão 3 de "O que mudou na segunda rodada".)
3. Aperte Home: a viagem volta à capa do mesmo jeito.
4. Pela fileira, clique na marca do verso estando na capa, e depois numa obra do meio. A câmera deve parar sempre na parada escolhida.
5. Recarregue a página, aperte End enquanto a capa ainda está surgindo e veja se a viagem acontece e se a capa volta com a pintura quando você retornar a ela.
6. Este passo saiu na segunda rodada: a câmera não se desvia mais para o lado nas entradas e saídas dos closes, nem durante as viagens.

### O que eu medi

- Até a pintura da capa chegar, o site baixa cerca de 1,6 MB (o limite combinado é 2 MB).
- Ao longo de uma travessia completa, no máximo 9 das 65 telas ficam com a imagem nítida ao mesmo tempo; as outras ficam na versão borrada, que já vem com a página. (Medida da primeira versão; a da segunda rodada está em "O que mudou na segunda rodada".)
- O texto das 58 páginas no site confere com o do PDF, palavra por palavra e na mesma ordem. A única diferença são os três subtítulos e o nome da capa, que no PDF estão desenhados e não saem como texto; eles foram transcritos à mão. "DÚVIDEI" está com a grafia do PDF.
- Os 18 closes que têm marca abrem na obra certa.

### Perguntas sobre as 58 páginas

Para cada uma, responda "está bom", "mais" ou "menos", e, se puder, diga por quê.

1. **Ritmo dos closes.** Os closes passam depressa demais, devagar demais ou na medida? Cada um fica tempo suficiente parado?
2. **Tamanho dos closes.** Parado, cada close é mais alto que a janela e fica cortado em cima e embaixo; só ampliado ele aparece inteiro. Prefere assim, ou o close inteiro dentro da janela, mesmo que fique menor?
3. **A travessia pela pintura.** Respondida: você não gostou, e na segunda rodada a câmera voltou a andar em linha reta.
4. **O giro final.** A velocidade do giro e o tamanho do verso estão bons? O verso deveria ficar mais tempo na tela?
5. **A abertura de "Entre Nós".** No PDF, a imagem dessa página sai pelo alto da folha. No site ela ficou inteira, à direita do texto, sem sair pelo topo. Prefere assim ou mais parecida com o PDF?
6. **As obras quadradas.** "Impermanência" e "Íntima" são quadradas e mais largas que as outras; para caberem inteiras na janela, elas ficam um pouco mais perto do centro do que as demais obras. Isso incomoda?
7. **O texto que espera a câmera.** Não vale mais: sem a travessia pela pintura, os textos de todas as paradas, inclusive "DETALHES" e as legendas de "Dúvidei" e "Cartografia do Íntimo", entram e saem como em qualquer outra parada (segunda rodada).

### O que só você pode conferir

Estes pontos eu não consegui testar de verdade no meu ambiente:

1. **Safari.** Repita no Safari os passos desta seção, além dos da seção 4.
2. **Fluidez real da rolagem contínua.** Rolar sem parar do topo ao fim, passando pelos closes e pelo giro, deve parecer macio, sem engasgos (veja "Como medir a fluidez", no fim).
3. **O ímã nos closes.** Pare de rolar entre dois closes e diga se o deslize vem no tempo certo e na direção esperada. Desde a segunda rodada o ímã segue o sentido da rolada; o item 3 de "O que só você pode conferir", na seção da segunda rodada, substitui este.
4. **A barra de rolagem no meio de uma viagem.** Aperte End e, enquanto a câmera viaja, agarre a barra de rolagem à direita e arraste. A viagem deve parar e a página seguir a sua mão, sem pulo.
5. **A música.** Ligue o som pelo botão ao lado do nome, no canto superior esquerdo (lugar novo desde a segunda rodada), e percorra o site inteiro. A música deve continuar sem cortes nem saltos de volume, inclusive nas viagens longas e no giro final.


## 1. Como abrir

1. Abra o Terminal.
2. Entre na pasta do projeto (a pasta "Ceça"): digite `cd ` (com um espaço no fim), arraste a pasta do projeto do Finder para a janela do Terminal e aperte Enter.
3. Agora rode o comando que abre o piloto:

   ```
   sh tools/abrir-piloto.sh
   ```

4. O navegador abre sozinho em **http://localhost:4173**. Se não abrir, copie esse endereço e cole no navegador.
5. Para fechar o piloto, volte ao Terminal e aperte **Ctrl+C**.

Se o Terminal avisar que o endereço já está sendo usado, é porque o piloto já estava aberto. Nesse caso ele só abre o navegador de novo e você pode seguir.

Use um computador (notebook ou desktop) com mouse ou trackpad. O Chrome é o navegador mais testado.

## 2. O que experimentar, em ordem

Faça com calma. Se algo parecer estranho, anote o que você fez e o que viu.

1. **A abertura.** A abertura só acontece com a página no topo. Se você já rolou, volte à capa (clique em "MARCELA DE LUNA" no canto ou aperte Home) e recarregue a página (Cmd+R). Você deve ver a tela branca, a pintura da capa surgir por pinceladas, "PORTFÓLIO" subir letra a letra e "MARCELA DE LUNA" se encher de tinta. Deve levar poucos segundos.
2. **Rolar.** Neste roteiro, "travessia" é o modo animado do site: a câmera avança por um espaço branco e cada página do PDF é uma parada. Role devagar, com o mouse ou o trackpad, do topo até o fim. Você deve ver a câmera avançar: a capa se abre, aparece a Pesquisa Artística com o texto, depois A Bailarina e as suas obras, e assim por diante até o verso. Nada deve travar nem pular. A barra de rolagem funciona normalmente.
3. **Mexer o mouse.** Com uma obra em foco (por exemplo, A Dança é por Ela), mova o mouse devagar. Você deve ver duas coisas discretas: as camadas se deslocam um pouco (paralaxe) e uma luz acompanha o cursor, deixando o relevo das pinceladas aparecer. As cores da pintura não devem mudar. Com o mouse parado, nada deve tremer.
4. **Pintar o fundo.** Passe o mouse no fundo branco. Deve surgir uma pincelada com textura de cerdas, que some aos poucos. A tinta sai num de quatro pigmentos da paleta da artista (azul, rosa, magenta e laranja), escolhido pela pintura mais próxima: não é a cor exata da pintura, é o pigmento da paleta que mais combina com ela. A tinta nunca deve cobrir uma pintura nem o texto.
5. **Pintar os títulos.** Passe o mouse sobre um título grande, como "PESQUISA ARTÍSTICA" ou "A BAILARINA". As letras devem se encher de pintura.
6. **Clicar numa tela.** Com uma obra em foco, clique nela. O "mergulho" é isso: a câmera chega bem perto até a tela ocupar a janela, com o título e a ficha no canto e o botão "voltar". Use a roda do mouse (ou a pinça no trackpad) para aproximar e arraste para mover a pintura. A pintura da capa, os recortes da Pesquisa Artística e de A Bailarina, os closes e o verso também ampliam assim quando estão em foco; nesses casos não há legenda, só o botão "voltar". Clicar numa tela que está ao longe leva até ela.
7. **Abrir um close.** Com uma obra ampliada, uma pequena marca sobre a pintura indica que há um close daquele trecho. Em A Dança é por Ela há uma. Clique na marca: abre o close em alta resolução. Aperte **Esc** uma vez para voltar à tela e **Esc** de novo para voltar à travessia, no mesmo ponto onde você estava. Cada Esc volta um nível: do close para a tela, da tela para a travessia; na travessia, o Esc não faz nada. Agora 18 obras têm marca; a lista de todas as ligações entre closes e telas está em `docs/closes.md`. Confira algumas além de A Dança é por Ela (por exemplo Tensão, Presença e Cartografia do Íntimo).
8. **Sair do mergulho de outros jeitos.** Entre de novo numa tela e saia pelo botão "voltar", depois rolando a roda para baixo sem ter aproximado, depois com a seta para baixo do teclado. Esc e "voltar" devolvem ao mesmo ponto; a seta para baixo fecha o mergulho e já leva à parada seguinte. Em todos os casos você não deve ficar preso.
9. **A fileira de pinceladas.** Na borda direita há uma fileira vertical de marcas, uma por parada. Passe o mouse: aparece o título. Clique: a câmera viaja até lá. A marca da parada atual fica mais comprida. Clique em marcas diferentes com a página parada e também logo depois de rolar rápido, e diga se a câmera sempre parou na obra escolhida. (Desde a segunda rodada a fileira fica contraída em repouso e abre como lente perto do ponteiro; veja os passos 4 e 5 de "O que mudou na segunda rodada".)
10. **As setas e a barra de espaço.** Com a página em foco, use seta para baixo, seta para cima e barra de espaço: cada toque leva à parada seguinte ou anterior.
11. **O nome no canto.** Clique em "MARCELA DE LUNA" no canto superior esquerdo: volta à capa.
12. **Recarregar no meio.** Role até a metade, recarregue a página. Ela deve abrir na mesma parada, sem repetir a abertura por cima do conteúdo.
13. **Mudar o tamanho da janela.** Com uma obra em foco, aumente e diminua a janela (inclusive deixando-a estreita, quase quadrada, ou abrindo o painel do desenvolvedor ao lado). Você deve continuar na mesma obra, com a pintura inteira na janela (numa janela estreita ela fica menor, com mais branco acima e abaixo) e a ficha sem cobrir a pintura. Faça o mesmo com uma tela aberta no mergulho e depois saia: deve voltar ao mesmo ponto. Por fim, recarregue a página: ela reabre na mesma obra.

## 3. O que ainda não existe neste piloto

- A versão para celular (o conceito "Folhas"). No celular, hoje, aparece apenas uma página simples, sem animação.
- A versão sem animação com botão para ligar e desligar. Hoje ela só aparece sozinha quando o sistema pede movimento reduzido ou quando os gráficos não funcionam.
- A publicação na internet (endereço, HTTPS). O piloto roda só no seu computador.

## 4. O que conferir no Safari

Eu não tenho Safari para testar. Abra o piloto no Safari do seu Mac (use o mesmo endereço, com o piloto já rodando) e confira:

1. A abertura aparece completa, sem tela branca parada.
2. Rolar do topo ao fim é fluido e nada trava.
3. O mouse deixa pinceladas no fundo e enche os títulos.
4. Clicar numa tela mergulha, e o botão "voltar" e o Esc funcionam.
5. No mergulho, o gesto de pinça no trackpad aproxima a pintura (e não a página inteira)? Este ponto eu fiz sem poder testar.
6. A fileira de pinceladas na direita leva às paradas.
7. As letras de "MARCELA DE LUNA" e dos subtítulos aparecem preenchidas com pintura.
8. Se algo aparecer em branco, preto ou cortado, anote em qual passo.

## 4b. O que conferir com movimento reduzido

1. Abra Ajustes do Sistema, Acessibilidade, Monitor e ligue "Reduzir movimento".
2. Recarregue o piloto no navegador.
3. Deve aparecer a página simples, sem animação, com todo o texto e todas as imagens das 58 páginas (as imagens carregam à medida que você rola).
4. Depois desligue "Reduzir movimento" de novo, para o resto do Mac voltar ao normal.

## 5. Perguntas para você responder

Para cada uma, responda "está bom", "mais" ou "menos", e, se puder, diga por quê.

1. **Ritmo do scroll.** Cada volta da roda anda demais, de menos ou na medida? As paradas ficam tempo suficiente em foco para ler o texto e ver a obra?
2. **Força da paralaxe.** O deslocamento com o mouse está sutil demais, na medida ou forte demais?
3. **Força da luz.** A luz que acompanha o cursor deixa o relevo aparecer o bastante? Alguma vez parece alterar a cor da pintura?
4. **Duração da tinta do pincel.** A pincelada some rápido demais, na medida ou fica tempo demais?
5. **Cor da tinta do pincel.** Os quatro pigmentos (azul, rosa, magenta e laranja) estão certos? O pigmento escolhido para cada pintura combina com ela? Prefere mais vivo, mais suave, ou uma cor só?
6. **Pesos da fonte.** Compare com o PDF: o título grande (pesado), o título de obra (leve) e o texto corrido (leve, com negritos) têm o mesmo peso e a mesma presença do original?
7. **Posição das legendas.** O título e a ficha ao lado de cada obra estão bem colocados? Cobrem alguma coisa? Ficam longe ou perto demais da pintura?
8. **A abertura.** A duração, o gesto das pinceladas e a entrada de "PORTFÓLIO" e do nome estão como você imaginava? Gostaria mais rápida, mais lenta ou diferente?
9. **Os closes.** As marcas sobre as pinturas e as ligações de `docs/closes.md` estão corretas? Algum close está ligado à tela errada?
10. **No geral.** Em algum momento você ficou sem saber o que fazer, ou achou algo cansativo?

## 6. Problemas conhecidos

Estes eu encontrei ao conferir e ainda não foram consertados.

- **"PORTFÓLIO" cortado na versão simples.** Na página sem animação (celular, por exemplo), a palavra "PORTFÓLIO" é branca e invade a base da pintura; a parte que cai no fundo branco some.
- **Imagem da capa baixada duas vezes.** A capa pequena é carregada mais de uma vez ao abrir. Não se vê nada, mas gasta internet à toa.
- **Legenda atrasada.** Logo depois de mudar de parada, a legenda da parada anterior pode ficar um instante na tela. Se durar, avise.
- **Primeira tela de Intervalo perto do nome.** Em algumas janelas, a primeira pintura de Intervalo chega a poucos pixels de "MARCELA DE LUNA" no canto.
- **Telas que ainda não chegaram.** Quando você salta para uma parada que ainda não carregou, as telas aparecem primeiro borradas e depois ficam nítidas. Desde a segunda rodada a passagem do borrado ao nítido esmaece em 0,35 s, e as imagens já baixadas em segundo plano chegam mais depressa. Se você enxergar um clarão branco inteiro durante um salto longo, avise.
- **Página simples no computador.** Se a animação falhar e o site cair na página simples, a palavra "PORTFÓLIO" também sai cortada ali, como no celular. E, se você recarregar depois disso, o site volta à capa com a abertura, em vez de reabrir onde você estava.
- **Fluidez ainda não medida.** Não consegui medir a fluidez do topo ao fim num notebook real. Veja o item abaixo.

### Como medir a fluidez (se você quiser)

1. No Chrome, abra o piloto, aperte **Cmd+Option+I** e clique na aba **Desempenho** (Performance).
2. Clique no botão de gravar (círculo), role a página do topo ao fim com calma e clique em parar.
3. Olhe a faixa de quadros por segundo no alto: o esperado é ficar perto de 60 sem quedas longas abaixo de 50.
4. Se preferir, só observe: a rolagem deve parecer macia, sem engasgos.
