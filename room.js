// ==========================================
// СОСТОЯНИЕ И ПЕРЕМЕННЫЕ
// ==========================================
let TRAITOR_NAME = ""; 

// ==========================================
// ЗАГРУЗКА И РАСШИФРОВКА ИМЕНИ
// ==========================================
async function loadTraitorName() {
    try {
        const response = await fetch('traitor.txt');
        if (!response.ok) throw new Error('Файл не найден');
        
        const encodedText = await response.text();
        
        // Расшифровываем Base64
        const decodedText = decodeURIComponent(escape(atob(encodedText.trim())));
        
        // Парсим JSON массив и берем первый элемент, сразу переводя в нижний регистр
        const data = JSON.parse(decodedText);
        TRAITOR_NAME = data[0].toLowerCase(); 
        
        console.log("Имя успешно загружено из файла.");
    } catch (error) {
        console.error("Ошибка загрузки имени:", error);
        // Если файла нет, ставим заглушку, чтобы игра не сломалась на тестах
        TRAITOR_NAME = "test"; 
    }
}

// ==========================================
// ЛОГИКА ИНТЕРФЕЙСА
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // Загружаем имя при старте
    await loadTraitorName();

    const chestView = document.getElementById('chestView');
    const letterView = document.getElementById('letterView');
    const chestImg = document.getElementById('chestImg');
    
    const waxSealBtn = document.getElementById('waxSealBtn');
    const nameModal = document.getElementById('nameModal');
    const submitNameBtn = document.getElementById('submitNameBtn');
    const closeNameBtn = document.getElementById('closeNameBtn');
    const nameInput = document.getElementById('traitorNameInput');
    const nameError = document.getElementById('nameError');


    // 1. Клик по сундуку
    chestImg.addEventListener('click', () => {
        chestView.classList.remove('active');
        letterView.classList.add('active');
    });

        // 2. Клик по печати (открывает модалку)
    waxSealBtn.addEventListener('click', () => {
        nameModal.style.display = 'flex';
        nameInput.value = '';
        nameError.innerText = '';
        nameInput.focus();
    });

    // НОВОЕ: Клик по крестику (отложить письмо)
    closeLetterBtn.addEventListener('click', () => {
        letterView.classList.remove('active'); // Прячем письмо
        chestView.classList.add('active');     // Показываем сундук обратно
    });
    
    // 3. Закрыть модалку
    closeNameBtn.addEventListener('click', () => {
        nameModal.style.display = 'none';
    });

    // 4. Проверка имени
    const checkName = () => {
        // Берем введенный текст, убираем пробелы по краям и делаем все буквы маленькими
        const input = nameInput.value.trim().toLowerCase();
        
        if (input === TRAITOR_NAME) {
            // Успех!
            nameModal.style.display = 'none';
            alert("Имя верное! (Здесь будет переход на следующую страницу или продолжение сюжета)");
        } else {
            // Неудача
            nameError.innerText = "Это не он. Подумай еще.";
            nameInput.value = '';
            nameInput.focus();
        }
    };

    // Проверка по кнопке и по Enter
    submitNameBtn.addEventListener('click', checkName);
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkName();
    });
});