const tg = window.Telegram?.WebApp;
if (tg) tg.expand();
const API_URL = "https://sciptyy-api.onrender.com";

let userProfile = { balance: 0, last_roll: 0, cases: 0, vip_cases: 0 };
let accountsData = [];
let selectedCountry = null;
let selectedPrice = 0;
let isAdmin = false;

async function loadData() {
    try {
        const res = await fetch(`${API_URL}/api/profile`, { headers: { "X-Telegram-Init-Data": tg.initData } });
        const data = await res.json();
        if (data.status === "ok") {
            userProfile = data.profile;
            accountsData = data.shop;
            isAdmin = data.is_admin;
            
            if (isAdmin) {
                document.getElementById('admin-btn').style.display = 'block';
                document.getElementById('admin-tickets-btn').style.display = 'block';
            }
            
            if (userProfile.cases > 0) document.getElementById('open-normal-case').style.display = 'block';
            if (userProfile.vip_cases > 0) document.getElementById('open-vip-case').style.display = 'block';
            
            document.getElementById('profile-balance').innerText = `${userProfile.balance.toFixed(2)} ₽`;
            
            const pDiv = document.getElementById('profile-purchases');
            pDiv.innerHTML = data.purchases.length > 0 ? data.purchases.map(p => {
                let copyBtn = '';
                if (p.name.includes('Промокод')) {
                    const codeMatch = p.name.match(/Промокод ([A-Z0-9-]+)/);
                    if (codeMatch && codeMatch[1]) {
                        copyBtn = `<button onclick="navigator.clipboard.writeText('${codeMatch[1]}'); tg.showAlert('Код скопирован: ${codeMatch[1]}');" style="background:#00d2ff; border:none; color:black; border-radius:5px; padding:5px; font-size:10px; margin-top:5px; cursor:pointer;">Скопировать код</button>`;
                    }
                }
                return `
                <div class="purchase-item">
                    <div style="font-weight: bold; color: #00d2ff;">${p.name}</div>
                    <div style="color: #888;">${p.price} ₽ • ${p.date.split(' ')[0]}</div>
                    ${copyBtn}
                </div>`;
            }).join('') : '<div style="color:#888;">Покупок нет</div>';
                
            renderTickets(data.tickets);
        }
    } catch(e) { console.log(e); }
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(id === 'screen-profile' || id === 'screen-main' || id === 'screen-admin-tickets') loadData();
}

function openCatalog() {
    const grid = document.getElementById('catalog-grid');
    grid.innerHTML = '';
    accountsData.forEach(item => {
        const stockColor = item.stock > 0 ? '#00d2ff' : '#ff4444';
        const stockText = item.stock > 0 ? `В наличии: ${item.stock}` : 'Нет в наличии';
        grid.innerHTML += `
            <div class="product-card">
                <div class="product-name">${item.name}</div>
                <div class="product-price">${item.price} ₽</div>
                <div style="color:${stockColor}; font-size:11px; margin-bottom:5px;">${stockText}</div>
                <button class="buy-btn" ${item.stock <= 0 ? 'disabled' : ''} onclick="openModal('${item.code}', '${item.name}', ${item.price}, ${item.stock})">Купить</button>
            </div>
        `;
    });
    showScreen('screen-catalog');
}
function openModal(code, name, price, stock) {
    if(stock <= 0) return;
    selectedCountry = code;
    selectedPrice = price;
    document.getElementById('modal-title').innerText = name;
    document.getElementById('modal-price').innerText = `Цена: ${price} ₽`;
    document.getElementById('modal-buy').style.display = 'flex';
}

function closeModal() { document.getElementById('modal-buy').style.display = 'none'; }

async function buyItem(method) {
    closeModal();
    if (method === 'stars') {
        try {
            const res = await fetch(`${API_URL}/api/buy_stars`, {
                method: 'POST',
                headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" },
                body: JSON.stringify({ country: selectedCountry })
            });
            const data = await res.json();
            if (data.status === 'ok') {
                tg.openInvoice(data.url, (status) => {
                    if (status === 'paid') {
                        tg.showAlert("✅ Оплачено звездами! Номер скоро выдадут. Если долго — напишите в поддержку.");
                        loadData();
                    }
                });
            } else { tg.showAlert(`❌ ${data.error}`); }
        } catch(e) { tg.showAlert("Ошибка сервера"); }
        return;
    }
    
    tg.showAlert("Списываем средства...");
    try {
        const res = await fetch(`${API_URL}/api/buy`, {
            method: 'POST',
            headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" },
            body: JSON.stringify({ country: selectedCountry, method: "balance" })
        });
        const data = await res.json();
        if (data.status === 'ok') {
            tg.showAlert(`✅ Деньги списаны! Номер скоро выдадут.\nЕсли долго — напишите в поддержку.`);
            loadData();
        } else { tg.showAlert(`❌ ${data.error}`); }
    } catch(e) { tg.showAlert("Ошибка сервера"); }
}

