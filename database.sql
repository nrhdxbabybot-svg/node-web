-- =============================================
-- Database Setup untuk Video API
-- Jalankan di phpMyAdmin atau MySQL CLI
-- =============================================

CREATE DATABASE IF NOT EXISTS videodb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE videodb;

-- Tabel videos
CREATE TABLE IF NOT EXISTS videos (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid        VARCHAR(36) NOT NULL UNIQUE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  filename    VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mimetype    VARCHAR(100) NOT NULL,
  size        BIGINT NOT NULL COMMENT 'ukuran file dalam bytes',
  duration    INT DEFAULT NULL COMMENT 'durasi dalam detik',
  thumbnail   VARCHAR(255) DEFAULT NULL,
  views       INT UNSIGNED DEFAULT 0,
  is_public   TINYINT(1) DEFAULT 1,
  api_key_used VARCHAR(64) DEFAULT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_uuid (uuid),
  INDEX idx_created (created_at),
  INDEX idx_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel api_keys (opsional, untuk multi-user)
CREATE TABLE IF NOT EXISTS api_keys (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  api_key     VARCHAR(64) NOT NULL UNIQUE,
  is_active   TINYINT(1) DEFAULT 1,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_apikey (api_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel view_logs (opsional, analytics sederhana)
CREATE TABLE IF NOT EXISTS view_logs (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  video_id   INT UNSIGNED NOT NULL,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  viewed_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  INDEX idx_video (video_id),
  INDEX idx_viewed (viewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User MySQL untuk aplikasi
-- Jalankan sebagai root:
-- CREATE USER 'videoapi'@'localhost' IDENTIFIED BY 'passwordkuat123';
-- GRANT ALL PRIVILEGES ON videodb.* TO 'videoapi'@'localhost';
-- FLUSH PRIVILEGES;
