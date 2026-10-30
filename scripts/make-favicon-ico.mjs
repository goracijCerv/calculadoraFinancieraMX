// Genera public/favicon.ico (con la palomita de Chécalo) SIN dependencias.
//
// Dibuja a mano un bitmap RGBA de 64x64 con la identidad de marca:
//   - cuadro vino #782f40 con esquinas redondeadas,
//   - tarjeta crema #faf8f5 interior,
//   - palomita (check) en vino,
// luego lo codifica como PNG (zlib de Node) y lo empaqueta en un contenedor ICO.
//
// Uso: node scripts/make-favicon-ico.mjs
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const S = 64; // lado en px
const buf = Buffer.alloc(S * S * 4); // RGBA

const WINE = [0x78, 0x2f, 0x40];
const CREAM = [0xfa, 0xf8, 0xf5];

function set(x, y, [r, g, b], a = 255) {
  if (x < 0 || y < 0 || x >= S || y >= S) return;
  const i = (y * S + x) * 4;
  // composición simple sobre lo existente usando alfa
  const ia = a / 255;
  buf[i] = Math.round(r * ia + buf[i] * (1 - ia));
  buf[i + 1] = Math.round(g * ia + buf[i + 1] * (1 - ia));
  buf[i + 2] = Math.round(b * ia + buf[i + 2] * (1 - ia));
  buf[i + 3] = Math.max(buf[i + 3], a);
}

// Cobertura de un píxel dentro de un rectángulo redondeado (antialias por supersampleo 4x).
function roundedCoverage(px, py, x0, y0, x1, y1, radius) {
  let hits = 0;
  for (let sx = 0; sx < 4; sx++) {
    for (let sy = 0; sy < 4; sy++) {
      const x = px + (sx + 0.5) / 4;
      const y = py + (sy + 0.5) / 4;
      if (x < x0 || y < y0 || x > x1 || y > y1) continue;
      const cx = Math.min(Math.max(x, x0 + radius), x1 - radius);
      const cy = Math.min(Math.max(y, y0 + radius), y1 - radius);
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= radius * radius) hits++;
    }
  }
  return hits / 16;
}

// Distancia de un punto a un segmento (para dibujar el trazo de la palomita).
function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

// Escala desde el viewBox 512 del SVG a 64 px.
const k = S / 512;
const strokeHalf = (54 / 2) * k; // grosor del trazo / 2

for (let y = 0; y < S; y++) {
  for (let x = 0; x < S; x++) {
    // Cuadro vino exterior (rx 96 en 512)
    const outer = roundedCoverage(x, y, 0, 0, S, S, 96 * k);
    if (outer > 0) set(x, y, WINE, Math.round(outer * 255));

    // Tarjeta crema interior (x64 y64 384x384, rx64 en 512)
    const inner = roundedCoverage(x, y, 64 * k, 64 * k, (64 + 384) * k, (64 + 384) * k, 64 * k);
    if (inner > 0) set(x, y, CREAM, Math.round(inner * 255));

    // Palomita: dos segmentos (150,262)->(224,336)->(366,180) en coords 512
    const cx = x + 0.5;
    const cy = y + 0.5;
    const d1 = distToSeg(cx, cy, 150 * k, 262 * k, 224 * k, 336 * k);
    const d2 = distToSeg(cx, cy, 224 * k, 336 * k, 366 * k, 180 * k);
    const d = Math.min(d1, d2);
    // antialias en el borde del trazo (1px de transición)
    const edge = strokeHalf - d;
    if (edge > -1) {
      const a = Math.max(0, Math.min(1, edge + 0.5));
      if (a > 0) set(x, y, WINE, Math.round(a * 255));
    }
  }
}

// ---- Codificar como PNG -----------------------------------------------------
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let kk = 0; kk < 8; kk++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(b) {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0);
ihdr.writeUInt32BE(S, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
// raw con filtro 0 por fila
const raw = Buffer.alloc(S * (S * 4 + 1));
for (let y = 0; y < S; y++) {
  raw[y * (S * 4 + 1)] = 0;
  buf.copy(raw, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4);
}
const idat = deflateSync(raw, { level: 9 });
const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0)),
]);

// ---- Empaquetar en contenedor ICO (un PNG embebido) -------------------------
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type icon
header.writeUInt16LE(1, 4); // count
const entry = Buffer.alloc(16);
entry[0] = S === 256 ? 0 : S; // width
entry[1] = S === 256 ? 0 : S; // height
entry[2] = 0; // palette
entry[3] = 0; // reserved
entry.writeUInt16LE(1, 4); // planes
entry.writeUInt16LE(32, 6); // bpp
entry.writeUInt32LE(png.length, 8); // size
entry.writeUInt32LE(6 + 16, 12); // offset
const ico = Buffer.concat([header, entry, png]);

const out = join(process.cwd(), 'public', 'favicon.ico');
writeFileSync(out, ico);
console.log('favicon.ico generado: ' + out + ' (' + ico.length + ' bytes)');
