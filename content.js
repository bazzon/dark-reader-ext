if (!window.__nocturneLoaded) {
  window.__nocturneLoaded = true;

  const STYLE_ID = "nocturne-style";

  let suppressed = false;
  let hostExcluded = false;
  let hostForced = false;
  let currentBrightness = 100;
  let currentContrast = 100;

  const levelsKey = location.hostname + "__levels__";

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

  function applyDark() {
    if (suppressed) return;

    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.documentElement.appendChild(style);
    }

    style.textContent = `html{filter:invert(1) hue-rotate(180deg) brightness(${currentBrightness / 100}) contrast(${currentContrast / 100});background:#fff}img,video,picture,svg,iframe,[style*="background-image"]{filter:invert(1) hue-rotate(180deg)}.nocturne-bg-fix{filter:invert(1) hue-rotate(180deg)}`;
  }

  function removeDark() {
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

  document.addEventListener("DOMContentLoaded", () => {
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
    }
  });

  chrome.storage.local.get([location.hostname, "__global__", "__excluded__", "__forced__", levelsKey], (storage) => {
    hostExcluded = Array.isArray(storage.__excluded__) && storage.__excluded__.includes(location.hostname);
    hostForced = Array.isArray(storage.__forced__) && storage.__forced__.includes(location.hostname);

    const levels = storage[levelsKey] || {};
    const brightness = Number(levels.brightness);
    const contrast = Number(levels.contrast);
    currentBrightness = Number.isFinite(brightness) ? brightness : 100;
    currentContrast = Number.isFinite(contrast) ? contrast : 100;

    if (hostExcluded) {
      removeDark();
      return;
    }

    if (storage.__global__ === false) return;

    if (hostForced) {
      suppressed = false;
      applyDark();
      return;
    }

    if (storage[location.hostname] === true) {
      applyDark();
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (typeof message.brightness === "number") {
      currentBrightness = message.brightness;
    }
    if (typeof message.contrast === "number") {
      currentContrast = message.contrast;
    }

    if (message.enabled === true) {
      suppressed = false;
      applyDark();
    } else {
      removeDark();
    }
  });
}