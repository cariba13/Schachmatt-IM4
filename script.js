// Asynchrone Funktion zur Überprüfung des aktuellen Status der Rätsel
async function checkStatus() {
  try {
    // Anfrage an das PHP-Backend zur Statusprüfung senden
    const res = await fetch('../php/status_check.php');
    const data = await res.json();

    // Fehlerbehandlung bei Rückgabe eines Fehlers
    if (data.error) {
      console.error(data.error);
      return;
    }

    // Auswertung der Rückgabewerte aus PHP und Definition der Zustände
    const statuses = {
      rotary: Number.isInteger(data.rotary) && data.rotary >= 15 && data.rotary <= 19, // gültiger Zahlenbereich
      licht: data.licht == 1, // Lichtstatus
      nfc: data.nfc === "FF0F53DE3F0000", // spezifische NFC-ID
      distanz: data.distanz >= 0 && data.distanz < 75 // zulässiger Abstand
    };

    let solvedCount = 0; // Zähler für gelöste Rätsel
    const zahlen = [3, 7, 5, 2]; // Codezahlen, die angezeigt werden
    const circles = document.querySelectorAll(".circle"); // Anzeige-Elemente (Kreise im Footer)

    // Überprüfung und Anzeige jedes Status-Elements
    Object.entries(statuses).forEach(([id, ok], index) => {
      const button = document.getElementById(id); // Button zum jeweiligen Rätsel
      const circle = circles[index]; // Der entsprechende Kreis im Footer

      if (button) {
        const statusSpan = button.querySelector(".status-icon"); // Symbol ✔ oder ✖ im Button
        if (statusSpan) {
          // Symbol und Stil aktualisieren je nach Status
          statusSpan.innerHTML = ok ? "✔" : "✖";
          statusSpan.className = `status-icon ${ok ? 'ok' : 'nok'}`;
        }

        // Farbe des Button-Rahmens je nach Status ändern
        button.style.borderColor = ok
          ? "#397734" // grün bei Erfolg
          : ok === false
          ? "#B22222" // rot bei Fehler
          : "var(--beige)"; // Standardfarbe
      }

      if (circle) {
        if (ok) {
          // Kreis grün färben und Zahl anzeigen
          circle.style.backgroundColor = "#397734";
          circle.textContent = zahlen[index];
          circle.style.color = "#f2f2f2";
        } else {
          // Kreis zurücksetzen (hellgrau und leer)
          circle.style.backgroundColor = "#F2F2F2";
          circle.textContent = "";
        }
      }

      // Erfolg zählen
      solvedCount += ok ? 1 : 0;
    });

    // Anzeige des Codes, wenn alle vier Rätsel gelöst sind
    const codeDisplay = document.getElementById("code-numbers");
    if (codeDisplay) {
      if (solvedCount === 4 && !codeDisplay.classList.contains("shown")) {
        // Codeanzeige mit Verzögerung einblenden
        setTimeout(() => {
          codeDisplay.style.display = "flex";
          codeDisplay.classList.add("shown");
        }, 2000);
      } else if (solvedCount < 4) {
        // Codeanzeige ausblenden, wenn nicht alle Rätsel gelöst sind
        codeDisplay.style.display = "none";
        codeDisplay.classList.remove("shown");
      }
    }

  } catch (err) {
    // Fehler beim Abrufen oder Verarbeiten der Daten
    console.error("Fehler beim Status-Check:", err);
  }
}

// Startet den Status-Check automatisch, wenn die Seite geladen ist
window.addEventListener("DOMContentLoaded", () => {
  checkStatus(); // Erstprüfung beim Laden
  setInterval(checkStatus, 5000); // Alle 5 Sekunden wiederholen
});
