<?php
// Verbindungskonfiguration zur Datenbank einbinden
require_once("db_config.php");

// Gibt an, dass die Rückgabe im JSON-Format erfolgt
header('Content-Type: application/json');

try {
    // Aufbau der Datenbankverbindung mit PDO
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);

    // SQL-Abfrage: Holt den neuesten Eintrag aus der Tabelle 'Schachdaten'
    $stmt = $pdo->query("SELECT * FROM Schachdaten ORDER BY id DESC LIMIT 1");

    // Ergebnis der Abfrage als assoziatives Array holen
    $data = $stmt->fetch(PDO::FETCH_ASSOC);

    // Wenn Daten vorhanden sind, werden sie als JSON zurückgegeben
    if ($data) {
        echo json_encode([
            "licht" => $data["licht"],       // Zustand des Lichtsensors
            "distanz" => $data["distanz"],   // Abstandswert vom Sensor
            "nfc" => $data["nfc"],           // Ausgelesene NFC-ID
            "rotary" => $data["rotary"]      // Position des Drehencoders
        ]);
    } else {
        // Falls keine Daten gefunden wurden, Fehlermeldung im JSON-Format
        echo json_encode(["error" => "Keine Daten gefunden"]);
    }

} catch (PDOException $e) {
    // Bei einem Verbindungsfehler oder anderen DB-Fehlern, Rückgabe einer Fehlermeldung
    echo json_encode(["error" => "DB Fehler: " . $e->getMessage()]);
}
?>
