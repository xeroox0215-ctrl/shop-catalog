const countries = [
    { code: "usa", name: "США", flag: "🇺🇸", price: 46 },
    { code: "canada", name: "Канада", flag: "🇨🇦", price: 99 },
    { code: "colombia", name: "Колумбия", flag: "🇨🇴", price: 99 },
    { code: "uk", name: "Великобритания", flag: "🇬🇧", price: 125 },
    { code: "bangladesh", name: "Бангладеш", flag: "🇧🇩", price: 99 },
    { code: "argentina", name: "Аргентина", flag: "🇦🇷", price: 125 },
    { code: "uzbekistan", name: "Узбекистан", flag: "🇺🇿", price: 175 },
    { code: "brazil", name: "Бразилия", flag: "🇧🇷", price: 175 },
    { code: "thailand", name: "Таиланд", flag: "🇹🇭", price: 199 },
    { code: "france", name: "Франция", flag: "🇫🇷", price: 199 },
    { code: "germany", name: "Германия", flag: "🇩🇪", price: 249 },
    { code: "kazakhstan", name: "Казахстан", flag: "🇰🇿", price: 249 },
    { code: "ukraine", name: "Украина", flag: "🇺🇦", price: 249 },
    { code: "poland", name: "Польша", flag: "🇵🇱", price: 249 },
    { code: "mauritania", name: "Мавритания", flag: "🇲🇷", price: 299 }
];

let tg = window.Telegram.WebApp;
tg.expand();

const catalog = document.getElementById('catalog');

countries.forEach(c => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="flag">${c.flag}</div>
        <div class="name">${c.name}</div>
        <div class="price">${c.price} ₽</div>
        <button class="btn" onclick="buy('${c.code}')">Купить</button>
    `;
    catalog.appendChild(card);
});

function buy(code) {
    tg.openTelegramLink(`https://t.me/sciptyy_storebot?start=buy_${code}`);
    tg.close();
}
