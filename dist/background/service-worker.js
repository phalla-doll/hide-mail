"use strict";
(() => {
  // src/background/service-worker.ts
  chrome.runtime.onInstalled.addListener(() => {
    console.log("HideMail extension installed");
  });
})();
