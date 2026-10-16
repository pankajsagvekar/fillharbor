/**
 * FillHarbor — Popup Script
 * Manages UI state, user preferences, and communication with the content script.
 */

"use strict";

document.addEventListener("DOMContentLoaded", async () => {

  // ── Element refs ───────────────────────────────────────────────────────────
  const pageBadge      = document.getElementById("pageBadge");
  const countrySelect  = document.getElementById("countrySelect");
  const personaSelect  = document.getElementById("personaSelect");
  const targetCountEl  = document.getElementById("targetCount");
  const speedSelect    = document.getElementById("speedSelect");
  const btnFillOnce    = document.getElementById("btnFillOnce");
  const btnStart       = document.getElementById("btnStart");
  const btnStop        = document.getElementById("btnStop");
  const startRow       = document.getElementById("startRow");
  const progressBox    = document.getElementById("progressBox");
  const progressBar    = document.getElementById("progressBar");
  const counterLabel   = document.getElementById("counterLabel");
  const statusLabel    = document.getElementById("statusLabel");
  const statusDetail   = document.getElementById("statusDetail");

  // ── Restore saved preferences ──────────────────────────────────────────────
  chrome.storage.local.get(["targetCount","country","persona","speed","isRunning","currentCount"], (data) => {
    if (data.targetCount) targetCountEl.value  = data.targetCount;
    if (data.country)     countrySelect.value  = data.country;
    if (data.persona)     personaSelect.value  = data.persona;
    if (data.speed)       speedSelect.value    = data.speed;

    if (data.isRunning) {
      setRunning(true, data.currentCount || 0, data.targetCount || 10);
    }
  });

  // ── Detect active tab ──────────────────────────────────────────────────────
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (activeTab?.id) {
    const url = activeTab.url || "";
    const isRestricted = url.startsWith("chrome://") || url.startsWith("about:") || url.startsWith("edge://");

    if (isRestricted) {
      setBadge(false, "Browser Page");
    } else {
      sendToTab(activeTab.id, { action: "GET_PAGE_INFO" }, (res) => {
        if (!res)              setBadge(false, "No Access");
        else if (res.isGoogleForm) setBadge(true,  "Google Form");
        else if (res.questionCount > 0) setBadge(true, `${res.questionCount} Fields`);
        else                   setBadge(false, "No Form");
      });
    }
  }

  // ── Fill Once ──────────────────────────────────────────────────────────────
  btnFillOnce.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    sendToTab(tab.id, {
      action: "FILL_ONCE",
      config: { country: countrySelect.value, persona: personaSelect.value }
    });
  });

  // ── Start Auto-Submit ──────────────────────────────────────────────────────
  btnStart.addEventListener("click", async () => {
    let targetCount = parseInt(targetCountEl.value, 10);
    if (isNaN(targetCount) || targetCount < 1) targetCount = 1;
    if (targetCount > 1000) targetCount = 1000;
    targetCountEl.value = targetCount;

    const speed       = speedSelect.value;
    const delays      = getPaceDelays(speed);
    const config      = { targetCount, currentCount: 0, country: countrySelect.value, persona: personaSelect.value, ...delays };

    chrome.storage.local.set({ targetCount, currentCount: 0, isRunning: true, country: countrySelect.value, persona: personaSelect.value, speed });
    setRunning(true, 0, targetCount);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) sendToTab(tab.id, { action: "START_AUTO", config });
  });

  // ── Stop ───────────────────────────────────────────────────────────────────
  btnStop.addEventListener("click", async () => {
    chrome.storage.local.set({ isRunning: false });
    setRunning(false);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) sendToTab(tab.id, { action: "STOP_AUTO" });
  });

  // ── Live status updates from content script ────────────────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action !== "UPDATE_STATUS") return;

    if (msg.status === "RUNNING") {
      setRunning(true, msg.currentCount, msg.targetCount);
      setStatusMsg(msg.detail || "", "");
    } else if (msg.status === "COMPLETED") {
      setRunning(false);
      progressBox.style.display = "block";
      statusLabel.innerText     = "Done";
      counterLabel.innerText    = `${msg.targetCount} / ${msg.targetCount}`;
      progressBar.style.width   = "100%";
      progressBar.classList.add("done");
      setStatusMsg(msg.detail || "All responses submitted successfully.", "success");
    } else if (msg.status === "STOPPED") {
      setRunning(false);
      progressBox.style.display = "block";
      setStatusMsg(msg.detail || "Stopped.", "error");
    }
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  function setRunning(running, current = 0, target = 10) {
    if (running) {
      startRow.style.display  = "none";
      btnStop.style.display   = "flex";
      progressBox.style.display = "block";
      const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
      counterLabel.innerText  = `${current} / ${target}`;
      progressBar.style.width = `${pct}%`;
      progressBar.classList.remove("done");
      statusLabel.innerText   = "Submitting…";
    } else {
      startRow.style.display = "flex";
      btnStop.style.display  = "none";
      statusLabel.innerText  = "Progress";
    }
  }

  function setStatusMsg(text, type) {
    statusDetail.className  = "status-msg" + (type ? ` ${type}` : "");
    statusDetail.innerText  = text;
  }

  function setBadge(active, label) {
    pageBadge.className = "status-pill" + (active ? " active" : "");
    pageBadge.textContent = "";
    const dot = document.createElement("span");
    dot.className = "status-dot";
    pageBadge.appendChild(dot);
    pageBadge.appendChild(document.createTextNode(label));
  }

  function getPaceDelays(speed) {
    if (speed === "fast") return { delayMin: 0.6,  delayMax: 1.2 };
    if (speed === "safe") return { delayMin: 2.5,  delayMax: 4.5 };
    return                       { delayMin: 1.2,  delayMax: 2.2 };
  }

  // Safe message sender to active tab
  function sendToTab(tabId, message, callback) {
    chrome.tabs.sendMessage(tabId, message, (res) => {
      if (chrome.runtime.lastError) {
        if (callback) callback(null);
      } else if (callback) {
        callback(res);
      }
    });
  }

});
