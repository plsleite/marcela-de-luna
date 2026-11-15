// Cartão final (core/final.js): se as duas últimas paradas são o último close e o verso, as duas
// telas formam um cartão que acompanha a câmera entre os dois focos, centraliza e gira meia volta.
// Face única (gl/tela.js): a tela do verso nasce de costas e não aparece nem responde ao ponteiro
// até o giro passar de π/2. No meio do giro a luz rasante dessas telas fica neutra
// (travessia/luz.js supõe tela sem rotação) e o clique nelas viaja em vez de ampliar.
// Com o último close em foco, um vulto do verso (só a miniatura, fora do carregamento) aparece do
// lado oposto; userData.vulto o separa da tela do verso, e o clique nele sempre viaja.
// Recebe tudo por parâmetro: stops, linha, images, telas (as das paradas, já criadas), palco,
// criarTela (gl/tela.js), estado (estado.mergulho) e ampliada() → true com uma tela ampliada ou
// na volta dela. A tela do vulto sai da cena em encerrar().
import { VERSO, VISIBILIDADE } from '../config.js';
import { focoDe, emFoco } from '../core/timeline.js';
import { naVista } from '../core/janela.js';
import { cartaoFinal, noMeioDoGiro, giroDaFace, deCostas, opacidadeDoVulto } from '../core/final.js';

const SOME_MS = 600; // com uma tela ampliada, o vulto some com as outras (gsap, 0,6 s, no mergulho)

export function montarCartao({ stops, linha, images, telas, palco, criarTela, estado, ampliada }) {
  const [a, b] = stops.slice(-2);
  if (!a || !b || a.tipo !== 'detalhe' || b.tipo !== 'verso') {
    return { vultos: [], emFocoParaClique: (vh) => emFoco(linha, vh), quadro() {}, usarMiniaturas() {}, encerrar() {} };
  }
  const tela = (id) => telas.find((m) => m.userData.stopId === id && m.userData.indiceTela === 0);
  const faces = { frente: tela(a.id), verso: tela(b.id) };
  const medidas = ({ x, y, altura }) => ({ x, y, altura });
  const p = { focoFrente: focoDe(linha, a.id), focoVerso: focoDe(linha, b.id),
    frente: medidas(faces.frente.userData.plano), verso: medidas(faces.verso.userData.plano) };
  let giro = 0;

  // Com uma tela ampliada, o cartão não se move: luzNeutra e deCostas ficam os da pose congelada,
  // que continuam a descrevê-la (e a ampliação só abre num foco, com giro 0 ou π).
  function mover(vh) {
    const c = cartaoFinal(vh, p);
    for (const face of ['frente', 'verso']) {
      const m = faces[face];
      m.position.set(c.x, c.y, c.z);
      m.rotation.y = giroDaFace(c.giro, face);
      m.scale.setScalar(c.altura / p[face].altura);
      m.userData.luzNeutra = noMeioDoGiro(c.giro);
      m.userData.deCostas = deCostas(c.giro, face); // não é desenhada nem barra o pincel
    }
    giro = c.giro;
  }

  // Vulto do verso: no z do verso, do lado oposto ao do close. Opacidade 0 o tira do ponteiro, da
  // luz e do pincel; `presenca` o apaga junto com as outras telas quando uma é ampliada.
  const plano = { ...faces.verso.userData.plano, ...VERSO.vulto };
  const vulto = criarTela(plano, { stopId: b.id, indiceTela: null, cor: images[plano.imagem].cor, visibilidade: VISIBILIDADE });
  vulto.userData.vulto = true;
  palco.cena.add(vulto);
  const u = vulto.material.uniforms;
  let presenca = 1;

  return {
    vultos: [vulto],
    // Parada clicável como "em foco": nenhuma com o cartão no meio do giro (aí a tela da parada
    // leva ao foco dela, em vez de ampliar), e nunca para o vulto (o clique nele viaja).
    emFocoParaClique: (vh, mesh = null) => (mesh?.userData.vulto || noMeioDoGiro(giro) ? null : emFoco(linha, vh)),
    // Depois da câmera e antes da luz (luzNeutra) e do mesh.visible das telas.
    quadro(vh, dt) {
      if (!estado.mergulho) mover(vh);
      presenca = ampliada() ? Math.max(0, presenca - dt / SOME_MS) : Math.min(1, presenca + dt / SOME_MS);
      u.uOpacidade.value = opacidadeDoVulto(vh, p) * presenca;
      vulto.visible = u.uOpacidade.value > 0 && naVista(palco.camera.position.z - vulto.position.z, vulto.userData.alcance);
    },
    usarMiniaturas(mapa) {
      const mini = mapa.get(plano.imagem);
      if (mini) { u.uMapa.value = mini; u.uTemMapa.value = 1; }
    },
    encerrar() {
      palco.cena.remove(vulto);
      vulto.geometry.dispose();
      vulto.material.dispose();
    },
  };
}
