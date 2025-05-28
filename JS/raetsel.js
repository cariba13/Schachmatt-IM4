// === Popup-Steuerung ===

// Funktion zum Anzeigen des Popups
function showPopup() {
  const popup = document.getElementById("popup");
  if (popup) {
    popup.classList.remove("hidden");    // Entfernt die Klasse, die das Element versteckt
    popup.classList.add("popupShow");    // Fügt eine Klasse für sichtbares Styling hinzu
    console.log("Popup shown");
  } else {
    console.log("Popup element not found");
  }
}

// Funktion zum Schliessen des Popups
function closePopup() {
  const popup = document.getElementById("popup");
  if (popup) {
    popup.classList.add("hidden");       // Versteckt das Element
    popup.classList.remove("popupShow"); // Entfernt sichtbares Styling
    console.log("Popup hidden");
  } else {
    console.log("Popup element not found");
  }
}

// === RÄTSEL 1: ROTARY – Wert muss zwischen 15 und 19 liegen ===
async function checkRotaryStatus() {
  const res = await fetch("../php/status_check.php");  // Holt Statusdaten vom Server
  const data = await res.json();
  const rotary = data?.rotary;                         // Extrahiert Rotary-Wert
  console.log("Rotary value:", rotary);

  // Zeigt Popup nur, wenn der Wert im gewünschten Bereich liegt
  if (rotary >= 15 && rotary <= 19) {
    console.log("Rotary in range (15-19)");
    showPopup();
  } else {
    console.log("Rotary out of range");
    closePopup();
  }
}

// === RÄTSEL 2: LICHT – Wert muss genau 1 sein ===
async function checkLichtStatus() {
  const res = await fetch("../php/status_check.php");
  const data = await res.json();
  const licht = data?.licht;             // Extrahiert Licht-Wert
  console.log("Licht value:", licht);

  if (licht == 1) {
    console.log("Licht is 1");
    showPopup();
  } else {
    console.log("Licht is not 1");
    closePopup();
  }
}

// === RÄTSEL 3: NFC – Wert muss exakt "FF0F53DE3F0000" sein ===
async function checkNfcStatus() {
  const res = await fetch("../php/status_check.php");
  const data = await res.json();
  const nfc = data?.nfc;                 // Extrahiert NFC-Wert
  console.log("NFC value:", nfc);

  if (nfc === "FF0F53DE3F0000") {
    console.log('NFC matches "FF0F53DE3F0000"');
    showPopup();
  } else {
    console.log('NFC does not match "FF0F53DE3F0000"');
    closePopup();
  }
}

// === RÄTSEL 4: DISTANZ – Muss zwischen 0 und 75 liegen (75 ausgeschlossen) ===
async function checkDistanzStatus() {
  const res = await fetch("../php/status_check.php");
  const data = await res.json();
  const distanz = data?.distanz;         // Extrahiert Distanz-Wert
  console.log("Distanz value:", distanz);

  if (distanz >= 0 && distanz < 75) {
    console.log("Distanz in range (0-75)");
    showPopup();
  } else {
    console.log("Distanz out of range");
    closePopup();
  }
}

// === Hinweis ===
// Die Funktionen sind definiert, aber aktuell auskommentiert.
// Um sie zu aktivieren, entferne die Kommentarzeichen:

// checkRotaryStatus();
// checkLichtStatus();
// checkNfcStatus();
// checkDistanzStatus();
// Diese Funktionen können einzeln aufgerufen werden, um den jeweiligen Status zu prüfen und das Popup anzuzeigen oder zu verstecken.