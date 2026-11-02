const countries = [
    { code: "usa", name: "США", price: 46 },
    { code: "canada", name: "Канада", price: 99 },
    { code: "colombia", name: "Колумбия", price: 99 },
    { code: "uk", name: "Великобритания", price: 125 },
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

let tg = window.Telegram.WebApp;
tg.expand();

const catalog = document.getElementById('catalog');

countries.forEach(c => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="name">${c.name}</div>
        <div class="price">${c.price} ₽</div>
        <button class="btn" onclick="buy('${c.code}')">Купить</button>
    `;
    catalog.appendChild(card);
});

// Покупка аккаунта (перекидывает в бота с командой start=buy_code)
function buy(code) {
    tg.openTelegramLink(`https://t.me/sciptyy_storebot?start=buy_${code}`);
    tg.close();
}

// Переход в другие разделы бота
function goToBot(action) {
    tg.openTelegramLink(`https://t.me/sciptyy_storebot?start=${action}`);
    tg.close();
}