let isSpinning = false;
async function spinWheel() {
    if (isSpinning) return;
    isSpinning = true;
    const wheel = document.getElementById('wheel');
    const btn = document.getElementById('roll-btn');
    const resDiv = document.getElementById('roll-result');
    
    btn.innerText = "Крутим...";
    resDiv.innerText = "";
    
    try {
        const res = await fetch(`${API_URL}/api/roll`, { method: 'POST', headers: { "X-Telegram-Init-Data": tg.initData } });
        const data = await res.json();
        
        if (data.status === 'ok') {
            let targetDeg = 0;
            if (data.amount === 1) targetDeg = 360 - 45;
            if (data.amount === 2) targetDeg = 360 - 225;
            if (data.amount === 3) targetDeg = 360 - 135;
            
            const randomOffset = Math.floor(Math.random() * 40) - 20;
            wheel.style.transform = `rotate(${1440 + targetDeg + randomOffset}deg)`;
            
            setTimeout(() => {
                resDiv.innerText = `🎉 Вы выиграли: ${data.prize}`;
                resDiv.style.color = "#ffd700";
                btn.innerText = "Крутить";
                isSpinning = false;
                loadData();
            }, 4000);
        } else {
            resDiv.innerText = `❌ ${data.error}`;
            resDiv.style.color = "#ff4444";
            btn.innerText = "Крутить";
            isSpinning = false;
        }
    } catch(e) {
        resDiv.innerText = "Ошибка сервера";
        btn.innerText = "Крутить";
        isSpinning = false;
    }
}

async function buyCase(type) {
    const price = type === 'normal' ? 99 : 249;
    tg.showConfirm(`Купить ${type === 'normal' ? 'обычный' : 'VIP'} кейс за ${price} ₽?`, async (confirmed) => {
        if (!confirmed) return;
        try {
            const res = await fetch(`${API_URL}/api/case/buy`, {
                method: 'POST',
                headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" },
                body: JSON.stringify({ type: type })
            });
            const data = await res.json();
            tg.showAlert(data.message || data.error);
            loadData();
        } catch(e) { tg.showAlert("Ошибка сервера"); }
    });
}

async function openCase(type) {
    const animDiv = document.getElementById('case-animation');
    const itemsContainer = document.getElementById('case-items-container');
    const prizeText = document.getElementById('case-prize-text');
    
    animDiv.style.display = 'flex';
    prizeText.innerText = "";
    itemsContainer.innerHTML = "";
    itemsContainer.style.transition = "none";
    itemsContainer.style.transform = "translateX(0)";
    
    const icons = ['🇺🇸', '🇨🇦', '💰', '🎁', '🇬🇧', '🇩🇪', '🇫🇷', '🇵🇱'];
    for (let i = 0; i < 40; i++) {
        const el = document.createElement('div');
        el.className = 'case-item';
        el.innerText = icons[Math.floor(Math.random() * icons.length)];
        itemsContainer.appendChild(el);
    }

    try {
        const res = await fetch(`${API_URL}/api/case/open`, {
            method: 'POST',
            headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" },
            body: JSON.stringify({ type: type })
        });
        const data = await res.json();
        
        if (data.status === 'ok') {
            setTimeout(() => {
                const randomStop = Math.floor(Math.random() * (30 - 10) + 10);
                const moveX = -(randomStop * 90) + 150; 
                itemsContainer.style.transition = "transform 4s cubic-bezier(0.1, 0.8, 0.1, 1)";
                itemsContainer.style.transform = `translateX(${moveX}px)`;
                
                setTimeout(() => {
                    let prizeStr = "";
                    if (data.prize.type === 'money') prizeStr = `🎉 Вы выиграли: ${data.prize.value}`;
                    if (data.prize.type === 'promo') prizeStr = `🎉 Выиграли: ${data.prize.value}\nКод: ${data.prize.code}`;
                    if (data.prize.type === 'account') prizeStr = `🎉 Выиграли: ${data.prize.value}\n\nНапишите в поддержку!`;
                    
                    prizeText.innerText = prizeStr;
                    tg.showAlert(prizeStr);
                    loadData();
                    
                    setTimeout(() => {
                        animDiv.style.display = 'none';
                    }, 3000);
                }, 4200);
            }, 100);
        } else {
            tg.showAlert(data.error);
            animDiv.style.display = 'none';
        }
    } catch(e) {
        tg.showAlert("Ошибка сервера");
        animDiv.style.display = 'none';
    }
}
async function createTicket() {
    const text = document.getElementById('ticket-input').value.trim();
    if(!text) return tg.showAlert("Напишите вопрос!");
    
    const res = await fetch(`${API_URL}/api/ticket/create`, {
        method: 'POST',
        headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" },
        body: JSON.stringify({ question: text })
    });
    const data = await res.json();
    tg.showAlert(data.message || data.error);
    if(data.status === 'ok') {
        document.getElementById('ticket-input').value = "";
        loadData();
    }
}

