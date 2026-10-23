// ==========================================
// 1. КОНФИГУРАЦИЯ И СОСТОЯНИЕ
// ==========================================

// Правильные ответы теперь загружаются из файла
let RIDDLE_ANSWERS = [];

// Даты разблокировки (МСК, декабрь 2026)
const UNLOCK_DATES = [
    new Date('2026-12-05T12:00:00+03:00').getTime(),
    new Date('2026-12-10T12:00:00+03:00').getTime(),
    new Date('2026-12-15T12:00:00+03:00').getTime(),
    new Date('2026-12-20T12:00:00+03:00').getTime(),
    new Date('2026-12-25T12:00:00+03:00').getTime()
];

// Начальное положение цепей (для красоты)
const CHAINS_PRESET = [
    { id: 0, top: '20%', rotate: '15deg' },
    { id: 1, top: '35%', rotate: '-10deg' },
    { id: 2, top: '55%', rotate: '12deg' },
    { id: 3, top: '70%', rotate: '-15deg' },
    { id: 4, top: '85%', rotate: '5deg' }
];

// Состояние игры по умолчанию (убрали поля для времени)
const DEFAULT_STATE = {
    playerName: "",
    keys: 0,
    solvedRiddles: [false, false, false, false, false],
    activeChains: [0, 1, 2, 3, 4],
    devMode: false
};

let state = JSON.parse(JSON.stringify(DEFAULT_STATE));
let currentRiddleIndex = -1;

// ==========================================
// 2. ЗАГРУЗКА И РАСШИФРОВКА ОТВЕТОВ
// ==========================================

async function loadAnswers() {
    try {
        // Запрашиваем текстовый файл с сервера
        const response = await fetch('answers.txt');
        if (!response.ok) throw new Error('Файл с ответами не найден');
        
        const encodedText = await response.text();
        
        // Расшифровываем Base64 обратно в строку и парсим как JSON массив
        const decodedText = decodeURIComponent(escape(atob(encodedText.trim())));
        RIDDLE_ANSWERS = JSON.parse(decodedText);
        
        console.log("Ответы успешно загружены и расшифрованы.");
    } catch (error) {
        console.error("Не удалось загрузить ответы. Проверьте наличие answers.txt", error);
        // Если файла нет, ставим заглушки, чтобы игра не сломалась
        RIDDLE_ANSWERS = ["ответ1", "ответ2", "ответ3", "ответ4", "ответ5"];
    }
}

// ==========================================
// 3. ЛОГИКА ИНТЕРФЕЙСА (РЕНДЕР)
// ==========================================

function updateUI() {
    // Ключи
    document.getElementById('keyCount').innerText = state.keys;
    
    // Профиль
    document.getElementById('profileNameDisplay').innerText = state.playerName || "Не задано";
    const profileBtn = document.getElementById('profileBtn');
    profileBtn.innerText = state.playerName ? state.playerName.charAt(0).toUpperCase() : "?";

    // Кнопки загадок
    const container = document.getElementById('riddlesContainer');
    container.innerHTML = '';
    
    // ТЕПЕРЬ ИСПОЛЬЗУЕМ ЛОКАЛЬНОЕ ВРЕМЯ ПК (или Infinity для теста)
    const currentTime = state.devMode ? Infinity : Date.now();

    for (let i = 0; i < 5; i++) {
        const isUnlocked = currentTime >= UNLOCK_DATES[i];
        const isSolved = state.solvedRiddles[i];

        const btnWrapper = document.createElement('div');
        btnWrapper.className = 'riddle-btn-container';

        const btn = document.createElement('button');
        btn.className = 'riddle-btn';
        btn.innerHTML = `Кнопка с загадкой ${i + 1}`;
        
        if (isSolved) {
            btn.innerHTML += " ✅";
            btn.disabled = true;
        } else if (!isUnlocked) {
            btn.disabled = true;
        } else {
            btn.onclick = () => openRiddle(i);
        }
        btnWrapper.appendChild(btn);

        if (!isUnlocked) {
            const lock = document.createElement('div');
            lock.className = 'lock-icon';
            lock.innerHTML = '🔒';
            lock.title="Время для этой загадки еще не наступило!";
            btnWrapper.appendChild(lock);
        }

        container.appendChild(btnWrapper);
    }

    // Цепи
    const chainsContainer = document.getElementById('chainsContainer');
    chainsContainer.innerHTML = '';
    
    CHAINS_PRESET.forEach(chainDef => {
        if (state.activeChains.includes(chainDef.id)) {
            const chain = document.createElement('div');
            chain.className = 'chain';
            chain.style.top = chainDef.top;
            chain.style.transform = `rotate(${chainDef.rotate})`;
            chain.onclick = () => removeChain(chainDef.id);
            chainsContainer.appendChild(chain);
        }
    });

        // Состояние двери
    const doorClosed = document.getElementById('doorClosed');
    const doorOpen = document.getElementById('doorOpen');
    const isDoorUnlocked = state.activeChains.length === 0;

    if (isDoorUnlocked) {
        // Цепей нет: делаем закрытую дверь черным проемом
        
        // Назначаем клик на проем, чтобы открыть дверь
        doorClosed.onclick = triggerDoorOpen;
    } else {
        // Цепи есть: возвращаем нормальный вид (на случай дебаг-сброса)
        doorClosed.classList.remove('is-black');
        doorClosed.onclick = null;
        
        // Прячем открытую дверь обратно
        doorOpen.classList.remove('show');
    }
}

