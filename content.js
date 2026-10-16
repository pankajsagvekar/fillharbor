/**
 * FillHarbor — Content Script
 * Universal smart form filler for Google Forms and generic HTML5 forms.
 *
 * Handles:
 *  - ARIA radio groups (Google Forms)
 *  - Standard HTML radio / checkbox / select inputs
 *  - Text, email, tel, number, date, textarea inputs
 *  - Google Forms custom listbox dropdowns
 *  - Multi-page navigation (Next / Submit buttons)
 *  - Confirmation page detection and loop restart
 *  - Required-field validation retry
 *  - React / Angular synthetic event dispatch
 */

"use strict";

// ─── State ───────────────────────────────────────────────────────────────────

let autoRunnerActive = false;
let autoRunnerConfig = {
  targetCount: 1,
  currentCount: 0,
  country:     "in",
  persona:     "balanced",
  delayMin:    1.0,
  delayMax:    2.0
};
let retryCount = 0;
const MAX_RETRIES = 4;

// ─── Localised Name / Contact Data ───────────────────────────────────────────

const LOCALE = {
  in: {
    firstNames: ["Aarav","Priya","Rahul","Ananya","Rohan","Sneha","Aditya","Neha","Vikram","Pooja","Arjun","Kavya","Karan","Tanvi","Siddharth","Divya"],
    lastNames:  ["Sharma","Patel","Verma","Rao","Gupta","Mehta","Singh","Nair","Kulkarni","Joshi","Deshmukh","Chopra","Reddy","Banerjee","Agarwal"],
    cities:     ["Mumbai","Delhi","Bengaluru","Pune","Hyderabad","Chennai","Ahmedabad","Kolkata","Jaipur","Lucknow"],
    institutions:["Government Medical & Dental College","National Institute of Health Sciences","Apex Institute of Dental Sciences","Amity University","Kasturba Medical College"],
    phonePrefixes:["98","97","99","88","70","81"],
    domains:    ["gmail.com","yahoo.co.in","outlook.com","rediffmail.com"]
  },
  us: {
    firstNames: ["James","Emma","Liam","Olivia","Noah","Ava","William","Sophia","Benjamin","Isabella","Lucas","Mia","Ethan","Harper","Mason","Evelyn"],
    lastNames:  ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Wilson","Anderson","Thomas"],
    cities:     ["New York, NY","Los Angeles, CA","Chicago, IL","Houston, TX","Phoenix, AZ","Philadelphia, PA","San Antonio, TX","San Diego, CA","Dallas, TX","Austin, TX"],
    institutions:["State University Health Center","Northwestern Medical Center","Columbia University College","University of Michigan","UCLA Health Sciences"],
    phonePrefixes:["212","312","415","617","713","206","303"],
    domains:    ["gmail.com","yahoo.com","outlook.com","icloud.com"]
  },
  uk: {
    firstNames: ["Oliver","Amelia","George","Isla","Harry","Emily","Jack","Poppy","Jacob","Lily","Charlie","Grace","Freddie","Evie","Thomas","Sophie"],
    lastNames:  ["Smith","Jones","Taylor","Brown","Williams","Wilson","Johnson","Davies","Robinson","Wright","Thompson","Evans","Walker","White","Roberts"],
    cities:     ["London","Manchester","Birmingham","Leeds","Glasgow","Liverpool","Edinburgh","Bristol","Sheffield","Newcastle"],
    institutions:["King's College Health Institute","University of Manchester","University of Birmingham","Leeds Dental Institute","Edinburgh Health Sciences"],
    phonePrefixes:["7700","7800","7900","7400"],
    domains:    ["gmail.com","outlook.com","yahoo.co.uk","icloud.com"]
  },
  ca: {
    firstNames: ["Liam","Olivia","Noah","Emma","Jackson","Charlotte","Lucas","Amelia","Logan","Chloe","Benjamin","Ella","Jacob","Hannah"],
    lastNames:  ["Smith","Brown","Tremblay","Martin","Roy","Wilson","MacDonald","Gagnon","Johnson","Taylor","Cote","Campbell","Leblanc"],
    cities:     ["Toronto, ON","Montreal, QC","Vancouver, BC","Calgary, AB","Edmonton, AB","Ottawa, ON","Winnipeg, MB","Quebec City, QC"],
    institutions:["University of Toronto Health","McGill Faculty of Medicine","UBC Dental Sciences","University of Alberta","Dalhousie Institute"],
    phonePrefixes:["416","647","514","604","403"],
    domains:    ["gmail.com","yahoo.ca","outlook.com","rogers.com"]
  },
  au: {
    firstNames: ["Oliver","Charlotte","Noah","Amelia","Jack","Isla","William","Mia","Leo","Grace","Lucas","Chloe","Henry","Ella"],
    lastNames:  ["Smith","Jones","Williams","Brown","Wilson","Taylor","Johnson","White","Martin","Anderson","Thompson","Nguyen","Thomas"],
    cities:     ["Sydney, NSW","Melbourne, VIC","Brisbane, QLD","Perth, WA","Adelaide, SA","Canberra, ACT","Hobart, TAS","Gold Coast, QLD"],
    institutions:["University of Melbourne","University of Sydney","Monash Health Sciences","University of Queensland","Adelaide Medical School"],
    phonePrefixes:["0411","0422","0433","0455"],
    domains:    ["gmail.com","outlook.com.au","yahoo.com.au","icloud.com"]
  },
  de: {
    firstNames: ["Lukas","Mia","Leon","Emma","Finn","Hannah","Paul","Sofia","Jonas","Emilia","Felix","Lina","Noah","Marie"],
    lastNames:  ["Müller","Schmidt","Schneider","Fischer","Weber","Meyer","Wagner","Becker","Schulz","Hoffmann","Schäfer","Koch","Bauer"],
    cities:     ["Berlin","München","Hamburg","Frankfurt","Köln","Stuttgart","Düsseldorf","Leipzig","Dresden","Nürnberg"],
    institutions:["Charité - Universitätsmedizin Berlin","LMU Klinikum München","Heidelberg University Hospital","RWTH Aachen Health","Uni Tübingen"],
    phonePrefixes:["151","160","170","175","157"],
    domains:    ["gmail.com","gmx.de","web.de","outlook.de"]
  }
};

