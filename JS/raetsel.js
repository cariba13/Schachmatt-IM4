function showPopup() {
  const popup = document.getElementById("popup");
  if (popup) {
    popup.classList.remove("hidden");
  }
}

// function closePopup() {
//   const popup = document.getElementById("popup");
//   if (popup) {
//     popup.classList.add("hidden");
//   }
// }


// ROTARY: Wert zwischen 9 und 11
async function checkRotaryStatus() {
  const res = await fetch("../php/status_check.php");
  const data = await res.json();
  const rotary = data?.rotary;
  
  if (rotary >= 9 && rotary <= 11) {
    showPopup();
  }
}

// LICHT: Lichtwert genau 1
async function checkLichtStatus() {
  const res = await fetch("../php/status_check.php");
  const data = await res.json();
  const licht = data.licht;
  
  if (licht == 1) {
    showPopup();
  }
}

// NFC: Muss exakt "FF0F53DE3F0000" sein
async function checkNfcStatus() {
  const res = await fetch("../php/status_check.php");
  const data = await res.json();
  const nfc = data?.nfc;
  
  if (nfc === "FF0F53DE3F0000") {
    showPopup();
  }
}

// DISTANZ: Zwischen 0 und 75 (nicht inkl. 75)
async function checkDistanzStatus() {
  const res = await fetch("../php/status_check.php");
  const data = await res.json();
  const distanz = data?.distanz;

  if (distanz >= 0 && distanz < 75) {
    showPopup();
  }
}
