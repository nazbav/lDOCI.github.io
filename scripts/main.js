// ========== КОНФИГУРАЦИЯ ==========
const config = {
    itemsPerPage: 12,      // Количество карточек на странице
    visiblePageLinks: 5,   // Видимых номеров страниц в пагинации
    storageKey: 'filaments_reviews' // Ключ для хранения отзывов в localStorage
};

// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let allFilaments = [];       // Все филаменты из JSON
let filteredFilaments = [];  // Отфильтрованные филаменты
let paginatedFilaments = []; // Филаменты для текущей страницы
let currentPage = 1;         // Текущая страница
let totalPages = 1;          // Всего страниц

// ========== ИНИЦИАЛИЗАЦИЯ ==========
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    setupEventListeners();
    renderFilters();
    applyFilters();
});

// ========== ЗАГРУЗКА ДАННЫХ ==========
async function loadData() {
    try {
        const response = await fetch('./data/filaments.json');
        if (!response.ok) throw new Error('Ошибка загрузки');
        const data = await response.json();
        allFilaments = data.filaments.map(filament => {
            // Расчет рейтинга на основе отзывов
            const filamentRating = calculateRating(filament.id);
            
            return {
                ...filament,
                // Добавляем обязательные поля, если их нет
                name: filament.name || filament.manufacturer || 'Без названия',
                type: filament.type || 'PLA', // Укажите тип по умолчанию
                rating: filamentRating > 0 ? filamentRating : (filament.rating || 0),
                price: filament.price || Math.round(Math.random() * 2000 + 500),
                spoolWeight: filament.weight_g || null,
                diameter: filament.diameter_mm || null,
                spoolDiameter: filament.diameter_mm || null,
                spoolWidth: filament.width_mm || null,
                spoolInnerDiameter: filament.inner_diameter_mm || null,
                filamentDiameter: filament.filament_diameter_mm || null
            };
        });
        
        // После загрузки данных применяем фильтры
        applyFilters();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showError('Не удалось загрузить данные. Попробуйте позже.');
    }
}

// ========== ФИЛЬТРАЦИЯ И СОРТИРОВКА ==========
function applyFilters() {
    // Получаем выбранные фильтры
    const materialFilters = getSelectedValues('material');
    const manufacturerFilters = getSelectedValues('manufacturer');
    const weightFilters = getSelectedValues('weight');
    const ratingFilter = getRatingFilter();
    const searchQuery = document.getElementById('search-input').value.toLowerCase();
    const sortBy = document.getElementById('sort-select').value;

    // Фильтрация
    filteredFilaments = allFilaments.filter(filament => {
        // Проверка поискового запроса
        const matchesSearch = searchQuery === '' || 
            (filament.name && filament.name.toLowerCase().includes(searchQuery)) || 
            (filament.manufacturer && filament.manufacturer.toLowerCase().includes(searchQuery));
        
        // Проверка фильтров материала
        const matchesMaterial = materialFilters.length === 0 || 
            materialFilters.includes('all') || 
            (filament.type && materialFilters.includes(filament.type));
        
        // Проверка фильтров производителя
        const matchesManufacturer = manufacturerFilters.length === 0 || 
            manufacturerFilters.includes('all') || 
            (filament.manufacturer && manufacturerFilters.includes(filament.manufacturer));
        
        // Проверка фильтров веса
        const matchesWeight = weightFilters.length === 0 || 
            weightFilters.includes('all') || 
            (filament.weight && checkWeightFilter(filament.weight, weightFilters));
        
        // Проверка рейтинга
        const matchesRating = ratingFilter === 0 || 
            (filament.rating && filament.rating >= ratingFilter);
        
        return matchesSearch && matchesMaterial && matchesManufacturer && matchesWeight && matchesRating;
    });

    // Сортировка
    sortFilaments(sortBy);

    // Пагинация
    currentPage = 1;
    updatePagination();
    renderFilaments();
}

