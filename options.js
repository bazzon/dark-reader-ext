document.addEventListener('DOMContentLoaded', () => {
  const excludedList = document.getElementById('excludedList');
  const forcedList = document.getElementById('forcedList');
  const excludedInput = document.getElementById('excludedInput');
  const forcedInput = document.getElementById('forcedInput');

  function normalizeHostname(value) {
    let hostname = value.trim();
    if (!hostname) return '';

    if (!/^https?:\/\//i.test(hostname)) {
      hostname = 'http://' + hostname;
    }

    try {
      return new URL(hostname).hostname;
    } catch {
      return hostname.replace(/^https?:\/\//i, '').split(/[/?#]/)[0];
    }
  }

  function addHostname(input, button, key) {
    button.addEventListener('click', () => {
      const hostname = normalizeHostname(input.value);
      if (!hostname) return;

      chrome.storage.local.get(key, (result) => {
        const list = Array.isArray(result[key]) ? result[key].slice() : [];

        if (!list.includes(hostname)) {
          list.push(hostname);
          chrome.storage.local.set({ [key]: list }, () => {
            input.value = '';
            render();
          });
        } else {
          input.value = '';
          render();
        }
      });
    });
  }

  function renderList(container, items, key, otherItems) {
    container.textContent = '';
    const list = Array.isArray(items) ? items : [];
    const other = Array.isArray(otherItems) ? otherItems : [];

    if (list.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'None';
      container.appendChild(empty);
      return;
    }

    list.forEach((hostname) => {
      const row = document.createElement('div');
      row.className = 'row';

      const label = document.createElement('span');
      const hostnameText = document.createElement('span');
      hostnameText.textContent = hostname;
      label.appendChild(hostnameText);

      if (key === '__forced__' && other.includes(hostname)) {
        const note = document.createElement('span');
        note.textContent = ' (overridden by exclusion)';
        note.style.color = '#888';
        label.appendChild(note);
      }

      const removeButton = document.createElement('button');
      removeButton.textContent = 'Remove';
      removeButton.addEventListener('click', () => {
        const nextItems = list.filter((item) => item !== hostname);
        chrome.storage.local.set({ [key]: nextItems }, render);
      });

      row.appendChild(label);
      row.appendChild(removeButton);
      container.appendChild(row);
    });
  }

  function render() {
    chrome.storage.local.get(['__excluded__', '__forced__'], (result) => {
      renderList(excludedList, result.__excluded__, '__excluded__', result.__forced__);
      renderList(forcedList, result.__forced__, '__forced__', result.__excluded__);
    });
  }

  addHostname(excludedInput, document.getElementById('excludedAdd'), '__excluded__');
  addHostname(forcedInput, document.getElementById('forcedAdd'), '__forced__');

  render();
});