// ─── Persona Feedback Pools ───────────────────────────────────────────────────

const FEEDBACK = {
  doctor:    ["Nutritional counseling and supplement history should be routinely integrated into clinical examinations.","Clearer guidelines regarding clinical contraindications and drug interactions would be highly beneficial.","Strongly emphasise evidence-based dietary recommendations over commercial supplements.","Knowledge of drug-nutrient interactions is critical for clinical patient management."],
  student:   ["Great learning material. Clear explanations that consolidated classroom concepts well.","Would love more interactive case studies and clinical question walkthroughs.","Very informative and clearly relevant to our current academic curriculum.","Covered high-yield topics effectively for undergraduate examinations."],
  academic:  ["Methodology is robust and the questionnaire addresses key public health dimensions accurately.","Recommending follow-up longitudinal studies to track knowledge retention across cohorts.","Data gathered should provide a meaningful foundation for peer-reviewed publication.","Question framing adheres well to standard validated psychometric scales."],
  tech:      ["Streamlined workflow, clear questions, and intuitive navigation.","Data collection format is well-structured for statistical analysis.","No friction encountered; well-optimised questionnaire structure.","Responses entered efficiently; clean survey design."],
  consumer:  ["Very easy to understand and relate to everyday health habits.","Appreciated the clear breakdown between practical usage and personal beliefs.","Helpful questions that prompt reflection on daily dietary choices.","Informative survey, glad to participate."],
  corporate: ["Structured effectively with clear strategic alignment to healthcare outcomes.","Professional presentation and concise execution throughout.","Value-added insights that can support wellness policy initiatives.","Solid operational design and actionable metrics."],
  agreeable: ["Outstanding session, exceptionally clear and very well structured.","Extremely helpful insights with excellent practical relevance.","Thoroughly enjoyed participating; everything was well explained.","Top-notch coverage of all important aspects."],
  critical:  ["Adequate content, but requires deeper emphasis on practical limitations.","Some questions would benefit from more granular option scales.","Acceptable overall, though more diverse case examples are needed.","Covers the basics, but room for deeper analysis on side effects."],
  balanced:  ["The questionnaire covers relevant dimensions thoroughly and objectively.","Good balance between theoretical knowledge and daily practical habits.","Appropriate length and comprehensive coverage of essential points.","Clear instructions and relevant inquiry areas."]
};

