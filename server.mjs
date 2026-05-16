// Frontend/server.mjs
import http from 'node:http';
import { createReadStream, existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const port = Number(process.env.FRONTEND_PORT ?? 5173);
const root = resolve(process.env.FRONTEND_ROOT ?? 'dist');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
  try {
    const pathname = new URL(req.url ?? '/', `http://localhost:${port}`).pathname;
    const file = pathname === '/' ? 'index.html' : pathname.slice(1);
    const candidate = join(root, file);
    const target = existsSync(candidate) ? candidate : join(root, 'index.html');

    res.writeHead(200, { 'Content-Type': mime[extname(target)] ?? 'text/plain; charset=utf-8' });
    createReadStream(target).pipe(res);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: true, mensaje: 'Error sirviendo frontend' }));
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Frontend Grand-Stay disponible en puerto ${port}`);
});
