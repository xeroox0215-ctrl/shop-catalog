const tg = window.Telegram.WebApp;
tg.expand();

// --- БАЗА ДАННЫХ ---
// Аккаунты (твои страны)
const accountsData = [
    { code: "usa", name: "США", price: 46 },
    { code: "canada", name: "Канада", price: 99 },
    { code: "uk", name: "Великобритания", price: 125 },
    { code: "colombia", name: "Колумбия", price: 99 },
    { code: "germany", name: "Германия", price: 249 },
    { code: "kazakhstan", name: "Казахстан", price: 249 }
];

// Номера (для примера, ты потом можешь поменять)
const numbersData = [
    { code: "num_usa", name: "США (Номер)", price: 15 },
    { code: "num_uk", name: "Великобритания (Номер)", price: 20 },
    { code: "num_rus", name: "Россия (Номер)", price: 10 },
    { code: "num_kz", name: "Казахстан (Номер)", price: 12 }
];

// --- ФУНКЦИИ ---

// Открыть каталог (Аккаунты или Номера)
function openCatalog(type) {
    const grid = document.getElementById('catalog-grid');
    const title = document.getElementById('catalog-title');
    grid.innerHTML = ''; // Очищаем старые карточки

    let dataToRender = [];
    if (type === 'accounts') {
        title.innerText = "Аккаунты";
        dataToRender = accountsData;
    } else if (type === 'numbers') {
        title.innerText = "Номера";
        dataToRender = numbersData;
    }

    // Рисуем карточки
    dataToRender.forEach(item => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div>
                <div class="product-name">${item.name}</div>
                <div class="product-price">${item.price} ₽</div>
            </div>
            <button class="buy-btn" onclick="confirmBuy('${item.code}', '${item.name}', ${item.price})">Купить</button>
        `;
        grid.appendChild(card);
    });

    // Переключаем экраны
    document.getElementById('screen-main').classList.remove('active');
    document.getElementById('screen-catalog').classList.add('active');
}

// Вернуться назад в меню
function closeCatalog() {
    document.getElementById('screen-catalog').classList.remove('active');
    document.getElementById('screen-main').classList.add('active');
}

// Подтверждение покупки и переход в бота
function confirmBuy(code, name, price) {
    tg.showConfirm(`Вы уверены, что хотите купить ${name} за ${price} ₽?`, (confirmed) => {
        if (confirmed) {
            // Перекидываем в бота с кодом покупки
            tg.openTelegramLink(`https://t.me/sciptyy_storebot?start=buy_${code}`);
            tg.close();
        }
    });
}

// Переход в разделы бота (Промокод, Рефералка)
function goToBot(action) {
    tg.openTelegramLink(`https://t.me/sciptyy_storebot?start=${action}`);
    tg.close();
}
