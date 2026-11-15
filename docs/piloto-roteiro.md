# Roteiro do piloto

Este roteiro é para você, Pedro. Ele diz como abrir o piloto, o que experimentar e o que você precisa me dizer para o trabalho continuar. Não precisa saber programar.

O piloto tem seis telas: a capa, a Pesquisa Artística, a abertura de A Bailarina e três obras (Foyer de la Danse, A Dança é por Ela e Intervalo). O resto do portfólio ainda não está aqui.

## 1. Como abrir

1. Abra o Terminal.
2. Entre na pasta do projeto (a pasta "Ceça").
3. Rode um comando só:

   ```
   sh tools/abrir-piloto.sh
   ```

4. O navegador abre sozinho em **http://localhost:4173**. Se não abrir, copie esse endereço e cole no navegador.
5. Para fechar o piloto, volte ao Terminal e aperte **Ctrl+C**.

Se o Terminal avisar que a porta 4173 já está em uso, é porque o piloto já estava aberto. Ele só abre o navegador de novo e você pode seguir.

Use um computador (notebook ou desktop) com mouse ou trackpad. O Chrome é o navegador mais testado.

## 2. O que experimentar, em ordem

Faça com calma. Se algo parecer estranho, anote o que você fez e o que viu.

1. **A abertura.** Recarregue a página (Cmd+R). Você deve ver a tela branca, a pintura da capa surgir por pinceladas, "PORTFÓLIO" subir letra a letra e "MARCELA DE LUNA" se encher de tinta. Deve levar poucos segundos.
2. **Rolar.** Role devagar, com o mouse ou o trackpad, do topo até o fim. Você deve ver a câmera avançar: a capa se abre, aparece a Pesquisa Artística com o texto, depois A Bailarina e as três obras. Nada deve travar nem pular. A barra de rolagem funciona normalmente.
3. **Mexer o mouse.** Com uma obra em foco (por exemplo, A Dança é por Ela), mova o mouse devagar. Você deve ver duas coisas discretas: as camadas se deslocam um pouco (paralaxe) e uma luz acompanha o cursor, deixando o relevo das pinceladas aparecer. As cores da pintura não devem mudar. Com o mouse parado, nada deve tremer.
4. **Pintar o fundo.** Passe o mouse no fundo branco. Deve surgir uma pincelada com textura de cerdas, na cor da pintura mais próxima, que some aos poucos. A tinta nunca deve cobrir uma pintura nem o texto.
5. **Pintar os títulos.** Passe o mouse sobre um título grande, como "PESQUISA ARTÍSTICA" ou "A BAILARINA". As letras devem se encher de pintura.
6. **Clicar numa tela.** Com uma obra em foco, clique nela. A câmera mergulha até a tela ocupar a janela, com o título e a ficha no canto e o botão "voltar". Use a roda do mouse para aproximar e arraste para mover a pintura.
7. **Abrir um close.** Em A Dança é por Ela há uma pequena marca sobre a pintura. Clique nela: abre o close em alta resolução. Aperte **Esc** uma vez para voltar à tela e **Esc** de novo para voltar à travessia, no mesmo ponto onde você estava. (A lista de todas as ligações entre closes e telas está em `docs/closes.md`. Confira se cada close está no lugar certo.)
8. **Sair do mergulho de outros jeitos.** Entre de novo numa tela e saia pelo botão "voltar", depois rolando a roda para baixo sem ter aproximado, depois com as setas do teclado. Em todos os casos você deve voltar à travessia sem ficar preso.
9. **A fileira de pinceladas.** Na borda direita há uma fileira vertical de marcas, uma por parada. Passe o mouse: aparece o título. Clique: a câmera viaja até lá. A marca da parada atual fica mais comprida.
10. **As setas e a barra de espaço.** Com a página em foco, use seta para baixo, seta para cima e barra de espaço: cada toque leva à parada seguinte ou anterior.
11. **O nome no canto.** Clique em "MARCELA DE LUNA" no canto superior esquerdo: volta à capa.
12. **Recarregar no meio.** Role até a metade, recarregue a página. Ela deve abrir na mesma parada, sem repetir a abertura por cima do conteúdo.
13. **Mudar o tamanho da janela.** Aumente e diminua a janela com uma obra em foco. A tela deve continuar inteira na janela e a ficha não deve cobrir a pintura.

## 3. O que ainda não existe neste piloto

