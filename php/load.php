<?php
require_once("db_config.php");
date_default_timezone_set("Europe/Zurich");

try {
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);
    echo "DB Verbindung erfolgreich<br>";
} catch (PDOException $e) {
    error_log("DB Error: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "DB connection failed"]);
    exit;
}

// Eingehende JSON-Daten lesen
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

if (json_last_error() !== JSON_ERROR_NONE || empty($input)) {
    echo json_encode(["status" => "error", "message" => "Invalid JSON input"]);
    exit;
}

// Eingabewerte extrahieren
$columns = ['nfc', 'licht', 'distanz', 'rotary'];
$updateFields = [];
$updateValues = [];

// Dynamisch nur die Spalten hinzufügen, die Werte haben
foreach ($columns as $column) {
    if (isset($input[$column])) {
        $updateFields[] = "$column = ?";
        $updateValues[] = $input[$column];
    }
}

// Letzten Datensatz holen
$sql = "SELECT * FROM Schachdaten ORDER BY id DESC LIMIT 1";
$stmt = $pdo->prepare($sql);
$stmt->execute();
$lastRow = $stmt->fetch(PDO::FETCH_ASSOC);

// Zeit vergleichen
$now = new DateTime();
$lastTime = isset($lastRow['zeit']) && !empty($lastRow['zeit']) ? DateTime::createFromFormat('Y-m-d H:i:s', $lastRow['zeit']) : null;
$intervalSeconds = $lastTime instanceof DateTime ? $now->getTimestamp() - $lastTime->getTimestamp() : PHP_INT_MAX;

// Entscheidung: Update oder Insert
if (!$lastRow || $intervalSeconds > 900) { // 15 Minuten = 900 Sekunden
    // Neue Zeile einfügen
    $sql = "INSERT INTO Schachdaten (" . implode(", ", $columns) . ", zeit) VALUES (" . implode(", ", array_fill(0, count($columns), "?")) . ", NOW())";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(array_map(fn($col) => $input[$col] ?? null, $columns));
    echo "Neue Zeile eingefügt.";
} else {
    // Nur die geänderten Spalten aktualisieren
    if (!empty($updateFields)) {
        $updateFields[] = "zeit = NOW()"; // Zeit immer aktualisieren
        $updateValues[] = $lastRow['id']; // ID für WHERE-Klausel
        $sql = "UPDATE Schachdaten SET " . implode(", ", $updateFields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($updateValues);
        echo "Letzte Zeile aktualisiert.";
    } else {
        echo "Keine Änderungen vorgenommen.";
    }
}
?>

trait_exists