// Проверка фильтра веса
function checkWeightFilter(weight, filters) {
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum)) {
        // Если вес указан как строка (например, "750 г")
        return filters.some(filter => {
            switch(filter) {
                case '0.5': return weight.includes('500');
                case '0.75': return weight.includes('750');
                case '1': return weight.includes('1000');
                case '2': return weight.includes('2000') || weight.includes('2500');
                default: return false;
            }
        });
    } else {
        // Если вес указан как число
        return filters.some(filter => {
            switch(filter) {
                case '0.5': return weightNum <= 500;
                case '0.75': return weightNum > 500 && weightNum <= 750;
                case '1': return weightNum > 750 && weightNum <= 1000;
                case '2': return weightNum > 1000;
                default: return false;
            }
        });
    }
}

// Получение фильтра рейтинга
function getRatingFilter() {
    const ratingCheckboxes = document.querySelectorAll('input[name="rating"]:checked');
    for (const checkbox of ratingCheckboxes) {
        if (checkbox.value !== 'all') return parseInt(checkbox.value);
    }
    return 0;
}

// Сортировка филаментов
function sortFilaments(sortBy) {
    filteredFilaments.sort((a, b) => {
        switch(sortBy) {
            case 'name-asc':
                return (a.name || '').localeCompare(b.name || '');
            case 'name-desc':
                return (b.name || '').localeCompare(a.name || '');
            case 'price-asc':
                return (a.price || 0) - (b.price || 0);
            case 'price-desc':
                return (b.price || 0) - (a.price || 0);
            case 'rating-asc':
                return (a.rating || 0) - (b.rating || 0);
            case 'rating-desc':
                return (b.rating || 0) - (a.rating || 0);
            default:
                return 0;
        }
    });
}

// ========== ПАГИНАЦИЯ ==========
function updatePagination() {
    totalPages = Math.ceil(filteredFilaments.length / config.itemsPerPage);
    currentPage = Math.min(currentPage, totalPages);
    
    // Получаем данные для текущей страницы
    const startIndex = (currentPage - 1) * config.itemsPerPage;
    const endIndex = startIndex + config.itemsPerPage;
    paginatedFilaments = filteredFilaments.slice(startIndex, endIndex);
    
    renderPagination();
    renderFilaments();
}

function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Кнопка "Назад"
    const prevButton = document.createElement('li');
    prevButton.className = 'pagination-item';
    prevButton.innerHTML = `<a href="#" class="pagination-link ${currentPage === 1 ? 'disabled' : ''}" data-page="${currentPage - 1}">
        <i class="fas fa-chevron-left"></i>
    </a>`;
    paginationContainer.appendChild(prevButton);
    
    // Первая страница
    if (currentPage > Math.floor(config.visiblePageLinks/2)) {
        const firstPage = document.createElement('li');
        firstPage.className = 'pagination-item';
        firstPage.innerHTML = `<a href="#" class="pagination-link" data-page="1">1</a>`;
        paginationContainer.appendChild(firstPage);
        
        if (currentPage > Math.floor(config.visiblePageLinks/2) + 1) {
            const dots = document.createElement('li');
            dots.className = 'pagination-item';
            dots.innerHTML = '<span class="pagination-dots">...</span>';
            paginationContainer.appendChild(dots);
        }
    }
    
    // Основные страницы
    const startPage = Math.max(1, currentPage - Math.floor(config.visiblePageLinks/2));
    const endPage = Math.min(totalPages, startPage + config.visiblePageLinks - 1);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = 'pagination-item';
        pageItem.innerHTML = `<a href="#" class="pagination-link ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</a>`;
        paginationContainer.appendChild(pageItem);
    }
    
    // Последняя страница
    if (currentPage < totalPages - Math.floor(config.visiblePageLinks/2)) {
        if (currentPage < totalPages - Math.floor(config.visiblePageLinks/2) - 1) {
            const dots = document.createElement('li');
            dots.className = 'pagination-item';
            dots.innerHTML = '<span class="pagination-dots">...</span>';
            paginationContainer.appendChild(dots);
        }
        
        const lastPage = document.createElement('li');
        lastPage.className = 'pagination-item';
        lastPage.innerHTML = `<a href="#" class="pagination-link" data-page="${totalPages}">${totalPages}</a>`;
        paginationContainer.appendChild(lastPage);
    }
    
    // Кнопка "Вперед"
    const nextButton = document.createElement('li');
    nextButton.className = 'pagination-item';
    nextButton.innerHTML = `<a href="#" class="pagination-link ${currentPage === totalPages ? 'disabled' : ''}" data-page="${currentPage + 1}">
        <i class="fas fa-chevron-right"></i>
    </a>`;
    paginationContainer.appendChild(nextButton);
}

