// Linha de crédito da música na parada do verso (só na travessia e só com a música carregada:
// ui/som.js a cria e a tira). Aparece e some com o verso em foco (travessia.css); barra a tinta
// do pincel (data-barra-tinta). O texto é core/credito.js.
import { CREDITO } from '../core/credito.js';

// → remover(), ou null sem a parada do verso.
export function criarCredito() {
  const verso = document.querySelector('.parada--verso');
  if (!verso) return null;
  const p = document.createElement('p');
  p.className = 'credito';
  p.dataset.barraTinta = '';
  for (const t of CREDITO) {
    if (typeof t === 'string') { p.append(t); continue; }
    const a = document.createElement('a');
    a.href = t.href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = t.texto;
    p.append(a);
  }
  verso.append(p);
  return () => p.remove();
}
