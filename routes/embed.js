const express = require('express');
const router  = express.Router();
const db      = require('../db');

const BASE_URL = () => process.env.BASE_URL || 'http://localhost:3000';

// ── GET /embed/:id ────────────────────────────────────────────────
// Render halaman HTML player yang bisa di-embed via iframe
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM videos WHERE uuid = ? AND is_public = 1', [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).send(`
        <!DOCTYPE html><html><body style="background:#000;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
        <p>❌ Video tidak ditemukan atau bersifat privat.</p></body></html>
      `);
    }

    const v           = rows[0];
    const streamUrl   = `${BASE_URL()}/api/videos/${v.uuid}/stream`;
    const thumbUrl    = v.thumbnail ? `${BASE_URL()}/uploads/${v.thumbnail}` : '';
    const sizeDisplay = (v.size / 1024 / 1024).toFixed(1);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Frame-Options', 'ALLOWALL');

    res.send(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(v.title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0f0f0f;
      color: #eee;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .player-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #000;
    }
    video {
      width: 100%;
      flex: 1;
      max-height: calc(100vh - 60px);
      background: #000;
    }
    .info-bar {
      height: 60px;
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #161616;
      border-top: 1px solid #2a2a2a;
      gap: 12px;
    }
    .info-bar h1 {
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }
    .meta {
      font-size: 12px;
      color: #888;
      white-space: nowrap;
    }
    .badge {
      background: #e50914;
      color: #fff;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
      white-space: nowrap;
    }
    a.dl {
      color: #4a9eff;
      font-size: 12px;
      text-decoration: none;
    }
    a.dl:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="player-wrap">
    <video
      id="player"
      controls
      preload="metadata"
      playsinline
      ${thumbUrl ? `poster="${thumbUrl}"` : ''}
    >
      <source src="${streamUrl}" type="${v.mimetype}">
      Browser Anda tidak mendukung pemutar video HTML5.
    </video>
    <div class="info-bar">
      <h1>${escHtml(v.title)}</h1>
      <span class="meta">${sizeDisplay} MB</span>
      <span class="meta">${v.views} views</span>
      <span class="badge">HD</span>
      <a class="dl" href="${streamUrl}" download="${escHtml(v.original_name)}">⬇ Download</a>
    </div>
  </div>

  <script>
    // Kirim pesan tinggi ke parent untuk iframe auto-resize
    const player = document.getElementById('player');
    player.addEventListener('loadedmetadata', () => {
      window.parent.postMessage({ type: 'videoLoaded', uuid: '${v.uuid}' }, '*');
    });
  </script>
</body>
</html>`);
  } catch (err) { next(err); }
});

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = router;
