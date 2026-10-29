// Production entry point for Plesk Phusion Passenger Node.js
const fs = require('fs');
const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');

// 1. Explicitly load .env into process.env before anything else
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const key = trimmed.substring(0, idx).trim();
          let val = trimmed.substring(idx + 1).trim();
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    });
    console.log('[Plesk] Loaded environment variables from .env successfully.');
  } catch (e) {
    console.warn('[Plesk] Could not parse .env file:', e);
  }
}

// 2. Ensure default critical environment fallbacks
process.env.NODE_ENV = 'production';
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    'postgresql://neondb_owner:npg_Z6Jd4cYxbyGk@52.76.212.156:5432/neondb?sslmode=require&options=endpoint%3Dep-long-salad-b3w1konb';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'electricare_super_secret_jwt_key_2026_enterprise_production';
}

const next = require('next');
const dev = false;
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;
const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling request:', req.url, err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(`<!DOCTYPE html><html><body><h1>Internal Server Error</h1><pre>${err.stack || err.message || err}</pre></body></html>`);
      }
    }).listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ghar Tak production server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to prepare Next.js application:', err);
    process.exit(1);
  });
