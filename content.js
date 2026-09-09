if (!window.__nocturneLoaded) {
  window.__nocturneLoaded = true;

  const STYLE_ID = "nocturne-style";

  let suppressed = false;

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
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `html{filter:invert(1) hue-rotate(180deg);background:#fff}img,video,picture,svg,canvas,iframe,[style*="background-image"]{filter:invert(1) hue-rotate(180deg)}.nocturne-bg-fix{filter:invert(1) hue-rotate(180deg)}`;
    document.documentElement.appendChild(style);
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
    if (document.getElementById(STYLE_ID) && isPageAlreadyDark()) {
      suppressed = true;
      removeDark();
    }

    if (document.getElementById(STYLE_ID) && !suppressed) {
      reinvertBackgroundImages();
    }
  });

  chrome.storage.local.get(location.hostname, (storage) => {
    if (storage[location.hostname] === true) {
      applyDark();
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.enabled === true) {
      suppressed = false;
      applyDark();
    } else {
      removeDark();
    }
  });
}