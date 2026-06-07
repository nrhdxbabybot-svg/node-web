require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security & Middleware ──────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // kita handle manual di player
  crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiter ───────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 100,
  message: { error: 'Terlalu banyak request, coba lagi nanti.' }
});
app.use('/api/', limiter);

// ── Static Files (uploaded videos & thumbnails) ───────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// ── Routes ─────────────────────────────────────────────────────────
app.use('/api/videos', require('./routes/videos'));
app.use('/embed',      require('./routes/embed'));
app.use('/',           require('./routes/docs'));

// ── 404 Handler ────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
});

// ── Error Handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// ── Start ──────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅  Video API berjalan di http://0.0.0.0:${PORT}`);
  console.log(`📺  Embed player : ${process.env.BASE_URL}/embed/:uuid`);
  console.log(`📖  Dokumentasi  : ${process.env.BASE_URL}/`);
});
