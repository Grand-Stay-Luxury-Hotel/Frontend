// Frontend/server.mjs
import http from 'node:http';
import https from 'node:https';
import { createReadStream, existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const port = Number(process.env.FRONTEND_PORT ?? 5173);
const root = resolve(process.env.FRONTEND_ROOT ?? 'dist');
const apiTarget = new URL(process.env.BACKEND_URL ?? 'http://localhost:4000');

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

function proxyApi(req, res) {
  const client = apiTarget.protocol === 'https:' ? https : http;
  const pathname = new URL(req.url ?? '/', `http://localhost:${port}`).pathname;
  const search = new URL(req.url ?? '/', `http://localhost:${port}`).search;
  const path = `${pathname.replace(/^\/api/, '') || '/'}${search}`;

  const proxyReq = client.request(
    {
      protocol: apiTarget.protocol,
      hostname: apiTarget.hostname,
      port: apiTarget.port,
      method: req.method,
      path,
      headers: {
        ...req.headers,
        host: apiTarget.host,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: true, mensaje: 'No se pudo conectar con el backend' }));
  });

  req.pipe(proxyReq);
}

http.createServer((req, res) => {
  try {
    const pathname = new URL(req.url ?? '/', `http://localhost:${port}`).pathname;
    if (pathname.startsWith('/api')) {
      proxyApi(req, res);
      return;
    }

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