// ==========================================
// 4. МЕХАНИКА ЗАГАДОК
// ==========================================

function openRiddle(index) {
    currentRiddleIndex = index;
    document.getElementById('riddleText').innerText = `Загадка номер ${index + 1}`;
    document.getElementById('riddleInput').value = '';
    document.getElementById('riddleError').innerText = '';
    document.getElementById('riddleModal').style.display = 'flex';
    document.getElementById('riddleInput').focus();
}

function submitRiddle() {
    if (currentRiddleIndex === -1) return;
    
    const input = document.getElementById('riddleInput').value.trim().toLowerCase();
    const correctAnswer = RIDDLE_ANSWERS[currentRiddleIndex].toLowerCase();
    const errorEl = document.getElementById('riddleError');

    if (input === correctAnswer) {
        state.solvedRiddles[currentRiddleIndex] = true;
        state.keys += 1;
        saveState();
        updateUI();
        document.getElementById('riddleModal').style.display = 'none';
        currentRiddleIndex = -1;
    } else {
        errorEl.innerText = "Ответ неверный!";
        document.getElementById('riddleInput').value = '';
        document.getElementById('riddleInput').focus();
    }
}

// ==========================================
// 5. МЕХАНИКА ЦЕПЕЙ И ДВЕРИ
// ==========================================

function removeChain(chainId) {
    // Проверяем, висит ли еще эта цепь
    if (!state.activeChains.includes(chainId)) return;

    if (state.keys > 0) {
        state.keys -= 1;
        // Удаляем конкретный ID из массива активных цепей
        state.activeChains = state.activeChains.filter(id => id !== chainId);
        
        saveState();
        updateUI();
    } else {
        alert("У вас нет ключей! Разгадайте загадки.");
    }
}
// ==========================================
// 5.5. ОТКРЫТИЕ ДВЕРИ И ПЕРЕХОД
// ==========================================

function triggerDoorOpen() {
    const doorClosed = document.getElementById('doorClosed');
    const doorOpen = document.getElementById('doorOpen');

    // Защита от повторного клика
    doorClosed.onclick = null; 

    // 1. Показываем открытую дверь
    doorClosed.classList.add('is-black');
    doorOpen.classList.add('show');

    // 2. Воспроизводим звук (раскомментируй, когда добавишь файл)
    const audio = new Audio('door-creak.mp3');
     audio.play().catch(e => console.log("Аудио заблокировано браузером:", e));

    // 3. Ждем 1.5 секунды и переводим на новую страницу
    setTimeout(() => {
        alert("Дверь открыта! Перевод на следующую страницу (в разработке).");
        
        // window.location.href = 'next-page.html'; // Раскомментируй, когда будет страница
    }, 1500);
}
// ==========================================
// 6. СОХРАНЕНИЕ, ЭКСПОРТ И ИМПОРТ
// ==========================================

