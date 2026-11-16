// Crédito da gravação de "O Cisne" (CC BY 3.0: crédito, link para a licença e aviso de edição),
// em trechos: texto simples ou { texto, href } (link). Sem DOM; quem o mostra é ui/credito.js.

export const COMMONS = 'https://commons.wikimedia.org/wiki/File:20091104_Alisa_Weilerstein_and_Jason_Yoder_-_Saint_Sa%C3%ABns%27_The_Swan.ogg';
export const LICENCA = 'https://creativecommons.org/licenses/by/3.0/';

export const CREDITO = [
  'Música: Camille Saint-Saëns, “O Cisne”. Alisa Weilerstein (violoncelo) e Jason Yoder (piano), Casa Branca, 2009. Gravação de whitehouse.gov, via ',
  { texto: 'Wikimedia Commons', href: COMMONS },
  ', sob licença ',
  { texto: 'CC BY 3.0', href: LICENCA },
  '. Editada: silêncio inicial e aplausos cortados.',
];

export const textoDoCredito = (trechos) => trechos.map((t) => (typeof t === 'string' ? t : t.texto)).join('');
export const linksDoCredito = (trechos) => trechos.filter((t) => typeof t !== 'string');
