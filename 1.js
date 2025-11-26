import { initialScheduleData } from '/example.js' ;
console.log(initialScheduleData)
    const scheduleContainer = document.getElementById('schedule-container');
    const daysOfWeek = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
    const datesElement = document.getElementById('dates');
    const monthYearElement = document.getElementById('monthYear');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    // Элементы модального окна расписания
    const scheduleModal = document.getElementById('scheduleModal');
    const selectedDateDisplay = document.getElementById('selectedDateDisplay');
    const dayOfWeekSelect = document.getElementById('dayOfWeekSelect');
    const lessonsContainer = document.getElementById('lessonsContainer');
    const addLessonBtn = document.getElementById('addLessonBtn');
    const saveScheduleBtn = document.getElementById('saveScheduleBtn');
    const cancelScheduleBtn = document.getElementById('cancelScheduleBtn');
    const closeModalBtn = document.querySelector('.close');

    let currentDate = new Date();
    let notes = []; 
    let currentEditingDate = null;
    let currentlySelectedDate = null;
    let currentWeekStartDate = null;

    // Примерные данные для выпадающих списков
    const availableLessons = [
        "Фортепиано", "Сольфеджио", "Гитара", "Скрипка", 
        "Хоровое пение", "История музыки", "Теория музыки"
    ];
    
    const availableTeachers = [
        "Иванова А.П.", "Петров В.С.", "Сидоров М.Д.", 
        "Кузнецова Е.Н.", "Васильев И.О."
    ];
    
    const availableCabinets = [
        "101", "102", "205", "301", "Актовый зал", "Концертный зал"
    ];

    function formatDateToISO(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatDateToRussian(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        const day = date.getDate();
        const month = date.toLocaleString('ru-RU', { month: 'long' });
        const year = date.getFullYear();
        const weekday = date.toLocaleString('ru-RU', { weekday: 'long' });
        return `${day} ${month} ${year} года, ${weekday}`;
    }

    // Функция для получения начала недели (понедельник)
    function getWeekStartDate(date) {
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
    }

   // Функция для получения дат недели с возможностью получения предыдущих/следующих недель
function getWeekDates(startDate, weeksOffset = 0) {
    const week = [];
    const start = new Date(startDate);
    
    // Добавляем смещение недель
    if (weeksOffset !== 0) {
        start.setDate(start.getDate() + (weeksOffset * 7));
    }
    
    // Устанавливаем начало недели (понедельник)
    const dayOfWeek = start.getDay();
    const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    start.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        week.push({
            date: new Date(date),
            dayOfWeek: daysOfWeek[i],
            formatted: formatDateToISO(date),
            dateString: formatDateToISO(date)
        });
    }
    return week;
}

// Функция для предварительной инициализации данных на несколько недель вперед
function preInitializeWeeksData() {
    const today = new Date();
    const currentWeekStart = getWeekStartDate(today);
    
    // Инициализируем данные на текущую неделю и 4 недели вперед
    for (let i = 0; i < 5; i++) {
        const weekStart = new Date(currentWeekStart);
        weekStart.setDate(currentWeekStart.getDate() + (i * 7));
        initializeWeekData(weekStart);
    }
    
    console.log('Данные на 5 недель инициализированы');
}

    // Функция для форматирования диапазона дат недели
    function formatWeekRange(weekDates) {
        const first = weekDates[0].date;
        const last = weekDates[6].date;
        
        if (first.getMonth() === last.getMonth()) {
            return `${first.getDate()} - ${last.getDate()} ${first.toLocaleString('ru-RU', { month: 'long' })} ${first.getFullYear()} года`;
        } else {
            return `${first.getDate()} ${first.toLocaleString('ru-RU', { month: 'long' })} - ${last.getDate()} ${last.toLocaleString('ru-RU', { month: 'long' })} ${first.getFullYear()} года`;
        }
    }

    // --- Структура данных с привязкой к датам ---
     
    // --- Функции для работы с localStorage ---
    function saveScheduleToLocalStorage(scheduleData) {
    localStorage.setItem('musicSchoolSchedule', JSON.stringify(scheduleData));
}

