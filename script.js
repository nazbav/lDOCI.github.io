// Загружаем JSON и отображаем данные
document.addEventListener('DOMContentLoaded', function() {
  fetch('data/cards.json')
    .then(response => response.json())
    .then(data => {
      const cards = data;
      renderCategories(cards);
      renderAllCards(cards);
      setupSearch(cards);
    });
});

// Отображаем категории в боковом меню
function renderCategories(cards) {
  const categoriesList = document.getElementById('categories-list');
  const categories = [...new Set(cards.map(card => card.category))];
  
  categories.forEach(category => {
    const categoryItem = document.createElement('div');
    categoryItem.className = 'category-item';
    categoryItem.textContent = category;
    categoryItem.addEventListener('click', () => {
      document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active');
      });
      categoryItem.classList.add('active');
      filterCardsByCategory(category, cards);
    });
    categoriesList.appendChild(categoryItem);
  });
}

// Отображаем все карточки
function renderAllCards(cards) {
  const container = document.getElementById('cards-container');
  container.innerHTML = '';
  
  const categories = [...new Set(cards.map(card => card.category))];
  
  categories.forEach(category => {
    const categoryCards = cards.filter(card => card.category === category);
    
    const categorySection = document.createElement('div');
    categorySection.className = 'category-section';
    categorySection.innerHTML = `<h2>${category}</h2>`;
    
    categoryCards.forEach(card => {
      const cardElement = document.createElement('div');
      cardElement.className = 'card';
      cardElement.innerHTML = `
        <h3 class="card-title">${card.title}</h3>
        <div class="card-content">
          ${card.описание ? `<div class="card-field"><h4>Описание</h4><p>${card.описание}</p></div>` : ''}
          ${card.причина ? `<div class="card-field"><h4>Причина</h4><p>${card.причина}</p></div>` : ''}
          ${card.решение ? `<div class="card-field"><h4>Решение</h4><p>${card.решение}</p></div>` : ''}
          ${card['полезно знать'] ? `<div class="card-field"><h4>Полезно знать</h4><p>${card['полезно знать']}</p></div>` : ''}
        </div>
      `;
      categorySection.appendChild(cardElement);
    });
    
    container.appendChild(categorySection);
  });
}

// Фильтрация по категории
function filterCardsByCategory(category, cards) {
  const container = document.getElementById('cards-container');
  container.innerHTML = '';
  
  const filteredCards = cards.filter(card => card.category === category);
  
  const categorySection = document.createElement('div');
  categorySection.className = 'category-section';
  categorySection.innerHTML = `<h2>${category}</h2>`;
  
  filteredCards.forEach(card => {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.innerHTML = `
      <h3 class="card-title">${card.title}</h3>
      <div class="card-content">
        ${card.описание ? `<div class="card-field"><h4>Описание</h4><p>${card.описание}</p></div>` : ''}
        ${card.причина ? `<div class="card-field"><h4>Причина</h4><p>${card.причина}</p></div>` : ''}
        ${card.решение ? `<div class="card-field"><h4>Решение</h4><p>${card.решение}</p></div>` : ''}
        ${card['полезно знать'] ? `<div class="card-field"><h4>Полезно знать</h4><p>${card['полезно знать']}</p></div>` : ''}
      </div>
    `;
    categorySection.appendChild(cardElement);
  });
  
  container.appendChild(categorySection);
}

// Поиск с подсветкой
function setupSearch(cards) {
  const searchInput = document.getElementById('search-input');
  
  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const cardElements = document.querySelectorAll('.card');
    
    cardElements.forEach(card => {
      const text = card.textContent.toLowerCase();
      if (searchTerm && text.includes(searchTerm)) {
        card.style.display = 'block';
        highlightText(card, searchTerm);
      } else if (!searchTerm) {
        card.style.display = 'block';
        removeHighlights(card);
      } else {
        card.style.display = 'none';
      }
    });
  });
}

// Подсветка текста
function highlightText(element, searchTerm) {
  removeHighlights(element);
  
  const regex = new RegExp(searchTerm, 'gi');
  const textNodes = getTextNodes(element);
  
  textNodes.forEach(node => {
    const newText = node.nodeValue.replace(regex, match => 
      `<span class="highlight">${match}</span>`
    );
    const temp = document.createElement('div');
    temp.innerHTML = newText;
    
    const parent = node.parentNode;
    while (temp.firstChild) {
      parent.insertBefore(temp.firstChild, node);
    }
    parent.removeChild(node);
  });
}

// Удаление подсветки
function removeHighlights(element) {
  const highlights = element.querySelectorAll('.highlight');
  highlights.forEach(highlight => {
    const parent = highlight.parentNode;
    parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
    parent.normalize();
  });
}

// Получение текстовых узлов
function getTextNodes(element) {
  const textNodes = [];
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while (node = walker.nextNode()) {
    if (node.nodeValue.trim() !== '') {
      textNodes.push(node);
    }
  }
  
  return textNodes;
}