const FALLBACK_TEXTS = ["Yes, definitely","Not applicable","Regular practice","Appropriate dosage","Standard protocol","As recommended"];

// ─── Message Listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "GET_PAGE_INFO":
      sendResponse({ success: true, ...inspectPage() });
      return true;

    case "START_AUTO":
      autoRunnerConfig = { ...autoRunnerConfig, ...message.config };
      autoRunnerActive = true;
      retryCount = 0;
      saveState();
      startLoop();
      sendResponse({ success: true });
      return true;

    case "STOP_AUTO":
      autoRunnerActive = false;
      saveState();
      sendStatus("STOPPED", "Stopped by user.");
      sendResponse({ success: true });
      return true;

    case "FILL_ONCE":
      autoRunnerConfig = { ...autoRunnerConfig, ...message.config };
      fillPage(autoRunnerConfig.persona, autoRunnerConfig.country, true);
      sendResponse({ success: true });
      return true;
  }
});

// ─── Restore State After Page Reload ─────────────────────────────────────────

chrome.storage.local.get(["isRunning","targetCount","currentCount","country","persona","delayMin","delayMax"], (data) => {
  if (!data || !data.isRunning) return;
  autoRunnerActive = true;
  autoRunnerConfig = {
    targetCount: data.targetCount || 1,
    currentCount: data.currentCount || 0,
    country:     data.country || "in",
    persona:     data.persona || "balanced",
    delayMin:    data.delayMin || 1.0,
    delayMax:    data.delayMax || 2.0
  };
  setTimeout(handleState, 1500);
});

// ─── State Persistence ────────────────────────────────────────────────────────

function saveState() {
  chrome.storage.local.set({
    isRunning:   autoRunnerActive,
    targetCount: autoRunnerConfig.targetCount,
    currentCount: autoRunnerConfig.currentCount,
    country:     autoRunnerConfig.country,
    persona:     autoRunnerConfig.persona,
    delayMin:    autoRunnerConfig.delayMin,
    delayMax:    autoRunnerConfig.delayMax
  });
}

function sendStatus(status, detail) {
  chrome.runtime.sendMessage({
    action:       "UPDATE_STATUS",
    status,
    detail,
    currentCount: autoRunnerConfig.currentCount,
    targetCount:  autoRunnerConfig.targetCount
  }).catch(() => {});
}

// ─── Utilities ────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand  = (min, max) => min + Math.random() * (max - min);
const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─── Submission Loop ──────────────────────────────────────────────────────────

async function startLoop() {
  if (!autoRunnerActive) return;
  await handleState();
}

async function handleState() {
  if (!autoRunnerActive) return;

  // Abort if form is locked to 1 response (sign-in required)
  const bodyText = document.body?.innerText || "";
  if (bodyText.includes("You've already responded") || bodyText.includes("only fill in this form once")) {
    autoRunnerActive = false;
    saveState();
    sendStatus("STOPPED", "Form requires sign-in to submit multiple responses. Disable 'Limit to 1 response' in Google Forms settings.");
    return;
  }

  if (isConfirmationPage()) {
    retryCount = 0;
    autoRunnerConfig.currentCount += 1;
    saveState();
    sendStatus("RUNNING", `Submitted ${autoRunnerConfig.currentCount} of ${autoRunnerConfig.targetCount}`);

    if (autoRunnerConfig.currentCount >= autoRunnerConfig.targetCount) {
      autoRunnerActive = false;
      saveState();
      sendStatus("COMPLETED", `All ${autoRunnerConfig.targetCount} responses submitted successfully.`);
      return;
    }

    const nextLink = findSubmitAnotherLink();
    if (nextLink) {
      await sleep(rand(autoRunnerConfig.delayMin * 1000, autoRunnerConfig.delayMax * 1000));
      nextLink.click();
    } else {
      await sleep(rand(1000, 2000));
      window.location.href = window.location.href.split("?")[0].replace("/formResponse", "/viewform");
    }
    return;
  }

  await fillAndAdvance();
}

