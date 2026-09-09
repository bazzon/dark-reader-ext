document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    const host = new URL(tab.url).hostname;
    document.getElementById('host').textContent = host;

    chrome.storage.local.get(host, (result) => {
      document.getElementById('toggle').checked = Boolean(result[host]);
    });

    document.getElementById('toggle').addEventListener('change', (event) => {
      const checkbox = event.target;
      chrome.storage.local.set({ [host]: checkbox.checked }, () => {
        chrome.tabs.sendMessage(tab.id, { enabled: checkbox.checked });
      });
    });
  });
});
