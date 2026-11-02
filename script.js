const tg = window.Telegram.WebApp;
tg.expand(); // Развернуть на весь экран

// Список стран
const countries = [
    { code: "usa", name: "США", price: 46 },
    { code: "canada", name: "Канада", price: 99 },
    { code: "uk", name: "Великобритания", price: 125 },
    { code: "colombia", name: "Колумбия", price: 99 },
    { code: "bangladesh", name: "Бангладеш", price: 99 },
    { code: "argentina", name: "Аргентина", price: 125 },
    { code: "uzbekistan", name: "Узбекистан", price: 175 },
    { code: "brazil", name: "Бразилия", price: 175 },
    { code: "thailand", name: "Таиланд", price: 199 },
    { code: "france", name: "Франция", price: 199 },
    { code: "germany", name: "Германия", price: 249 },
    { code: "kazakhstan", name: "Казахстан", price: 249 },
    { code: "ukraine", name: "Украина", price: 249 },
    { code: "poland", name: "Польша", price: 249 },
    { code: "mauritania", name: "Мавритания", price: 299 }
];

// 1. Отрисовка каталога
const catalogGrid = document.getElementById('catalog-grid');
countries.forEach(c => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <div>
            <div class="product-name">${c.name}</div>
            <div class="product-price">${c.price} ₽</div>
        </div>
        <button class="buy-btn" onclick="confirmBuy('${c.code}', '${c.name}', ${c.price})">Купить</button>
    `;
    catalogGrid.appendChild(card);
});

// 2. Переход на экран меню
function openMenu() {
    document.getElementById('screen-welcome').classList.remove('active');
    document.getElementById('screen-menu').classList.add('active');
}

// 3. Переключение вкладок (Главная / Каталог)
function switchTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
}

// 4. Подтверждение покупки
function confirmBuy(code, name, price) {
    const confirmMsg = `Вы уверены, что хотите купить аккаунт ${name} за ${price} ₽?`;
    
    tg.showConfirm(confirmMsg, (confirmed) => {
        if (confirmed) {
            // Если да — перекидываем в бота
            tg.openTelegramLink(`https://t.me/sciptyy_storebot?start=buy_${code}`);
            tg.close();
        }
    });
}

// 5. Переход в другие разделы бота (Рефералка, Промокод и т.д.)
function goToBot(action) {
    // Закрываем сайт и перекидываем в бота
    tg.openTelegramLink(`https://t.me/sciptyy_storebot?start=${action}`);
    tg.close();
}
