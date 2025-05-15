NFC: ID Wert
licht: 0=Hell 1=dunkel
distanz: Zahl
rotary: Zahl


# PROJEKT DOKUMENTATION - SCHACHMATT

## Inhaltsverzeichnis

1. [Projektbeschreibung](#Projektbeschreibung)
2. [Hardware-Setup und Code](#hardware-setup-und-Code)
3. [Kapitel 0](#Kapitel)
4. [Kapitel 1](#Kapitel-1)  
5. [Kapitel 2](#Kapitel-2)  
6. [Kapitel 3](#Kapitel-3)  


## Projektbeschreibung

Lorem Ipsum....



## Hardware-Setup und Code

### Lichtsensor
Lorem Ipsum

---

### Distanzsensor
Lorem Ipsum

---

### NFC Reader
Lorem Ipsum

---

### Drehregler

Funktionsweise:
1. Der Rotary Encoder wird via Interrupt abgefragt.
2. Die Bewegung wird als relative Position (von 0 bis `NUM_POSITIONS - 1`) interpretiert.
3. Nach einer kurzen Stabilitätsverzögerung (5 Sekunden ohne weitere Bewegung) wird die Position via HTTP POST als JSON an einen Server gesendet.

Hardware-Setup

| Komponente       | Anschluss ESP32 |
|------------------|-----------------|
| Rotary Encoder A | GPIO 2 (ENC_A)  |
| Rotary Encoder B | GPIO 3 (ENC_B)  |




für im body vom index.html

<div id="status-icon">⏳ Lade...</div>

<script>
function checkStatus() {
  fetch("php/status_check.php")
    .then(res => res.json())
    .then(data => {
      document.getElementById("status-icon").textContent = data.ok ? "✅ Erfüllt" : "❌ Noch offen";
    })
    .catch(() => {
      document.getElementById("status-icon").textContent = "⚠️ Fehler";
    });
}

// beim Laden + alle 10 Sekunden erneut prüfen
checkStatus();
setInterval(checkStatus, 10000);
</script>
