// Servidor estático mínimo (sin dependencias) para previsualizar el build de
// producción tal como se serviría en Cloudflare Pages. Incluye el fallback SPA
// a index.html. Uso: node scripts/preview-server.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'dist', 'calcula-facil', 'browser');
const port = 4300;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2',
};

createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
    let filePath = join(root, normalize(urlPath));
    if (urlPath === '/' || urlPath.endsWith('/')) filePath = join(root, 'index.html');

    let data;
    try {
      data = await readFile(filePath);
    } catch {
      // Fallback SPA: cualquier ruta no encontrada devuelve index.html.
      data = await readFile(join(root, 'index.html'));
      filePath = 'index.html';
    }

    // Sin caché, para que el favicon no quede pegado mientras pruebas.
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', types[extname(filePath)] ?? 'application/octet-stream');
    res.end(data);
  } catch (err) {
    res.statusCode = 500;
    res.end('Error: ' + err.message);
  }
}).listen(port, () => {
  console.log(`Preview de Chécalo en http://localhost:${port}/`);
});
