const STYLE_ID = "nocturne-style";

let suppressed = false;

function applyDark() {
  if (suppressed) return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `html{filter:invert(1) hue-rotate(180deg);background:#fff}img,video,picture,svg,canvas,iframe,[style*="background-image"]{filter:invert(1) hue-rotate(180deg)}`;
  document.documentElement.appendChild(style);
}

function removeDark() {
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