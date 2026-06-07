#!/bin/bash
# =====================================================================
# install.sh — Setup otomatis Video API di Armbian/Debian
# Jalankan sebagai root: bash install.sh
# =====================================================================

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

APP_DIR="/opt/video-api"
DB_NAME="videodb"
DB_USER="videoapi"
DB_PASS="$(openssl rand -base64 20 | tr -dc 'a-zA-Z0-9' | head -c 20)"
API_KEY="$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 40)"
PORT=3000

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║        Video API — Installer v1.0.0          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. Update & Install dependencies ─────────────────────────────
info "Memperbarui package list..."
apt-get update -q

info "Menginstall Node.js 20..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v && npm -v

info "Menginstall MySQL Server..."
if ! command -v mysql &>/dev/null; then
  apt-get install -y mysql-server mysql-client
  systemctl enable mysql
  systemctl start mysql
fi

info "Menginstall phpMyAdmin..."
if [ ! -d "/var/www/html/phpmyadmin" ]; then
  apt-get install -y phpmyadmin php php-mbstring php-zip php-gd php-json php-curl libapache2-mod-php apache2
  systemctl enable apache2
  systemctl start apache2
fi

# ── 2. Setup MySQL ─────────────────────────────────────────────────
info "Membuat database dan user MySQL..."
mysql -u root <<MYSQL
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
MYSQL

info "Menjalankan skema database..."
mysql -u root ${DB_NAME} < "$(dirname "$0")/database.sql"

# ── 3. Install aplikasi ────────────────────────────────────────────
info "Menyalin file aplikasi ke ${APP_DIR}..."
mkdir -p "${APP_DIR}"
cp -r "$(dirname "$0")/." "${APP_DIR}/"
cd "${APP_DIR}"

info "Install npm packages..."
npm install --production

info "Membuat folder uploads..."
mkdir -p "${APP_DIR}/uploads"
chmod 755 "${APP_DIR}/uploads"

# ── 4. Buat file .env ──────────────────────────────────────────────
LOCAL_IP=$(hostname -I | awk '{print $1}')
info "Membuat file .env..."
cat > "${APP_DIR}/.env" <<ENV
# Server
PORT=${PORT}
BASE_URL=http://${LOCAL_IP}:${PORT}

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASS}
DB_NAME=${DB_NAME}

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=500

# API Key
API_KEY=${API_KEY}

# Rate Limit
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
ENV

chmod 600 "${APP_DIR}/.env"

# ── 5. Setup PM2 (process manager) ────────────────────────────────
info "Menginstall PM2..."
npm install -g pm2

info "Menjalankan Video API dengan PM2..."
pm2 delete video-api 2>/dev/null || true
pm2 start "${APP_DIR}/server.js" --name video-api --env production
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

# ── 6. Install Cloudflare Tunnel ───────────────────────────────────
info "Menginstall Cloudflare Tunnel (cloudflared)..."
if ! command -v cloudflared &>/dev/null; then
  ARCH=$(dpkg --print-architecture)
  wget -q "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb" -O /tmp/cloudflared.deb
  dpkg -i /tmp/cloudflared.deb
fi

# ── 7. Buat script quick-tunnel ────────────────────────────────────
cat > /usr/local/bin/video-tunnel <<'TUNNEL'
#!/bin/bash
echo ""
echo "🌐 Membuka Cloudflare Quick Tunnel untuk Video API..."
echo "   (URL publik akan muncul di bawah, copy dan set BASE_URL di .env)"
echo ""
cloudflared tunnel --url http://localhost:3000
TUNNEL
chmod +x /usr/local/bin/video-tunnel

# ── 8. Ringkasan ───────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                   ✅  INSTALASI SELESAI                      ║"
echo "╠══════════════════════════════════════════════════════════════╣"
printf "║  Local URL    : http://%-39s║\n" "${LOCAL_IP}:${PORT}"
printf "║  phpMyAdmin   : http://%-39s║\n" "${LOCAL_IP}/phpmyadmin"
printf "║  API Key      : %-43s║\n" "${API_KEY}"
printf "║  DB User      : %-43s║\n" "${DB_USER}"
printf "║  DB Password  : %-43s║\n" "${DB_PASS}"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  Untuk tunnel publik, jalankan:                              ║"
echo "║    video-tunnel                                              ║"
echo "║  Lalu update BASE_URL di /opt/video-api/.env                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
warn "Simpan API Key dan password DB di tempat aman!"

# Simpan credentials ke file
cat > /root/video-api-credentials.txt <<CRED
=== Video API Credentials ===
Generated: $(date)

API_KEY=${API_KEY}
DB_USER=${DB_USER}
DB_PASS=${DB_PASS}
DB_NAME=${DB_NAME}

Local URL : http://${LOCAL_IP}:${PORT}
phpMyAdmin: http://${LOCAL_IP}/phpmyadmin
CRED
chmod 600 /root/video-api-credentials.txt
info "Credentials tersimpan di /root/video-api-credentials.txt"
