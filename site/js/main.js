import { PILOTO_ULTIMA_PAGINA } from './config.js';
import { montarBase } from './ui/base.js';

const raiz = document.getElementById('paradas');

async function json(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Falha ao carregar ${url}: HTTP ${r.status}`);
  return r.json();
}

try {
  const [{ stops }, images] = await Promise.all([json('./data/content.json'), json('./data/images.json')]);
  montarBase(raiz, stops.filter((s) => s.pagina <= PILOTO_ULTIMA_PAGINA), images);
} catch (erro) {
  console.error(erro);
  raiz.textContent = 'Não foi possível carregar o portfólio.';
}
