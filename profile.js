document.addEventListener('DOMContentLoaded', function () {
    fetchOrders(); // Вызываем функцию для загрузки заказов
    getItemsArray(); // Вызываем функцию для получения списка товаров
});

// Объявляем объекты для хранения названий и цен товаров
let itemDictionary = {};
let itemPrice = {};
let orderIdToDelete;

// Функция для получения списка товаров и их цен
function getItemsArray() {
    fetch(`https://cors-anywhere.herokuapp.com/https://edu.std-900.ist.mospolytech.ru/labs/api/orders/${orderId}?api_key=2dfbe953-fd93-4148-9021-f0e4e65e9744`) // Отправляем запрос на получение списка товаров
        .then(response => response.json()) // Преобразуем ответ в формат JSON
        .then(data => {
            data.forEach(item => {
                itemDictionary[String(item.id)] = item.name; // Сохраняем название товара по его ID
                itemPrice[String(item.id)] = item.price; // Сохраняем цену товара по его ID
            })
        })
        .catch(error => {
            console.error('Ошибка при загрузке списка товаров:', error); // Обрабатываем ошибку, если она возникла
        });
}

// Функция для загрузки заказов
function fetchOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];

    // Очищаем таблицу перед добавлением новых данных
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = '';

    // Счётчик для ID заказов
    let displayedId = 1;

    // Функция для подсчёта стоимости заказа
    function calculateOrderPrice(goods) {
        return goods.reduce((total, good) => total + (good['discount_price'] ? good['discount_price'] : good['actual_price']), 0);
    }

    // Функция для расчета стоимости доставки
    function calculateDeliveryCost(date) {
        if (date) {
            const deliveryDate = new Date(date);
            if (deliveryDate.getDay() >= 1 && deliveryDate.getDay() <= 5) { // Будние дни
                return 200;
            } else { // Выходные дни
                return 300;
            }
        }
        return 0;
    }

    // Перебираем полученные данные и создаем строки таблицы
    orders.forEach(order => {
        if (!order.goods || !Array.isArray(order.goods)) {
            console.error('Invalid order data:', order);
            return;
        }

        const row = document.createElement('tr'); // Создаем новую строку таблицы

        // Добавляем данные в соответствующие ячейки
        row.dataset.id = order.id; // Сохраняем ID заказа
        row.dataset.fullName = order.name; // Сохраняем полное имя клиента
        row.dataset.date = order.createdAt; // Сохраняем дату создания заказа или 'Неизвестно', если дата не указана
        row.dataset.email = order.email; // Сохраняем email клиента
        row.dataset.phone = order.phone; // Сохраняем телефон клиента
        row.dataset.address = order.address; // Сохраняем адрес доставки
        row.dataset.type = order.deliveryType === 'now' ? 'Как можно скорее' : 'Ко времени'; // Сохраняем тип доставки
        row.dataset.time = `${order.deliveryDate} ${order.deliveryTime}`; // Сохраняем время доставки
        row.dataset.comment = order.comment || ''; // Сохраняем комментарий к заказу

        console.log(order); // Выводим заказ в консоль для отладки

        // Получаем названия товаров по их ID
        const orderItems = order.goods.map(good => good['name']); // Получаем названия товаров
        const orderPrice = calculateOrderPrice(order.goods); // Подсчитываем стоимость заказа
        const deliveryCost = calculateDeliveryCost(order.deliveryDate); // Подсчитываем стоимость доставки
        const totalCost = orderPrice + deliveryCost; // Подсчитываем общую стоимость заказа

        // Собираем строку из заказанных товаров
        const orderItemsString = orderItems.join(', ');

        row.dataset.cost = `${totalCost}₽`; // Сохраняем стоимость заказа
        row.dataset.order = orderItemsString; // Сохраняем строку заказанных товаров

        // Заполняем строку таблицы данными
        row.innerHTML = `
            <td>${displayedId++}</td>
            <td>${new Date(order.createdAt).toLocaleString()}</td> <!-- Форматируем дату и время -->
            <td>${orderItemsString}</td>
            <td>${orderPrice}₽</td>
            <td>${row.dataset.time}</td>
            <td>${deliveryCost}₽</td> <!-- Новая колонка -->
            <td>
                <span class="action-btn" onclick="showDetails(this)" title="Подробнее"><img src="./eye.png" alt="Eye"></span>
                <span class="action-btn" onclick="editOrder(this)" title="Редактировать"><img src="./pen.png" alt="Pencil"></span>
                <span class="action-btn" onclick="deleteOrder(this)" title="Удалить"><img src="./tras.png" alt="Trash"></span>
            </td>
        `;

        // Добавляем строку в таблицу
        tbody.appendChild(row);
    });
}

// Функция для открытия модального окна
function openModal(type) {
    document.getElementById('overlay').style.display = 'block'; // Показываем затемненный фон
    document.getElementById(type + '-modal').style.display = 'block'; // Показываем модальное окно
}

// Функция для закрытия модального окна
function closeModal() {
    document.getElementById('overlay').style.display = 'none'; // Скрываем затемненный фон
    const modals = document.querySelectorAll('.modal'); // Получаем все модальные окна
    modals.forEach(modal => modal.style.display = 'none'); // Скрываем все модальные окна
}

