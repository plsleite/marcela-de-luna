import { test } from 'node:test'; import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const { stops } = JSON.parse(readFileSync('site/data/content.json', 'utf8'));
const imgs = JSON.parse(readFileSync('site/data/images.json', 'utf8'));
const pdf = readFileSync('tools/pdf-text.txt', 'utf8').replace(/\s+/g, ' ');
const obras = stops.filter(s => s.tipo === 'obra');
const texto = s => s.paragrafos.map(p => p.map(x => x.t).join('')).join(' ');
const negrito = s => s.paragrafos.flat().filter(x => x.b).map(x => x.t).join(' ').replace(/\s+/g, ' ');

test('58 paradas na ordem das páginas', () => {
  assert.deepEqual(stops.map(s => s.pagina), Array.from({ length: 58 }, (_, i) => i + 1));
  assert.equal(new Set(stops.map(s => s.id)).size, 58);
});
test('obras e telas', () => {
  assert.equal(obras.length, 29);
  assert.equal(obras.filter(o => o.serie === 'a-bailarina').length, 20);
  assert.equal(obras.flatMap(o => o.telas).length, 35);
  assert.deepEqual(obras.filter(o => o.telas.length === 2).map(o => o.pagina), [6, 7, 12, 14, 15, 16]);
  for (const o of obras) { assert.equal(o.ficha.tecnica, 'acrílica sobre tela'); assert.equal(o.ficha.ano, '2026'); }
  assert.equal(stops[22].titulo, 'DÚVIDEI');
  assert.equal(stops[3].ficha.dimensoes, '30 x 40 cm');
  assert.equal(stops[10].ficha.dimensoes, '30 x 20 cm');
});
test('detalhes e verso', () => {
  assert.equal(stops.filter(s => s.tipo === 'detalhe').length, 24);
  assert.equal(stops[23].titulo, 'DETALHES'); assert.equal(stops[49].titulo, 'DETALHES');
  assert.equal(stops[57].tipo, 'verso');
});
test('todo texto extraível confere com o PDF', () => {
  for (const s of stops.filter(s => s.paragrafos))
    for (const p of s.paragrafos) assert.ok(pdf.includes(p.map(x => x.t).join('').replace(/\s+/g, ' ').trim()), s.id);
  for (const o of obras) assert.ok(pdf.includes(o.titulo), o.titulo);
});
test('subtítulos e negritos', () => {
  assert.equal(stops[1].subtitulo, 'A mulher como campo de investigação');
  assert.equal(stops[2].subtitulo, 'CORPO, MOVIMENTO E EXPRESSÃO');
  assert.equal(stops[39].subtitulo, 'FIGURA, IDENTIDADE E SUBJETIVIDADE');
  assert.equal(negrito(stops[1]), 'identidade, subjetividade, força, vulnerabilidade e transformação.');
  assert.equal(negrito(stops[2]), 'Para além da representação da dança, investigo a figura feminina como presença expressiva, atravessada por forças e vulnerabilidades.');
  assert.equal(negrito(stops[39]), 'A pintura torna-se um espaço de experimentação, no qual cor, matéria e gesto participam da construção de estados emocionais e dimensões interiores.');
  assert.equal(stops[1].paragrafos.length, 4);
});
test('capa', () => {
  const c = stops[0];
  assert.equal(c.titulo, 'PORTFÓLIO'); assert.equal(c.nome, 'MARCELA DE LUNA'); assert.equal(c.ano, '2026');
  assert.deepEqual(c.contato, { rotulo: 'PROJETOS | CONTATO', telefone: '+55 21 996602668', instagram: '@marceladeluna_art', email: 'marceladeluna.art@gmail.com' });
  assert.equal(c.rodape, 'PESQUISA ARTÍSTICA | PINTURA CONTEMPORÂNEA');
});
test('toda imagem citada existe e nenhuma sobra', () => {
  const usadas = stops.flatMap(s => [...(s.imagens ?? []), ...(s.telas ?? []), ...(s.planos ?? []).map(p => p.imagem)]);
  for (const id of usadas) assert.ok(imgs[id], id);
  assert.equal(new Set(usadas).size, 65);
});
