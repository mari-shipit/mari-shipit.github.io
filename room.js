// ==========================================
// ГЕЙТ: в комнату только с открытой дверью
// ==========================================
(function gate() {
    try {
        const s = JSON.parse(localStorage.getItem('questState') || '{}');
        if (!s.activeChains || s.activeChains.length > 0) location.replace('index.html');
    } catch (e) { location.replace('index.html'); }
})();

// ==========================================
// СОСТОЯНИЕ И ПЕРЕМЕННЫЕ
// ==========================================
let TRAITOR_NAME = "";
const norm = s => s.trim().toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ');

// ==========================================
// ЗАГРУЗКА И РАСШИФРОВКА ИМЕНИ
// ==========================================
async function loadTraitorName() {
    try {
        const response = await fetch('traitor.txt');
        if (!response.ok) throw new Error('Файл не найден');

        const encodedText = await response.text();
        const decodedText = decodeURIComponent(escape(atob(encodedText.trim())));

        const data = JSON.parse(decodedText);
        TRAITOR_NAME = data[0] ? norm(data[0]) : "";

        console.log("Имя успешно загружено из файла.");
    } catch (error) {
        console.error("Ошибка загрузки имени:", error);
        TRAITOR_NAME = "";
    }
}

// ==========================================
// ЛОГИКА ИНТЕРФЕЙСА
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadTraitorName();

    const chestView = document.getElementById('chestView');
    const letterView = document.getElementById('letterView');
    const chestImg = document.getElementById('chestImg');

    const closeLetterBtn = document.getElementById('closeLetterBtn');
    const waxSealBtn = document.getElementById('waxSealBtn');

    const nameModal = document.getElementById('nameModal');
    const submitNameBtn = document.getElementById('submitNameBtn');
    const closeNameBtn = document.getElementById('closeNameBtn');
    const nameInput = document.getElementById('traitorNameInput');
    const nameError = document.getElementById('nameError');

    const letterBtn = document.getElementById('letterBtn');
    const letterModal = document.getElementById('letterModal');
    const closeLetterModalBtn = document.getElementById('closeLetterModalBtn');
const letterSound = new Audio('letter.mp3');
letterSound.preload = 'auto';
const playLetterSound = () => {
    letterSound.currentTime = 0;
    letterSound.play().catch(e => console.log('Аудио заблокировано:', e));
};
    // --- Письмо из сундука (окно с прокруткой) ---
    const openLetterModal = () => {
        letterModal.style.display = 'flex';
        letterModal.querySelector('.letter-scroll').scrollTop = 0;
    };
    const closeLetterModal = () => { letterModal.style.display = 'none'; };

    letterBtn.addEventListener('click', () => {
    playLetterSound();
    openLetterModal();
});

    closeLetterModalBtn.addEventListener('click', () => {
    playLetterSound();
    closeLetterModal();
});
    letterModal.addEventListener('click', e => {
        if (e.target === letterModal) closeLetterModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeLetterModal();
            nameModal.style.display = 'none';
        }
    });

    // --- 1. Клик по сундуку ---
    chestImg.addEventListener('click', () => {
        chestView.classList.remove('active');
        letterView.classList.add('active');
    });

    // --- 2. Клик по печати ---
    waxSealBtn.addEventListener('click', () => {
        nameModal.style.display = 'flex';
        nameInput.value = '';
        nameError.innerText = '';
        nameInput.focus();
    });

    // --- Крестик на конверте (отложить письмо) ---
    closeLetterBtn.addEventListener('click', () => {
        letterView.classList.remove('active');
        chestView.classList.add('active');
    });

    // --- 3. Закрыть модалку имени ---
    closeNameBtn.addEventListener('click', () => {
        nameModal.style.display = 'none';
    });

    // --- 4. Проверка имени ---
    const checkName = () => {
        if (!TRAITOR_NAME) {
            nameError.innerText = "Не удалось загрузить данные, обнови страницу.";
            return;
        }

        const input = norm(nameInput.value);

        if (input === TRAITOR_NAME) {
            nameModal.style.display = 'none';
            alert("Имя верное! (Здесь будет переход на следующую страницу или продолжение сюжета)");
        } else {
            nameError.innerText = "Это не он. Подумай еще.";
            nameInput.value = '';
            nameInput.focus();
        }
    };

    submitNameBtn.addEventListener('click', checkName);
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkName();
    });
});