document.addEventListener('DOMContentLoaded', () => {
  const excludedList = document.getElementById('excludedList');
  const forcedList = document.getElementById('forcedList');

  function renderList(container, items, key) {
    container.textContent = '';
    const list = Array.isArray(items) ? items : [];

    if (list.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'None';
      container.appendChild(empty);
      return;
    }

    list.forEach((hostname) => {
      const row = document.createElement('div');
      row.className = 'row';

      const hostnameText = document.createElement('span');
      hostnameText.textContent = hostname;

      const removeButton = document.createElement('button');
      removeButton.textContent = 'Remove';
      removeButton.addEventListener('click', () => {
        const nextItems = list.filter((item) => item !== hostname);
        chrome.storage.local.set({ [key]: nextItems }, render);
      });

      row.appendChild(hostnameText);
      row.appendChild(removeButton);
      container.appendChild(row);
    });
  }

  function render() {
    chrome.storage.local.get(['__excluded__', '__forced__'], (result) => {
      renderList(excludedList, result.__excluded__, '__excluded__');
      renderList(forcedList, result.__forced__, '__forced__');
    });
  }

  render();
});