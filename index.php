<?php

declare(strict_types=1);

$mode = $_POST['mode'] ?? 'encrypt';
$cipher = $_POST['cipher'] ?? 'caesar';
$input = (string) ($_POST['message'] ?? '');
$key = (string) ($_POST['key'] ?? '');
$result = '';
$error = '';

function shiftLetter(string $letter, int $shift): string
{
    $base = ord(ctype_upper($letter) ? 'A' : 'a');
    $position = ord($letter) - $base;
    $shifted = (($position + $shift) % 26 + 26) % 26;

    return chr($base + $shifted);
}

function caesar(string $message, int $shift): string
{
    $output = '';
    for ($index = 0, $length = strlen($message); $index < $length; $index++) {
        $character = $message[$index];
        $output .= ctype_alpha($character) ? shiftLetter($character, $shift) : $character;
    }

    return $output;
}

function vigenere(string $message, string $keyword, bool $decrypt = false): string
{
    $lettersOnlyKey = preg_replace('/[^A-Za-z]/', '', $keyword);
    if ($lettersOnlyKey === '') {
        throw new InvalidArgumentException('Vigenere needs a keyword made from letters.');
    }

    $output = '';
    $keyIndex = 0;
    for ($index = 0, $length = strlen($message); $index < $length; $index++) {
        $character = $message[$index];
        if (!ctype_alpha($character)) {
            $output .= $character;
            continue;
        }

        $keyShift = ord(strtolower($lettersOnlyKey[$keyIndex % strlen($lettersOnlyKey)])) - ord('a');
        $output .= shiftLetter($character, $decrypt ? -$keyShift : $keyShift);
        $keyIndex++;
    }

    return $output;
}

function transformMessage(string $message, string $cipher, string $key, bool $decrypt = false): string
{
    if ($cipher === 'vigenere') {
        return vigenere($message, $key, $decrypt);
    }

    if (!preg_match('/^-?\d+$/', $key)) {
        throw new InvalidArgumentException('Caesar needs a whole-number shift, such as 3 or 13.');
    }

    return caesar($message, $decrypt ? -(int) $key : (int) $key);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if ($input === '' || $key === '') {
            throw new InvalidArgumentException('Add a message and a cipher key to continue.');
        }

        if ($mode === 'decrypt') {
            $result = transformMessage($input, $cipher, $key, true);
        } else {
            $mode = 'encrypt';
            $result = transformMessage($input, $cipher, $key);
        }
    } catch (Throwable $exception) {
        $error = $exception->getMessage();
    }
}

$escapedInput = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
$escapedResult = htmlspecialchars($result, ENT_QUOTES, 'UTF-8');
$escapedError = htmlspecialchars($error, ENT_QUOTES, 'UTF-8');
$isDecrypt = $mode === 'decrypt';
$isVigenere = $cipher === 'vigenere';
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="A soft, secure encryption and decryption workspace.">
    <title>Moonlit Cipher</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="ambient ambient-one"></div>
    <div class="ambient ambient-two"></div>
    <main class="app-shell">
        <header class="topbar">
            <a class="brand" href="index.php" aria-label="Moonlit Cipher home">
                <span class="brand-mark">✦</span>
                <span>moonlit <strong>cipher</strong></span>
            </a>
            <div class="status-pill"><span class="status-dot"></span> private by design</div>
        </header>

        <section class="hero">
            <div class="eyebrow"><span></span> your little secret keeper</div>
            <h1>Keep your words<br><em>just between us.</em></h1>
            <p>A pretty little place to tuck away your thoughts. Encrypt something sweet, or unlock a message waiting for you.</p>
        </section>

        <section class="workspace" aria-label="Cipher workspace">
            <div class="mode-tabs" role="tablist" aria-label="Cipher mode">
                <button type="button" class="mode-tab <?= !$isDecrypt ? 'active' : '' ?>" data-mode="encrypt" role="tab" aria-selected="<?= !$isDecrypt ? 'true' : 'false' ?>">
                    <span class="tab-icon">✧</span> Encrypt
                </button>
                <button type="button" class="mode-tab <?= $isDecrypt ? 'active' : '' ?>" data-mode="decrypt" role="tab" aria-selected="<?= $isDecrypt ? 'true' : 'false' ?>">
                    <span class="tab-icon">♡</span> Decrypt
                </button>
            </div>

            <form class="cipher-form" method="post" action="index.php" id="cipher-form">
                <input type="hidden" name="mode" id="mode-input" value="<?= $isDecrypt ? 'decrypt' : 'encrypt' ?>">
                <div class="form-grid">
                    <div class="field-group message-field">
                        <div class="field-heading">
                            <label for="message" id="message-label"><?= $isDecrypt ? 'Your ciphertext' : 'Your message' ?></label>
                            <span class="character-count"><span id="character-count">0</span> chars</span>
                        </div>
                        <textarea id="message" name="message" placeholder="<?= $isDecrypt ? 'Paste your encoded message here...' : 'Type something only you should read...' ?>" spellcheck="true" required><?= $escapedInput ?></textarea>
                    </div>

                    <div class="field-group passphrase-field">
                        <label for="cipher">Cipher method</label>
                        <select id="cipher" name="cipher">
                            <option value="caesar" <?= !$isVigenere ? 'selected' : '' ?>>Caesar cipher</option>
                            <option value="vigenere" <?= $isVigenere ? 'selected' : '' ?>>Vigenere cipher</option>
                        </select>
                        <label for="key" id="key-label"><?= $isVigenere ? 'Keyword' : 'Shift amount' ?></label>
                        <div class="input-with-action">
                            <input type="text" id="key" name="key" value="<?= htmlspecialchars($key, ENT_QUOTES, 'UTF-8') ?>" placeholder="<?= $isVigenere ? 'e.g. moonlight' : 'e.g. 3' ?>" required>
                        </div>
                        <p class="field-hint" id="key-hint"><span>⌁</span> <?= $isVigenere ? 'Letters only, spaces are ignored' : 'Use any whole-number shift' ?></p>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="primary-button" type="submit" id="submit-button">
                        <span id="submit-label"><?= $isDecrypt ? 'Unlock message' : 'Create ciphertext' ?></span>
                        <span class="button-arrow">↗</span>
                    </button>
                    <button class="clear-button" type="button" id="clear-button">Clear all</button>
                </div>
            </form>

            <?php if ($result !== ''): ?>
                <section class="result-panel" aria-live="polite">
                    <div class="result-heading">
                        <div>
                            <span class="result-kicker"><?= $isDecrypt ? 'Message unlocked' : 'Your secret is ready' ?></span>
                            <h2><?= $isDecrypt ? 'Welcome back to the words.' : 'A little magic, encoded.' ?></h2>
                        </div>
                        <button type="button" class="copy-button" id="copy-button" data-copy-target="result-text">Copy <span>⧉</span></button>
                    </div>
                    <textarea class="result-text" id="result-text" readonly><?= $escapedResult ?></textarea>
                </section>
            <?php elseif ($error !== ''): ?>
                <div class="error-message" role="alert"><span>!</span><?= $escapedError ?></div>
            <?php endif; ?>
        </section>

        <footer class="footer-note">
            <span>made for quiet thoughts</span>
            <span class="footer-sparkle">✦</span>
            <span>classical cipher studio</span>
        </footer>
    </main>
    <script src="script.js"></script>
</body>
</html>