function loadScheduleFromLocalStorage() {
    const savedSchedule = localStorage.getItem('musicSchoolSchedule');
    if (savedSchedule) {
        try {
            return JSON.parse(savedSchedule);
        } catch (e) {
            console.error("Ошибка при парсинге расписания из localStorage:", e);
            return { ...initialScheduleData };
        }
    }
    // Если ничего нет, возвращаем копию начальных данных
    return { ...initialScheduleData };
}
    // Получить занятия для конкретной даты
    function getLessonsForDate(dateString) {
        const scheduleData = loadScheduleFromLocalStorage();
        
        // Сначала ищем занятия для конкретной даты
        if (scheduleData[dateString]) {
            return scheduleData[dateString];
        }
        
        // Если для конкретной даты нет занятий, используем шаблон дня недели
        const dateObj = new Date(dateString + 'T00:00:00');
        const dayOfWeekIndex = (dateObj.getDay() + 6) % 7;
        const dayOfWeek = daysOfWeek[dayOfWeekIndex];
        
        return scheduleData[dayOfWeek] || [];
    }

    // Сохранить занятия для конкретной даты
    function saveLessonsForDate(dateString, lessons) {
        const scheduleData = loadScheduleFromLocalStorage();
        scheduleData[dateString] = lessons;
        saveScheduleToLocalStorage(scheduleData);
    }

    function loadNotes() {
        const savedNotes = localStorage.getItem('musicSchoolSchedule');
        if (savedNotes) {
            try {
                notes = JSON.parse(savedNotes);
            } catch (e) {
                console.error("Ошибка при парсинге заметок из localStorage:", e);
                notes = [];
            }
        }
    }

    function saveNotes() {
    localStorage.setItem('musicSchoolSchedule', JSON.stringify(notes));
}

// Функция для инициализации данных на неделю
function initializeWeekData(weekStartDate) {
    const scheduleData = loadScheduleFromLocalStorage();
    const weekDates = getWeekDates(weekStartDate);
    let wasInitialized = false;

    weekDates.forEach(weekDay => {
        const dateString = weekDay.dateString;
        
        // Если для этой даты еще нет данных, создаем пустой массив
        if (!scheduleData[dateString]) {
            scheduleData[dateString] = [];
            wasInitialized = true;
        }
    });

    // Если были добавлены новые данные, сохраняем в LocalStorage
    if (wasInitialized) {
        saveScheduleToLocalStorage(scheduleData);
        console.log('Данные для недели инициализированы');
    }

    return scheduleData;
}

// Функция проверки и инициализации структуры данных
function initializeScheduleStructure() {
    const scheduleData = loadScheduleFromLocalStorage();
    let wasModified = false;

    // Проверяем, есть ли уже данные с привязкой к датам
    const hasDateBasedData = Object.keys(scheduleData).some(key => {
        return key.match(/^\d{4}-\d{2}-\d{2}$/); // Проверяем формат даты YYYY-MM-DD
    });

    // Если нет данных с привязкой к датам, создаем базовую структуру
    if (!hasDateBasedData) {
        // Создаем данные для текущей и следующей недели
        const today = new Date();
        const currentWeekStart = getWeekStartDate(today);
        
        // Инициализируем текущую неделю
        initializeWeekData(currentWeekStart);
        
        // Инициализируем следующую неделю
        const nextWeekStart = new Date(currentWeekStart);
        nextWeekStart.setDate(currentWeekStart.getDate() + 7);
        initializeWeekData(nextWeekStart);
        
        wasModified = true;
        console.log('Базовая структура данных создана');
    }

    return wasModified;
}

   // --- Функция для рендеринга расписания на неделю ---
