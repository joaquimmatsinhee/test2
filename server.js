/**
 * AllContent — Node.js + Express + Neon PostgreSQL
 * A API roda no servidor (funciona no celular).
 *
 * Deploy: Render, Railway, Fly.io, VPS, etc.
 *   npm install && npm start
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const DATABASE_URL = (
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL ||
  'postgresql://neondb_owner:npg_my9MGUxd5rNc@ep-broad-lake-b526gxc3-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require'
).replace(/&channel_binding=[^&]+/g, '');

const sql = neon(DATABASE_URL);

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ——— API (servidor → Neon) ———

app.get('/api/videos', async (_req, res) => {
  try {
    const rows = await sql`
      SELECT
        id, title, description, price, video_url, thumbnail_url,
        duration, category, views_count, created_by, is_published, created_at
      FROM videos
      WHERE is_published = true OR is_published IS NULL
      ORDER BY created_at DESC
    `;
    res.json({ success: true, videos: rows });
  } catch (err) {
    console.error('[api/videos]', err);
    res.status(500).json({ success: false, error: err.message || String(err), videos: [] });
  }
});

app.get('/api/settings', async (_req, res) => {
  try {
    const rows = await sql`
      SELECT id, telegram_group_url, updated_at
      FROM app_settings
      WHERE id = 'default'
      LIMIT 1
    `;
    res.json({ success: true, settings: rows?.[0] || null });
  } catch (err) {
    console.error('[api/settings]', err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'allcontent-node', time: new Date().toISOString() });
});

// Arquivos estáticos (HTML/CSS/JS)
app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html'],
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
}));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[AllContent] http://0.0.0.0:${PORT}`);
  console.log(`[AllContent] Neon host: ${new URL(DATABASE_URL).hostname}`);
});
