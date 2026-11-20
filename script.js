const $ = id => document.getElementById(id);

const input = $("input");
const count = $("count");
const colors = $("colors");
const spaces = $("spaces");
const punctuation = $("punctuation");
const results = $("results");

let generatedResults = [];

function saveSettings() {
    localStorage.setItem("scramble-config", JSON.stringify({
        count: count.value,
        colors: colors.checked,
        spaces: spaces.checked,
        punctuation: punctuation.checked
    }));
}

function loadSettings() {
    try {
        const config = JSON.parse(localStorage.getItem("scramble-config"));

        if (!config) return;

        count.value = config.count ?? 10;
        colors.checked = config.colors ?? true;
        spaces.checked = config.spaces ?? true;
        punctuation.checked = config.punctuation ?? true;
    } catch {
        localStorage.removeItem("scramble-config");
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

function scramble(text) {
    const characters = Array.from(text);
    const movable = [];
    const fixedSpaces = [];
    const fixedPunctuation = [];

    characters.forEach((character, index) => {
        if (/\s/u.test(character)) {
            fixedSpaces.push(index);
        } else if (!punctuation.checked && /[^\p{L}\p{N}]/u.test(character)) {
            fixedPunctuation.push(index);
        } else {
            movable.push(index);
        }
    });

    const shuffled = shuffle(movable.map(index => characters[index]));
    const output = [...characters];

    movable.forEach((index, i) => {
        output[index] = shuffled[i];
    });

    if (spaces.checked) {
        const nonSpaces = output.filter(character => !/\s/u.test(character));

        for (let i = fixedSpaces.length; i > 0; i--) {
            const position = Math.floor(Math.random() * (nonSpaces.length + 1));
            nonSpaces.splice(position, 0, " ");
        }

        return nonSpaces.join("");
    }

    return output.join("");
}

function randomRGB() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    return `rgb(${r}, ${g}, ${b})`;
}

function renderResult(text, index) {
    const card = document.createElement("div");
    card.className = "result-card";

    const header = document.createElement("div");
    header.className = "result-card-header";

    const number = document.createElement("span");
    number.className = "result-number";
    number.textContent = `${index + 1}회차`;

    const copy = document.createElement("button");
    copy.className = "copy-button";
    copy.textContent = "COPY";

    copy.addEventListener("click", () => copyText(text));

    header.append(number, copy);

    const content = document.createElement("div");
    content.className = "result-text";

    for (const character of text) {
        const span = document.createElement("span");
        span.textContent = character;

        if (colors.checked && !/\s/u.test(character)) {
            span.style.color = randomRGB();
        }

        content.appendChild(span);
    }

    card.append(header, content);

    return card;
}

function generate() {
    const text = input.value;

    if (!text.trim()) {
        showToast("문장을 입력해주세요.");
        input.focus();
        return;
    }

    const amount = Math.min(100, Math.max(1, Number(count.value) || 10));
    count.value = amount;

    saveSettings();

    generatedResults = [];

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < amount; i++) {
        const result = scramble(text);

        generatedResults.push(result);
        fragment.appendChild(renderResult(result, i));
    }

    results.replaceChildren(fragment);

    $("resultCount").textContent = `${amount}`;
    $("copyAllButton").disabled = false;
}

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast("복사되었습니다.");
    } catch {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
        showToast("복사되었습니다.");
    }
}

function showToast(message) {
    const toast = $("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 1800);
}

$("scrambleButton").addEventListener("click", generate);

$("copyAllButton").addEventListener("click", () => {
    copyText(generatedResults.join("\n"));
});

input.addEventListener("input", () => {
    $("charCount").textContent = `${Array.from(input.value).length} characters`;
});

[count, colors, spaces, punctuation].forEach(element => {
    element.addEventListener("change", saveSettings);
});

loadSettings();

$("charCount").textContent = `${Array.from(input.value).length} characters`;
