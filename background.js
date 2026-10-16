// FillHarbor — Background Service Worker
// Initialises default configuration on install.

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    targetCount: 10,
    currentCount: 0,
    isRunning:   false,
    persona:     "balanced",
    country:     "in",
    speed:       "normal"
  });
});
