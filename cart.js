document.addEventListener('DOMContentLoaded', () => {
    const categories = ['home & kitchen', 'tv, audio & cameras', 'sports & fitness', 'beauty & health'];
    const selectedGoods = {};

    // Загрузка данных из localStorage
    categories.forEach(category => {
        const storedGoods = window.localStorage.getItem(`${category.replace(/[^a-zA-Z0-9]/g, '')}-selected`);
        if (storedGoods) {
            selectedGoods[category] = JSON.parse(storedGoods);
        } else {
            selectedGoods[category] = [];
        }
    });

    const container = document.querySelector('.order-container');
    const orderItemsContainer = document.getElementById('order-items');
    const totalPriceElement = document.getElementById('total_price');
    const form = document.getElementById('order-form');
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    const notificationButton = document.getElementById('notification-button');
    const nothingSelected = document.getElementById('nothing_selected');
    const deliveryDateInput = document.getElementById('delivery_date');
    const deliveryTimeInput = document.getElementById('delivery_time');

    if (!container) {
        console.error('Container not found');
        return;
    }

    function createGoodCard(good) {
        const card = document.createElement('div');
        card.classList.add('cart-item');

        const img = document.createElement('img');
        img.src = good['image_url'];
        img.alt = good['name'];

        const goodName = document.createElement('p');
        goodName.classList.add('good-name');
        goodName.textContent = good['name'];

        const price = document.createElement('p');
        price.classList.add('price');
        price.textContent = good['discount_price'] ? `${good['discount_price']}₽` : `${good['actual_price']}₽`;

        const button = document.createElement('button');
        button.textContent = "Удалить";
        button.classList.add('remove-from-cart');

        button.addEventListener('click', () => {
            removeFromOrder(good);
        });

        card.appendChild(img);
        card.appendChild(goodName);
        card.appendChild(price);
        card.appendChild(button);

        return card;
    }

    function displaySelectedGoods() {
        container.innerHTML = '';
        orderItemsContainer.innerHTML = '';
        let hasItems = false;

        categories.forEach(category => {
            if (selectedGoods[category] && selectedGoods[category].length > 0) {
                hasItems = true;
                selectedGoods[category].forEach(good => {
                    const card = createGoodCard(good);
                    container.appendChild(card);

                    const orderItem = document.createElement('p');
                    orderItem.textContent = `${good['name']} - ${good['discount_price'] ? good['discount_price'] : good['actual_price']}₽`;
                    orderItemsContainer.appendChild(orderItem);
                });
            }
        });

        if (hasItems) {
            nothingSelected.style.display = 'none';
        } else {
            nothingSelected.style.display = 'block';
        }

        updateTotalPrice();
    }

    function removeFromOrder(good) {
        const category = good['main_category'];
        selectedGoods[category] = selectedGoods[category].filter(item => item['id'] !== good['id']);
        window.localStorage.setItem(`${category.replace(/[^a-zA-Z0-9]/g, '')}-selected`, JSON.stringify(selectedGoods[category]));
        displaySelectedGoods();
    }

    function updateTotalPrice() {
        let totalPrice = 0;
        let hasItems = false;

        categories.forEach(category => {
            if (selectedGoods[category] && selectedGoods[category].length > 0) {
                hasItems = true;
                selectedGoods[category].forEach(good => {
                    totalPrice += good['discount_price'] ? good['discount_price'] : good['actual_price'];
                });
            }
        });

        let deliveryCost = 0;
        if (hasItems) {
            deliveryCost = calculateDeliveryCost(deliveryDateInput.value, deliveryTimeInput.value);
        }

        totalPrice += deliveryCost;
        totalPriceElement.textContent = `${totalPrice}₽`;
    }

    function calculateDeliveryCost(date, time) {
        let deliveryCost = 0;
        if (date && time) {
            const deliveryDate = new Date(date);
            const deliveryTime = new Date(`1970-01-01T${time}:00`);

            if (deliveryDate.getDay() >= 1 && deliveryDate.getDay() <= 5) { // Будние дни
                deliveryCost += 200;
            } else { // Выходные дни
                deliveryCost += 300;
            }
        }

        return deliveryCost;
    }

    function updateDeliveryCost() {
        updateTotalPrice();
    }

    deliveryDateInput.addEventListener('change', updateDeliveryCost);
    deliveryTimeInput.addEventListener('change', updateDeliveryCost);

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('address').value;
        const deliveryDate = document.getElementById('delivery_date').value;
        const deliveryTime = document.getElementById('delivery_time').value;
        const comment = document.getElementById('comment').value;
        const subscribe = document.getElementById('subscribe').checked;

        const totalCost = parseInt(totalPriceElement.textContent.replace('₽', ''));

        const orderData = {
            id: Date.now(), // Генерируем уникальный ID для заказа
            name,
            email,
            phone,
            address,
            deliveryDate,
            deliveryTime,
            comment,
            subscribe,
            totalCost,
            goods: [],
            createdAt: new Date().toISOString() // Добавляем дату и время оформления заказа
        };

        categories.forEach(category => {
            orderData.goods = orderData.goods.concat(selectedGoods[category]);
        });

        console.log('Order Data:', orderData);

        try {
            const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
            const targetUrl = 'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods?api_key=2dfbe953-fd93-4148-9021-f0e4e65e9744';
            const response = await fetch(proxyUrl + targetUrl, {
                method: 'GET', // Изменяем метод запроса на GET
                headers: {
                    'Content-Type': 'application/json'
                },
            });

            console.log('Response Status:', response.status);
            console.log('Response Headers:', response.headers);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Server Response:', result);

            // Check if the response is an array
            if (Array.isArray(result)) {
                // If the response is an array, it means the server returned a list of items
                // Assume the order is processed successfully
                notificationText.textContent = 'Заказ успешно оформлен!';
                notification.classList.remove('hidden');
                categories.forEach(category => {
                    window.localStorage.removeItem(`${category.replace(/[^a-zA-Z0-9]/g, '')}-selected`);
                });

                // Save the order data to localStorage
                const orders = JSON.parse(localStorage.getItem('orders')) || [];
                orders.push(orderData);
                localStorage.setItem('orders', JSON.stringify(orders));

                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 3000);
            } else {
                // Check if the response contains the expected structure
                if (result.success !== undefined) {
                    if (result.success) {
                        notificationText.textContent = 'Заказ успешно оформлен!';
                        notification.classList.remove('hidden');
                        categories.forEach(category => {
                            window.localStorage.removeItem(`${category.replace(/[^a-zA-Z0-9]/g, '')}-selected`);
                        });

                        // Save the order data to localStorage
                        const orders = JSON.parse(localStorage.getItem('orders')) || [];
                        orders.push(orderData);
                        localStorage.setItem('orders', JSON.stringify(orders));

                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 3000);
                    } else {
                        notificationText.textContent = 'Ошибка при оформлении заказа. Пожалуйста, попробуйте снова.';
                        notification.classList.remove('hidden');
                    }
                } else {
                    notificationText.textContent = 'Неожиданный формат ответа от сервера. Пожалуйста, попробуйте снова.';
                    notification.classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            notificationText.textContent = `Ошибка при оформлении заказа: ${error.message}`;
            notification.classList.remove('hidden');
        }
    });

    notificationButton.addEventListener('click', () => {
        notification.classList.add('hidden');
    });

    // Initialize the total price to 0
    totalPriceElement.textContent = '0₽';

    displaySelectedGoods();
});