function renderTickets(tickets) {
    const list = document.getElementById('ticket-list');
    const adminList = document.getElementById('admin-ticket-list');
    
    if (isAdmin) {
        adminList.innerHTML = tickets.length > 0 ? tickets.map(t => `
            <div class="purchase-item" style="background:rgba(0,210,255,0.1); border-color:#00d2ff;">
                <div style="font-weight:bold; color:#fff; margin-bottom:5px;">От: @${t.username} (ID: ${t.user_id})</div>
                <div style="color:#ddd; margin-bottom:10px;">${t.question}</div>
                <button class="buy-btn" style="padding:5px; background:#00d2ff; animation:none;" onclick="replyTicket(${t.id})">Ответить</button>
            </div>
        `).join('') : '<div style="color:#888;">Нет новых тикетов.</div>';
    } else {
        list.innerHTML = tickets.length > 0 ? tickets.map(t => `
            <div class="purchase-item">
                <div style="color:#888; font-size:11px; margin-bottom:5px;">Ваш вопрос: ${t.question}</div>
                <div style="font-weight:bold; color:${t.answer ? '#00d2ff' : '#ffd700'};">
                    ${t.answer ? `Ответ: ${t.answer}` : 'Ожидает ответа...'}
                </div>
            </div>
        `).join('') : '';
    }
}

async function replyTicket(id) {
    const answer = prompt("Введите ответ для пользователя:");
    if(!answer) return;
    const res = await fetch(`${API_URL}/api/ticket/reply`, {
        method: 'POST',
        headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: id, answer: answer })
    });
    const data = await res.json();
    tg.showAlert(data.message || data.error);
    loadData();
}