async function fillAndAdvance() {
  if (!autoRunnerActive) return;

  const filled = await fillPage(autoRunnerConfig.persona, autoRunnerConfig.country);
  sendStatus("RUNNING", `Filled ${filled} fields…`);

  await sleep(rand(600, 1100));

  // Retry if required fields flagged
  if (hasValidationErrors() && retryCount < MAX_RETRIES) {
    retryCount++;
    sendStatus("RUNNING", `Validation error — retrying (attempt ${retryCount})…`);
    await fillPage(autoRunnerConfig.persona, autoRunnerConfig.country);
    await sleep(800);
  }

  const { submitBtn, nextBtn } = findNavButtons();

  if (submitBtn) {
    sendStatus("RUNNING", `Submitting (${autoRunnerConfig.currentCount + 1}/${autoRunnerConfig.targetCount})…`);
    fireClick(submitBtn);
    setTimeout(() => { if (autoRunnerActive) handleState(); }, 2800);
  } else if (nextBtn) {
    fireClick(nextBtn);
    setTimeout(() => { if (autoRunnerActive) fillAndAdvance(); }, 1600);
  } else if (retryCount < 3) {
    retryCount++;
    setTimeout(fillAndAdvance, 1500);
  } else {
    sendStatus("STOPPED", "No Submit or Next button found on page.");
  }
}

// ─── Page Inspection ──────────────────────────────────────────────────────────

function inspectPage() {
  const isGoogleForm = window.location.hostname.includes("docs.google.com") &&
                       window.location.pathname.includes("/forms/");
  const inputs = document.querySelectorAll('div[role="radiogroup"], fieldset, div[role="checkbox"], input, textarea, select, div[role="listbox"]');
  return {
    isGoogleForm,
    questionCount:  inputs.length,
    isConfirmation: isConfirmationPage()
  };
}

function isConfirmationPage() {
  const text = document.body?.innerText.toLowerCase() || "";
  return text.includes("your response has been recorded") ||
         text.includes("has been submitted") ||
         text.includes("thank you for your submission") ||
         text.includes("response recorded") ||
         !!findSubmitAnotherLink();
}

function findSubmitAnotherLink() {
  return Array.from(document.querySelectorAll('a, div[role="button"], button')).find((el) => {
    const t = (el.innerText || el.getAttribute("aria-label") || "").toLowerCase();
    return t.includes("submit another") || t.includes("another response") || t.includes("fill again");
  });
}

function findNavButtons() {
  let submitBtn = null, nextBtn = null;
  for (const el of document.querySelectorAll('div[role="button"], button, input[type="submit"]')) {
    if (el.offsetParent === null) continue;
    const t = (el.innerText || el.value || el.getAttribute("aria-label") || "").toLowerCase().trim();
    if (["clear","reset","back","previous"].some((w) => t.includes(w))) continue;
    if (["submit","send","finish","done"].includes(t)) { submitBtn = el; break; }
    if (["next","continue","forward"].includes(t))    { nextBtn   = el; }
  }
  return { submitBtn, nextBtn };
}

function hasValidationErrors() {
  return document.querySelectorAll('[aria-invalid="true"], [data-has-error="true"], .freebirdFormviewerViewItemsItemErrorMessage').length > 0;
}

// ─── Form Filler ──────────────────────────────────────────────────────────────

