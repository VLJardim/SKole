-- ----------------------------------------------
-- Pipper – Database skema (MySQL / MariaDB)
-- Opretter database 'pipper' og tabel 'pips'
-- Bruger utf8mb4 så emojis m.m. virker korrekt
-- ----------------------------------------------

-- 1) Opret database (hvis den ikke findes)
CREATE DATABASE IF NOT EXISTS pipper
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 2) Brug databasen
USE pipper;

-- 3) Opret tabel til pips
-- id:         Primær nøgle (auto increment)
-- username:   Brugernavn, maks 30 tegn (kravet i opgaven)
-- message:    Pip-besked, maks 255 tegn (kravet i opgaven)
-- created_at: Tidsstempel (nyeste kan sorteres øverst)
CREATE TABLE IF NOT EXISTS pips (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(30) NOT NULL,
  message  VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- (Valgfrit) Testdata:
-- INSERT INTO pips (username, message) VALUES
--   ('Admin', 'Velkommen til Pipper! 🎉'),
--   ('Victor', 'Første test-pip – det virker!');
