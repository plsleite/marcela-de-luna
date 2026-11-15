// Pincel (só com mouse): tinta no fundo branco, na cor viva da tela da parada atual, e letras
// dos títulos que se enchem de pintura. Não deposita sobre as telas; passa por baixo de todo
// texto, mais leve sobre os parágrafos da parada em foco (para não atrapalhar a leitura).
// Recebe tudo por parâmetro: palco, raiz, telas, porId (Map id → stop), images, estado
// (estado.id, estado.mergulho), criarTinta (gl/tinta.js), criarPreenchimento (ui/preenchimento.js)
// e retanguloProjetado (gl/tela.js).
import { aoAlcance } from '../core/janela.js';
import { corDaParada, distanciaAoRetangulo, forcaSobreTexto } from '../core/pincel.js';

export function montarPincel({ palco, raiz, telas, porId, images, estado, criarTinta, criarPreenchimento, retanguloProjetado }) {
  const p = { obstaculos: null };
  function obstaculos() {
    const telasNaJanela = [];
    const cz = palco.camera.position.z;
    for (const m of telas) {
      const d = cz - m.position.z; // telas visíveis (nem rente à câmera nem sumidas no branco,
      // nem a do cartão final que está de costas, nem com opacidade 0: ver travessia/cartao.js)
      if (m.visible && m.material.uniforms.uOpacidade.value > 0 && aoAlcance(d, m.userData.perto, m.userData.alcance)) {
        telasNaJanela.push(retanguloProjetado(m, palco.camera));
      }
    }
    const paragrafos = [...raiz.querySelectorAll('.em-foco .corpo')].map((el) => {
      const b = el.getBoundingClientRect();
      return { esq: b.left, dir: b.right, topo: b.top, base: b.bottom };
    });
    return { telasNaJanela, paragrafos };
  }
  const forca = (x, y) => {
    const o = (p.obstaculos ??= obstaculos());
    if (o.telasNaJanela.some((r) => distanciaAoRetangulo(x, y, r) === 0)) return 0;
    return forcaSobreTexto({ x, y }, o.paragrafos, { dentro: 0.3, faixa: 40 });
  };
  const tinta = criarTinta(palco, { forca });
  const preenchimento = criarPreenchimento(raiz);
  const aoMover = (e) => {
    if (e.pointerType !== 'mouse' || estado.mergulho) return;
    tinta.pintar(e.clientX, e.clientY, corDaParada(porId.get(estado.id), images));
    preenchimento.tocar(e.clientX, e.clientY);
  };
  const aoSair = (e) => { if (!e.relatedTarget) { tinta.romper(); preenchimento.romper(); } };
  addEventListener('pointermove', aoMover, { passive: true });
  document.addEventListener('mouseout', aoSair, { passive: true });
  const soltar = () => {
    removeEventListener('pointermove', aoMover);
    document.removeEventListener('mouseout', aoSair);
  };
  return {
    tinta,
    preenchimento,
    limparObstaculos() { p.obstaculos = null; }, // a câmera e os textos podem ter mudado
    // Cada passo no seu try/catch: um que falha não impede os outros.
    encerrar() {
      for (const passo of [soltar, () => tinta.liberar(), () => preenchimento.desfazer()]) {
        try { passo(); } catch (e) { console.error(e); }
      }
    },
  };
}