async function adminAction(action) {
    const resDiv = document.getElementById('admin-result');
    resDiv.innerText = "Загрузка...";
    
    if (action === 'money') {
        const amount = prompt("Сколько рублей выдать?");
        if (!amount) { resDiv.innerText = ""; return; }
        const res = await fetch(`${API_URL}/api/admin/money`, { method: 'POST', headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" }, body: JSON.stringify({ amount: parseFloat(amount) }) });
        const data = await res.json();
        resDiv.innerText = data.message || data.error;
        loadData();
    }
    if (action === 'promo') {
        const code = prompt("Название промокода (например, HALLOWEEN):");
        if (!code) { resDiv.innerText = ""; return; }
        const disc = prompt("Скидка от 5 до 80 (%):");
        const limit = prompt("Лимит активаций:");
        const res = await fetch(`${API_URL}/api/admin/promo`, { method: 'POST', headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" }, body: JSON.stringify({ code: code, discount: parseInt(disc), limit: parseInt(limit) }) });
        const data = await res.json();
        resDiv.innerText = data.message || data.error;
    }
    if (action === 'stock') {
        let list = "Введите код страны:\n";
        accountsData.forEach(i => list += `${i.code} - ${i.name}\n`);
        const country = prompt(list);
        if (!country) { resDiv.innerText = ""; return; }
        const amount = prompt(`Сколько штук добавить для ${country}?`);
        const res = await fetch(`${API_URL}/api/admin/stock`, { method: 'POST', headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" }, body: JSON.stringify({ country: country.toLowerCase(), amount: parseInt(amount) }) });
        const data = await res.json();
        resDiv.innerText = data.message || data.error;
        loadData();
    }
}

function openInfo(type) {
    if (type === 'promo') {
        document.getElementById('info-title').innerText = "🎁 Промокод";
        const contentDiv = document.getElementById('info-content');
        contentDiv.innerHTML = `
            <p>Введите ваш промокод ниже, чтобы получить скидку:</p>
            <input type="text" id="promo-input" placeholder="Ваш код..." style="width:100%; padding:15px; border-radius:10px; border:1px solid #333; background:rgba(255,255,255,0.05); color:white; margin-bottom:15px; text-transform: uppercase;">
            <button class="info-btn" onclick="activatePromo()">Активировать</button>
        `;
        showScreen('screen-info');
        return;
    }
    
    const infoTexts = {
        reviews: { title: "⭐ Отзывы", text: "<p>Почитай отзывы наших клиентов или оставь свой в нашем канале!</p>", btn: "Перейти в канал", action: "https://t.me/sciptyyrewievs" },
        about: { title: "ℹ️ О нас", text: "<p>Sciptyy Store — это <b>самый лучший магазин</b> качественных аккаунтов Telegram.</p><p>✅ Работаем 24/7 без выходных.<br>✅ Мгновенная авто-выдача.<br>✅ Работаем без обмана и скрытых комиссий.</p><p>Нам доверяют сотни клиентов!</p>", btn: "Назад", action: "back" },
        terms: { title: "📜 Соглашение", text: "<p>Покупая товар в нашем магазине, вы автоматически соглашаетесь со всеми правилами Telegram и нашего бота.</p><p>Вы действуете <b>добровольно</b> и на свой страх и риск. Мы гарантируем качество товара, но не несем ответственности за дальнейшее использование аккаунтов.</p><p>Мы ничего не нарушаем и работаем строго по правилам.</p>", btn: "Назад", action: "back" },
        privacy: { title: "📄 Политика", text: "<p>Мы ценим вашу конфиденциальность.</p><p>Бот собирает только ваш ID и username для выдачи товаров и работы реферальной системы.</p><p>Ваши данные <b>защищены</b> и никогда не передаются третьим лицам. Мы не нарушаем законы и правила Telegram.</p>", btn: "Назад", action: "back" }
    };
    const data = infoTexts[type];
    document.getElementById('info-title').innerText = data.title;
    const contentDiv = document.getElementById('info-content');
    contentDiv.innerHTML = data.text;
    const btn = document.createElement('button');
    btn.className = 'info-btn';
    btn.innerText = data.btn;
    if(data.action === 'back') btn.onclick = () => showScreen('screen-main');
    else btn.onclick = () => {
        if (data.action.startsWith('http')) window.open(data.action, '_blank');
        else {
            tg.openTelegramLink(`https://t.me/sciptyy_storebot?start=${data.action}`);
            tg.close();
        }
    };
    contentDiv.appendChild(btn);
    showScreen('screen-info');
}

async function activatePromo() {
    const code = document.getElementById('promo-input').value.trim().toUpperCase();
    if (!code) return tg.showAlert("Введите код!");
    try {
        const res = await fetch(`${API_URL}/api/promo`, {
            method: 'POST',
            headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" },
            body: JSON.stringify({ code: code })
        });
        const data = await res.json();
        if (data.status === 'ok') {
            tg.showAlert(`✅ ${data.message}`);
            loadData();
        } else {
            tg.showAlert(`❌ ${data.error}`);
        }
    } catch(e) { tg.showAlert("Ошибка сервера"); }
}

function showTopupModal() { document.getElementById('modal-topup').style.display = 'flex'; }
function closeTopup() { document.getElementById('modal-topup').style.display = 'none'; }

async function topupBalance() {
    const amount = parseFloat(document.getElementById('topup-amount').value);
    if (!amount || amount < 50) return tg.showAlert("Минимум 50 ₽");
    closeTopup();
    tg.showAlert("Создаем счет...");
    try {
        const res = await fetch(`${API_URL}/api/topup`, {
            method: 'POST',
            headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" },
            body: JSON.stringify({ amount: amount })
        });
        const data = await res.json();
        if (data.url) tg.openLink(data.url);
        else tg.showAlert("Ошибка: " + data.error);
    } catch(e) { tg.showAlert("Ошибка сервера"); }
}

loadData();