function saveState() {
    const stateToSave = { ...state };
    localStorage.setItem('questState', JSON.stringify(stateToSave));
}

function loadState() {
    const saved = localStorage.getItem('questState');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state = { ...state, ...parsed };
        } catch (e) {
            console.error("Ошибка загрузки состояния", e);
        }
    } else {
        setTimeout(() => {
            document.getElementById('profileModal').style.display = 'flex';
        }, 500);
    }
}

function exportData() {
    const stateToExport = { ...state };
    
    const dataStr = JSON.stringify(stateToExport);
    const encodedData = btoa(unescape(encodeURIComponent(dataStr))); 
    
    const blob = new Blob([encodedData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `save_${state.playerName || 'player'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const encodedData = e.target.result;
            const decodedStr = decodeURIComponent(escape(atob(encodedData)));
            const importedState = JSON.parse(decodedStr);
            
            if (importedState.keys !== undefined && importedState.activeChains !== undefined) {
                state = { ...state, ...importedState };
                saveState();
                updateUI();
                alert("Данные успешно импортированы!");
                document.getElementById('profileModal').style.display = 'none';
            } else {
                alert("Неверный формат файла!");
            }
        } catch (error) {
            alert("Ошибка при чтении файла. Возможно, он поврежден.");
        }
    };
    reader.readAsText(file);
}

// ==========================================
// 7. СОБЫТИЯ
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
            // Логика для мобильного меню (бургер)
    const burgerBtn = document.getElementById('burgerBtn');
    const panelWrapper = document.querySelector('.left-panel-wrapper'); // Ищем обертку

    if (burgerBtn && panelWrapper) {
        burgerBtn.addEventListener('click', () => {
            // Переключаем класс active у ОБЕРТКИ
            panelWrapper.classList.toggle('active');
        });
    }
    // Загадки
    document.getElementById('submitRiddleBtn').onclick = submitRiddle;
    document.getElementById('closeRiddleBtn').onclick = () => {
        document.getElementById('riddleModal').style.display = 'none';
        currentRiddleIndex = -1;
    };
    document.getElementById('riddleInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitRiddle();
    });

    // Профиль
    document.getElementById('profileBtn').onclick = () => document.getElementById('profileModal').style.display = 'flex';
    document.getElementById('closeProfileBtn').onclick = () => document.getElementById('profileModal').style.display = 'none';
    
    document.getElementById('saveNameBtn').onclick = () => {
        state.playerName = document.getElementById('nameInput').value.trim();
        saveState();
        updateUI();
    };
 document.getElementById('nameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            state.playerName = document.getElementById('nameInput').value.trim();
            document.getElementById('profileModal').style.display = 'none';
            saveState();
            updateUI();
            
        }
    });
    document.getElementById('exportBtn').onclick = exportData;
    document.getElementById('importBtn').onclick = () => document.getElementById('importFile').click();
    document.getElementById('importFile').onchange = (e) => {
        if (e.target.files.length > 0) importData(e.target.files[0]);
    };

    // Дебаг панель
    document.getElementById('devTrigger').onclick = () => {
        document.getElementById('devPanel').style.display = 'flex';
        document.getElementById('devKeysInput').value = state.keys;
        document.getElementById('devTimeToggle').checked = state.devMode;
    };
    document.getElementById('closeDevPanel').onclick = () => document.getElementById('devPanel').style.display = 'none';
    
    document.getElementById('devTimeToggle').onchange = (e) => {
        state.devMode = e.target.checked;
        updateUI();
    };

    document.getElementById('devSetKeys').onclick = () => {
        state.keys = parseInt(document.getElementById('devKeysInput').value) || 0;
        updateUI();
    };

    document.getElementById('devResetChains').onclick = () => {
        state.activeChains = [0, 1, 2, 3, 4];
        updateUI();
    };

    document.getElementById('devResetAll').onclick = () => {
        if(confirm("Сбросить весь прогресс?")) {
            localStorage.removeItem('questState');
            state = JSON.parse(JSON.stringify(DEFAULT_STATE));
            location.reload();
        }
    };

    // Инициализация
    // Загружаем состояние, ответы и только потом обновляем интерфейс
    (async () => {
        loadState();
        await loadAnswers();
        updateUI();
    })();
});
