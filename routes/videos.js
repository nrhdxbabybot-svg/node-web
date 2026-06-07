const express  = require('express');
const router   = express.Router();
const path     = require('path');
const fs       = require('fs');
const { v4: uuidv4 } = require('uuid');

const db         = require('../db');
const upload     = require('../middleware/upload');
const requireKey = require('../middleware/auth');

const BASE_URL   = () => process.env.BASE_URL || 'http://localhost:3000';
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// ── Helper ────────────────────────────────────────────────────────
function videoResponse(v) {
  return {
    id:           v.uuid,
    title:        v.title,
    description:  v.description,
    url:          `${BASE_URL()}/uploads/${v.filename}`,
    embed_url:    `${BASE_URL()}/embed/${v.uuid}`,
    embed_iframe: `<iframe src="${BASE_URL()}/embed/${v.uuid}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`,
    thumbnail:    v.thumbnail ? `${BASE_URL()}/uploads/${v.thumbnail}` : null,
    mimetype:     v.mimetype,
    size_bytes:   v.size,
    size_mb:      (v.size / 1024 / 1024).toFixed(2),
    duration_sec: v.duration,
    views:        v.views,
    is_public:    !!v.is_public,
    created_at:   v.created_at,
  };
}

// ── POST /api/videos/upload ───────────────────────────────────────
// Upload video baru
router.post('/upload', requireKey, upload.single('video'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File video tidak disertakan.' });

    const { title, description, is_public } = req.body;
    if (!title) return res.status(400).json({ error: 'Field "title" wajib diisi.' });

    const uuid     = uuidv4();
    const isPublic = is_public === '0' ? 0 : 1;

    await db.execute(
      `INSERT INTO videos (uuid, title, description, filename, original_name, mimetype, size, is_public, api_key_used)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid,
        title,
        description || null,
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        isPublic,
        process.env.API_KEY ? process.env.API_KEY.substring(0, 8) + '***' : null,
      ]
    );

    const [rows] = await db.execute('SELECT * FROM videos WHERE uuid = ?', [uuid]);
    res.status(201).json({ success: true, video: videoResponse(rows[0]) });
  } catch (err) {
    // hapus file kalau gagal simpan ke DB
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
});

// ── GET /api/videos ───────────────────────────────────────────────
// List semua video publik, dengan pagination
router.get('/', async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : null;

    let where = 'WHERE is_public = 1';
    const params = [];

    if (search) {
      where += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(search, search);
    }

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM videos ${where}`, params
    );
    const [rows] = await db.execute(
      `SELECT * FROM videos ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      videos: rows.map(videoResponse),
    });
  } catch (err) { next(err); }
});

// ── GET /api/videos/:id ───────────────────────────────────────────
// Detail satu video + tambah view count
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM videos WHERE uuid = ? AND is_public = 1', [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Video tidak ditemukan.' });

    // log view
    await db.execute(
      'UPDATE videos SET views = views + 1 WHERE uuid = ?', [req.params.id]
    );
    await db.execute(
      'INSERT INTO view_logs (video_id, ip_address, user_agent) VALUES (?, ?, ?)',
      [rows[0].id, req.ip, (req.headers['user-agent'] || '').substring(0, 500)]
    );

    const [updated] = await db.execute('SELECT * FROM videos WHERE uuid = ?', [req.params.id]);
    res.json({ success: true, video: videoResponse(updated[0]) });
  } catch (err) { next(err); }
});

// ── PATCH /api/videos/:id ─────────────────────────────────────────
// Update title / description / is_public
router.patch('/:id', requireKey, async (req, res, next) => {
  try {
    const { title, description, is_public } = req.body;
    const [rows] = await db.execute('SELECT * FROM videos WHERE uuid = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Video tidak ditemukan.' });

    const newTitle  = title       !== undefined ? title       : rows[0].title;
    const newDesc   = description !== undefined ? description : rows[0].description;
    const newPublic = is_public   !== undefined ? (is_public == '1' ? 1 : 0) : rows[0].is_public;

    await db.execute(
      'UPDATE videos SET title = ?, description = ?, is_public = ? WHERE uuid = ?',
      [newTitle, newDesc, newPublic, req.params.id]
    );

    const [updated] = await db.execute('SELECT * FROM videos WHERE uuid = ?', [req.params.id]);
    res.json({ success: true, video: videoResponse(updated[0]) });
  } catch (err) { next(err); }
});

// ── DELETE /api/videos/:id ────────────────────────────────────────
// Hapus video dari DB dan disk
router.delete('/:id', requireKey, async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM videos WHERE uuid = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Video tidak ditemukan.' });

    const video = rows[0];
    // hapus file dari disk
    const filePath = path.join(__dirname, '..', UPLOAD_DIR, video.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db.execute('DELETE FROM videos WHERE uuid = ?', [req.params.id]);
    res.json({ success: true, message: `Video "${video.title}" berhasil dihapus.` });
  } catch (err) { next(err); }
});

// ── GET /api/videos/:id/stream ────────────────────────────────────
// Stream video dengan support Range Request (untuk scrubbing di browser)
router.get('/:id/stream', async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM videos WHERE uuid = ? AND is_public = 1', [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Video tidak ditemukan.' });

    const video    = rows[0];
    const filePath = path.join(__dirname, '..', UPLOAD_DIR, video.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File tidak ditemukan.' });

    const stat     = fs.statSync(filePath);
    const fileSize = stat.size;
    const range    = req.headers.range;

    if (range) {
      const parts  = range.replace(/bytes=/, '').split('-');
      const start  = parseInt(parts[0], 10);
      const end    = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range':  `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges':  'bytes',
        'Content-Length': chunkSize,
        'Content-Type':   video.mimetype,
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type':   video.mimetype,
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) { next(err); }
});

module.exports = router;
