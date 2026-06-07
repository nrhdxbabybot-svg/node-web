# 📺 Video API

Web API untuk upload, stream, dan embed video. Dibangun dengan **Node.js + MySQL**, siap jalan di Armbian/Debian.

---

## 🖥️ Spesifikasi Sistem

| Komponen | Versi |
|---|---|
| Runtime | Node.js 20 LTS |
| Database | MySQL 8 + phpMyAdmin |
| Process Manager | PM2 |
| Tunnel Publik | Cloudflare Tunnel (cloudflared) |
| OS Target | Armbian / Debian Bookworm |

---

## ⚡ Instalasi Cepat (1 Perintah)

SSH ke Armbian sebagai **root**, lalu:

```bash
# Upload folder video-api ke server (dari PC lokal)
scp -r video-api root@192.168.100.27:/root/

# Masuk ke server
ssh root@192.168.100.27

# Jalankan installer
cd /root/video-api
chmod +x install.sh
bash install.sh
```

Installer akan otomatis:
- Install Node.js 20, MySQL, phpMyAdmin, Apache
- Buat database & user MySQL
- Setup file `.env` dengan password & API Key acak
- Jalankan API via PM2 (auto-restart)
- Install `cloudflared` untuk tunnel publik

---

## 🔧 Instalasi Manual (Step by Step)

### 1. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v  # harus v20.x.x
```

### 2. Install MySQL

```bash
apt-get install -y mysql-server
systemctl enable --now mysql

# Amankan instalasi
mysql_secure_installation
```

### 3. Setup Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE videodb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'videoapi'@'localhost' IDENTIFIED BY 'password_kuat_anda';
GRANT ALL PRIVILEGES ON videodb.* TO 'videoapi'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# Import skema tabel
mysql -u root -p videodb < /root/video-api/database.sql
```

### 4. Install phpMyAdmin

```bash
apt-get install -y apache2 php php-mbstring phpmyadmin
systemctl enable --now apache2
# Akses: http://192.168.100.27/phpmyadmin
```

### 5. Setup Aplikasi

```bash
cd /root/video-api
npm install

# Buat file .env
cp .env.example .env
nano .env
```

Edit `.env`:
```env
PORT=3000
BASE_URL=http://192.168.100.27:3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=videoapi
DB_PASSWORD=password_kuat_anda
DB_NAME=videodb

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=500

API_KEY=buat-key-panjang-acak-disini
```

```bash
mkdir -p uploads
```

### 6. Jalankan dengan PM2

```bash
npm install -g pm2

# Start
pm2 start server.js --name video-api

# Auto-start saat boot
pm2 save
pm2 startup

# Cek status
pm2 status
pm2 logs video-api
```

### 7. Cloudflare Tunnel (Akses Publik Tanpa Domain)

```bash
# Install cloudflared
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
dpkg -i cloudflared-linux-arm64.deb

# Jalankan quick tunnel (gratis, no signup)
cloudflared tunnel --url http://localhost:3000
```

Output akan menampilkan URL seperti:
```
https://random-name-xyz.trycloudflare.com
```

Update `BASE_URL` di `.env` dengan URL tersebut, lalu restart:
```bash
pm2 restart video-api
```

> **Catatan:** Quick tunnel URL berubah setiap restart. Untuk URL permanen, daftar di [dash.cloudflare.com](https://dash.cloudflare.com) (gratis).

---

## 📡 API Reference

### Autentikasi

Endpoint upload, update, delete memerlukan API Key di header:

```
X-API-Key: your-api-key
```

Atau via query string: `?api_key=your-api-key`

---

### POST /api/videos/upload
Upload video baru.

```bash
curl -X POST http://localhost:3000/api/videos/upload \
  -H "X-API-Key: YOUR_KEY" \
  -F "video=@video.mp4" \
  -F "title=Judul Video" \
  -F "description=Deskripsi opsional"
```

**Response:**
```json
{
  "success": true,
  "video": {
    "id": "uuid-video",
    "title": "Judul Video",
    "url": "http://server/uploads/file.mp4",
    "embed_url": "http://server/embed/uuid",
    "embed_iframe": "<iframe src=\"...\" width=\"640\" height=\"360\"></iframe>",
    "size_mb": "10.50",
    "views": 0,
    "created_at": "2026-06-08T10:00:00.000Z"
  }
}
```

---

### GET /api/videos
List video dengan pagination & search.

```bash
curl "http://localhost:3000/api/videos?page=1&limit=10&search=tutorial"
```

---

### GET /api/videos/:id
Detail video (view count +1).

```bash
curl "http://localhost:3000/api/videos/uuid-video"
```

---

### GET /api/videos/:id/stream
Stream video langsung (support scrubbing).

```html
<video controls>
  <source src="http://server/api/videos/uuid/stream" type="video/mp4">
</video>
```

---

### PATCH /api/videos/:id
Update metadata.

```bash
curl -X PATCH http://localhost:3000/api/videos/uuid \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Judul Baru","is_public":"0"}'
```

---

### DELETE /api/videos/:id
Hapus video (file + database).

```bash
curl -X DELETE http://localhost:3000/api/videos/uuid \
  -H "X-API-Key: YOUR_KEY"
```

---

### GET /embed/:id
Halaman player untuk iframe embed.

```html
<iframe
  src="http://server/embed/uuid"
  width="640"
  height="390"
  frameborder="0"
  allowfullscreen>
</iframe>
```

---

## 🔧 Perintah Berguna

```bash
# Lihat log real-time
pm2 logs video-api

# Restart API
pm2 restart video-api

# Lihat status semua proses
pm2 status

# Monitor resource
pm2 monit

# Buka tunnel publik
video-tunnel

# Backup database
mysqldump -u videoapi -p videodb > backup_$(date +%Y%m%d).sql
```

---

## 📁 Struktur File

```
video-api/
├── server.js          # Entry point
├── db.js              # Koneksi MySQL pool
├── package.json
├── .env               # Konfigurasi (jangan di-commit!)
├── .env.example       # Template konfigurasi
├── database.sql       # Skema database
├── install.sh         # Installer otomatis
├── middleware/
│   ├── auth.js        # Validasi API Key
│   └── upload.js      # Multer config
├── routes/
│   ├── videos.js      # CRUD + stream endpoint
│   ├── embed.js       # Player HTML
│   └── docs.js        # Halaman dokumentasi web
└── uploads/           # Folder file video (auto-created)
```

---

## 🛡️ Keamanan

- API Key wajib untuk semua operasi write
- Rate limiting (100 req/15 menit default)
- Helmet.js untuk HTTP security headers
- File upload hanya menerima format video
- Ukuran file dibatasi (default 500 MB)
- File disimpan dengan nama UUID acak

---

## 📊 phpMyAdmin

Akses: `http://192.168.100.27/phpmyadmin`

Login dengan user `videoapi` atau `root` MySQL untuk melihat dan mengelola data video, view logs, dan API keys.
