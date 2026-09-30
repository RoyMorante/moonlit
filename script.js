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
const resultPanel = document.querySelector('#result-panel');
const resultTitle = document.querySelector('#result-title');
const resultKicker = document.querySelector('#result-kicker');
const resultText = document.querySelector('#result-text');
const errorMessage = document.querySelector('#error-message');
const errorText = document.querySelector('#error-text');
const form = document.querySelector('#cipher-form');

function shiftLetter(letter, shift) {
    const upper = /^[A-Z]$/.test(letter);
    const base = upper ? 'A'.charCodeAt(0) : 'a'.charCodeAt(0);
    const position = letter.charCodeAt(0) - base;
    const shifted = ((position + shift) % 26 + 26) % 26;
    return String.fromCharCode(base + shifted);
}

function caesar(message, shift) {
    let output = '';
    for (const character of message) {
        output += /[A-Za-z]/.test(character) ? shiftLetter(character, shift) : character;
    }
    return output;
}

function vigenere(message, keyword, decrypt = false) {
    const lettersOnlyKey = keyword.replace(/[^A-Za-z]/g, '');
    if (!lettersOnlyKey) {
        throw new Error('Vigenere needs a keyword made from letters.');
    }

    let output = '';
    let keyIndex = 0;

    for (const character of message) {
        if (!/[A-Za-z]/.test(character)) {
            output += character;
            continue;
        }

        const keyShift = lettersOnlyKey[keyIndex % lettersOnlyKey.length].toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
        output += shiftLetter(character, decrypt ? -keyShift : keyShift);
        keyIndex += 1;
    }

    return output;
}

function transformMessage(messageValue, cipher, keyValue, decrypt = false) {
    if (cipher === 'vigenere') {
        return vigenere(messageValue, keyValue, decrypt);
    }

    if (!/^-?\d+$/.test(keyValue)) {
        throw new Error('Caesar needs a whole-number shift, such as 3 or 13.');
    }

    return caesar(messageValue, decrypt ? -Number(keyValue) : Number(keyValue));
}

function updateCount() {
    if (message && characterCount) {
        characterCount.textContent = String(message.value.length);
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

function updateKeyField() {
    const isVigenere = cipherSelect.value === 'vigenere';
    keyLabel.textContent = isVigenere ? 'Keyword' : 'Shift amount';
    keyInput.placeholder = isVigenere ? 'e.g. moonlight' : 'e.g. 3';
    keyHint.innerHTML = `<span>⌁</span> ${isVigenere ? 'Letters only, spaces are ignored' : 'Use any whole-number shift'}`;
}

function setResult(output, isDecrypt) {
    resultPanel.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    resultKicker.textContent = isDecrypt ? 'Message unlocked' : 'Your secret is ready';
    resultTitle.textContent = isDecrypt ? 'Welcome back to the words.' : 'A little magic, encoded.';
    resultText.value = output;
    copyButton.innerHTML = 'Copy <span>⧉</span>';
}

function setError(errorMessageText) {
    errorText.textContent = errorMessageText;
    errorMessage.classList.remove('hidden');
    resultPanel.classList.add('hidden');
}

modeTabs.forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
message?.addEventListener('input', updateCount);

cipherSelect?.addEventListener('change', () => {
    updateKeyField();
});

clearButton?.addEventListener('click', () => {
    message.value = '';
    keyInput.value = '';
    resultPanel.classList.add('hidden');
    errorMessage.classList.add('hidden');
    updateCount();
    message.focus();
});

copyButton?.addEventListener('click', async () => {
    if (resultPanel.classList.contains('hidden')) return;

    try {
        await navigator.clipboard.writeText(resultText.value);
        copyButton.innerHTML = 'Copied <span>✓</span>';
        window.setTimeout(() => { copyButton.innerHTML = 'Copy <span>⧉</span>'; }, 1600);
    } catch {
        resultText.select();
        document.execCommand('copy');
    }
});

form?.addEventListener('submit', (event) => {
    event.preventDefault();

    const inputValue = message.value.trim();
    const keyValue = keyInput.value.trim();
    const currentMode = modeInput.value;
    const currentCipher = cipherSelect.value;

    try {
        if (!inputValue || !keyValue) {
            throw new Error('Add a message and a cipher key to continue.');
        }

        const output = transformMessage(inputValue, currentCipher, keyValue, currentMode === 'decrypt');
        setResult(output, currentMode === 'decrypt');
    } catch (error) {
        setError(error.message || 'Something went wrong.');
    }
});

updateKeyField();
updateCount();
