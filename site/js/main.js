import { PILOTO_ULTIMA_PAGINA } from './config.js';
import { montarBase } from './ui/base.js';

const [{ stops }, images] = await Promise.all([
  fetch('./data/content.json').then((r) => r.json()),
  fetch('./data/images.json').then((r) => r.json()),
]);

montarBase(
  document.getElementById('paradas'),
  stops.filter((s) => s.pagina <= PILOTO_ULTIMA_PAGINA),
  images,
);
