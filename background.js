chrome.runtime.onInstalled.addListener(() => {
  console.log('Nocturne installed');
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== 'toggle-dark') return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    const host = new URL(tab.url).hostname;

    chrome.storage.local.get(host, (result) => {
      const newValue = !(result[host] === true);

      chrome.storage.local.set({ [host]: newValue }, () => {
        chrome.tabs.sendMessage(tab.id, { enabled: newValue });
      });
    });
  });
});