<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$DB_HOST = '127.0.0.1';
$DB_NAME = 'pipper';
$DB_USER = 'root';
$DB_PASS = ''; // put a password if you set one
// If your MySQL runs on another port (e.g. 3307), add ;port=3307 in the DSN:
$dsn = "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4";

try {
  $pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'DB connect failed','detail'=>$e->getMessage()]);
  exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  $stmt = $pdo->query("SELECT id, username, message,
              DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%s') AS created_at
              FROM pips ORDER BY created_at DESC");
  echo json_encode($stmt->fetchAll());
  exit;
}

if ($method === 'POST') {
  $ctype = $_SERVER['CONTENT_TYPE'] ?? '';
  $data = (stripos($ctype,'application/json') !== false)
      ? json_decode(file_get_contents('php://input'), true)
      : $_POST;

  if (!is_array($data)) { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'Invalid JSON']); exit; }

  $username = trim($data['username'] ?? '');
  $message  = trim($data['message'] ?? '');

  if ($username === '' || $message === '') { http_response_code(400); echo json_encode(['ok'=>false,'error'=>'username and message required']); exit; }
  if (mb_strlen($username) > 30)           { http_response_code(413); echo json_encode(['ok'=>false,'error'=>'username too long']); exit; }
  if (mb_strlen($message)  > 255)          { http_response_code(413); echo json_encode(['ok'=>false,'error'=>'message too long']);  exit; }

  $username = strip_tags($username);
  $message  = strip_tags($message);

  $stmt = $pdo->prepare("INSERT INTO pips (username, message) VALUES (?, ?)");
  $stmt->execute([$username, $message]);
  $id = (int)$pdo->lastInsertId();

  $created = $pdo->prepare("SELECT DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%s') AS created_at FROM pips WHERE id=?");
  $created->execute([$id]);
  $row = $created->fetch();

  echo json_encode(['id'=>$id,'username'=>$username,'message'=>$message,'created_at'=>$row['created_at'] ?? date('Y-%m-%d %H:%i:%s')]);
  exit;
}

http_response_code(405);
echo json_encode(['ok'=>false,'error'=>'Method not allowed']);
