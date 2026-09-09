document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    const host = new URL(tab.url).hostname;

    const hostElement = document.getElementById('host');
    const toggle = document.getElementById('toggle');
    const globalToggle = document.getElementById('globalToggle');
    const forceButton = document.getElementById('force');
    const excludeButton = document.getElementById('exclude');

    hostElement.textContent = host;

    let hostExcluded = false;
    let hostForced = false;

    function sendEnabledMessage(enabled) {
      chrome.tabs.sendMessage(tab.id, { enabled }, () => {
        if (chrome.runtime.lastError) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"]
          }, () => {
            chrome.tabs.sendMessage(tab.id, { enabled });
          });
        }
      });
    }

    function updateButtons() {
      forceButton.textContent = hostForced
        ? "Always dark — click to undo"
        : "Always dark here";
      excludeButton.textContent = hostExcluded
        ? "Excluded — click to undo"
        : "Never on this site";
    }

    chrome.storage.local.get([host, "__global__", "__excluded__", "__forced__"], (result) => {
      toggle.checked = Boolean(result[host]);
      globalToggle.checked = result.__global__ !== false;
      hostExcluded = Array.isArray(result.__excluded__) && result.__excluded__.includes(host);
      hostForced = Array.isArray(result.__forced__) && result.__forced__.includes(host);
      updateButtons();
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
  });
});