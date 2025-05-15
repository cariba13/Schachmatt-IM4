async function checkStatus() {
  try {
    const res = await fetch('../php/status_check.php');
    const data = await res.json();

    if (data.error) {
      console.error(data.error);
      return;
    }




    const statuses = {
      rotary: data.rotary >= 9 && data.rotary <= 11,
      licht: data.licht == 1,
      nfc: data.nfc === "FF0F53DE3F0000",
      distanz: data.distanz >= 0 && data.distanz < 75
    };

    let solvedCount = 0;
    const zahlen = [3, 7, 5, 2];
    const circles = document.querySelectorAll(".circle");

    Object.entries(statuses).forEach(([id, ok], index) => {
      const button = document.getElementById(id);
      const circle = circles[index];

      if (button) {
        const statusSpan = button.querySelector(".status-icon");
        if (statusSpan) {
          statusSpan.innerHTML = ok ? "✔" : "✖";
          statusSpan.className = `status-icon ${ok ? 'ok' : 'nok'}`;
        }

        button.style.borderColor = ok
          ? "#397734"
          : ok === false
          ? "#B22222"
          : "var(--beige)";
      }

      if (circle) {
        if (ok) {
          circle.style.backgroundColor = "#397734";
          circle.textContent = zahlen[index];
          circle.style.color = "#f2f2f2";
        } else {
          circle.style.backgroundColor = "#F2F2F2";
          circle.textContent = "";
        }
      }

      solvedCount += ok ? 1 : 0;
    });

    const codeDisplay = document.getElementById("code-numbers");
    if (codeDisplay) {
      if (solvedCount === 4 && !codeDisplay.classList.contains("shown")) {
        setTimeout(() => {
          codeDisplay.style.display = "flex";
          codeDisplay.classList.add("shown");
        }, 2000);
      } else if (solvedCount < 4) {
        codeDisplay.style.display = "none";
        codeDisplay.classList.remove("shown");
      }
    }

  } catch (err) {
    console.error("Fehler beim Status-Check:", err);
  }
}

// Automatisch starten, wenn die Seite geladen ist
window.addEventListener("DOMContentLoaded", () => {
  checkStatus();
  setInterval(checkStatus, 5000);
});
