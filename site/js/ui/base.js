// Página base: o conteúdo como página vertical simples. Roda no navegador e no Node.
// htmlDaParada é pura (sem DOM); montarBase é a única que usa o DOM.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

const SIZES = '(min-width: 900px) 45vw, 92vw';

function img(id, images, { alt = '', lazy = true, sizes = SIZES } = {}) {
  const m = images[id];
  if (!m) return '';
  const srcset = m.larguras.map((w) => `./assets/img/${id}-${w}.webp ${w}w`).join(', ');
  const src = `./assets/img/${id}-${m.larguras[Math.min(1, m.larguras.length - 1)]}.webp`;
  return `<img class="tela" src="${src}" srcset="${srcset}" sizes="${sizes}" width="${m.w}" height="${m.h}" alt="${esc(alt)}"${lazy ? ' loading="lazy" decoding="async"' : ''}>`;
}

const trechos = (p) => p.map((x) => (x.b ? `<strong>${esc(x.t)}</strong>` : esc(x.t))).join('');
const corpo = (ps) => `<div class="corpo">${ps.map((p) => `<p>${trechos(p)}</p>`).join('')}</div>`;

export function htmlDaParada(stop, images) {
  const abre = `<section class="parada parada--${esc(stop.tipo)}" id="${esc(stop.id)}" data-id="${esc(stop.id)}">`;
  let dentro = '';
  switch (stop.tipo) {
    case 'capa': {
      const c = stop.contato ?? {};
      const insta = String(c.instagram ?? '').replace(/^@/, '');
      dentro = `
<figure class="capa-pintura">${stop.imagens.map((id) => img(id, images, { alt: 'Pintura de bailarina, acrílica sobre tela, capa do portfólio', lazy: false, sizes: '(min-width: 900px) 55vw, 100vw' })).join('')}</figure>
<h1 class="titulo-secao capa-titulo">${esc(stop.titulo)}</h1>
<div class="capa-assinatura"><span class="nome">${esc(stop.nome)}</span><span class="ano">${esc(stop.ano)}</span></div>
<address class="contato">
<span class="rotulo">${esc(c.rotulo)}</span>
<span>${esc(c.telefone)}</span>
<a href="https://www.instagram.com/${esc(insta)}">${esc(c.instagram)}</a>
<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>
</address>
<div class="rodape">${esc(stop.rodape)}</div>`;
      break;
    }
    case 'texto':
    case 'abertura':
      dentro = `
<header class="cabecalho"><h2 class="titulo-secao">${esc(stop.titulo)}</h2>${stop.subtitulo ? `<div class="subtitulo">${esc(stop.subtitulo)}</div>` : ''}</header>
<div class="planos">${(stop.planos ?? []).map((pl) => img(pl.imagem, images)).join('')}</div>
${corpo(stop.paragrafos ?? [])}`;
      break;
    case 'obra': {
      const f = stop.ficha ?? {};
      const alt = `${stop.titulo}, ${f.tecnica}, ${f.dimensoes}, ${f.ano}`;
      dentro = `
<div class="telas telas--${stop.telas.length}">${stop.telas.map((id) => img(id, images, { alt })).join('')}</div>
<div class="legenda"><h2 class="obra-titulo">${esc(stop.titulo)}</h2><dl class="ficha"><div>${esc(f.tecnica)}</div><div>${esc(f.dimensoes)}</div><div>${esc(f.ano)}</div></dl></div>`;
      break;
    }
    case 'detalhe':
      dentro = `${stop.titulo ? `<h2 class="titulo-secao">${esc(stop.titulo)}</h2>` : ''}
<div class="closes">${stop.imagens.map((id) => img(id, images, { alt: 'Detalhe de pintura, acrílica sobre tela', sizes: '(min-width: 900px) 70vw, 100vw' })).join('')}</div>`;
      break;
    case 'verso':
      dentro = `<div class="closes">${stop.imagens.map((id) => img(id, images, { alt: 'Verso da tela, com a assinatura da artista', sizes: '(min-width: 900px) 55vw, 100vw' })).join('')}</div>`;
      break;
  }
  return `${abre}${dentro}\n</section>`;
}

export function montarBase(raiz, stops, images) {
  raiz.innerHTML = stops.map((s) => htmlDaParada(s, images)).join('\n');
}
