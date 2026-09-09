document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];

    const hostElement = document.getElementById('host');
    const toggle = document.getElementById('toggle');
    const globalToggle = document.getElementById('globalToggle');
    const forceButton = document.getElementById('force');
    const excludeButton = document.getElementById('exclude');
    const brightnessInput = document.getElementById('brightness');
    const contrastInput = document.getElementById('contrast');
    const brightnessValue = document.getElementById('brightnessValue');
    const contrastValue = document.getElementById('contrastValue');

    function isRestrictedPage(url) {
      return (
        url.startsWith('chrome://') ||
        url.startsWith('chrome-extension://') ||
        url.startsWith('edge://') ||
        url.startsWith('about:') ||
        url.startsWith('https://chrome.google.com/webstore')
      );
    }

    if (isRestrictedPage(tab.url)) {
      hostElement.textContent = 'Not available on this page';
      document.querySelectorAll('input, button').forEach((control) => {
        control.disabled = true;
      });
      return;
    }

    const host = new URL(tab.url).hostname;
    const levelsKey = host + "__levels__";

    hostElement.textContent = host;

    let hostExcluded = false;
    let hostForced = false;

    function sendEnabledMessage(enabled) {
      chrome.tabs.sendMessage(tab.id, { enabled }, () => {
        if (chrome.runtime.lastError) {
          // Restricted pages may not host content scripts; ignore silently.
        }
      });
    }

    function sendLevelsMessage() {
      const message = {
        enabled: true,
        brightness: Number(brightnessInput.value),
        contrast: Number(contrastInput.value)
      };

      chrome.tabs.sendMessage(tab.id, message, () => {
        if (chrome.runtime.lastError) {
          // Restricted pages may not host content scripts; ignore silently.
        }
      });
    }

    function updateRangeLabels() {
      brightnessValue.textContent = brightnessInput.value;
      contrastValue.textContent = contrastInput.value;
    }

    function updateButtons() {
      forceButton.textContent = hostForced
        ? "Always dark — click to undo"
        : "Always dark here";
      excludeButton.textContent = hostExcluded
        ? "Excluded — click to undo"
        : "Never on this site";
    }

    chrome.storage.local.get([host, "__global__", "__excluded__", "__forced__", levelsKey], (result) => {
      toggle.checked = Boolean(result[host]);
      globalToggle.checked = result.__global__ !== false;
      hostExcluded = Array.isArray(result.__excluded__) && result.__excluded__.includes(host);
      hostForced = Array.isArray(result.__forced__) && result.__forced__.includes(host);

      const levels = result[levelsKey] || {};
      const brightness = Number(levels.brightness);
      const contrast = Number(levels.contrast);
      brightnessInput.value = Number.isFinite(brightness) ? brightness : 100;
      contrastInput.value = Number.isFinite(contrast) ? contrast : 100;

      updateButtons();
      updateRangeLabels();
    });

    globalToggle.addEventListener('change', (event) => {
      chrome.storage.local.set({ __global__: event.target.checked });
    });

    toggle.addEventListener('change', (event) => {
      const checkbox = event.target;
      chrome.storage.local.set({ [host]: checkbox.checked }, () => {
        sendEnabledMessage(checkbox.checked);
      });
    });

    brightnessInput.addEventListener('input', () => {
      updateRangeLabels();
      const levels = {
        brightness: Number(brightnessInput.value),
        contrast: Number(contrastInput.value)
      };
      chrome.storage.local.set({ [levelsKey]: levels }, () => {
        sendLevelsMessage();
      });
    });

    contrastInput.addEventListener('input', () => {
      updateRangeLabels();
      const levels = {
        brightness: Number(brightnessInput.value),
        contrast: Number(contrastInput.value)
      };
      chrome.storage.local.set({ [levelsKey]: levels }, () => {
        sendLevelsMessage();
      });
    });

    forceButton.addEventListener('click', () => {
      chrome.storage.local.get("__forced__", (result) => {
        const forced = Array.isArray(result.__forced__) ? result.__forced__.slice() : [];

        if (hostForced) {
          const nextForced = forced.filter((item) => item !== host);
          chrome.storage.local.set({ __forced__: nextForced }, () => {
            hostForced = false;
            updateButtons();
            const shouldEnable = globalToggle.checked && !hostExcluded && toggle.checked;
            sendEnabledMessage(shouldEnable);
          });
        } else {
          if (!forced.includes(host)) {
            forced.push(host);
          }
          chrome.storage.local.set({ __forced__: forced }, () => {
            hostForced = true;
            updateButtons();
            sendEnabledMessage(true);
          });
        }
      });
    });

    excludeButton.addEventListener('click', () => {
      chrome.storage.local.get("__excluded__", (result) => {
        const excluded = Array.isArray(result.__excluded__) ? result.__excluded__.slice() : [];

        if (hostExcluded) {
          const nextExcluded = excluded.filter((item) => item !== host);
          chrome.storage.local.set({ __excluded__: nextExcluded }, () => {
            hostExcluded = false;
            updateButtons();
            const shouldEnable = globalToggle.checked && (hostForced || toggle.checked);
            sendEnabledMessage(shouldEnable);
          });
        } else {
          if (!excluded.includes(host)) {
            excluded.push(host);
          }
          chrome.storage.local.set({ __excluded__: excluded }, () => {
            hostExcluded = true;
            updateButtons();
            sendEnabledMessage(false);
          });
        }
      });
    });

    document.getElementById('openOptions').addEventListener('click', (event) => {
      event.preventDefault();
      chrome.runtime.openOptionsPage();
    });
  });
});