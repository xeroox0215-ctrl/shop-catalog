const tg = window.Telegram?.WebApp;
if (tg) tg.expand();
const API_URL = "https://sciptyy-api.onrender.com";

// Скрываем заставку сразу, чтобы она не перекрывала экран
if (document.getElementById('splash-screen')) {
    document.getElementById('splash-screen').style.display = 'none';
}

let userProfile = { balance: 0, cases: 0, vip_cases: 0, discount: 0 };
let accountsData = []; 
let myAccounts = []; 
let selectedCountry = null; 
let isAdmin = false;
let upgradeSlot1 = null; 
let upgradeSlot2 = null;

async function loadData() {
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const u = tg.initDataUnsafe.user;
        document.getElementById('user-name').innerText = u.first_name;
        document.getElementById('user-id').innerText = `ID: ${u.id}`;
        const avatar = document.getElementById('user-avatar');
        if (u.photo_url) { avatar.style.backgroundImage = `url('${u.photo_url}')`; avatar.innerText = ''; }
        else { avatar.innerText = u.first_name.charAt(0).toUpperCase(); }
    }
    try {
        const res = await fetch(`${API_URL}/api/profile`, { headers: { "X-Telegram-Init-Data": tg.initData } });
        const data = await res.json();
        if (data.status === "ok") {
            userProfile = data.profile; 
            accountsData = data.shop; 
            myAccounts = data.my_accounts || []; 
            isAdmin = data.is_admin;
            
            if (isAdmin) { 
                document.getElementById('admin-btn').style.display = 'block'; 
                document.getElementById('admin-tickets-btn').style.display = 'block'; 
            }
            if (userProfile.cases > 0) document.getElementById('open-normal-case').style.display = 'block';
            if (userProfile.vip_cases > 0) document.getElementById('open-vip-case').style.display = 'block';
            
            document.getElementById('profile-balance').innerText = `${userProfile.balance.toFixed(2)} ₽`;
            
            const pDiv = document.getElementById('profile-purchases');
            pDiv.innerHTML = data.purchases.length > 0 ? data.purchases.map(p => `
                <div class="purchase-item">
                    <div style="font-weight: bold; color: #00d2ff;">${p.name}</div>
                    <div style="color: #888;">${p.price} ₽ • ${p.date.split(' ')[0]} • <span style="color:#aaa;">Заказ #${p.id}</span></div>
                </div>`).join('') : '<div style="color:#888;">Покупок нет</div>';
            renderTickets(data.tickets);
        }
    } catch(e) { console.log(e); }
}

async function loadEvents() {
    try {
        const res = await fetch(`${API_URL}/api/events`);
        const data = await res.json();
        const track = document.getElementById('ticker-track');
        if (data.status === 'ok' && data.events.length > 0) track.innerText = data.events.join('  •  ') + '  •  ';
        else track.innerText = "Добро пожаловать в Sciptyy Store!  •  ";
    } catch(e) {}
}
setInterval(loadEvents, 10000); loadEvents();