- As páginas 7 a 58 do PDF: as outras obras, os "Detalhes", Entre Nós e o verso com a assinatura.
- A versão para celular (o conceito "Folhas"). No celular, hoje, aparece apenas uma página simples, sem animação.
- A versão sem animação com botão para ligar e desligar. Hoje ela só aparece sozinha quando o sistema pede movimento reduzido ou quando os gráficos não funcionam.
- A publicação na internet (endereço, HTTPS). O piloto roda só no seu computador.
- O texto do PDF só foi conferido nestas seis telas.

## 4. O que conferir no Safari

Eu não tenho Safari para testar. Abra o piloto no Safari do seu Mac (use o mesmo endereço, com o piloto já rodando) e confira:

1. A abertura aparece completa, sem tela branca parada.
2. Rolar do topo ao fim é fluido e nada trava.
3. O mouse deixa pinceladas no fundo e enche os títulos.
4. Clicar numa tela mergulha, e o botão "voltar" e o Esc funcionam.
5. A fileira de pinceladas na direita leva às paradas.
6. As letras de "MARCELA DE LUNA" e dos subtítulos aparecem preenchidas com pintura.
7. Se algo aparecer em branco, preto ou cortado, anote em qual passo.

## 5. Perguntas para você responder

Para cada uma, responda "está bom", "mais" ou "menos", e, se puder, diga por quê.

1. **Ritmo do scroll.** Cada volta da roda anda demais, de menos ou na medida? As paradas ficam tempo suficiente em foco para ler o texto e ver a obra?
2. **Força da paralaxe.** O deslocamento com o mouse está sutil demais, na medida ou forte demais?
3. **Força da luz.** A luz que acompanha o cursor deixa o relevo aparecer o bastante? Alguma vez parece alterar a cor da pintura?
4. **Duração da tinta do pincel.** A pincelada some rápido demais, na medida ou fica tempo demais?
5. **Cor da tinta do pincel.** A cor tirada da pintura mais próxima combina? Prefere mais viva, mais suave, ou uma cor só?
6. **Pesos da fonte.** Compare com o PDF: o título grande (pesado), o título de obra (leve) e o texto corrido (leve, com negritos) têm o mesmo peso e a mesma presença do original?
7. **Posição das legendas.** O título e a ficha ao lado de cada obra estão bem colocados? Cobrem alguma coisa? Ficam longe ou perto demais da pintura?
8. **A abertura.** A duração, o gesto das pinceladas e a entrada de "PORTFÓLIO" e do nome estão como você imaginava? Gostaria mais rápida, mais lenta ou diferente?
9. **Os closes.** As marcas sobre as pinturas e as ligações de `docs/closes.md` estão corretas? Algum close está ligado à tela errada?
10. **No geral.** Em algum momento você ficou sem saber o que fazer, ou achou algo cansativo?

## 6. Problemas conhecidos

Estes eu encontrei ao conferir. Não foram consertados, porque esta etapa é só de conferência.

- **Redimensionar a janela muda a parada.** Ao aumentar ou diminuir a janela no meio da página, você pode ser levado a outra parada (por exemplo, estava em A Dança é por Ela e passa para A Bailarina). A tela não quebra; só o ponto de leitura se desloca.
- **"PORTFÓLIO" cortado na versão simples.** Na página sem animação (celular, por exemplo), a palavra "PORTFÓLIO" é branca e invade a base da pintura; a parte que cai no fundo branco some.
- **Imagem da capa baixada duas vezes.** A capa pequena é carregada mais de uma vez ao abrir. Não se vê nada, mas gasta internet à toa.
- **Ícone do site.** O navegador procura um ícone e não acha. É só um aviso na lista de pedidos; não aparece para você.
- **Telas que ainda não chegaram.** Quando você salta para uma parada que ainda não carregou, as telas aparecem primeiro na cor dominante e depois ganham a imagem. É de propósito. Se você enxergar um clarão branco inteiro durante um salto longo, avise: eu não consegui confirmar se isso é do site ou do meu teste.
- **Fluidez ainda não medida.** Não consegui medir a fluidez do topo ao fim num notebook real. Veja o item abaixo.

### Como medir a fluidez (se você quiser)

1. No Chrome, abra o piloto, aperte **Cmd+Option+I** e clique na aba **Desempenho** (Performance).
2. Clique no botão de gravar (círculo), role a página do topo ao fim com calma e clique em parar.
3. Olhe a faixa de quadros por segundo no alto: o esperado é ficar perto de 60 sem quedas longas abaixo de 50.
4. Se preferir, só observe: a rolagem deve parecer macia, sem engasgos.
