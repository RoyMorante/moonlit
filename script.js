const modeTabs = document.querySelectorAll('.mode-tab');
const modeInput = document.querySelector('#mode-input');
const message = document.querySelector('#message');
const messageLabel = document.querySelector('#message-label');
const submitLabel = document.querySelector('#submit-label');
const characterCount = document.querySelector('#character-count');
const cipherSelect = document.querySelector('#cipher');
const keyLabel = document.querySelector('#key-label');
const keyInput = document.querySelector('#key');
const keyHint = document.querySelector('#key-hint');
const clearButton = document.querySelector('#clear-button');
const copyButton = document.querySelector('#copy-button');

function updateCount() {
    if (message && characterCount) {
        characterCount.textContent = message.value.length;
    }
}

function setMode(mode) {
    const isDecrypt = mode === 'decrypt';
    modeInput.value = mode;
    messageLabel.textContent = isDecrypt ? 'Your ciphertext' : 'Your message';
    message.placeholder = isDecrypt ? 'Paste your encoded message here...' : 'Type something only you should read...';
    submitLabel.textContent = isDecrypt ? 'Unlock message' : 'Create ciphertext';

    modeTabs.forEach((tab) => {
        const active = tab.dataset.mode === mode;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
    });
}

modeTabs.forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
message?.addEventListener('input', updateCount);

cipherSelect?.addEventListener('change', () => {
    const isVigenere = cipherSelect.value === 'vigenere';
    keyLabel.textContent = isVigenere ? 'Keyword' : 'Shift amount';
    keyInput.placeholder = isVigenere ? 'e.g. moonlight' : 'e.g. 3';
    keyHint.innerHTML = `<span>⌁</span> ${isVigenere ? 'Letters only, spaces are ignored' : 'Use any whole-number shift'}`;
});

clearButton?.addEventListener('click', () => {
    message.value = '';
    keyInput.value = '';
    updateCount();
    message.focus();
});

copyButton?.addEventListener('click', async () => {
    const result = document.querySelector(`#${copyButton.dataset.copyTarget}`);
    if (!result) return;

    try {
        await navigator.clipboard.writeText(result.value);
        copyButton.innerHTML = 'Copied <span>✓</span>';
        window.setTimeout(() => { copyButton.innerHTML = 'Copy <span>⧉</span>'; }, 1600);
    } catch {
        result.select();
        document.execCommand('copy');
    }
});

updateCount();