// Функция для просмотра деталей заказа
function showDetails(button) {
    const row = button.closest('tr'); // Получаем строку таблицы, содержащую кнопку

    document.getElementById('details-date').textContent = new Date(row.dataset.date).toLocaleString(); // Заполняем дату
    document.getElementById('details-full-name').textContent = row.dataset.fullName; // Заполняем полное имя
    document.getElementById('details-address').textContent = row.dataset.address; // Заполняем адрес
    document.getElementById('details-type').textContent = row.dataset.type; // Заполняем тип доставки
    document.getElementById('details-time').textContent = row.dataset.time; // Заполняем время доставки
    document.getElementById('details-phone').textContent = row.dataset.phone; // Заполняем телефон
    document.getElementById('details-email').textContent = row.dataset.email; // Заполняем email
    document.getElementById('details-comment').textContent = row.dataset.comment || ''; // Заполняем комментарий
    document.getElementById('details-order').textContent = row.dataset.order; // Заполняем заказанные товары
    document.getElementById('details-cost').textContent = row.dataset.cost; // Заполняем стоимость заказа

    openModal('view'); // Открываем модальное окно для просмотра деталей
}

// Функция для редактирования заказа
function editOrder(button) {
    const row = button.closest('tr'); // Получаем строку таблицы, содержащую кнопку
    openModal('edit'); // Открываем модальное окно для редактирования

    document.getElementById('edit-order-id').value = row.dataset.id; // Заполняем ID заказа для редактирования
    document.getElementById('edit-date').value = new Date(row.dataset.date).toISOString().split('T')[0]; // Заполняем дату
    document.getElementById('edit-full-name').value = row.dataset.fullName; // Заполняем полное имя
    document.getElementById('edit-address').value = row.dataset.address; // Заполняем адрес
    document.getElementById('edit-type-asap').checked = row.dataset.type === "Как можно скорее"; // Заполняем тип доставки
    document.getElementById('edit-type-time').checked = row.dataset.type === "Ко времени"; // Заполняем тип доставки
    document.getElementById('edit-time').value = row.dataset.time; // Заполняем время доставки
    document.getElementById('edit-phone').value = row.dataset.phone; // Заполняем телефон
    document.getElementById('edit-email').value = row.dataset.email; // Заполняем email
    document.getElementById('edit-comment').value = row.dataset.comment; // Заполняем комментарий
    document.getElementById('edit-order').textContent = row.dataset.order; // Заполняем заказанные товары
    document.getElementById('edit-cost').textContent = row.dataset.cost; // Заполняем стоимость заказа
}

// Функция для сохранения изменений заказа
function saveOrder() {
    const orderId = document.getElementById('edit-order-id').value; // Получаем ID заказа
    if (!orderId) {
        console.error('ID заказа не найден.'); // Обрабатываем ошибку, если ID не найден
        return;
    }
    const fullName = document.getElementById('edit-full-name').value; // Получаем полное имя
    const address = document.getElementById('edit-address').value; // Получаем адрес
    let deliveryType = document.querySelector('input[name="delivery-type"]:checked').value; // Получаем тип доставки

    if (deliveryType === 'Как можно скорее') {
        deliveryType = 'now'; // Преобразуем тип доставки в формат API
    } else {
        deliveryType = 'by_time'; // Преобразуем тип доставки в формат API
    }

    const deliveryDate = document.getElementById('edit-date').value; // Получаем дату доставки
    const deliveryTime = document.getElementById('edit-time').value; // Получаем время доставки
    const phone = document.getElementById('edit-phone').value; // Получаем телефон
    const email = document.getElementById('edit-email').value; // Получаем email
    const comment = document.getElementById('edit-comment').value; // Получаем комментарий
    const cost = document.getElementById('edit-cost').textContent; // Получаем стоимость заказа

    // Получаем заказы из localStorage
    let orders = JSON.parse(localStorage.getItem('orders')) || [];

    // Находим заказ по ID и обновляем его данные
    const updatedOrder = orders.find(order => order.id === parseInt(orderId));
    if (updatedOrder) {
        updatedOrder.name = fullName;
        updatedOrder.address = address;
        updatedOrder.deliveryType = deliveryType;
        updatedOrder.deliveryDate = deliveryDate; // Обновляем дату доставки
        updatedOrder.deliveryTime = deliveryTime; // Обновляем время доставки
        updatedOrder.phone = phone;
        updatedOrder.email = email;
        updatedOrder.comment = comment;
        updatedOrder.totalCost = parseFloat(cost.replace('₽', '')); // Обновляем стоимость
    }

    // Сохраняем обновленный список заказов в localStorage
    localStorage.setItem('orders', JSON.stringify(orders));

    // Обновляем отображение таблицы
    fetchOrders();

    // Закрываем модальное окно
    closeModal();

    // Выводим сообщение об успешном сохранении
    alert('Изменения сохранены!');
}

// Функция для удаления заказа
function deleteOrder(button) {
    const row = button.closest('tr'); // Получаем строку таблицы, содержащую кнопку
    openModal('delete'); // Открываем модальное окно для удаления

    const orderId = row.dataset.id; // Получаем ID заказа
    if (!orderId) {
        console.error('ID заказа не найден.'); // Обрабатываем ошибку, если ID не найден
        return;
    }

    // Сохраняем ID заказа в переменную
    orderIdToDelete = orderId;
}

// Функция для подтверждения удаления заказа
function confirmDelete() {
    if (!orderIdToDelete) {
        console.error('ID заказа не найден.'); // Обрабатываем ошибку, если ID не найден
        return;
    }

    // Получаем заказы из localStorage
    let orders = JSON.parse(localStorage.getItem('orders')) || [];

    // Фильтруем заказы, удаляя заказ с соответствующим ID
    orders = orders.filter(order => order.id !== parseInt(orderIdToDelete));

    // Сохраняем обновленный список заказов в localStorage
    localStorage.setItem('orders', JSON.stringify(orders));

    // Обновляем отображение таблицы
    fetchOrders();

    // Закрываем модальное окно
    closeModal();

    // Выводим сообщение об успешном удалении
    alert('Заказ удалён!');
}
