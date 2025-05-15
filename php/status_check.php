<?php
require_once("php/db_config.php");
header('Content-Type: application/json');

try {
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);
    $stmt = $pdo->query("SELECT * FROM Schachdaten ORDER BY id DESC LIMIT 1");
    $data = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($data) {
        echo json_encode([
            "licht" => $data["licht"],
            "distanz" => $data["distanz"],
            "nfc" => $data["nfc"],
            "rotary" => $data["rotary"]
        ]);
    } else {
        echo json_encode(["error" => "Keine Daten gefunden"]);
    }

} catch (PDOException $e) {
    echo json_encode(["error" => "DB Fehler: " . $e->getMessage()]);
}
?>
