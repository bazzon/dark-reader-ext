if (!window.__nocturneLoaded) {
  window.__nocturneLoaded = true;

  const STYLE_ID = "nocturne-style";

  let suppressed = false;
  let hostExcluded = false;
  let hostForced = false;
  let currentBrightness = 100;
  let currentContrast = 100;
  let currentMode = "invert";
  let observer = null;
  let observerTimeout = null;

  const levelsKey = location.hostname + "__levels__";
  const modeKey = location.hostname + "__mode__";

  function reinvertBackgroundImages() {
    if (!document.body) return;

    const elements = [document.body, ...document.body.querySelectorAll("*")];
    for (const el of elements) {
      const backgroundImage = getComputedStyle(el).backgroundImage;
      if (backgroundImage !== "none" && backgroundImage.includes("url(")) {
        el.classList.add("nocturne-bg-fix");
      }
    }
  }

  function startObserver() {
    if (observer || !document.body) return;

    observer = new MutationObserver(() => {
      clearTimeout(observerTimeout);
      observerTimeout = setTimeout(() => {
        observerTimeout = null;
        reinvertBackgroundImages();
      }, 500);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (observerTimeout) {
      clearTimeout(observerTimeout);
      observerTimeout = null;
    }
  }

  function applyDark() {
    if (suppressed) return;

    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.documentElement.appendChild(style);
    }

    let modeFilter = "invert(1) hue-rotate(180deg)";
    if (currentMode === "grayscale") {
      modeFilter = "invert(1) grayscale(1)";
    } else if (currentMode === "sepia") {
      modeFilter = "invert(1) sepia(0.6)";
    }

    style.textContent = `html{filter:${modeFilter} brightness(${currentBrightness / 100}) contrast(${currentContrast / 100});background:#fff}img,video,picture,iframe,[style*="background-image"]{filter:invert(1) hue-rotate(180deg)}.nocturne-bg-fix{filter:invert(1) hue-rotate(180deg)}`;

    let siteRules = null;
    try {
      siteRules = typeof NOCTURNE_SITE_RULES === "object" ? NOCTURNE_SITE_RULES : null;
    } catch {
      siteRules = null;
    }

    const ruleHosts = Object.keys(siteRules || {});
    const ruleHost = ruleHosts.includes(location.hostname)
      ? location.hostname
      : ruleHosts.find((host) => location.hostname.endsWith("." + host));

    if (ruleHost && siteRules[ruleHost]) {
      style.textContent += siteRules[ruleHost];
    }

    if (document.body) {
      reinvertBackgroundImages();
      startObserver();
    }
  }

  function removeDark() {
    stopObserver();

    document.querySelectorAll(".nocturne-bg-fix").forEach((el) => {
      el.classList.remove("nocturne-bg-fix");
    });
    document.getElementById(STYLE_ID)?.remove();
  }

  function isPageAlreadyDark() {
    return (
      window.matchMedia("(prefers-color-scheme: dark)").matches &&
      getComputedStyle(document.documentElement).colorScheme.includes("dark")
    );
  }

  function onReady() {
    if (hostExcluded) {
      removeDark();
      return;
    }

    if (!hostForced && document.getElementById(STYLE_ID) && isPageAlreadyDark()) {
      suppressed = true;
      removeDark();
    }

    if (document.getElementById(STYLE_ID) && !suppressed) {
      reinvertBackgroundImages();
      startObserver();
    }
  }

  chrome.storage.local.get([location.hostname, "__global__", "__excluded__", "__forced__", levelsKey, modeKey], (storage) => {
    hostExcluded = Array.isArray(storage.__excluded__) && storage.__excluded__.includes(location.hostname);
    hostForced = Array.isArray(storage.__forced__) && storage.__forced__.includes(location.hostname);

    const levels = storage[levelsKey] || {};
    const brightness = Number(levels.brightness);
    const contrast = Number(levels.contrast);
    currentBrightness = Number.isFinite(brightness) ? brightness : 100;
    currentContrast = Number.isFinite(contrast) ? contrast : 100;

    if (typeof storage[modeKey] === "string") {
      currentMode = storage[modeKey];
    }

    if (hostExcluded) {
      removeDark();
    } else if (hostForced) {
      suppressed = false;
      applyDark();
    } else if (storage.__global__ !== false && storage[location.hostname] === true) {
      applyDark();
    }

    if (document.readyState !== "loading") {
      onReady();
    } else {
      document.addEventListener("DOMContentLoaded", onReady, { once: true });
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (typeof message.brightness === "number") {
      currentBrightness = message.brightness;
    }
    if (typeof message.contrast === "number") {
      currentContrast = message.contrast;
    }
    if (typeof message.mode === "string") {
      currentMode = message.mode;
    }

    if (message.enabled === true) {
      suppressed = false;
      applyDark();
    } else {
      removeDark();
    }
  });
}