function renderScheduleForWeek(weekStartDate) {
    // Инициализируем данные для недели перед отображением
    initializeWeekData(weekStartDate);
    
    const scheduleData = loadScheduleFromLocalStorage();
    scheduleContainer.innerHTML = '';

    // Добавляем заголовок с диапазоном дат недели
    const weekDates = getWeekDates(weekStartDate);
    const weekTitle = document.createElement('div');
    weekTitle.className = 'week-title';
    weekTitle.innerHTML = `
        <h2>Расписание на неделю</h2>
        <p class="week-range">${formatWeekRange(weekDates)}</p>
    `;
    scheduleContainer.appendChild(weekTitle);

    // Рендерим расписание для каждого дня недели
    weekDates.forEach(weekDay => {
        const dayScheduleDiv = document.createElement('div');
        dayScheduleDiv.classList.add('day-schedule');

        const dayTitle = document.createElement('h2');
        dayTitle.textContent = `${weekDay.dayOfWeek}, ${weekDay.date.getDate()} ${weekDay.date.toLocaleString('ru-RU', { month: 'short' })}`;
        dayScheduleDiv.appendChild(dayTitle);

        // Получаем занятия для конкретной даты
        const lessons = getLessonsForDate(weekDay.dateString);

        if (lessons.length === 0) {
            const noLessonsMessage = document.createElement('p');
            noLessonsMessage.textContent = "На этот день уроков нет.";
            noLessonsMessage.style.fontStyle = "italic";
            noLessonsMessage.style.color = "#7f8c8d";
            dayScheduleDiv.appendChild(noLessonsMessage);
        } else {
            lessons.forEach((lesson, index) => {
                const lessonDiv = document.createElement('div');
                lessonDiv.classList.add('lesson');

                let statusClass = 'status-not-set';
                let statusText = 'Статус не указан';

                if (lesson.attended === true) {
                    statusClass = 'status-attended';
                    statusText = 'Посещен';
                } else if (lesson.attended === false) {
                    statusClass = 'status-missed';
                    statusText = 'Пропущен';
                } else {
                    statusClass = 'status-pending';
                    statusText = 'Ожидает';
                }

                lessonDiv.innerHTML = `
                    <div class="lesson-info">
                        <h3>${lesson.lessonName}</h3>
                        <div class="lesson-number">Пара ${index + 1}</div>
                    </div>
                    <div class="lesson-details">
                        <span>Кабинет: ${lesson.cabinet}</span>
                        <span>Преподаватель: ${lesson.teacher}</span>
                    </div>
                    <div class="lesson-status ${statusClass}">
                        ${statusText}
                    </div>
                `;
                dayScheduleDiv.appendChild(lessonDiv);
            });
        }
        
        // Добавляем кнопку редактирования для этого дня
        const editButton = document.createElement('button');
        editButton.className = 'edit-day-btn';
        editButton.innerHTML = '<i class="fas fa-edit"></i> Редактировать';
        editButton.addEventListener('click', () => {
            openScheduleModal(weekDay.dateString);
        });
        dayScheduleDiv.appendChild(editButton);
        
        scheduleContainer.appendChild(dayScheduleDiv);
    });
}

    // --- Функции для работы с календарем ---
    prevBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar();
    });

    nextBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar();
    });

    const updateCalendar = () => {
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();

        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

        const totalDays = lastDayOfMonth.getDate();
        const firstDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
        const lastDayIndex = (lastDayOfMonth.getDay() + 6) % 7;

        const monthYearString = currentDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
        monthYearElement.textContent = monthYearString.charAt(0).toUpperCase() + monthYearString.slice(1);

        let datesHTML = '';

        for (let i = firstDayIndex; i > 0; i--) {
            const prevDate = new Date(currentYear, currentMonth, 1 - i);
            const formattedPrevDate = formatDateToISO(prevDate);
            datesHTML += `<div class="date inactive" data-date="${formattedPrevDate}">${prevDate.getDate()}</div>`;
        }

        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(currentYear, currentMonth, i);
            const formattedDate = formatDateToISO(date);

            const todayClass = date.toDateString() === new Date().toDateString() ? 'active' : '';
            
            // Проверяем, есть ли занятия для этой даты
            const lessons = getLessonsForDate(formattedDate);
            const hasLessonsClass = lessons.length > 0 ? 'has-note' : '';

            datesHTML += `<div class="date ${todayClass} ${hasLessonsClass}" data-date="${formattedDate}">${i}</div>`;
        }

        for (let i = 1; i <= 6 - lastDayIndex; i++) {
            const nextDate = new Date(currentYear, currentMonth + 1, i);
            const formattedNextDate = formatDateToISO(nextDate);
            datesHTML += `<div class="date inactive" data-date="${formattedNextDate}">${nextDate.getDate()}</div>`;
        }

        datesElement.innerHTML = datesHTML;
    };

    // --- Функции для модального окна редактирования ---
    function openScheduleModal(dateString) {
        currentEditingDate = dateString;
        currentlySelectedDate = dateString;
        
        const dateObj = new Date(dateString + 'T00:00:00');
        const dayOfWeekIndex = (dateObj.getDay() + 6) % 7;
        const dayOfWeek = daysOfWeek[dayOfWeekIndex];
        
        selectedDateDisplay.textContent = formatDateToRussian(dateString);
        dayOfWeekSelect.value = dayOfWeek;
        
        loadLessonsForDate(dateString);
        scheduleModal.style.display = 'block';
    }

    function closeScheduleModal() {
        scheduleModal.style.display = 'none';
        currentEditingDate = null;
        currentlySelectedDate = null;
    }

    function loadLessonsForDate(dateString) {
        const lessons = getLessonsForDate(dateString);
        
        lessonsContainer.innerHTML = '';
        
        if (lessons.length === 0) {
            addLessonItem();
        } else {
            lessons.forEach((lesson, index) => {
                addLessonItem(lesson, index + 1);
            });
        }
    }

    function addLessonItem(lessonData = null, lessonNumber = null) {
        const lessonCount = lessonsContainer.children.length + 1;
        const lessonItem = document.createElement('div');
        lessonItem.className = 'lesson-item';
        
        const lessonNum = lessonNumber || lessonCount;
        
        lessonItem.innerHTML = `
            <div class="lesson-item-header">
                <div class="lesson-number">Пара ${lessonNum}</div>
                <button type="button" class="remove-lesson" onclick="this.closest('.lesson-item').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="lesson-fields">
                <div class="lesson-field">
                    <label for="lessonName${lessonNum}">Предмет:</label>
                    <select id="lessonName${lessonNum}" class="lesson-name">
                        <option value="">-- Выберите предмет --</option>
                        ${availableLessons.map(lesson => 
                            `<option value="${lesson}" ${lessonData && lessonData.lessonName === lesson ? 'selected' : ''}>${lesson}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="lesson-field">
                    <label for="teacher${lessonNum}">Преподаватель:</label>
                    <select id="teacher${lessonNum}" class="teacher">
                        <option value="">-- Выберите преподавателя --</option>
                        ${availableTeachers.map(teacher => 
                            `<option value="${teacher}" ${lessonData && lessonData.teacher === teacher ? 'selected' : ''}>${teacher}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="lesson-field">
                    <label for="cabinet${lessonNum}">Кабинет:</label>
                    <select id="cabinet${lessonNum}" class="cabinet">
                        <option value="">-- Выберите кабинет --</option>
                        ${availableCabinets.map(cabinet => 
                            `<option value="${cabinet}" ${lessonData && lessonData.cabinet === cabinet ? 'selected' : ''}>${cabinet}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="lesson-field attendance-field">
                    <label>Посещение:</label>
                    <div class="attendance-options">
                        <div class="attendance-option">
                            <input type="radio" id="attended${lessonNum}" name="attended${lessonNum}" value="true" 
                                ${lessonData && lessonData.attended === true ? 'checked' : ''}>
                            <label for="attended${lessonNum}">Посещена</label>
                        </div>
                        <div class="attendance-option">
                            <input type="radio" id="missed${lessonNum}" name="attended${lessonNum}" value="false"
                                ${lessonData && lessonData.attended === false ? 'checked' : ''}>
                            <label for="missed${lessonNum}">Пропущена</label>
                        </div>
                        <div class="attendance-option">
                            <input type="radio" id="notset${lessonNum}" name="attended${lessonNum}" value="" 
                                ${!lessonData || lessonData.attended === undefined || lessonData.attended === null ? 'checked' : ''}>
                            <label for="notset${lessonNum}">Не указано</label>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        lessonsContainer.appendChild(lessonItem);
    }

    function saveScheduleChanges() {
        const dateString = currentEditingDate;
        const lessonItems = lessonsContainer.querySelectorAll('.lesson-item');
        const lessons = [];
        
        lessonItems.forEach((item, index) => {
            const lessonName = item.querySelector('.lesson-name').value;
            const teacher = item.querySelector('.teacher').value;
            const cabinet = item.querySelector('.cabinet').value;
            const attendedRadio = item.querySelector('input[type="radio"]:checked');
            const attended = attendedRadio ? (attendedRadio.value === 'true' ? true : attendedRadio.value === 'false' ? false : null) : null;
            
            if (lessonName && teacher && cabinet) {
                lessons.push({
                    lessonName,
                    teacher,
                    cabinet,
                    attended
                });
            }
        });
        
        saveLessonsForDate(dateString, lessons);
        
        // Перерисовываем расписание для текущей недели
        if (currentWeekStartDate) {
            renderScheduleForWeek(currentWeekStartDate);
        }
        
        // Обновляем календарь, чтобы показать точки на датах с занятиями
        updateCalendar();
        
        closeScheduleModal();
    }

    // Функция для выбора недели по дате
function selectWeekByDate(dateString) {
    const dateObj = new Date(dateString + 'T00:00:00');
    const weekStart = getWeekStartDate(dateObj);
    currentWeekStartDate = weekStart;
    
    // Инициализируем данные для этой недели перед отображением
    initializeWeekData(weekStart);
    
    renderScheduleForWeek(weekStart);
}

    // --- Обработчики событий ---
    datesElement.addEventListener('click', (event) => {
        const clickedDateElement = event.target.closest('.date');
        
        if (clickedDateElement && !clickedDateElement.classList.contains('inactive')) {
            const fullDate = clickedDateElement.dataset.date;
            
            // Переключаем отображение на неделю выбранной даты
            selectWeekByDate(fullDate);
            
            // Показываем модальное окно для редактирования этой даты
            openScheduleModal(fullDate);
        }
    });

    addLessonBtn.addEventListener('click', () => {
        addLessonItem();
    });

    saveScheduleBtn.addEventListener('click', saveScheduleChanges);

    cancelScheduleBtn.addEventListener('click', closeScheduleModal);

    closeModalBtn.addEventListener('click', closeScheduleModal);

    window.addEventListener('click', (event) => {
        if (event.target === scheduleModal) {
            closeScheduleModal();
        }
    });

// Добавьте в секцию элементов
const prevWeekBtn = document.getElementById('prevWeekBtn');
const nextWeekBtn = document.getElementById('nextWeekBtn');
const todayWeekBtn = document.getElementById('todayWeekBtn');

// Добавьте в секцию обработчиков событий
prevWeekBtn.addEventListener('click', () => {
    if (currentWeekStartDate) {
        currentWeekStartDate.setDate(currentWeekStartDate.getDate() - 7);
        renderScheduleForWeek(currentWeekStartDate);
    }
});

nextWeekBtn.addEventListener('click', () => {
    if (currentWeekStartDate) {
        currentWeekStartDate.setDate(currentWeekStartDate.getDate() + 7);
        renderScheduleForWeek(currentWeekStartDate);
    }
});

todayWeekBtn.addEventListener('click', () => {
    const today = new Date();
    currentWeekStartDate = getWeekStartDate(today);
    renderScheduleForWeek(currentWeekStartDate);
});

    if (!localStorage.getItem('musicSchoolSchedule')) {
    // Первая загрузка - создаем базовую структуру
    saveScheduleToLocalStorage({ ...initialScheduleData });
    initializeScheduleStructure();
    preInitializeWeeksData(); // Создаем данные на несколько недель вперед
} else {
    // Проверяем и дополняем структуру данных если нужно
    initializeScheduleStructure();
}

loadNotes();
updateCalendar();

// Показываем текущую неделю при загрузке
const today = new Date();
currentWeekStartDate = getWeekStartDate(today);
renderScheduleForWeek(currentWeekStartDate);
