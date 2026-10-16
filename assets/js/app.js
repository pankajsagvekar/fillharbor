/**
 * FillHarbor Website — Interactive Simulation Controller
 * Demonstrates real-time localized profile generation and persona Likert weighting.
 */

"use strict";

const SAMPLE_DATA = {
  in: {
    firstNames: ["Aarav", "Priya", "Rahul", "Ananya", "Rohan", "Sneha", "Aditya", "Neha", "Vikram", "Kavya"],
    lastNames:  ["Sharma", "Patel", "Verma", "Rao", "Gupta", "Mehta", "Singh", "Nair", "Kulkarni", "Deshmukh"],
    domains:    ["gmail.com", "outlook.com", "yahoo.in"],
    institutions: [
      "Government Medical & Dental College",
      "National Institute of Health Sciences",
      "Apex Institute of Dental Sciences",
      "Indian Institute of Science & Technology",
      "Symbiosis International University"
    ]
  },
  us: {
    firstNames: ["James", "Emma", "Michael", "Olivia", "William", "Sophia", "Alexander", "Charlotte", "Ethan", "Amelia"],
    lastNames:  ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson", "Anderson", "Taylor"],
    domains:    ["gmail.com", "yahoo.com", "outlook.com"],
    institutions: [
      "State University Health Sciences Center",
      "Northwestern Medical Institute",
      "Boston Research Foundation",
      "Pacific Northwest Dental Academy",
      "Midwest Institute of Technology"
    ]
  },
  uk: {
    firstNames: ["Oliver", "George", "Harry", "Jack", "Jacob", "Noah", "Charlie", "Thomas", "Arthur", "Oscar"],
    lastNames:  ["Davies", "Evans", "Thomas", "Roberts", "Edwards", "Hughes", "Lewis", "Morgan", "Griffiths", "Walker"],
    domains:    ["gmail.com", "yahoo.co.uk", "outlook.com"],
    institutions: [
      "Royal College of Health Sciences",
      "London Dental & Medical Institute",
      "Edinburgh Research Trust",
      "Manchester Institute of Sciences",
      "Oxford Health Systems Group"
    ]
  },
  ca: {
    firstNames: ["Liam", "Noah", "William", "Lucas", "Benjamin", "Logan", "Alexander", "Ethan", "Jacob", "Michael"],
    lastNames:  ["Roy", "Tremblay", "Gagnon", "Bouchard", "Gauthier", "Morin", "Lavoie", "Fortin", "Gagne", "Pelletier"],
    domains:    ["gmail.com", "yahoo.ca", "outlook.com"],
    institutions: [
      "Toronto Metropolitan Health Research",
      "McGill Clinical Sciences Institute",
      "British Columbia Dental Centre",
      "University Health Network",
      "Canadian Institute of Health"
    ]
  },
  de: {
    firstNames: ["Lukas", "Leon", "Finn", "Elias", "Jonas", "Noah", "Ben", "Paul", "Luis", "Felix"],
    lastNames:  ["Muller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann"],
    domains:    ["gmail.com", "gmx.de", "web.de"],
    institutions: [
      "Charité – Universitätsmedizin Berlin",
      "Munich Institute of Clinical Research",
      "Heidelberg Medical Technologies",
      "Frankfurt Health Foundation",
      "Max Planck Institute"
    ]
  },
  global: {
    firstNames: ["Alex", "Jordan", "Taylor", "Morgan", "Sam", "Chris", "Pat", "Robin", "Kai", "Ren"],
    lastNames:  ["Lee", "Kim", "Chen", "Santos", "Silva", "Kumar", "Ivanov", "Garcia", "Martinez", "Novak"],
    domains:    ["gmail.com", "outlook.com", "icloud.com"],
    institutions: [
      "International Health Studies Institute",
      "Global Survey Consortium",
      "Federated Sciences Research Center",
      "Worldwide Academic Alliance",
      "Intercontinental Medical Group"
    ]
  }
};

const LIKERT_WEIGHTS = {
  balanced:   [0.08, 0.18, 0.48, 0.18, 0.08],
  agreeable:  [0.02, 0.05, 0.13, 0.45, 0.35],
  critical:   [0.35, 0.40, 0.15, 0.07, 0.03],
  tech:       [0.05, 0.15, 0.25, 0.40, 0.15],
  student:    [0.10, 0.20, 0.35, 0.25, 0.10],
  corporate:  [0.04, 0.12, 0.34, 0.38, 0.12],
  medical:    [0.06, 0.14, 0.30, 0.35, 0.15]
};

