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
    const totalPriceElement = document.getElementById('total_price');
    const form = document.getElementById('order-form');
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    const notificationButton = document.getElementById('notification-button');

    if (!container) {
        console.error('Container not found');
        return;
    }

    function createGoodCard(good) {
        const card = document.createElement('div');
        card.classList.add('order-card');

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
        categories.forEach(category => {
            if (selectedGoods[category] && selectedGoods[category].length > 0) {
                selectedGoods[category].forEach(good => {
                    const card = createGoodCard(good);
                    container.appendChild(card);
                });
            }
        });
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
        categories.forEach(category => {
            if (selectedGoods[category] && selectedGoods[category].length > 0) {
                selectedGoods[category].forEach(good => {
                    totalPrice += good['discount_price'] ? good['discount_price'] : good['actual_price'];
                });
            }
        });
        totalPriceElement.textContent = `${totalPrice}₽`;
    }

    function calculateDeliveryCost(date, time) {
        let deliveryCost = 200;
        const deliveryDate = new Date(date);
        const deliveryTime = new Date(`1970-01-01T${time}:00`);

        if (deliveryDate.getDay() >= 1 && deliveryDate.getDay() <= 5) { // Будние дни
            if (deliveryTime.getHours() >= 18) {
                deliveryCost += 200;
            }
        } else { // Выходные дни
            deliveryCost += 300;
        }

        return deliveryCost;
    }

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

        const deliveryCost = calculateDeliveryCost(deliveryDate, deliveryTime);
        const totalCost = parseInt(totalPriceElement.textContent.replace('₽', '')) + deliveryCost;

        const orderData = {
            name,
            email,
            phone,
            address,
            deliveryDate,
            deliveryTime,
            comment,
            subscribe,
            totalCost
        };

        try {
            const response = await fetch('YOUR_API_URL', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (result.success) {
                notificationText.textContent = 'Заказ успешно оформлен!';
                notification.classList.remove('hidden');
                categories.forEach(category => {
                    window.localStorage.removeItem(`${category.replace(/[^a-zA-Z0-9]/g, '')}-selected`);
                });
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 3000);
            } else {
                notificationText.textContent = 'Ошибка при оформлении заказа. Пожалуйста, попробуйте снова.';
                notification.classList.remove('hidden');
            }
        } catch (error) {
            notificationText.textContent = 'Ошибка при оформлении заказа. Пожалуйста, попробуйте снова.';
            notification.classList.remove('hidden');
        }
    });

    notificationButton.addEventListener('click', () => {
        notification.classList.add('hidden');
    });

    displaySelectedGoods();
});
