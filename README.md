# Marcela de Luna — portfólio

Site experimental do portfólio de pesquisa artística e pintura contemporânea de Marcela de Luna.

Endereço: https://plsleite.github.io/marcela-de-luna/

O site é estático (pasta `site/`, módulos ES sem etapa de build) e é publicado no GitHub Pages pelo fluxo `.github/workflows/pages.yml`, que roda os testes antes de cada publicação.

## Abrir localmente

Na pasta do projeto:

```sh
sh tools/abrir-piloto.sh
```

O comando copia o site para uma pasta de cache, sobe um servidor local e abre o navegador (Ctrl+C encerra).

## Testes

```sh
node --test tests/*.test.mjs
python3 -m unittest discover -s tools -p "test_*.py"
```

Os testes em JavaScript usam só o Node (22 ou mais novo), sem `npm install`. Os de Python cobrem as ferramentas de extração do acervo (`tools/`) e pedem o Pillow com suporte a WebP.

## Direitos

As pinturas, as fotografias e os textos do portfólio são de Marcela de Luna, com todos os direitos reservados, e não podem ser reutilizados sem autorização dela.

O código do site não tem licença aberta.

## Créditos de terceiros

- **three.js** 0.187.0 — licença MIT (Copyright 2010-2026 Three.js Authors), conforme o cabeçalho de `site/vendor/three.module.min.js` e `site/vendor/three.core.min.js`.
- **GSAP** 3.15.1 — licença padrão "no charge" da GreenSock (https://gsap.com/standard-license), conforme o pacote `gsap` de origem.
- **Lenis** 1.3.27 — licença MIT (Copyright 2024 darkroom.engineering), conforme o pacote `lenis` de origem.
- **Fonte Outfit** (`site/fonts/outfit-latin-wght-normal.woff2`, do pacote `@fontsource-variable/outfit` 5.3.0) — SIL Open Font License 1.1 (Copyright 2021 The Outfit Project Authors).
- **Música:** Camille Saint-Saëns, “O Cisne”. Alisa Weilerstein (violoncelo) e Jason Yoder (piano), Casa Branca, 2009. Gravação de whitehouse.gov, via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:20091104_Alisa_Weilerstein_and_Jason_Yoder_-_Saint_Sa%C3%ABns%27_The_Swan.ogg), sob licença [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Editada: silêncio inicial e aplausos cortados (`site/assets/audio/o-cisne.mp3`). A composição está em domínio público.