async function fillPage(persona, country = "in", force = false) {
  let count = 0;
  const locale = LOCALE[country] || LOCALE.in;

  // 1. ARIA radio groups (Google Forms)
  document.querySelectorAll('div[role="radiogroup"]').forEach((rg) => {
    const radios = Array.from(rg.querySelectorAll('div[role="radio"], input[type="radio"]'));
    if (!radios.length) return;
    if (!force && radios.some((r) => r.getAttribute("aria-checked") === "true" || r.checked)) return;
    const chosen = smartChoice(radios, getQuestionText(rg), persona);
    if (chosen) { fireClick(chosen); count++; }
  });

  // 2. Standard HTML radio groups
  const radioGroups = {};
  document.querySelectorAll('input[type="radio"]:not([role="radio"])').forEach((r) => {
    if (r.name) (radioGroups[r.name] = radioGroups[r.name] || []).push(r);
  });
  Object.values(radioGroups).forEach((radios) => {
    if (!force && radios.some((r) => r.checked)) return;
    const chosen = smartChoice(radios, getQuestionText(radios[0]), persona);
    if (chosen) { fireClick(chosen); count++; }
  });

  // 3. Checkboxes
  const cbContainers = document.querySelectorAll('div[role="listitem"], fieldset, .freebirdFormviewerViewNumberedItemContainer, .form-group');
  if (cbContainers.length) {
    cbContainers.forEach((c) => {
      const cbs = Array.from(c.querySelectorAll('div[role="checkbox"], input[type="checkbox"]'));
      if (!cbs.length) return;
      if (!force && cbs.some((cb) => cb.getAttribute("aria-checked") === "true" || cb.checked)) return;
      const n = Math.min(cbs.length, Math.floor(Math.random() * 2) + 1);
      [...cbs].sort(() => 0.5 - Math.random()).slice(0, n).forEach((cb) => { fireClick(cb); count++; });
    });
  }

  // 4. Text inputs
  document.querySelectorAll('input[type="text"], input[type="email"], input[type="number"], input[type="tel"], input:not([type]), input[type="url"]').forEach((el) => {
    if (el.disabled || el.readOnly || el.offsetParent === null) return;
    if (!force && el.value?.trim()) return;
    setInputValue(el, buildText(getQuestionText(el), el.type, persona, locale));
    count++;
  });

  // 5. Textareas
  document.querySelectorAll("textarea").forEach((el) => {
    if (el.disabled || el.readOnly || el.offsetParent === null) return;
    if (!force && el.value?.trim()) return;
    setInputValue(el, pick(FEEDBACK[persona] || FEEDBACK.balanced));
    count++;
  });

  // 6. Native <select>
  document.querySelectorAll("select").forEach((el) => {
    if (el.disabled || el.options.length <= 1) return;
    if (!force && el.selectedIndex > 0) return;
    const valid = Array.from(el.options).map((o, i) => o.value ? i : -1).filter((i) => i > 0);
    if (valid.length) { el.selectedIndex = pick(valid); el.dispatchEvent(new Event("change", { bubbles: true })); count++; }
  });

  // 7. Google Forms custom listbox dropdowns
  for (const lb of document.querySelectorAll('div[role="listbox"]')) {
    if (lb.offsetParent === null) continue;
    lb.click();
    await sleep(250);
    const opts = Array.from(document.querySelectorAll('div[role="option"]')).filter((o) => o.getAttribute("data-value"));
    if (opts.length) { pick(opts).click(); count++; await sleep(150); }
  }

  // 8. Date inputs
  document.querySelectorAll('input[type="date"]').forEach((el) => {
    if (!el.value) { setInputValue(el, new Date().toISOString().split("T")[0]); count++; }
  });

  return count;
}

// ─── Text Generation ──────────────────────────────────────────────────────────

function buildText(context, type, persona, locale) {
  const c = context.toLowerCase();

  if (c.includes("name") || c.includes("full name") || c.includes("respondent"))
    return `${pick(locale.firstNames)} ${pick(locale.lastNames)}`;

  if (type === "email" || c.includes("email") || c.includes("mail"))
    return `${pick(locale.firstNames).toLowerCase()}.${Math.floor(Math.random() * 900) + 100}@${pick(locale.domains)}`;

  if (c.includes("age")) {
    const ranges = { doctor: [22,27], student: [19,23], academic: [30,55], tech: [23,38] };
    const [min, max] = ranges[persona] || [21, 46];
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
  }

  if (c.includes("year") || c.includes("semester") || c.includes("batch"))
    return pick(["3rd Year","Final Year","Intern","4th Year","Batch of 2024"]);

  if (type === "tel" || c.includes("phone") || c.includes("mobile") || c.includes("contact"))
    return `${pick(locale.phonePrefixes)}${Math.floor(1000000 + Math.random() * 9000000)}`;

  if (c.includes("college") || c.includes("university") || c.includes("hospital") || c.includes("institution") || c.includes("organization"))
    return persona === "tech" ? pick(["Tech Innovations Lab","Global Solutions","Cognitive Systems"]) : pick(locale.institutions);

  if (c.includes("city") || c.includes("place") || c.includes("state") || c.includes("location"))
    return pick(locale.cities);

  if (c.includes("designation") || c.includes("role") || c.includes("occupation")) {
    const roles = {
      doctor:   ["Junior Resident","Dental Surgeon","BDS Intern","Medical Officer"],
      academic: ["Assistant Professor","Senior Lecturer","Research Fellow"],
      tech:     ["Software Engineer","Systems Analyst","Frontend Developer"],
      student:  ["Student","Final Year Student","Undergraduate Scholar"]
    };
    return pick(roles[persona] || ["Professional","Executive","Analyst"]);
  }

  return pick(FALLBACK_TEXTS);
}

