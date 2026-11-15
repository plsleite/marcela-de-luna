# Publicação no GitHub Pages (15/11/2026)

Preparação para publicar o site em `https://plsleite.github.io/marcela-de-luna/`. A publicação em si (criar o repositório remoto e enviar) só acontece quando o Pedro disser "pode publicar".

## Decisões do Pedro

- **Publicação antes do conceito de celular.** No celular o site mostra a página simples, sem animação nem música.
- **Repositório público com o projeto inteiro** (site, documentos, testes e histórico), na conta `plsleite`, com o nome `marcela-de-luna`.
- **Contato da Marcela na capa como está no PDF** (telefone, Instagram e e-mail). A página já pede aos buscadores que não a indexem (`noindex, nofollow`).
- **Crédito da música na última parada** (o verso da tela).
- **Caminho local fora do histórico.** O roteiro trazia o caminho completo da pasta no Mac; ele foi trocado por um caminho genérico em todas as versões (histórico reescrito em 15/11/2026, com cópia de segurança do repositório local feita antes).

## Restrições que continuam valendo

- Nenhum recurso remoto em tempo de execução (scripts, fontes, imagens, áudio): tudo sai da pasta `site/`. Links para páginas externas (`<a href>`) são permitidos.
- Sem `npm install`. Sem `git push` até o "pode publicar".
- `desmontar()` em `site/js/main.js` é o caminho único de saída para a página base; `site/js/main.js` não cresce.
- A página base (sem a classe `travessia`) não muda.
- Lógica nova que puder ser pura vai para `site/js/core/` com teste em `tests/`.

## P1. Crédito visível da gravação

A gravação de "O Cisne" vem do Wikimedia Commons (arquivo "20091104 Alisa Weilerstein and Jason Yoder - Saint Saëns' The Swan.ogg", fonte whitehouse.gov). A composição está em domínio público; a gravação é obra do governo federal dos EUA; a execução está sob **Creative Commons Atribuição 3.0 Não Adaptada (CC BY 3.0)**, que exige crédito, link para a licença e indicação de que houve mudanças. Hoje o crédito só existe em comentários do código.

- Na parada do verso, no modo travessia, aparece uma linha pequena de crédito no canto inferior esquerdo da janela, com a margem esquerda do nome "MARCELA DE LUNA" e a base alinhada com a base da tela do verso. Tipografia do rodapé da capa, em tamanho de legenda (cerca de 0,7rem), largura máxima de cerca de 22rem.
- Texto: `Música: Camille Saint-Saëns, “O Cisne”. Alisa Weilerstein (violoncelo) e Jason Yoder (piano), Casa Branca, 2009. Gravação de whitehouse.gov, via Wikimedia Commons, sob licença CC BY 3.0. Editada: silêncio inicial e aplausos cortados.`
- "Wikimedia Commons" é link para a página do arquivo no Commons; "CC BY 3.0" é link para `https://creativecommons.org/licenses/by/3.0/`. Os links abrem em outra aba (`target="_blank"`, `rel="noopener noreferrer"`).
- O crédito segue as regras dos textos de parada: aparece com o verso em foco e some fora dele e com uma tela ampliada; os links só recebem ponteiro e foco de teclado enquanto ele está visível; ele barra a tinta (`data-barra-tinta`); não cobre a tela do verso nem o vulto em 1512×828, 1440×900 e 1280×700.
- O crédito só existe no modo travessia (a página base não tem música) e só quando o arquivo de áudio carregou (sem música, sem crédito). É criado em tempo de execução e removido em `desmontar()`.
- Os comentários de crédito em `site/index.html` e `site/js/ui/som.js` continuam.

## P2. Publicação pela pasta `site/`

O GitHub Pages só publica direto da raiz ou de `/docs`; como o site fica em `site/`, a publicação é feita por um fluxo do GitHub Actions.

- `.github/workflows/pages.yml`: a cada `push` no `main` (e por acionamento manual), um trabalho roda `node --test tests/*.test.mjs` (Node 22) e, se passar, outro publica a pasta `site/` no Pages (ações oficiais `actions/checkout`, `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`, nas versões principais atuais, conferidas na documentação). Permissões mínimas (`contents: read`, `pages: write`, `id-token: write`) e um grupo de concorrência para não sobrepor publicações.
- O repositório tem de se bastar: um clone limpo do `main` passa em `node --test tests/*.test.mjs` sem depender de arquivo ignorado (o PDF não vai para o repositório).
- O site funciona servido de um subcaminho (`/marcela-de-luna/`): nenhum caminho absoluto em `site/`.

## P3. README e avisos de direitos

`README.md` na raiz, curto, em português:

- o que é (site experimental do portfólio de pesquisa artística e pintura contemporânea de Marcela de Luna) e o endereço publicado;
- como abrir localmente (`sh tools/abrir-piloto.sh`) e como rodar os testes;
- direitos: as pinturas, as fotografias e os textos do portfólio são de Marcela de Luna, todos os direitos reservados, e não podem ser reutilizados sem autorização dela; o código do site não tem licença aberta;
- créditos de terceiros, com a licença de cada um conferida no próprio arquivo ou na fonte: three.js, GSAP, Lenis, a fonte Outfit e a gravação de "O Cisne" (como em P1).

## P4. Documentos

- `docs/piloto-roteiro.md`, seção "Como abrir": o passo que manda copiar o comando `cd` passa a dizer para digitar `cd ` (com um espaço), arrastar a pasta do projeto do Finder para o Terminal e apertar Enter, sem caminho escrito.
- `docs/pendencias-do-piloto.md`, seção "Publicação": saem os itens resolvidos (direitos da gravação); ficam, com o estado atual, os que não bloqueiam (cache de 10 minutos do GitHub Pages para módulos depois de uma atualização; peso das imagens e limite de banda do Pages; a capa de 640 px baixada duas vezes; `window.__site` e `?lento` no código; README de vendor); entra o que a revisão achar.
- `docs/2026-11-14-site-marcela-de-luna-design.md`: seção de hospedagem com o endereço, o fluxo de publicação e o crédito da música.

## Depois do "pode publicar" (não faz parte desta preparação)

Criar o repositório público `plsleite/marcela-de-luna`, enviar o `main`, ligar o Pages com origem "GitHub Actions", acompanhar a execução do fluxo e conferir o site no endereço publicado (abertura, travessia, música, crédito, nenhum pedido a outro domínio, nenhum erro no console).
