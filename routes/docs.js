const express  = require('express');
const router   = express.Router();

const BASE_URL = () => process.env.BASE_URL || 'http://localhost:3000';

router.get('/', (req, res) => {
  const base = BASE_URL();
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Video API — Dokumentasi</title>
  <style>
    :root {
      --bg: #0d1117; --surface: #161b22; --border: #30363d;
      --accent: #58a6ff; --green: #3fb950; --red: #f85149;
      --yellow: #d29922; --text: #c9d1d9; --muted: #8b949e;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--bg); color: var(--text); font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; line-height: 1.6; }
    header { background: var(--surface); border-bottom: 1px solid var(--border); padding: 20px 32px; display:flex; align-items:center; gap:12px; }
    header h1 { font-size: 20px; color: #fff; }
    header .version { background: var(--accent); color: #000; font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight:700; }
    .container { max-width: 900px; margin: 0 auto; padding: 32px 24px; }
    h2 { color: #fff; font-size: 18px; margin: 32px 0 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
    h3 { color: var(--accent); font-size: 15px; margin: 20px 0 8px; }
    p { color: var(--muted); margin-bottom: 10px; }
    .endpoint {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 8px; margin-bottom: 16px; overflow: hidden;
    }
    .endpoint-header {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; background: #1c2128; cursor: pointer;
    }
    .method {
      font-weight: 700; font-size: 12px; padding: 3px 10px;
      border-radius: 4px; font-family: monospace; min-width: 60px; text-align:center;
    }
    .GET    { background:#0d4a26; color: var(--green); }
    .POST   { background:#3d2b00; color: var(--yellow); }
    .PATCH  { background:#0c2d6b; color: var(--accent); }
    .DELETE { background:#4d0f0f; color: var(--red); }
    .path   { font-family: monospace; font-size: 14px; color: #fff; }
    .desc   { color: var(--muted); font-size: 13px; margin-left: auto; }
    .endpoint-body { padding: 16px; border-top: 1px solid var(--border); display:none; }
    .endpoint-body.open { display:block; }
    table { width:100%; border-collapse:collapse; font-size:13px; margin: 8px 0 12px; }
    th { text-align:left; color: var(--muted); font-weight:600; border-bottom:1px solid var(--border); padding:6px 8px; }
    td { padding:6px 8px; border-bottom:1px solid #21262d; vertical-align:top; }
    td:first-child { font-family:monospace; color: var(--accent); }
    td.req { color: var(--red); font-size:11px; font-weight:700; }
    pre {
      background:#010409; border:1px solid var(--border); border-radius:6px;
      padding:14px; overflow-x:auto; font-size:13px; font-family:'Courier New',monospace;
      color:#e6edf3; margin:8px 0;
    }
    code { background:#1c2128; padding:1px 5px; border-radius:3px; font-family:monospace; font-size:12px; }
    .badge-auth { background:#3d2b00; color:var(--yellow); font-size:11px; padding:2px 8px; border-radius:4px; font-weight:700; }
    .alert { background:#1c2128; border-left:3px solid var(--accent); padding:12px 16px; border-radius:0 6px 6px 0; margin:12px 0; font-size:13px; }
    .alert.warn { border-color: var(--yellow); }
    .toc { background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:16px; margin-bottom:24px; }
    .toc a { color:var(--accent); text-decoration:none; font-size:14px; display:block; padding:3px 0; }
    .toc a:hover { text-decoration:underline; }
  </style>
</head>
<body>
<header>
  <span style="font-size:28px">📺</span>
  <h1>Video API</h1>
  <span class="version">v1.0.0</span>
</header>

<div class="container">

  <div class="alert">
    <strong>Base URL:</strong> <code>${base}</code> &nbsp;|&nbsp;
    <strong>Auth:</strong> Header <code>X-API-Key: &lt;your-key&gt;</code> untuk endpoint yang membutuhkan autentikasi.
  </div>

  <div class="toc">
    <strong style="color:#fff">Daftar Isi</strong>
    <a href="#upload">POST /api/videos/upload</a>
    <a href="#list">GET /api/videos</a>
    <a href="#detail">GET /api/videos/:id</a>
    <a href="#stream">GET /api/videos/:id/stream</a>
    <a href="#update">PATCH /api/videos/:id</a>
    <a href="#delete">DELETE /api/videos/:id</a>
    <a href="#embed">GET /embed/:id</a>
    <a href="#contoh">Contoh Integrasi</a>
  </div>

  <!-- UPLOAD -->
  <h2 id="upload">📤 Upload Video</h2>
  <div class="endpoint">
    <div class="endpoint-header" onclick="toggle(this)">
      <span class="method POST">POST</span>
      <span class="path">/api/videos/upload</span>
      <span class="badge-auth">🔑 API Key</span>
      <span class="desc">Upload file video baru</span>
    </div>
    <div class="endpoint-body open">
      <p>Gunakan <code>multipart/form-data</code>. Header wajib: <code>X-API-Key</code>.</p>
      <table>
        <tr><th>Field</th><th>Tipe</th><th>Wajib</th><th>Keterangan</th></tr>
        <tr><td>video</td><td>file</td><td class="req">YA</td><td>File video (mp4, webm, ogg, avi, mkv). Maks ${process.env.MAX_FILE_SIZE||500} MB</td></tr>
        <tr><td>title</td><td>string</td><td class="req">YA</td><td>Judul video</td></tr>
        <tr><td>description</td><td>string</td><td>tidak</td><td>Deskripsi video</td></tr>
        <tr><td>is_public</td><td>0|1</td><td>tidak</td><td>Default 1 (publik). Set 0 untuk privat.</td></tr>
      </table>
      <h3>Contoh cURL</h3>
      <pre>curl -X POST ${base}/api/videos/upload \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -F "video=@/path/to/video.mp4" \\
  -F "title=Video Saya" \\
  -F "description=Deskripsi video"</pre>
      <h3>Response 201</h3>
      <pre>{
  "success": true,
  "video": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Video Saya",
    "description": "Deskripsi video",
    "url": "${base}/uploads/550e8400...mp4",
    "embed_url": "${base}/embed/550e8400...",
    "embed_iframe": "&lt;iframe src=\\"${base}/embed/550e8400...\\" width=\\"640\\" height=\\"360\\" frameborder=\\"0\\" allowfullscreen&gt;&lt;/iframe&gt;",
    "thumbnail": null,
    "mimetype": "video/mp4",
    "size_bytes": 10485760,
    "size_mb": "10.00",
    "duration_sec": null,
    "views": 0,
    "is_public": true,
    "created_at": "2026-06-08T10:00:00.000Z"
  }
}</pre>
    </div>
  </div>

  <!-- LIST -->
  <h2 id="list">📋 List Video</h2>
  <div class="endpoint">
    <div class="endpoint-header" onclick="toggle(this)">
      <span class="method GET">GET</span>
      <span class="path">/api/videos</span>
      <span class="desc">Daftar semua video publik</span>
    </div>
    <div class="endpoint-body open">
      <table>
        <tr><th>Query Param</th><th>Default</th><th>Keterangan</th></tr>
        <tr><td>page</td><td>1</td><td>Nomor halaman</td></tr>
        <tr><td>limit</td><td>10</td><td>Jumlah per halaman (maks 50)</td></tr>
        <tr><td>search</td><td>-</td><td>Cari berdasarkan judul/deskripsi</td></tr>
      </table>
      <h3>Contoh</h3>
      <pre>curl "${base}/api/videos?page=1&limit=5&search=tutorial"</pre>
    </div>
  </div>

  <!-- DETAIL -->
  <h2 id="detail">🔍 Detail Video</h2>
  <div class="endpoint">
    <div class="endpoint-header" onclick="toggle(this)">
      <span class="method GET">GET</span>
      <span class="path">/api/videos/:id</span>
      <span class="desc">Detail video + tambah view count</span>
    </div>
    <div class="endpoint-body">
      <pre>curl "${base}/api/videos/550e8400-e29b-41d4-a716-446655440000"</pre>
    </div>
  </div>

  <!-- STREAM -->
  <h2 id="stream">▶️ Stream Video</h2>
  <div class="endpoint">
    <div class="endpoint-header" onclick="toggle(this)">
      <span class="method GET">GET</span>
      <span class="path">/api/videos/:id/stream</span>
      <span class="desc">Stream video dengan Range Request (scrubbing)</span>
    </div>
    <div class="endpoint-body">
      <p>Mendukung HTTP Range Request sehingga browser bisa seek/scrub video.</p>
      <pre>&lt;video controls&gt;
  &lt;source src="${base}/api/videos/:id/stream" type="video/mp4"&gt;
&lt;/video&gt;</pre>
    </div>
  </div>

  <!-- UPDATE -->
  <h2 id="update">✏️ Update Video</h2>
  <div class="endpoint">
    <div class="endpoint-header" onclick="toggle(this)">
      <span class="method PATCH">PATCH</span>
      <span class="path">/api/videos/:id</span>
      <span class="badge-auth">🔑 API Key</span>
      <span class="desc">Update metadata video</span>
    </div>
    <div class="endpoint-body">
      <pre>curl -X PATCH ${base}/api/videos/:id \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Judul Baru","is_public":"0"}'</pre>
    </div>
  </div>

  <!-- DELETE -->
  <h2 id="delete">🗑️ Hapus Video</h2>
  <div class="endpoint">
    <div class="endpoint-header" onclick="toggle(this)">
      <span class="method DELETE">DELETE</span>
      <span class="path">/api/videos/:id</span>
      <span class="badge-auth">🔑 API Key</span>
      <span class="desc">Hapus video dari server dan database</span>
    </div>
    <div class="endpoint-body">
      <pre>curl -X DELETE ${base}/api/videos/:id \\
  -H "X-API-Key: YOUR_API_KEY"</pre>
    </div>
  </div>

  <!-- EMBED -->
  <h2 id="embed">🖼️ Embed Player</h2>
  <div class="endpoint">
    <div class="endpoint-header" onclick="toggle(this)">
      <span class="method GET">GET</span>
      <span class="path">/embed/:id</span>
      <span class="desc">Halaman player HTML untuk di-embed via iframe</span>
    </div>
    <div class="endpoint-body open">
      <p>Salin kode iframe berikut ke website Anda:</p>
      <pre>&lt;iframe
  src="${base}/embed/VIDEO_UUID"
  width="640"
  height="390"
  frameborder="0"
  allowfullscreen
  allow="autoplay; fullscreen"&gt;
&lt;/iframe&gt;</pre>
      <div class="alert warn">Player mendukung mp4, webm, ogg. Untuk browser lama, gunakan format mp4 H.264.</div>
    </div>
  </div>

  <!-- CONTOH INTEGRASI -->
  <h2 id="contoh">💡 Contoh Integrasi</h2>

  <h3>JavaScript (Fetch API)</h3>
  <pre>// Upload video
const formData = new FormData();
formData.append('video', fileInput.files[0]);
formData.append('title', 'Judul Video');

const res = await fetch('${base}/api/videos/upload', {
  method: 'POST',
  headers: { 'X-API-Key': 'YOUR_API_KEY' },
  body: formData,
});
const data = await res.json();
console.log(data.video.embed_url);</pre>

  <h3>PHP (cURL)</h3>
  <pre>$ch = curl_init('${base}/api/videos/upload');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => ['X-API-Key: YOUR_API_KEY'],
  CURLOPT_POSTFIELDS => [
    'video'       => new CURLFile('/path/to/video.mp4'),
    'title'       => 'Judul Video',
    'description' => 'Deskripsi',
  ],
  CURLOPT_RETURNTRANSFER => true,
]);
$response = json_decode(curl_exec($ch), true);
echo $response['video']['embed_url'];</pre>

  <h3>Python (requests)</h3>
  <pre>import requests

with open('video.mp4', 'rb') as f:
    r = requests.post(
        '${base}/api/videos/upload',
        headers={'X-API-Key': 'YOUR_API_KEY'},
        files={'video': f},
        data={'title': 'Judul Video'},
    )
print(r.json()['video']['embed_url'])</pre>

</div>

<script>
  function toggle(header) {
    const body = header.nextElementSibling;
    body.classList.toggle('open');
  }
</script>
</body>
</html>`);
});

module.exports = router;
