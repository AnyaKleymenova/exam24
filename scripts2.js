import api from './service.js';
import Modal from './modal.js';
import popup from './popup.js';

class Orders {
    constructor() {
        this.container = document.querySelector('.js-orders');
        this.template = document.getElementById("js-order-item");
        this.orders = [];
        this.ordersIdData = {};
        this.productsBiId = {};
        this.modalDelete = new Modal('modal-delete');
        this.modalView = new Modal('modal-view');
        this.modalDeleteEl = document.getElementById('modal-delete');
        this.modalViewEl = document.getElementById('modal-view');

        this.init();
    }

    async init() {
        this.orders = await api.getOrders();
        await this.getOrdersData();
        this.setOrders();

        this.container.addEventListener('click', (e) => {
            const target = e.target;
            // Проверяем, была ли нажата кнопка view
            if (target.matches('.js-order-view')) {
                // Находим ближайший родительский блок с классом
                const item = target.closest('.orders__list-item');
                // Получаем значение order-id из блока
                if (item && item.hasAttribute('data-order-id')) {
                    const dataValue = item.dataset.orderId;
                    this.modalView.open(dataValue, this.getOrderData(dataValue));
                }
            }
            // Проверяем, была ли нажата кнопка edit
            if (target.matches('.js-order-edit')) {
                // Находим ближайший родительский блок с классом
                const item = target.closest('.orders__list-item');
                // Получаем значение order-id из блока
                if (item && item.hasAttribute('data-order-id')) {
                    const dataValue = item.dataset.orderId;
                    this.modalView.open(dataValue, this.getOrderData(dataValue), true);
                }
            }
            // Проверяем, была ли нажата кнопка delete
            if (target.matches('.js-order-delete')) {
                // Находим ближайший родительский блок с классом
                const item = target.closest('.orders__list-item');
                // Получаем значение order-id из блока
                if (item && item.hasAttribute('data-order-id')) {
                    const dataValue = item.dataset.orderId;
                    this.modalDelete.open(dataValue);
                }
            }
        });

        this.initDeleteModal();
        this.initViewModal();
    }

    getOrderData(orderId) {
        const order = this.orders.find(({ id }) => id === Number(orderId));
        const products = this.productsBiId[orderId];

        const [year, month, day] = order.delivery_date.split('-'); // Разбиваем строку на части
        const formattedDate = `${day}.${month}.${year}`; // Формируем строку в формате dd.mm.yyyy

        const orderData = {
            date: this.formatDate(order.created_at),
            name: order.full_name,
            phone: order.phone,
            email: order.email,
            address: order.delivery_address,
            delivery_date: formattedDate,
            delivery_interval: order.delivery_interval,
            comment: order.comment,
            price: this.getTotalSum(orderId),
            products: [],
        };

        orderData.products = products.map(i => i.name);

        return orderData;
    }

    initDeleteModal() {
        const closeBtn = this.modalDeleteEl.querySelector('.modal-close');
        const submitBtn = this.modalDeleteEl.querySelector('.modal-submit');

        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.modalDelete.close();
        });

        submitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            this.deleteOrder(this.modalDelete.orderId);
            this.modalDelete.close();
            this.orders = await api.getOrders();
            await this.getOrdersData();
            this.setOrders();
        });
    }

    initViewModal() {
        const closeBtns = this.modalViewEl.querySelectorAll('.modal-close');
        const submitBtn = this.modalViewEl.querySelector('.modal-submit');

        closeBtns.forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                this.modalView.close();
            });
        });
    }

    async deleteOrder(id) {
        const res = await api.deleteOrderById(id);
        if (res) {
            popup.openPopup('Заказ удален');
        }
    }

    async getOrdersData() {
        this.orders.forEach(item => {
            this.ordersIdData[item.id] = item.good_ids;
        });

        for (let key in this.ordersIdData) {
            this.productsBiId[key] = await Promise.all(this.ordersIdData[key].map(async (id) => {
                return await api.getItem(id);
            }));
        }
    }

    formatDate(time) {
        // Преобразуем строку в объект Date
        const date = new Date(time);

        // Получаем компоненты даты и времени
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        // Формируем строку в формате "dd.mm.yyyy hh:mm"
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }

    getTotalSum(id) {
        return this.productsBiId[id].reduce((acc, item) => {
            acc += item.actual_price || item.discount_price;
            return acc;
        }, 0);
    }

    setOrders() {
        this.container.innerHTML = '';

        this.orders.forEach((order, index) => {
            const [year, month, day] = order.delivery_date.split('-'); // Разбиваем строку на части
            const formattedDate = `${day}.${month}.${year}`; // Формируем строку в формате dd.mm.yyyy

            const clone = this.template.content.cloneNode(true);
            clone.querySelector(".orders__list-item").setAttribute("data-order-id", order.id);
            clone.querySelector(".orders__num").textContent = `${index + 1}.`;
            clone.querySelector(".orders__date").textContent = this.formatDate(order.created_at);
            clone.querySelector(".orders__price").textContent = `${this.getTotalSum(order.id)} ₽`;
            clone.querySelector(".orders__names").innerHTML = `<p>${this.productsBiId[order.id][0]?.name || ''}</p><p>${this.productsBiId[order.id]?.[1]?.name || ''}</p>`;
            clone.querySelector(".orders__delivery").innerHTML = `<p>${formattedDate}</p><p>${order.delivery_interval}</p>`;

            this.container.appendChild(clone);
        });
    }
}

new Orders();
