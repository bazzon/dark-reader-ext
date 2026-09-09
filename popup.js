document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    const host = new URL(tab.url).hostname;
    document.getElementById('host').textContent = host;

    const globalToggle = document.getElementById('globalToggle');
    chrome.storage.local.get('__global__', (result) => {
      globalToggle.checked = result['__global__'] !== false;
    });

    globalToggle.addEventListener('change', (event) => {
      chrome.storage.local.set({ __global__: event.target.checked });
    });

    chrome.storage.local.get(host, (result) => {
      document.getElementById('toggle').checked = Boolean(result[host]);
    });

    document.getElementById('toggle').addEventListener('change', (event) => {
      const checkbox = event.target;
      chrome.storage.local.set({ [host]: checkbox.checked }, () => {
        chrome.tabs.sendMessage(tab.id, { enabled: checkbox.checked }, () => {
          if (chrome.runtime.lastError) {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["content.js"]
            }, () => {
              chrome.tabs.sendMessage(tab.id, { enabled: checkbox.checked });
            });
          }
        });
      });
    });

    document.getElementById('force').addEventListener('click', () => {
      chrome.storage.local.get('__forced__', (result) => {
        const forced = Array.isArray(result.__forced__) ? result.__forced__ : [];
        if (!forced.includes(host)) {
          forced.push(host);
        }
        chrome.storage.local.set({ __forced__: forced }, () => {
          chrome.tabs.sendMessage(tab.id, { enabled: true }, () => {
            if (chrome.runtime.lastError) {
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["content.js"]
              }, () => {
                chrome.tabs.sendMessage(tab.id, { enabled: true });
              });
            }
          });
        });
      });
    });

  });
});