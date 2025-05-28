// === Popup-Steuerung ===
function showPopup() {
  const popup = document.getElementById("popup");
  if (popup) {
    popup.classList.remove("hidden");
    popup.classList.add("popupShow");
    console.log("Popup shown");
  } else {
    console.log("Popup element not found");
  }
}

function closePopup() {
  const popup = document.getElementById("popup");
  if (popup) {
    popup.classList.add("hidden");
    popup.classList.remove("popupShow");
    console.log("Popup hidden");
  } else {
    console.log("Popup element not found");
  }
}

// === RÄTSEL 1: ROTARY – Wert zwischen 9 und 11 ===
async function checkRotaryStatus() {
  const res = await fetch("../php/status_check.php");
  const data = await res.json();
  const rotary = data?.rotary;
  console.log("Rotary value:", rotary);

  if (rotary >= 9 && rotary <= 11) {
    console.log("Rotary in range (9-11)");
    showPopup();
  } else {
    console.log("Rotary out of range");
    closePopup();
  }
}

// === RÄTSEL 2: LICHT – Lichtwert genau 1 ===
async function checkLichtStatus() {
  const res = await fetch("../php/status_check.php");
  const data = await res.json();
  const licht = data?.licht;
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
  const nfc = data?.nfc;
  console.log("NFC value:", nfc);

  if (nfc === "FF0F53DE3F0000") {
    console.log('NFC matches "FF0F53DE3F0000"');
    showPopup();
  } else {
    console.log('NFC does not match "FF0F53DE3F0000"');
    closePopup();
  }
}

// === RÄTSEL 4: DISTANZ – Zwischen 0 und 75 (exklusiv 75) ===
async function checkDistanzStatus() {
  const res = await fetch("../php/status_check.php");
  const data = await res.json();
  const distanz = data?.distanz;
  console.log("Distanz value:", distanz);

  if (distanz >= 0 && distanz < 75) {
    console.log("Distanz in range (0-75)");
    showPopup();
  } else {
    console.log("Distanz out of range");
    closePopup();
  }
}

// checkRotaryStatus();
// checkLichtStatus();
// checkNfcStatus();
// checkDistanzStatus();