document.addEventListener("DOMContentLoaded", () => {
  const countrySelect = document.getElementById("sim-country");
  const personaSelect = document.getElementById("sim-persona");
  const countInput    = document.getElementById("sim-count");
  const btnFill       = document.getElementById("sim-btn-fill");
  const btnAuto       = document.getElementById("sim-btn-auto");
  const statusEl      = document.getElementById("sim-status-text");

  const fieldName  = document.getElementById("field-name");
  const fieldEmail = document.getElementById("field-email");
  const fieldOrg   = document.getElementById("field-org");
  const likertBoxes = document.querySelectorAll(".sim-radio-box");

  let isRunning = false;
  let timerId = null;

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function pickWeighted(weights) {
    let r = Math.random();
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i + 1;
    }
    return 3;
  }

  function generateProfile() {
    const cKey = countrySelect.value || "in";
    const pKey = personaSelect.value || "balanced";
    const data = SAMPLE_DATA[cKey] || SAMPLE_DATA["in"];

    const first = pickRandom(data.firstNames);
    const last  = pickRandom(data.lastNames);
    const domain = pickRandom(data.domains);
    const org   = pickRandom(data.institutions);
    const num   = Math.floor(Math.random() * 89 + 10);

    const email = `${first.toLowerCase()}.${last.toLowerCase()}${num}@${domain}`;
    const weights = LIKERT_WEIGHTS[pKey] || LIKERT_WEIGHTS.balanced;
    const rating = pickWeighted(weights);

    return { name: `${first} ${last}`, email, org, rating };
  }

  function applyProfile(profile) {
    fieldName.value  = profile.name;
    fieldEmail.value = profile.email;
    fieldOrg.value   = profile.org;

    // Flash animation
    [fieldName, fieldEmail, fieldOrg].forEach(input => {
      input.classList.add("highlight");
      setTimeout(() => input.classList.remove("highlight"), 300);
    });

    // Update likert rating radio
    likertBoxes.forEach(box => {
      if (parseInt(box.getAttribute("data-val"), 10) === profile.rating) {
        box.classList.add("checked");
      } else {
        box.classList.remove("checked");
      }
    });
  }

  // Single Fill Trigger
  btnFill.addEventListener("click", () => {
    if (isRunning) stopAutoRun();
    const profile = generateProfile();
    applyProfile(profile);
    statusEl.textContent = `Generated: ${profile.name} (${personaSelect.value})`;
    statusEl.style.color = "#22c55e";
  });

  // Bulk Simulation Trigger
  btnAuto.addEventListener("click", () => {
    if (isRunning) {
      stopAutoRun();
      return;
    }

    isRunning = true;
    btnAuto.textContent = "⏹ Stop Demo";
    btnAuto.style.background = "#dc2626";
    btnAuto.style.color = "#ffffff";

    let remaining = parseInt(countInput.value, 10) || 5;
    let current = 0;

    function step() {
      if (!isRunning || current >= remaining) {
        stopAutoRun();
        statusEl.textContent = `Completed ${current} demo responses.`;
        statusEl.style.color = "#22c55e";
        return;
      }

      current++;
      const profile = generateProfile();
      applyProfile(profile);
      statusEl.textContent = `Simulating response ${current}/${remaining}...`;
      statusEl.style.color = "#3b82f6";

      timerId = setTimeout(step, 800);
    }

    step();
  });

  function stopAutoRun() {
    isRunning = false;
    if (timerId) clearTimeout(timerId);
    btnAuto.textContent = "▶ Auto Submit";
    btnAuto.style.background = "#0a0a0a";
    btnAuto.style.color = "#fff";
  }

  // Country/Persona change auto-refresh
  countrySelect.addEventListener("change", () => {
    if (!isRunning) applyProfile(generateProfile());
  });
  personaSelect.addEventListener("change", () => {
    if (!isRunning) applyProfile(generateProfile());
  });

  // Mobile navigation drawer toggle
  const navToggle = document.getElementById("nav-toggle");
  const navMenu   = document.getElementById("nav-menu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      navToggle.classList.toggle("active");
      navMenu.classList.toggle("active");
    });

    // Close menu when clicking any nav link
    navMenu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        navToggle.classList.remove("active");
        navMenu.classList.remove("active");
      });
    });
  }
});

