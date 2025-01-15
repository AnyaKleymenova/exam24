document.addEventListener('DOMContentLoaded', () => {
    let allGoods = [];
    let filteredGoods = [];
    let currentPage = 1;
    const itemsPerPage = 10;

    // Функция для загрузки товаров
    function loadGoods() {
        fetch("https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods?api_key=2dfbe953-fd93-4148-9021-f0e4e65e9744")
            .then(response => response.json())
            .then(data => {
                allGoods = data;
                filteredGoods = data;
                displayGoods();
            });
    }

    // Функция для отображения товаров
    function displayGoods() {
        const catalog = document.getElementById('catalog');
        catalog.innerHTML = '';

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const goodsToDisplay = filteredGoods.slice(start, end);

        goodsToDisplay.forEach(item => {
            const ticket = document.createElement('div');
            ticket.classList.add('flex');
            ticket.dataset.kind = item['sub_category'];

            const img = document.createElement('img');
            img.src = item['image_url'];
            img.alt = item['name'];

            const price = document.createElement('p');
            price.classList.add('price');
            price.textContent = item['discount_price'] ? item['discount_price'] + '₽' : item['actual_price'] + '₽';

            const name = document.createElement('p');
            name.classList.add('food');
            name.textContent = item['name'];

            const rating = document.createElement('p');
            rating.classList.add('count');
            rating.textContent = 'Рейтинг: ' + item['rating'];

            const button = document.createElement('button');
            button.textContent = "Добавить";

            ticket.appendChild(img);
            ticket.appendChild(price);
            ticket.appendChild(name);
            ticket.appendChild(rating);
            ticket.appendChild(button);

            button.addEventListener('click', () => {
                addToCart(item);
            });

            catalog.appendChild(ticket);
        });

        document.getElementById('load-more').style.display = end < filteredGoods.length ? 'block' : 'none';
    }

    // Функция для добавления товара в корзину
    function addToCart(item) {
        let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        const existingItem = cartItems.find(cartItem => cartItem.id === item.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cartItems.push({ ...item, quantity: 1 });
        }

        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        updateCartDisplay();
    }

    // Функция для обновления отображения корзины
    function updateCartDisplay() {
        const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        const cartContainer = document.getElementById('cart-container');
        if (cartContainer) {
            cartContainer.innerHTML = '';

            cartItems.forEach(item => {
                const cartItem = document.createElement('div');
                cartItem.classList.add('cart-item');

                const img = document.createElement('img');
                img.src = item['image_url'];
                img.alt = item['name'];

                const name = document.createElement('p');
                name.classList.add('cart-item-name');
                name.textContent = item['name'];

                const price = document.createElement('p');
                price.classList.add('cart-item-price');
                price.textContent = item['discount_price'] ? item['discount_price'] + '₽' : item['actual_price'] + '₽';

                const quantity = document.createElement('p');
                quantity.classList.add('cart-item-quantity');
                quantity.textContent = `Количество: ${item.quantity}`;

                cartItem.appendChild(img);
                cartItem.appendChild(name);
                cartItem.appendChild(price);
                cartItem.appendChild(quantity);

                cartContainer.appendChild(cartItem);
            });
        }
    }

    // Функция для применения фильтров
    function applyFilters(event) {
        event.preventDefault();
        const form = event.target;
        const categoryFilters = Array.from(form.elements['category']).filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);
        const minPrice = parseFloat(form.elements['min-price'].value) || 0;
        const maxPrice = parseFloat(form.elements['max-price'].value) || Infinity;
        const discountOnly = form.elements['discount'].checked;

        filteredGoods = allGoods.filter(item => {
            const categoryMatch = categoryFilters.length === 0 || categoryFilters.includes(item['main_category']);
            const priceMatch = item['discount_price'] ? item['discount_price'] >= minPrice && item['discount_price'] <= maxPrice : item['actual_price'] >= minPrice && item['actual_price'] <= maxPrice;
            const discountMatch = !discountOnly || item['discount_price'] !== null;
            return categoryMatch && priceMatch && discountMatch;
        });

        currentPage = 1;
        displayGoods();
    }

    // Функция для сортировки товаров
    function sortGoods(event) {
        const value = event.target.value;
        if (value === 'default') {
            filteredGoods = [...allGoods];
        } else if (value === 'price-asc') {
            filteredGoods.sort((a, b) => (a['discount_price'] || a['actual_price']) - (b['discount_price'] || b['actual_price']));
        } else if (value === 'price-desc') {
            filteredGoods.sort((a, b) => (b['discount_price'] || b['actual_price']) - (a['discount_price'] || a['actual_price']));
        } else if (value === 'rating-asc') {
            filteredGoods.sort((a, b) => a['rating'] - b['rating']);
        } else if (value === 'rating-desc') {
            filteredGoods.sort((a, b) => b['rating'] - a['rating']);
        }
        currentPage = 1;
        displayGoods();
    }

    // Обработчик события для загрузки еще товаров
    document.getElementById('load-more').addEventListener('click', () => {
        currentPage++;
        displayGoods();
    });

    // Обработчик события для применения фильтров
    document.getElementById('filter-form').addEventListener('submit', applyFilters);

    // Обработчик события для сортировки товаров
    document.getElementById('sort-select').addEventListener('change', sortGoods);

    // Загрузка товаров при загрузке страницы
    loadGoods();

    // Обновление отображения корзины при загрузке страницы
    updateCartDisplay();
});