// ========== ОТОБРАЖЕНИЕ ДАННЫХ ==========
function renderFilaments() {
    const container = document.getElementById('filament-cards');
    container.innerHTML = '';
    
    if (paginatedFilaments.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Ничего не найдено</h3>
                <p>Попробуйте изменить параметры поиска или фильтры</p>
            </div>
        `;
        return;
    }
    
    paginatedFilaments.forEach(filament => {
        const card = document.createElement('div');
        card.className = 'filament-card';
        card.innerHTML = generateFilamentCard(filament);
        container.appendChild(card);
    });
}

function generateFilamentCard(filament) {
    const ratingStars = generateRatingStars(filament.rating || 0);
    const marketplaceLinks = generateMarketplaceLinks(filament.links);
    
    return `
        <div class="card-header">
            <div class="card-title">
                <h3>${filament.name || 'Без названия'}</h3>
                <p>${filament.manufacturer || 'Производитель не указан'}</p>
            </div>
            <span class="card-material">${filament.type || '?'}</span>
        </div>
        <div class="card-body">
            <ul class="specs-list">
                <li>
                    <i class="fas fa-weight-hanging"></i>
                    <span>Вес филамента:</span>
                    <span class="specs-value">${filament.weight ? filament.weight : '-'}</span>
                </li>
                <li>
                    <i class="fas fa-ruler-combined"></i>
                    <span>Диаметр катушки:</span>
                    <span class="specs-value">${filament.diameter_mm ? filament.diameter_mm + 'мм' : '-'}</span>
                </li>
                <li>
                    <i class="fas fa-circle-notch"></i>
                    <span>Толщина нити:</span>
                    <span class="specs-value">1.75мм</span>
                </li>
                <li>
                    <i class="fas fa-star"></i>
                    <span>Рейтинг:</span>
                    <span class="specs-value">${ratingStars}</span>
                </li>
                <li>
                    <i class="fas fa-tag"></i>
                    <span>Цена:</span>
                    <span class="specs-value">${filament.price ? filament.price + '₽' : '-'}</span>
                </li>
            </ul>
            <div class="profiles-section">
                <h4>Где купить:</h4>
                <div class="profiles-links">${marketplaceLinks}</div>
            </div>
        </div>
        <div class="card-footer">
            <button class="details-button" data-id="${filament.id}">
                Подробнее <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function generateRatingStars(rating) {
    if (!rating) return '<span class="no-rating">Нет оценки</span>';
    
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === fullStars && hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    
    return stars + ` (${rating.toFixed(1)})`;
}

function generateMarketplaceLinks(links) {
    if (!links || links.length === 0) return '<span class="no-links">Нет ссылок</span>';
    
    return links.map(link => {
        const iconClass = link.type === 'ozon' ? 'fa-shopping-cart' : 
                         link.type === 'wildberries' ? 'fa-shopping-bag' : 
                         link.type === 'ali' ? 'fa-truck' : 'fa-external-link-alt';
        
        return `
            <a href="${link.url}" target="_blank" class="marketplace-link ${link.type}-link">
                <i class="fas ${iconClass}"></i> ${link.type === 'website' ? 'Сайт' : link.type}
            </a>
        `;
    }).join('');
}

function getSelectedValues(name) {
    const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

function renderFilters() {
    const manufacturers = [...new Set(allFilaments.map(f => f.manufacturer).filter(Boolean))];
    const container = document.getElementById('manufacturers-filter');
    
    // Очистка контейнера перед добавлением чекбоксов
    while (container.children.length > 1) {
        container.removeChild(container.lastChild);
    }
    
    manufacturers.forEach(manufacturer => {
        const checkbox = document.createElement('div');
        checkbox.className = 'checkbox-group';
        checkbox.innerHTML = `
            <label>
                <input type="checkbox" name="manufacturer" value="${manufacturer}">
                ${manufacturer}
            </label>
        `;
        container.appendChild(checkbox);
    });
}

function showError(message) {
    const container = document.getElementById('filament-cards');
    container.innerHTML = `
        <div class="no-results">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Ошибка</h3>
            <p>${message}</p>
        </div>
    `;
}

function setupEventListeners() {
    // Фильтры
    document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
        input.addEventListener('change', applyFilters);
    });
    
    // Поиск
    document.getElementById('search-input').addEventListener('input', debounce(applyFilters, 300));
    
    // Сортировка
    document.getElementById('sort-select').addEventListener('change', applyFilters);
    
    // Сброс фильтров
    document.getElementById('reset-filters').addEventListener('click', (e) => {
        e.preventDefault();
        resetFilters();
    });
    
    // Пагинация
    document.getElementById('pagination').addEventListener('click', (e) => {
        if (e.target.closest('.pagination-link')) {
            e.preventDefault();
            const page = parseInt(e.target.closest('.pagination-link').dataset.page);
            if (!isNaN(page) && !e.target.closest('.pagination-link').classList.contains('disabled')) {
                currentPage = page;
                updatePagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    });
    
    // Подробная информация
    document.addEventListener('click', (e) => {
        if (e.target.closest('.details-button')) {
            const id = parseInt(e.target.closest('.details-button').dataset.id);
            openModal(id);
        }
        
        if (e.target.closest('.modal-close') || e.target.classList.contains('modal')) {
            closeModal();
        }
    });
    
    // Переключение вкладок в модальном окне
    document.querySelectorAll('.modal-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Убираем класс active у всех вкладок и контента
            document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));
            
            // Добавляем класс active текущей вкладке и соответствующему контенту
            this.classList.add('active');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });
    
    // Кнопка "Наверх"
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTop.classList.add('show');
            } else {
                backToTop.classList.remove('show');
            }
        });
        
        backToTop.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

