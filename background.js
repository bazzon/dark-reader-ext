chrome.runtime.onInstalled.addListener(() => {
  console.log('Nocturne installed');
});

function isRestrictedPage(url) {
  return (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('https://chrome.google.com/webstore')
  );
}

chrome.commands.onCommand.addListener((command) => {
  if (command !== 'toggle-dark') return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab || isRestrictedPage(tab.url)) return;

    const host = new URL(tab.url).hostname;

    chrome.storage.local.get(host, (result) => {
      const newValue = !(result[host] === true);

      chrome.storage.local.set({ [host]: newValue }, () => {
        chrome.tabs.sendMessage(tab.id, { enabled: newValue }, () => {
          if (chrome.runtime.lastError) {
            // Restricted pages may not host content scripts; ignore silently.
          }
        });
      });
    });
  });
});