async function loadNews() {
    const container = document.getElementById('news-container');
    if(!container) return;
    try {
        const res = await fetch(`${API_URL}/api/news`);
        const data = await res.json();
        if (data.status === 'ok' && data.news.length > 0) {
            container.innerHTML = data.news.map(n => `
                <div class="news-card">
                    <div class="news-image" style="background: linear-gradient(135deg, #2a0845, #6441A5, #ff416c); position: relative; overflow: hidden;">
                        <div style="position:absolute; top:0; left:0; width:100%; height:100%; background: url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path d=\"M0,0 L100,100 M0,20 L80,100 M20,0 L100,80 M0,50 L50,100 M50,0 L100,50 M0,0 Q50,0 100,50 Q50,100 0,50\" stroke=\"rgba(255,255,255,0.1)\" fill=\"none\" stroke-width=\"1\"/></svg>'); background-size: cover;"></div>
                        <h3 style="color:#fff; text-align:center; font-weight:900; position:relative; z-index:2; text-shadow: 0 2px 10px rgba(0,0,0,0.8);">НОВОСТИ<br><span style="font-size:12px; color:#ffd700;">Sciptyy Store</span></h3>
                    </div>
                    <div class="news-content" style="padding:15px;">
                        <div style="font-size:10px; color:#00d2ff; font-weight:bold; margin-bottom:5px;">${n.date}</div>
                        <h3 style="color:#fff; margin-bottom:10px; font-family:Unbounded;">${n.title}</h3>
                        <p style="color:#ccc; font-size:12px; line-height:1.6; font-family:Unbounded; white-space: pre-wrap;">${n.text}</p>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div style="color:#888; text-align:center; margin-top:20px;">Новостей пока нет.</div>';
        }
    } catch(e) { container.innerHTML = '<div style="color:#ff4444; text-align:center;">Ошибка загрузки новостей.</div>'; }
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    const screensMap = {
        'screen-main': 0, 'screen-cases': 1, 'screen-roll': 2, 'screen-profile': 3, 'screen-news': 4
    };
    if (screensMap[id] !== undefined) {
        const navItems = document.querySelectorAll('.nav-item');
        if(navItems[screensMap[id]]) navItems[screensMap[id]].classList.add('active');
    }

    if(id === 'screen-profile' || id === 'screen-main' || id === 'screen-admin-tickets') loadData();
    if(id === 'screen-chat') loadChat();
    if(id === 'screen-news') loadNews();
}
function openCatalog() {
    const grid = document.getElementById('catalog-grid');
    grid.innerHTML = '';
    accountsData.forEach(item => {
        const stockColor = item.stock > 0 ? '#00d2ff' : '#ff4444';
        const stockText = item.stock > 0 ? `В наличии: ${item.stock}` : 'Нет в наличии';
        grid.innerHTML += `<div class="product-card"><div class="product-name">${item.name}</div><div class="product-price">${item.price} ₽</div><div style="color:${stockColor}; font-size:11px; margin-bottom:5px;">${stockText}</div><button class="buy-btn" ${item.stock <= 0 ? 'disabled' : ''} onclick="openModal('${item.code}', '${item.name}', ${item.price}, ${item.stock})">Купить</button></div>`;
    });
    showScreen('screen-catalog');
}

function openModal(code, name, price, stock) {
    if(stock <= 0) return;
    selectedCountry = code;
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
                method: 'POST', headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" },
                body: JSON.stringify({ country: selectedCountry })
            });
            const data = await res.json();
            if (data.status === 'ok') {
                tg.openInvoice(data.url, (status) => {
                    if (status === 'paid') { tg.showAlert("✅ Оплачено звездами!"); loadData(); }
                });
            } else { tg.showAlert(`❌ ${data.error}`); }
        } catch(e) { tg.showAlert("Ошибка сервера"); }
        return;
    }
    tg.showAlert("Списываем средства...");
    try {
        const res = await fetch(`${API_URL}/api/buy`, {
            method: 'POST', headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" },
            body: JSON.stringify({ country: selectedCountry, method: "balance" })
        });
        const data = await res.json();
        if (data.status === 'ok') { tg.showAlert(`✅ ${data.message}`); loadData(); loadEvents(); }
        else { tg.showAlert(`❌ ${data.error}`); }
    } catch(e) { tg.showAlert("Ошибка сервера"); }
}

let currentWheelDeg = 0;
let isSpinning = false;

async function spinWheel() {
    if (isSpinning) return;
    isSpinning = true;
    const wheel = document.getElementById('wheel');
    const btn = document.getElementById('roll-btn');
    const resDiv = document.getElementById('roll-result');
    btn.innerText = "Крутим..."; resDiv.innerText = "";
    wheel.style.boxShadow = "0 0 50px #00d2ff, inset 0 0 50px #00d2ff";
    try {
        const res = await fetch(`${API_URL}/api/roll`, { method: 'POST', headers: { "X-Telegram-Init-Data": tg.initData } });
        const data = await res.json();
        if (data.status === 'ok') {
            let targetDeg = 0;
            if (data.amount === 1) targetDeg = 360 - 45;
            if (data.amount === 2) targetDeg = 360 - 225;
            if (data.amount === 3) targetDeg = 360 - 135;
            
            const randomOffset = Math.floor(Math.random() * 40) - 20;
            
            // Накопление угла (чтобы колесо всегда крутилось вперед)
            currentWheelDeg += 1440 + targetDeg + randomOffset;
            wheel.style.transform = `rotateX(20deg) rotate(${currentWheelDeg}deg)`;
            
            setTimeout(() => {
                resDiv.innerText = `🎉 Вы выиграли: ${data.prize}`;
                resDiv.style.color = "#ffd700";
                btn.innerText = "Крутить";
                isSpinning = false;
                loadData();
            }, 4000);
        } else { 
            resDiv.innerText = `❌ ${data.error}`; resDiv.style.color = "#ff4444"; btn.innerText = "Крутить"; isSpinning = false; 
        }
    } catch(e) { resDiv.innerText = "Ошибка"; btn.innerText = "Крутить"; isSpinning = false; }
}

async function buyCase(type) {
    const price = type === 'normal' ? 99 : 249;
    tg.showConfirm(`Купить кейс за ${price} ₽?`, async (confirmed) => {
        if (!confirmed) return;
        try {
            const res = await fetch(`${API_URL}/api/case/buy`, {
                method: 'POST', headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" },
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
    const track = document.getElementById('roulette-track');
    const winContainer = document.getElementById('win-card-container');
    const winContent = document.getElementById('win-card-content');
    const prizeText = document.getElementById('case-prize-text');
    animDiv.style.display = 'block'; winContainer.style.display = 'none';
    track.style.transition = 'none'; track.style.transform = 'translateX(0)'; track.innerHTML = '';
    try {
        const res = await fetch(`${API_URL}/api/case/open`, {
            method: 'POST', headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" },
            body: JSON.stringify({ type: type })
        });
        const data = await res.json();
        if (data.status === 'ok') {
            const winIndex = 25; let itemsHTML = '';
            for (let i = 0; i < 30; i++) {
                if (i === winIndex) {
                    if (data.prize.type === 'money') itemsHTML += `<div class="roulette-item money">💰<br>${data.prize.value}</div>`;
                    else if (data.prize.type === 'promo') itemsHTML += `<div class="roulette-item promo">🎁<br>Скидка</div>`;
                    else itemsHTML += `<div class="roulette-item account">🌍<br>${data.prize.value}</div>`;
                } else {
                    const rnd = Math.random();
                    if (rnd < 0.4) itemsHTML += `<div class="roulette-item money">💰<br>Рубли</div>`;
                    else if (rnd < 0.7) itemsHTML += `<div class="roulette-item promo">🎁<br>Промо</div>`;
                    else itemsHTML += `<div class="roulette-item account">🌍<br>Аккаунт</div>`;
                }
            }
            track.innerHTML = itemsHTML;
            setTimeout(() => {
                track.style.transition = 'transform 5s cubic-bezier(0.1, 0.8, 0.1, 1)';
                const finalX = -((winIndex * 100) - (window.innerWidth / 2) + 45);
                track.style.transform = `translateX(${finalX}px)`;
                setTimeout(() => {
                    let prizeStr = "";
                    if (data.prize.type === 'money') prizeStr = `<div style="text-align:center; font-size:18px; color:#00d2ff; margin-top:10px;">Вы выиграли <b>${data.prize.value}</b>!</div>`;
                    if (data.prize.type === 'promo') prizeStr = `<div style="text-align:center; font-size:14px; margin-top:10px;">Промокод:<br><b style="font-size:20px; color:#ffd700;">${data.prize.code}</b></div>`;
                    if (data.prize.type === 'account') prizeStr = `<div style="text-align:center; font-size:16px; margin-top:10px;">Аккаунт <b>${data.prize.value}</b><br><span style="font-size:11px; color:#aaa;">Напишите в поддержку!</span></div>`;
                    winContent.innerHTML = `<div style="font-size:50px; text-align:center;">🎁</div><div style="font-size:18px; font-weight:900; color:#ffd700; text-align:center; margin-top:10px;">ПОЗДРАВЛЯЕМ!</div>`;
                    prizeText.innerHTML = prizeStr;
                    winContainer.style.display = 'flex';
                    tg.showAlert("Приз получен!");
                    loadData(); loadEvents();
                }, 5200); 
            }, 100);
        } else { tg.showAlert(data.error); animDiv.style.display = 'none'; }
    } catch(e) { tg.showAlert("Ошибка сервера"); animDiv.style.display = 'none'; }
}
function selectSlot(slotNum) {
    if(myAccounts.length === 0) return tg.showAlert("У вас нет аккаунтов для апгрейда.");
    let msg = `Слот ${slotNum}. Введите номер аккаунта из списка (1-${myAccounts.length}):\n\n`;
    myAccounts.forEach((acc, i) => msg += `${i + 1}. ${acc}\n`);
    
    askPrompt(msg, "", (choice) => {
        if(!choice) return;
        const acc = myAccounts[parseInt(choice) - 1];
        if(!acc) return tg.showAlert("Неверный номер.");
        
        tg.showConfirm(`Поставить "${acc}" в слот ${slotNum}?`, (confirmed) => {
            if(!confirmed) return;
            if(slotNum === 1) { 
                upgradeSlot1 = acc; 
                document.getElementById('slot-1').innerHTML = `<div style="font-size:12px; color:#ffd700; text-align:center;">${acc}</div>`; 
                document.getElementById('slot-1').classList.add('filled'); 
            } else { 
                upgradeSlot2 = acc; 
                document.getElementById('slot-2').innerHTML = `<div style="font-size:12px; color:#ffd700; text-align:center;">${acc}</div>`; 
                document.getElementById('slot-2').classList.add('filled'); 
            }
            checkUpgrade();
        });
    });
}

function checkUpgrade() {
    const btn = document.getElementById('upgrade-btn');
    if(upgradeSlot1 && upgradeSlot2 && upgradeSlot1 === upgradeSlot2) {
        btn.disabled = false; btn.style.opacity = '1'; btn.style.background = 'linear-gradient(90deg, #00d2ff, #0052ff)'; btn.style.cursor = 'pointer';
    } else { 
        btn.disabled = true; btn.style.opacity = '0.5'; btn.style.background = '#333'; btn.style.cursor = 'not-allowed'; 
    }
}

async function startUpgrade() {
    tg.showConfirm("Вы уверены? Аккаунты могут сгореть!", async (confirmed) => {
        if(!confirmed) return;
        tg.showAlert("Апгрейд запущен...");
        try {
            const res = await fetch(`${API_URL}/api/upgrade`, {
                method: 'POST', headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" },
                body: JSON.stringify({ acc1: upgradeSlot1, acc2: upgradeSlot2 })
            });
            const data = await res.json();
            if(data.status === 'ok') {
                tg.showAlert(data.success ? `🎉 ${data.message}` : `😢 ${data.message}`);
                upgradeSlot1 = null; upgradeSlot2 = null;
                document.getElementById('slot-1').innerHTML = '<div style="font-size:30px; margin-bottom:10px;">➕</div><div style="font-size:12px; color:#888;">Аккаунт 1</div>';
                document.getElementById('slot-2').innerHTML = '<div style="font-size:30px; margin-bottom:10px;">➕</div><div style="font-size:12px; color:#888;">Аккаунт 2</div>';
                document.getElementById('slot-1').classList.remove('filled'); document.getElementById('slot-2').classList.remove('filled');
                checkUpgrade(); loadData();
            } else { tg.showAlert(`❌ ${data.error}`); }
        } catch(e) { tg.showAlert("Ошибка сервера"); }
    });
}

async function loadChat() {
    try {
        const res = await fetch(`${API_URL}/api/chat`, { headers: { "X-Telegram-Init-Data": tg.initData } });
        const data = await res.json();
        if(data.status === 'ok') {
            const chatBox = document.getElementById('chat-messages');
            chatBox.innerHTML = data.messages.map(m => `
                <div class="chat-msg ${m.user_id === tg.initDataUnsafe.user.id ? 'mine' : 'other'}">
                    <div class="chat-author">${m.username}</div><div>${m.text}</div>
                </div>`).join('');
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    } catch(e) {}
}
setInterval(() => { if(document.getElementById('screen-chat').classList.contains('active')) loadChat(); }, 5000);

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if(!text) return;
    input.value = "";
    await fetch(`${API_URL}/api/chat`, { method: 'POST', headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" }, body: JSON.stringify({ text: text }) });
    loadChat();
}

async function createTicket() {
    const text = document.getElementById('ticket-input').value.trim();
    if(!text) return tg.showAlert("Напишите вопрос!");
    const res = await fetch(`${API_URL}/api/ticket/create`, { method: 'POST', headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" }, body: JSON.stringify({ question: text }) });
    const data = await res.json();
    tg.showAlert(data.message || data.error);
    if(data.status === 'ok') { document.getElementById('ticket-input').value = ""; loadData(); }
}

function renderTickets(tickets) {
    const adminList = document.getElementById('admin-ticket-list');
    const list = document.getElementById('ticket-list');
    if (isAdmin) {
        adminList.innerHTML = tickets.length > 0 ? tickets.map(t => `<div class="purchase-item"><div>@${t.username}: ${t.question}</div><button class="buy-btn" style="padding:5px; background:#00d2ff; animation:none;" onclick="replyTicket(${t.id})">Ответить</button></div>`).join('') : 'Нет новых тикетов.';
    } else {
        list.innerHTML = tickets.map(t => `<div class="purchase-item"><div>${t.question}</div><div style="font-weight:bold; color:${t.answer ? '#00d2ff' : '#ffd700'};">${t.answer ? 'Ответ: '+t.answer : 'Ожидает...'}</div></div>`).join('');
    }
}

function replyTicket(id) {
    askPrompt("Введите ответ на тикет:", "", async (answer) => {
        if(!answer) return;
        const res = await fetch(`${API_URL}/api/ticket/reply`, { method: 'POST', headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" }, body: JSON.stringify({ ticket_id: id, answer: answer }) });
        const data = await res.json(); tg.showAlert(data.message || data.error); loadData();
    });
}

function adminAction(action) {
    const resDiv = document.getElementById('admin-result');
    resDiv.innerText = "";
    
    if (action === 'money') { 
        askPrompt("Сколько рублей выдать?", "", async (amount) => {
            if (!amount) return;
            resDiv.innerText = "Загрузка...";
            const res = await fetch(`${API_URL}/api/admin/money`, { method: 'POST', headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" }, body: JSON.stringify({ amount: parseFloat(amount) }) }); 
            const data = await res.json(); resDiv.innerText = data.message || data.error; loadData(); 
        });
    }
    if (action === 'promo') { 
        askPrompt("Название промокода:", "", (code) => {
            if (!code) return;
            askPrompt("Скидка (%):", "", (disc) => {
                askPrompt("Лимит активаций:", "", async (limit) => {
                    resDiv.innerText = "Загрузка...";
                    const res = await fetch(`${API_URL}/api/admin/promo`, { method: 'POST', headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" }, body: JSON.stringify({ code, discount: parseInt(disc), limit: parseInt(limit) }) }); 
                    const data = await res.json(); resDiv.innerText = data.message || data.error; 
                });
            });
        });
    }
    if (action === 'stock') { 
        let list = "Код страны:\n"; 
        accountsData.forEach(i => list += `${i.code} - ${i.name}\n`); 
        askPrompt(list, "", (country) => {
            if (!country) return;
            askPrompt(`Сколько штук для ${country}?`, "", async (amount) => {
                resDiv.innerText = "Загрузка...";
                const res = await fetch(`${API_URL}/api/admin/stock`, { method: 'POST', headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" }, body: JSON.stringify({ country: country.toLowerCase(), amount: parseInt(amount) }) }); 
                const data = await res.json(); resDiv.innerText = data.message || data.error; loadData(); 
            });
        });
    }
    if (action === 'broadcast') { 
        askPrompt("Текст рассылки:", "", async (text) => {
            if (!text) return;
            resDiv.innerText = "Загрузка...";
            const res = await fetch(`${API_URL}/api/admin/broadcast`, { method: 'POST', headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" }, body: JSON.stringify({ text: text, minutes: 60 }) }); 
            const data = await res.json(); resDiv.innerText = data.message || data.error; loadEvents(); 
        });
    }
    if (action === 'news') {
        askPrompt("Заголовок новости:", "Обновление Sciptyy Store", (title) => {
            if (!title) return;
            askPrompt("Текст новости:", "", async (text) => {
                if (!text) return;
                resDiv.innerText = "Публикация...";
                const res = await fetch(`${API_URL}/api/admin/news`, { method: 'POST', headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" }, body: JSON.stringify({ title: title, text: text }) });
                const data = await res.json(); resDiv.innerText = data.message || data.error;
                if(data.status === 'ok') loadNews();
            });
        });
    }
}

async function clearEvents() {
    const resDiv = document.getElementById('admin-result'); resDiv.innerText = "Очистка...";
    try { const res = await fetch(`${API_URL}/api/admin/clear_events`, { method: 'POST', headers: { "X-Telegram-Init-Data": tg.initData } }); const data = await res.json(); resDiv.innerText = data.message || data.error; loadEvents(); } catch(e) { resDiv.innerText = "Ошибка"; }
}
function openInfo(type) {
    if (type === 'promo') {
        document.getElementById('info-title').innerText = "🎁 Промокод";
        document.getElementById('info-content').innerHTML = `<p>Введите код:</p><input type="text" id="promo-input" placeholder="Код..." style="width:100%; padding:15px; border-radius:10px; border:1px solid #333; background:rgba(255,255,255,0.05); color:white; margin-bottom:15px; text-transform: uppercase;"><button class="info-btn" onclick="activatePromo()">Активировать</button>`;
        showScreen('screen-info'); return;
    }
    const infoTexts = {
        reviews: { title: "⭐ Отзывы", text: "<p>Почитай отзывы наших клиентов или оставь свой в нашем канале!</p><p>Мы ценим каждого покупателя и всегда рады обратной связи. Ваше мнение помогает нам становиться лучше. Все отзывы реальные, без обмана.</p>", btn: "Перейти в канал", action: "https://t.me/sciptyyrewievs" },
        about: { title: "ℹ️ О нас", text: "<p>Sciptyy Store — это <b>самый лучший магазин</b> качественных аккаунтов Telegram.</p><p>✅ Работаем 24/7 без выходных.<br>✅ Мгновенная авто-выдача.<br>✅ Работаем без обмана и скрытых комиссий.</p><p>Нам доверяют сотни клиентов по всему миру!</p>", btn: "Назад", action: "back" },
        terms: { title: "📜 Соглашение", text: "<p>Покупая товар в нашем магазине, вы автоматически соглашаетесь со всеми правилами Telegram и нашего бота.</p><p>Вы действуете <b>добровольно</b> и на свой страх и риск. Мы гарантируем качество товара, но не несем ответственности за дальнейшее использование аккаунтов.</p><p>Возврат средств за цифровые товары не предусмотрен.</p>", btn: "Назад", action: "back" },
        privacy: { title: "📄 Политика", text: "<p>Мы ценим вашу конфиденциальность.</p><p>Бот собирает только ваш ID и имя для отображения в профиле.</p><p>Мы никогда не передаем ваши данные третьим лицам. Все транзакции защищены.</p>", btn: "Назад", action: "back" }
    };
    const data = infoTexts[type];
    document.getElementById('info-title').innerText = data.title;
    document.getElementById('info-content').innerHTML = data.text;
    const btn = document.createElement('button'); btn.className = 'info-btn'; btn.innerText = data.btn;
    if(data.action === 'back') btn.onclick = () => showScreen('screen-main'); else btn.onclick = () => window.open(data.action, '_blank');
    document.getElementById('info-content').appendChild(btn);
    showScreen('screen-info');
}

async function activatePromo() {
    const code = document.getElementById('promo-input').value.trim().toUpperCase();
    if (!code) return tg.showAlert("Введите код!");
    try { const res = await fetch(`${API_URL}/api/promo`, { method: 'POST', headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" }, body: JSON.stringify({ code }) }); const data = await res.json(); tg.showAlert(data.status === 'ok' ? `✅ ${data.message}` : `❌ ${data.error}`); if (data.status === 'ok') loadData(); } catch(e) { tg.showAlert("Ошибка сервера"); }
}

function showTopupModal() { document.getElementById('modal-topup').style.display = 'flex'; }
function closeTopup() { document.getElementById('modal-topup').style.display = 'none'; }
async function topupBalance() {
    const amount = parseFloat(document.getElementById('topup-amount').value);
    if (!amount || amount < 50) return tg.showAlert("Минимум 50 ₽");
    closeTopup(); tg.showAlert("Создаем счет...");
    try { const res = await fetch(`${API_URL}/api/topup`, { method: 'POST', headers: { "X-Telegram-Init-Data": tg.initData, "Content-Type": "application/json" }, body: JSON.stringify({ amount }) }); const data = await res.json(); if (data.url) { tg.openLink(data.url); } else { tg.showAlert("Ошибка: " + data.error); } } catch(e) { tg.showAlert("Ошибка сервера"); }
}

// ================= СИСТЕМА КАСТОМНОГО PROMPT И ЗВУКОВ =================
let promptCallback = null;

function askPrompt(title, defaultValue, callback) {
    document.getElementById('prompt-title').innerText = title;
    const input = document.getElementById('prompt-input');
    input.value = defaultValue || "";
    document.getElementById('custom-prompt').style.display = 'flex';
    promptCallback = callback;
    setTimeout(() => input.focus(), 100);
}

function submitPrompt() {
    const val = document.getElementById('prompt-input').value;
    closePrompt();
    if (promptCallback) promptCallback(val);
}

function closePrompt() {
    document.getElementById('custom-prompt').style.display = 'none';
    promptCallback = null;
}

// Звук при нажатии
function playClickSound() {
    const audio = document.getElementById('click-sound');
    if (audio) {
        audio.currentTime = 0;
        audio.volume = 0.3; // Громкость 30% (поменяй на 0.1, если громко)
        audio.play().catch(e => console.log("Звук заблокирован"));
    }
}

// Навешиваем звук и вибрацию на все кнопки
document.addEventListener('DOMContentLoaded', () => {
    const clickable = document.querySelectorAll('.menu-btn, .buy-btn, .info-btn, .roll-btn, .upgrade-slot, .nav-item');
    clickable.forEach(el => {
        el.addEventListener('click', () => {
            playClickSound();
            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
            }
        });
    });
});

// Глобальный запуск
if (tg) { tg.ready(); loadData(); loadEvents(); setInterval(loadData, 15000); }