// ─── Smart Choice for Radio / Checkbox Options ────────────────────────────────

function smartChoice(options, questionText, persona) {
  if (!options?.length) return null;

  const labels = options.map((o) =>
    (o.getAttribute("aria-label") || o.getAttribute("data-value") || o.innerText || o.value || "").trim().toLowerCase()
  );

  const isLikert    = labels.some((l) => l.includes("agree") || l.includes("disagree"));
  const isFrequency = labels.some((l) => l.includes("always") || l.includes("often") || l.includes("never"));

  const WEIGHTS = {
    doctor:    { likert: [0.55,0.40,0.04,0.01], freq: [0.48,0.38,0.12,0.02] },
    academic:  { likert: [0.40,0.45,0.12,0.03], freq: [0.35,0.45,0.18,0.02] },
    tech:      { likert: [0.30,0.50,0.15,0.05], freq: [0.30,0.45,0.20,0.05] },
    student:   { likert: [0.35,0.50,0.12,0.03], freq: [0.25,0.45,0.22,0.08] },
    consumer:  { likert: [0.45,0.40,0.12,0.03], freq: [0.35,0.35,0.25,0.05] },
    corporate: { likert: [0.40,0.45,0.10,0.05], freq: [0.30,0.50,0.15,0.05] },
    agreeable: { likert: [0.60,0.35,0.04,0.01], freq: [0.50,0.40,0.08,0.02] },
    critical:  { likert: [0.05,0.15,0.50,0.30], freq: [0.05,0.15,0.45,0.35] },
    balanced:  { likert: [0.25,0.45,0.22,0.08], freq: [0.20,0.40,0.30,0.10] }
  };

  const w = WEIGHTS[persona] || WEIGHTS.balanced;
  if (isLikert)    return weightedPick(options, w.likert);
  if (isFrequency) return weightedPick(options, w.freq);

  // Non-scale questions: favour longest / most specific option (likely the correct one)
  if (persona === "doctor" || persona === "academic") {
    let best = 0;
    labels.forEach((l, i) => { if (l.length > labels[best].length) best = i; });
    return Math.random() < 0.82 ? options[best] : pick(options);
  }

  return pick(options);
}

function weightedPick(items, weights) {
  let r = Math.random() * weights.slice(0, items.length).reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) {
    r -= weights[i] || 0;
    if (r <= 0) return items[i];
  }
  return items[0];
}

// ─── DOM Helpers ──────────────────────────────────────────────────────────────

function getQuestionText(el) {
  const container = el.closest('div[role="listitem"], .freebirdFormviewerViewNumberedItemContainer, fieldset, .form-group') || el.parentElement;
  if (!container) return el.getAttribute("aria-label") || el.placeholder || el.name || "";
  const heading = container.querySelector('div[role="heading"], label, legend, .title');
  return (heading?.innerText || el.getAttribute("aria-label") || el.placeholder || el.name || "").trim();
}

// Dispatches full pointer + mouse event chain for React / Angular compatibility
function fireClick(el) {
  if (!el) return;
  el.scrollIntoView({ behavior: "instant", block: "center" });
  ["pointerdown","mousedown","pointerup","mouseup","click"].forEach((evt) => {
    el.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, view: window }));
  });
}

// Uses native value setter to bypass Virtual DOM overrides (React 16+)
function setInputValue(el, val) {
  if (!el) return;
  try {
    const proto = Object.getPrototypeOf(el);
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    el.focus();
    if (setter) {
      setter.call(el, val);
    } else {
      el.value = val;
    }
  } catch {
    el.value = val;
  }
  el.dispatchEvent(new Event("input",  { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.blur();
}
