document.addEventListener('DOMContentLoaded', () => {
    let allGoods = [];
    let filteredGoods = [];
    let currentPage = 1;
    const itemsPerPage = 10;

    fetch("https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods?api_key=2dfbe953-fd93-4148-9021-f0e4e65e9744")
        .then(response => response.json())
        .then(data => {
            allGoods = data;
            filteredGoods = data;
            displayGoods(filteredGoods.slice(0, itemsPerPage));
            checkLoadMoreButton();
        });

    function createGoodCard(good) {
        const card = document.createElement('div');
        card.classList.add('catalog-item');
        card.dataset.kind = good['sub_category'];

        const img = document.createElement('img');
        img.src = good['image_url'];
        img.alt = good['name'];

        const price = document.createElement('p');
        price.classList.add('price');
        if (good['discount_price']) {
            price.innerHTML = `<span class="discount-price">${good['discount_price']}₽</span> <span class="original-price">${good['actual_price']}₽</span>`;
        } else {
            price.textContent = `${good['actual_price']}₽`;
        }

        const goodName = document.createElement('h3');
        goodName.textContent = good['name'];

        const rating = document.createElement('div');
        rating.classList.add('rating');
        rating.innerHTML = generateStarRating(good['rating']);

        const button = document.createElement('button');
        button.textContent = "Добавить";

        card.appendChild(img);
        card.appendChild(goodName);
        card.appendChild(price);
        card.appendChild(rating);
        card.appendChild(button);

        button.addEventListener('click', () => {
            addToOrder(good);
        });

        return card;
    }

    function generateStarRating(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += i <= rating ? '★' : '☆';
        }
        return `Рейтинг: ${stars}`;
    }

    function displayGoods(goods) {
        const catalog = document.querySelector('#catalog');
        goods.forEach(good => {
            const card = createGoodCard(good);
            catalog.appendChild(card);
        });
    }

    function filterGoods() {
        const form = document.querySelector('#filter-form');
        const formData = new FormData(form);
        const categories = formData.getAll('category');
        const minPrice = formData.get('min-price');
        const maxPrice = formData.get('max-price');
        const discount = formData.get('discount');

        filteredGoods = allGoods.filter(good => {
            const categoryMatch = categories.length === 0 || categories.includes(good['main_category']);
            const effectivePrice = good['discount_price'] !== null ? good['discount_price'] : good['actual_price'];
            const priceMatch = (minPrice === '' || effectivePrice >= minPrice) && (maxPrice === '' || effectivePrice <= maxPrice);
            const discountMatch = discount ? good['discount_price'] !== null : true;
            return categoryMatch && priceMatch && discountMatch;
        });

        currentPage = 1;
        const catalog = document.querySelector('#catalog');
        catalog.innerHTML = ''; // Clear existing items
        displayGoods(filteredGoods.slice(0, itemsPerPage));
        checkLoadMoreButton();
    }

    function sortGoods(criteria) {
        switch (criteria) {
            case 'price-asc':
                filteredGoods.sort((a, b) => (a['discount_price'] ?? a['actual_price']) - (b['discount_price'] ?? b['actual_price']));
                break;
            case 'price-desc':
                filteredGoods.sort((a, b) => (b['discount_price'] ?? b['actual_price']) - (a['discount_price'] ?? a['actual_price']));
                break;
            case 'rating-asc':
                filteredGoods.sort((a, b) => a['rating'] - b['rating']);
                break;
            case 'rating-desc':
                filteredGoods.sort((a, b) => b['rating'] - a['rating']);
                break;
            default:
                filteredGoods = allGoods;
        }
        currentPage = 1;
        const catalog = document.querySelector('#catalog');
        catalog.innerHTML = ''; // Clear existing items
        displayGoods(filteredGoods.slice(0, itemsPerPage));
        checkLoadMoreButton();
    }

    function loadMoreGoods() {
        currentPage++;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = currentPage * itemsPerPage;
        const moreGoods = filteredGoods.slice(startIndex, endIndex);
        displayGoods(moreGoods);
        checkLoadMoreButton();
    }

    function checkLoadMoreButton() {
        const loadMoreButton = document.querySelector('#load-more');
        if (currentPage * itemsPerPage >= filteredGoods.length) {
            loadMoreButton.style.display = 'none';
        } else {
            loadMoreButton.style.display = 'block';
        }
    }

    document.querySelector('#filter-form').addEventListener('submit', (e) => {
        e.preventDefault();
        filterGoods();
    });

    document.querySelector('#sort-select').addEventListener('change', (e) => {
        sortGoods(e.target.value);
    });

    document.querySelector('#load-more').addEventListener('click', () => {
        loadMoreGoods();
    });

    let totalPrice = 0;
    const totalPriceElement = document.getElementById('price');

    let selectedGoods = {
        'home & kitchen': [],
        'tv, audio & cameras': [],
        'sports & fitness': [],
        'beauty & health': [],
    };

    function addToOrder(good) {
        const category = good['main_category'];
        selectedGoods[category].push(good);
        window.localStorage.setItem(`${category.replace(/[^a-zA-Z0-9]/g, '')}-selected`, JSON.stringify(selectedGoods[category]));

        totalPrice += good['discount_price'] ? good['discount_price'] : good['actual_price'];

        if (totalPriceElement) {
            totalPriceElement.textContent = `Стоимость заказа ${totalPrice}₽`;
            totalPriceElement.style.display = 'block';
        }

        showNotification(`${good['name']} добавлен в корзину!`);

        const link = document.querySelector('.order_link');
        link.style.display = '';
    }

    function showNotification(message) {
        const notifications = document.querySelector('.notifications');
        notifications.textContent = message;
        notifications.style.display = 'block';
        setTimeout(() => {
            notifications.style.display = 'none';
        }, 3000); // Hide the notification after 3 seconds
    }

    function loadFromLocalStorage() {
        const categories = ['home & kitchen', 'tv, audio & cameras', 'sports & fitness', 'beauty & health'];
        categories.forEach(category => {
            const storedGoods = window.localStorage.getItem(`${category.replace(/[^a-zA-Z0-9]/g, '')}-selected`);
            if (storedGoods) {
                const parsedGoods = JSON.parse(storedGoods);
                parsedGoods.forEach(good => {
                    addToOrder(good);
                });
            }
        });
    }

    loadFromLocalStorage();

    const categories = ['home & kitchen', 'tv, audio & cameras', 'sports & fitness', 'beauty & health'];
    categories.forEach(category => setupFilters(category));

    function setupFilters(category) {
        const filters = document.querySelectorAll(`.${category.replace(/[^a-zA-Z0-9]/g, '')}-filter`);

        filters.forEach(filter => {
            filter.addEventListener('click', (e) => {
                e.preventDefault();

                const section = document.querySelector(`#${category.replace(/[^a-zA-Z0-9]/g, '')}`);
                const goods = section.querySelectorAll('.catalog-item');
                const isActive = filter.classList.contains('active');
                const filterKind = filter.dataset.kind;

                filters.forEach(f => f.classList.remove('active'));

                if (!isActive) {
                    filter.classList.add('active');
                    goods.forEach(good => {
                        good.classList.toggle('hidden', good.dataset.kind !== filterKind);
                    });
                } else {
                    goods.forEach(good => good.classList.remove('hidden'));
                }
            });
        });
    }
});
