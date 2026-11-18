# Ajustes: alcance do vulto e convite de rolagem na capa

18/11/2026. Pedido do Pedro depois de ver o site publicado: na capa e na "Pesquisa Artística" não se vê o vulto da tela seguinte, e o visitante não adivinha que pode rolar ou clicar para seguir.

## Medição

Distância do foco de uma parada até a primeira tela da seguinte: `8 + (durA/2 + durB/2) × 0,14 − z do plano`. A faixa `VISIBILIDADE.some` (alfa 1 até 22 un., zero em 28) foi afinada para obra → obra, que dá 22,00. Das 57 transições:

| De → para | Distância | Alfa |
|---|---|---|
| Capa → Pesquisa Artística | 26,80 | 0,10 |
| Pesquisa Artística → A Bailarina | 29,30 | 0,00 |
| A Bailarina → Foyer de la Danse | 24,80 | 0,55 |
| Entre Nós → Impermanência | 24,80 | 0,55 |

As outras têm alfa 1 e brancura 0,92. O teste de `tests/vultos.test.mjs` só cobria as transições em volta dos closes. Não foi escolha de desenho: é efeito colateral das paradas mais longas (capa 100 vh, texto 160 vh, abertura 140 vh).

## C1. Alcance do vulto por parada

Regra B3 (segunda rodada) mantida: do foco de qualquer parada vê-se uma única tela à frente, a primeira da parada seguinte.

- Função pura nova `visibilidadeDasParadas(stops, planos, linha)` em `site/js/core/vulto.js`: para cada parada, a visibilidade das suas telas. Closes: `VISIBILIDADE_DETALHE`, como hoje. Demais: `VISIBILIDADE`, com `some` deslocado para começar em `d + 0,2` quando a distância `d` do foco da parada anterior até a primeira tela desta passa de `some[0]`; a largura da faixa (6 un.) não muda.
- Com os dados atuais mudam só as telas de quatro paradas: Pesquisa Artística (some 27,0 a 33,0), A Bailarina (29,5 a 35,5), Foyer de la Danse e Impermanência (25,0 a 31,0). Nenhuma delas aparece do foco de duas paradas antes (a mais próxima fica a 37,75 un.).
- Não se alonga a faixa do site inteiro: do foco do penúltimo close do primeiro trecho, "Entre Nós" está a 27,55 un. e viraria um segundo vulto.
- `site/js/main.js` passa a pedir a visibilidade a essa função.
- Teste com os dados reais, em 1440×900 e 1512×828, nas 57 transições: a primeira tela da parada seguinte tem alfa 1 e brancura ≥ 0,9; nenhuma tela de parada mais adiante tem alfa > 0,05. A área livre mínima de 40% continua exigida onde já era (em volta dos closes); nas demais, 25%.

Fica como está, por decisão pendente: em "Entre Deux Temps" → "Contracorpo" e "Deux Figures" → "Suspenso" o vulto tem só 27% de área livre (aparece como faixa acima da segunda tela). Na "Pesquisa Artística", o vulto de "A Bailarina" fica 64% livre, entre a imagem da direita e o texto; se parecer apertado, o ajuste é deslocar essa imagem.

## C2. Convite de rolagem na capa

Mesmo inteiro, o vulto é 92% branco sobre branco: quem chega ainda não conhece essa linguagem. Entra um rótulo de interface, discreto, que diz o que fazer.

- Texto: "ROLE PARA ENTRAR", com um traço vertical fino que desce em ciclo lento. Mesma fonte, tamanho e espaçamento do convite "LIGAR O SOM".
- Lugar: canto superior direito, na linha do nome e do som (o canto está livre desde que o som foi para a esquerda; a fileira de navegação fica mais abaixo, na borda direita).
- Aparece só depois do fim da abertura e só com a capa em foco: esconde-se ao rolar (a partir de 3 vh) e volta sempre que o visitante retorna à capa. (Primeira versão: sumia de vez na primeira rolagem; o Pedro pediu que voltasse.)
- É um botão: o clique viaja até a parada seguinte, como o clique no vulto. Barra a tinta do pincel, como os outros controles.
- Movimento reduzido (`prefers-reduced-motion`): o traço fica parado.
- Lógica pura em `site/js/core/convite.js` (com teste); o elemento em `site/js/ui/convite-rolagem.js`, desfeito por `encerrar()`. A página base não muda.

## C3. Folga entre o vulto e o texto da "Pesquisa Artística"

Com o vulto de "A Bailarina" visível, a borda direita dele (62,8% da largura da janela nas proporções até 1,65) encostava na coluna de texto, que começava em 63%: 3 px de folga em 1440×900, 23 px em 1512×828. O Pedro achou apertado.

- A coluna de texto das paradas de texto passa de `min(30rem, 31vw)` para `min(30rem, 28vw)` de largura (`site/css/travessia.css`), presa à direita como antes: começa em 66% da largura.
- Folga medida depois: 46 px em 1440×900, 67 px em 1512×828, 33 px em 1024×768, 29 px em 900×900. O texto continua inteiro na janela nos quatro tamanhos.
- Deslocar a imagem da direita (ideia anterior) não resolveria: a folga depende do vulto e do texto, não dela.

## Fora desta rodada

- Ajuda "COMO NAVEGAR" no canto superior direito: decidir depois de ver o convite em uso.
- Reposicionar o vulto nas duas obras de duas telas citadas acima.
