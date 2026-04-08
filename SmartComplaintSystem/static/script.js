// ════════════════════════════════════════
//  SmartComplaints — script.js
// ════════════════════════════════════════

// ── Priority radio button styling ──
document.addEventListener("DOMContentLoaded", function () {

  // Style priority labels based on checked radio
  const radios = document.querySelectorAll('input[name="priority"]');
  const labels = document.querySelectorAll('.priority-btn');

  function updatePriorityStyle() {
    radios.forEach(function (radio) {
      const label = document.querySelector('label[for="' + radio.id + '"]');
      if (!label) return;
      // Reset
      label.style.borderColor = "";
      label.style.color = "";
      label.style.background = "";
      if (radio.checked) {
        if (radio.value === "Low") {
          label.style.borderColor = "#4caf7d";
          label.style.color = "#4caf7d";
          label.style.background = "rgba(76,175,125,0.08)";
        } else if (radio.value === "Medium") {
          label.style.borderColor = "#c9a84c";
          label.style.color = "#c9a84c";
          label.style.background = "rgba(201,168,76,0.08)";
        } else if (radio.value === "High") {
          label.style.borderColor = "#e05c5c";
          label.style.color = "#e05c5c";
          label.style.background = "rgba(224,92,92,0.08)";
        }
      }
    });
  }

  radios.forEach(function (radio) {
    radio.addEventListener("change", updatePriorityStyle);
  });

  // Run once on load
  updatePriorityStyle();

  // ── Auto-dismiss flash messages ──
  const alerts = document.querySelectorAll(".alert-auto");
  alerts.forEach(function (alert) {
    setTimeout(function () {
      alert.style.opacity = "0";
      alert.style.transform = "translateY(-10px)";
      alert.style.transition = "all 0.4s ease";
      setTimeout(function () { alert.remove(); }, 400);
    }, 4000);
  });

  // ── Form validation feedback ──
  const form = document.getElementById("complaintForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      const btn = form.querySelector(".btn-primary");
      if (btn) {
        btn.textContent = "Submitting…";
        btn.style.opacity = "0.7";
      }
    });
  }

  // ── Fade-up animation on scroll ──
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".step-card, .kpi-card").forEach(function (el) {
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    el.style.transition = "opacity 0.5s ease, transform 0.5s ease";
    observer.observe(el);
  });

});