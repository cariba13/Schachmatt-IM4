<?php
require_once 'db_config.php';

$sql = "SELECT * FROM daten ORDER BY timestamp DESC LIMIT 1"; // ggf. Tabellennamen anpassen
$result = $conn->query($sql);

if ($result && $row = $result->fetch_assoc()) {
    $licht = $row['licht'];
    $distanz = $row['distanz'];
    $nfc = $row['nfc'] ?? ''; // optional, falls vorhanden

    $status = ($licht == 1 && $distanz < 100); // deine Bedingungen

    echo json_encode(['ok' => $status]);
} else {
    echo json_encode(['ok' => false]);
}

$conn->close();
?>
