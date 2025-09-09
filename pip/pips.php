<?php
// Pipper – simpel API (GET + POST på samme URL)

declare(strict_types=1);

// ----- HEADERS (JSON + dev CORS) -----
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

// ----- HJÆLPER TIL JSON SVAR -----
function send_json($data, int $code = 200): void {
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

// ----- DB KONFIG -----
$DB_HOST = '127.0.0.1';
$DB_NAME = 'pipper';
$DB_USER = 'root';
$DB_PASS = ''; // sæt evt. dit root-password her
// Hvis din MySQL kører på en anden port (fx 3307), tilføj ;port=3307 herunder
$dsn = "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4";

try {
  $pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
} catch (PDOException $e) {
  send_json(['ok' => false, 'error' => 'DB connect failed', 'detail' => $e->getMessage()], 500);
}

$method = $_SERVER['REQUEST_METHOD'];

// ----- GET: alle pips (nyeste først) -----
if ($method === 'GET') {
  $sql = "SELECT id, username, message,
          DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
          FROM pips ORDER BY created_at DESC";
  $rows = $pdo->query($sql)->fetchAll();
  send_json($rows);
}

// ----- POST: opret pip -----
if ($method === 'POST') {
  $ctype = $_SERVER['CONTENT_TYPE'] ?? '';
  $data = (stripos($ctype, 'application/json') !== false)
    ? json_decode(file_get_contents('php://input'), true)
    : $_POST;

  if (!is_array($data)) {
    send_json(['ok' => false, 'error' => 'Invalid JSON body'], 400);
  }

  $username = trim((string)($data['username'] ?? ''));
  $message  = trim((string)($data['message'] ?? ''));

  if ($username === '' || $message === '') {
    send_json(['ok' => false, 'error' => 'username and message are required'], 400);
  }
  if (mb_strlen($username) > 30) {
    send_json(['ok' => false, 'error' => 'username too long (max 30)'], 413);
  }
  if (mb_strlen($message) > 255) {
    send_json(['ok' => false, 'error' => 'message too long (max 255)'], 413);
  }

  // simpel sanitization
  $username = strip_tags($username);
  $message  = strip_tags($message);

  $stmt = $pdo->prepare("INSERT INTO pips (username, message) VALUES (?, ?)");
  $stmt->execute([$username, $message]);
  $id = (int)$pdo->lastInsertId();

  $row = $pdo->prepare("SELECT DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at FROM pips WHERE id = ?");
  $row->execute([$id]);
  $created = $row->fetch();

  send_json([
    'id'         => $id,
    'username'   => $username,
    'message'    => $message,
    'created_at' => $created['created_at'] ?? date('Y-m-d H:i:s'),
  ], 200);
}

// ----- Fejl: metode ikke tilladt -----
send_json(['ok' => false, 'error' => 'Method not allowed'], 405);
