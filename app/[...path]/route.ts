import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';

const ROOT = join(process.cwd(), 'static-pages');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const rel = (params.path || []).join('/');
  // Prevent traversal
  const safe = normalize('/' + rel).replace(/^\/+/, '');
  if (safe.includes('..')) return new NextResponse('forbidden', { status: 403 });

  const full = join(ROOT, safe);
  try {
    const s = await stat(full);
    if (s.isDirectory()) {
      const idx = join(full, 'index.html');
      const buf = await readFile(idx);
      return new NextResponse(buf, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    }
    const buf = await readFile(full);
    const ct = MIME[extname(full).toLowerCase()] || 'application/octet-stream';
    return new NextResponse(buf, { headers: { 'content-type': ct } });
  } catch {
    return new NextResponse('not found', { status: 404 });
  }
}
