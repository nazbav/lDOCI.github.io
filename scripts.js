// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let filaments = []; // Все филаменты
let filteredFilaments = []; // Отфильтрованные филаменты

// ========== ЗАГРУЗКА ДАННЫХ ==========
async function loadFilaments() {
    try {
        const response = await fetch('data/filaments.json');
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        const data = await response.json();
        filaments = data.filaments;
        filteredFilaments = [...filaments];
        renderTable();
        updateFilters();
    } catch (error) {
        console.error('Ошибка:', error);
        showError('Не удалось загрузить данные. Попробуйте позже.');
    }
}

// ========== ОТОБРАЖЕНИЕ ТАБЛИЦЫ ==========
function renderTable() {
    const tableBody = document.getElementById('filamentTableBody');
    tableBody.innerHTML = '';

    if (filteredFilaments.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-results">
                    <i class="fas fa-exclamation-circle"></i> Ничего не найдено
                </td>
            </tr>
        `;
        return;
    }

    filteredFilaments.forEach(filament => {
        const row = document.createElement('tr');
        
        // Форматирование данных
        const spoolInfo = filament.spoolWeight ? `${filament.spoolWeight}г` : '-';
        const weightInfo = filament.weight ? `${filament.weight}г` : '-';
        const profilesHtml = renderProfiles(filament.printProfiles);
        const linksHtml = renderLinks(filament.links);

        row.innerHTML = `
            <td>${escapeHtml(filament.name) || '-'}</td>
            <td>${escapeHtml(filament.manufacturer) || '-'}</td>
            <td>${weightInfo}</td>
            <td>${escapeHtml(filament.type) || '-'}</td>
            <td>${spoolInfo}</td>
            <td>${profilesHtml}</td>
            <td>${linksHtml}</td>
        `;

        // Добавляем атрибуты для поиска
        row.dataset.name = filament.name.toLowerCase();
        row.dataset.manufacturer = filament.manufacturer ? filament.manufacturer.toLowerCase() : '';
        row.dataset.type = filament.type.toLowerCase();
        row.dataset.weight = filament.weight || '';

        tableBody.appendChild(row);
    });
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

// Рендер профилей печати
function renderProfiles(profiles) {
    if (!profiles || profiles.length === 0) return '-';
    
    return profiles.map(profile => `
        <a href="${profile.url}" 
           target="_blank" 
           class="print-profile"
           title="Температура: ${profile.temp || 'не указана'}, Стол: ${profile.bed || 'не указан'}">
            <i class="fas fa-file-alt"></i> ${escapeHtml(profile.name)}
        </a>
    `).join(' ');
}

// Рендер ссылок на магазины
function renderLinks(links) {
    if (!links || links.length === 0) return '-';
    
    return links.map(link => {
        let icon = '';
        switch(link.type) {
            case 'ozon': icon = '<i class="fas fa-shopping-cart"></i>'; break;
            case 'wildberries': icon = '<i class="fas fa-shopping-bag"></i>'; break;
            case 'ali': icon = '<i class="fas fa-truck"></i>'; break;
            default: icon = '<i class="fas fa-external-link-alt"></i>';
        }
        
        return `
            <a href="${link.url}" 
               target="_blank" 
               class="store-link ${link.type}"
               title="${link.type.toUpperCase()}">
                ${icon} ${link.type}
            </a>
        `;
    }).join(' ');
}

// Экранирование HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ========== ФИЛЬТРАЦИЯ И СОРТИРОВКА ==========
function applyFilters() {
    const material = document.getElementById('materialFilter').value;
    const weight = document.getElementById('weightFilter').value;
    const search = document.getElementById('searchInput').value.toLowerCase();

    filteredFilaments = filaments.filter(filament => {
        const matchesMaterial = !material || filament.type === material;
        const matchesWeight = !weight || (filament.weight && filament.weight.toString() === weight);
        const matchesSearch = !search || 
            (filament.name && filament.name.toLowerCase().includes(search)) || 
            (filament.manufacturer && filament.manufacturer.toLowerCase().includes(search));
        
        return matchesMaterial && matchesWeight && matchesSearch;
    });

    renderTable();
}

// Обновление фильтров
function updateFilters() {
    // Материалы
    const materialFilter = document.getElementById('materialFilter');
    const materials = [...new Set(filaments.map(f => f.type).filter(Boolean))];
    
    materials.forEach(material => {
        if (![...materialFilter.options].some(o => o.value === material)) {
            const option = document.createElement('option');
            option.value = material;
            option.textContent = material;
            materialFilter.appendChild(option);
        }
    });

    // Веса
    const weightFilter = document.getElementById('weightFilter');
    const weights = [...new Set(filaments.map(f => f.weight).filter(Boolean).sort((a, b) => a - b))];
    
    weights.forEach(weight => {
        const weightStr = weight.toString();
        if (![...weightFilter.options].some(o => o.value === weightStr)) {
            const option = document.createElement('option');
            option.value = weightStr;
            option.textContent = `${weight}г`;
            weightFilter.appendChild(option);
        }
    });
}

// ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========
function setupEventListeners() {
    document.getElementById('materialFilter').addEventListener('change', applyFilters);
    document.getElementById('weightFilter').addEventListener('change', applyFilters);
    document.getElementById('searchInput').addEventListener('input', applyFilters);
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', () => {
    loadFilaments();
    setupEventListeners();
});

// ========== ОБРАБОТКА ОШИБОК ==========
function showError(message) {
    const tableBody = document.getElementById('filamentTableBody');
    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="error-message">
                <i class="fas fa-exclamation-triangle"></i> ${message}
            </td>
        </tr>
    `;
}