function resetFilters() {
    // Сброс чекбоксов
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = checkbox.value === 'all';
    });
    
    // Сброс радио-кнопок
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.checked = radio.value === 'all';
    });
    
    // Сброс поиска
    document.getElementById('search-input').value = '';
    
    // Сброс сортировки
    document.getElementById('sort-select').value = 'name-asc';
    
    applyFilters();
}

function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// ========== МОДАЛЬНОЕ ОКНО ФИЛАМЕНТА ==========
function openModal(id) {
    const filament = allFilaments.find(f => f.id === id);
    if (!filament) return;
    
    currentFilamentId = id;
    
    const modal = document.getElementById('filament-modal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Заполнение модального окна данными
    document.getElementById('modal-title').innerHTML = `
        <h2>${filament.name || 'Без названия'}</h2>
        <p>${filament.manufacturer || 'Производитель не указан'} • ${filament.type || '?'}</p>
    `;
    
    // Заполнение спецификаций
    const specsHtml = `
        <tr>
            <th>Вес филамента</th>
            <td>${filament.weight || '-'}</td>
        </tr>
        <tr>
            <th>Диаметр нити</th>
            <td>1.75мм</td>
        </tr>
        <tr>
            <th>Вес катушки</th>
            <td>${filament.weight_g ? filament.weight_g + 'г' : '-'}</td>
        </tr>
        <tr>
            <th>Диаметр катушки</th>
            <td>${filament.diameter_mm ? filament.diameter_mm + 'мм' : '-'}</td>
        </tr>
        <tr>
            <th>Ширина катушки</th>
            <td>${filament.width_mm ? filament.width_mm + 'мм' : '-'}</td>
        </tr>
        <tr>
            <th>Внутренний диаметр</th>
            <td>${filament.inner_diameter_mm ? filament.inner_diameter_mm + 'мм' : '-'}</td>
        </tr>
        <tr>
            <th>Диаметр области под филамент</th>
            <td>${filament.filament_diameter_mm ? filament.filament_diameter_mm + 'мм' : '-'}</td>
        </tr>
        <tr>
            <th>Рейтинг</th>
            <td>${generateRatingStars(filament.rating || 0)}</td>
        </tr>
        <tr>
            <th>Цена</th>
            <td>${filament.price ? filament.price + '₽' : '-'}</td>
        </tr>
    `;
    
    document.getElementById('modal-specs').innerHTML = specsHtml;
    
    // Заполнение профилей печати
    const profilesHtml = `
        <div class="printing-profiles">
            <div class="profile-item">
                <h4>Настройки для PrusaSlicer</h4>
                <ul>
                    <li>Температура печати: ${filament.type === 'PLA' ? '190-210°C' : filament.type === 'PETG' ? '230-250°C' : filament.type === 'ABS' ? '230-250°C' : '200-230°C'}</li>
                    <li>Температура стола: ${filament.type === 'PLA' ? '50-60°C' : filament.type === 'PETG' ? '70-90°C' : filament.type === 'ABS' ? '90-110°C' : '60-80°C'}</li>
                    <li>Скорость печати: 40-60 мм/с</li>
                    <li>Охлаждение: ${filament.type === 'ABS' ? 'Отключено или 0-20%' : '80-100%'}</li>
                </ul>
            </div>
            <div class="profile-item">
                <h4>Настройки для Cura</h4>
                <ul>
                    <li>Температура печати: ${filament.type === 'PLA' ? '195-215°C' : filament.type === 'PETG' ? '235-255°C' : filament.type === 'ABS' ? '235-255°C' : '205-235°C'}</li>
                    <li>Температура стола: ${filament.type === 'PLA' ? '55-65°C' : filament.type === 'PETG' ? '75-95°C' : filament.type === 'ABS' ? '95-115°C' : '65-85°C'}</li>
                    <li>Скорость печати: 40-60 мм/с</li>
                    <li>Охлаждение: ${filament.type === 'ABS' ? 'Отключено или 0-20%' : '80-100%'}</li>
                </ul>
            </div>
        </div>
    `;
    
    document.getElementById('modal-profiles').innerHTML = profilesHtml;
    
    // Заполнение ссылок
    const linksHtml = filament.links && filament.links.length > 0 ? 
        filament.links.map(link => `
            <a href="${link.url}" target="_blank" class="marketplace-link ${link.type}-link">
                <i class="fas ${link.type === 'ozon' ? 'fa-shopping-cart' : 
                                link.type === 'wildberries' ? 'fa-shopping-bag' : 
                                link.type === 'ali' ? 'fa-truck' : 
                                'fa-external-link-alt'}"></i> ${link.type === 'website' ? 'Сайт производителя' : link.type}
            </a>
        `).join('') : '<p>Нет доступных ссылок</p>';
    
    document.getElementById('modal-links').innerHTML = linksHtml;
    
    // Загружаем отзывы
    renderReviews(id);
    
    // Сбрасываем активную вкладку на "Характеристики"
    document.querySelectorAll('.modal-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.modal-tab-content').forEach(content => content.classList.remove('active'));
    document.querySelector('.modal-tab[data-tab="specs"]').classList.add('active');
    document.getElementById('tab-specs').classList.add('active');
    
    // Настраиваем звезды рейтинга для отзывов
    setupRatingInteraction();
}

function closeModal() {
    const modal = document.getElementById('filament-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    currentFilamentId = null;
}
