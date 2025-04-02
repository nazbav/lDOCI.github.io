// ========== КОНФИГУРАЦИЯ ==========
const config = {
  itemsPerPage: 12,      // Количество карточек на странице
  visiblePageLinks: 5    // Видимых номеров страниц в пагинации
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
      allFilaments = data.filaments.map(filament => ({
          ...filament,
          // Добавляем случайный рейтинг, если его нет в данных
          rating: filament.rating || Math.round((Math.random() * 2 + 3) * 10) / 10,
          // Добавляем случайную цену, если ее нет в данных
          price: filament.price || Math.round(Math.random() * 2000 + 500)
      }));
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
  return filters.some(filter => {
      switch(filter) {
          case '0.5': return weight === 500;
          case '0.75': return weight === 750;
          case '1': return weight === 1000;
          case '2': return weight >= 2000;
          default: return false;
      }
  });
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
  const profilesLinks = generateProfilesLinks(filament.printProfiles);
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
                  <span class="specs-value">${filament.weight ? filament.weight + 'г' : '-'}</span>
              </li>
              <li>
                  <i class="fas fa-ruler-combined"></i>
                  <span>Диаметр:</span>
                  <span class="specs-value">${filament.diameter ? filament.diameter + 'мм' : '-'}</span>
              </li>
              <li>
                  <i class="fas fa-circle-notch"></i>
                  <span>Катушка:</span>
                  <span class="specs-value">${filament.spoolWeight ? filament.spoolWeight + 'г' : '-'}</span>
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
              <h4>Профили печати:</h4>
              <div class="profiles-links">${profilesLinks}</div>
          </div>
      </div>
      <div class="card-footer">
          <div class="marketplace-links">${marketplaceLinks}</div>
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

function generateProfilesLinks(profiles) {
  if (!profiles || profiles.length === 0) return '<span class="no-profiles">Нет профилей</span>';
  
  return profiles.map(profile => `
      <a href="${profile.url}" target="_blank" class="profile-link">
          <i class="fas fa-file-alt"></i> ${profile.name}
      </a>
  `).join('');
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

// ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========
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
  
  // Модальное окно
  document.addEventListener('click', (e) => {
      if (e.target.closest('.details-button')) {
          const id = parseInt(e.target.closest('.details-button').dataset.id);
          openModal(id);
      }
      
      if (e.target.closest('.modal-close') || e.target.classList.contains('modal')) {
          closeModal();
      }
  });
  
  // Форма отзыва
  const reviewBtn = document.getElementById('add-review-btn');
  const reviewForm = document.getElementById('review-form');
  
  if (reviewBtn && reviewForm) {
      reviewBtn.addEventListener('click', function() {
          reviewForm.style.display = reviewForm.style.display === 'block' ? 'none' : 'block';
      });
  }
  
  // Рейтинг в форме
  const ratingInput = document.getElementById('rating-input');
  if (ratingInput) {
      const stars = ratingInput.querySelectorAll('i');
      let currentRating = 0;
      
      stars.forEach(star => {
          star.addEventListener('click', function() {
              const rating = parseInt(this.getAttribute('data-rating'));
              currentRating = rating;
              
              stars.forEach((s, index) => {
                  if (index < rating) {
                      s.classList.add('active');
                  } else {
                      s.classList.remove('active');
                  }
              });
          });
          
          star.addEventListener('mouseover', function() {
              const rating = parseInt(this.getAttribute('data-rating'));
              
              stars.forEach((s, index) => {
                  if (index < rating) {
                      s.classList.add('hover');
                  } else {
                      s.classList.remove('hover');
                  }
              });
          });
          
          star.addEventListener('mouseout', function() {
              stars.forEach(s => s.classList.remove('hover'));
          });
      });
  }
  
  // Отправка отзыва
  const submitBtn = document.getElementById('submit-review-btn');
  if (submitBtn) {
      submitBtn.addEventListener('click', function() {
          const author = document.getElementById('review-author').value;
          const text = document.getElementById('review-text').value;
          const rating = document.querySelectorAll('#rating-input i.active').length;
          
          if (!author || !text || rating === 0) {
              alert('Пожалуйста, заполните все поля и поставьте оценку');
              return;
          }
          
          addNewReview(author, text, rating);
          
          // Очистка формы
          document.getElementById('review-author').value = '';
          document.getElementById('review-text').value = '';
          document.querySelectorAll('#rating-input i').forEach(s => s.classList.remove('active'));
          document.getElementById('review-form').style.display = 'none';
      });
  }
  
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

// ========== МОДАЛЬНОЕ ОКНО ==========
function openModal(id) {
  const filament = allFilaments.find(f => f.id === id);
  if (!filament) return;
  
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
          <td>${filament.weight ? filament.weight + 'г' : '-'}</td>
      </tr>
      <tr>
          <th>Диаметр</th>
          <td>${filament.diameter ? filament.diameter + 'мм' : '-'}</td>
      </tr>
      <tr>
          <th>Вес катушки</th>
          <td>${filament.spoolWeight ? filament.spoolWeight + 'г' : '-'}</td>
      </tr>
      <tr>
          <th>Диаметр катушки</th>
          <td>${filament.spoolDiameter ? filament.spoolDiameter + 'мм' : '-'}</td>
      </tr>
      <tr>
          <th>Ширина катушки</th>
          <td>${filament.spoolWidth ? filament.spoolWidth + 'мм' : '-'}</td>
      </tr>
      <tr>
          <th>Внутренний диаметр</th>
          <td>${filament.spoolInnerDiameter ? filament.spoolInnerDiameter + 'мм' : '-'}</td>
      </tr>
      <tr>
          <th>Диаметр филамента</th>
          <td>${filament.filamentDiameter ? filament.filamentDiameter + 'мм' : '-'}</td>
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
  
  // Заполнение профилей
  const profilesHtml = filament.printProfiles && filament.printProfiles.length > 0 ? 
      filament.printProfiles.map(p => `
          <div class="profile-item">
              <a href="${p.url}" target="_blank" class="profile-link">
                  <i class="fas fa-file-alt"></i> ${p.name}
              </a>
              ${p.temp ? `<span class="profile-temp">${p.temp}</span>` : ''}
          </div>
      `).join('') : '<p>Нет доступных профилей</p>';
  
  document.getElementById('modal-profiles').innerHTML = profilesHtml;
  
  // Заполнение ссылок
  const linksHtml = filament.links && filament.links.length > 0 ? 
      filament.links.map(link => `
          <a href="${link.url}" target="_blank" class="marketplace-link ${link.type}-link">
              <i class="fas ${link.type === 'ozon' ? 'fa-shopping-cart' : 
                              link.type === 'wildberries' ? 'fa-shopping-bag' : 
                              'fa-external-link-alt'}"></i> ${link.type === 'website' ? 'Сайт производителя' : link.type}
          </a>
      `).join('') : '<p>Нет доступных ссылок</p>';
  
  document.getElementById('modal-links').innerHTML = linksHtml;
}

function closeModal() {
  document.getElementById('filament-modal').style.display = 'none';
  document.body.style.overflow = 'auto';
}

// ========== ОТЗЫВЫ ==========
function addNewReview(author, text, rating) {
  const reviewList = document.getElementById('review-list');
  const noReviews = reviewList.querySelector('.no-reviews');
  
  if (noReviews) {
      noReviews.remove();
  }
  
  const now = new Date();
  const dateStr = now.toLocaleDateString('ru-RU') + ' ' + now.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});
  
  const reviewItem = document.createElement('div');
  reviewItem.className = 'review-item';
  reviewItem.innerHTML = `
      <div class="review-header">
          <span class="review-author">${author}</span>
          <span class="review-date">${dateStr}</span>
      </div>
      <div class="review-rating">
          ${'<i class="fas fa-star"></i>'.repeat(rating)}${'<i class="far fa-star"></i>'.repeat(5 - rating)}
      </div>
      <div class="review-text">${text}</div>
  `;
  
  reviewList.prepend(reviewItem);
}
