const socket = io();

const loginPage = document.getElementById('login-page');
const mainContent = document.getElementById('main-content');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

const botStatus = document.getElementById('bot-status');
const botUptime = document.getElementById('bot-uptime');
const botMemory = document.getElementById('bot-memory');
const activeUsers = document.getElementById('active-users');
const topCommands = document.getElementById('top-commands');
const chatList = document.getElementById('chat-list');
const chatMessages = document.getElementById('chat-messages');
const currentChatName = document.getElementById('current-chat-name');

let currentView = 'dashboard';
let selectedChatJid = null;

function showView(view, el) {
    currentView = view;
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.getElementById(`${view}-view`).style.display = 'block';
    document.getElementById('view-title').innerText = view.charAt(0).toUpperCase() + view.slice(1);

    document.querySelectorAll('nav.drawer a').forEach(a => a.classList.remove('active'));
    if (el) el.classList.add('active');

    if (view === 'chat') {
        loadChats();
    } else if (view === 'groups') {
        loadGroups();
    }
}

function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        loginPage.style.display = 'none';
        mainContent.style.display = 'block';
        updateStatus();
        updateAnalytics();
    } else {
        loginPage.style.display = 'flex';
        mainContent.style.display = 'none';
    }
}

loginBtn.addEventListener('click', async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.token) {
            localStorage.setItem('token', data.token);
            checkAuth();
        } else {
            alert('Invalid credentials');
        }
    } catch (e) {
        alert('Login failed');
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    checkAuth();
});

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('new_message', (messages) => {
    messages.forEach(msg => {
        if (selectedChatJid === msg.key.remoteJid) {
            appendMessage(msg);
        }
        if (currentView === 'chat') {
            loadChats();
        }
    });
});

async function loadChats() {
    const res = await fetch('/api/chats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const chats = await res.json();
    chatList.innerHTML = chats.map(chat => `
        <div class="row padding clickable border bottom-margin ${selectedChatJid === chat.chatJid ? 'primary-container' : ''}" onclick="selectChat('${chat.chatJid}')">
            <div class="max">
                <div class="bold">${chat.chatJid}</div>
                <div class="small">${chat.lastMessage?.substring(0, 30) || ''}...</div>
            </div>
        </div>
    `).join('');
}

async function loadGroups() {
    const res = await fetch('/api/groups', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const groups = await res.json();
    const groupsList = document.getElementById('groups-list');
    groupsList.innerHTML = groups.map(group => `
        <div class="s12 m6 l4">
            <article>
                <h5>${group.subject}</h5>
                <p class="small">${group.id}</p>
                <p>${group.participants.length} members</p>
                <nav>
                    <button class="border" onclick="mentionEveryone('${group.id}')">Mention All</button>
                </nav>
            </article>
        </div>
    `).join('');
}

async function mentionEveryone(jid) {
    // This would typically be a bot command or a specific API call
    alert('Feature coming soon: Mention Everyone in ' + jid);
}

async function selectChat(jid) {
    selectedChatJid = jid;
    currentChatName.innerText = jid;
    loadChats(); // Update highlight
    const res = await fetch(`/api/messages?jid=${jid}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const messages = await res.json();
    chatMessages.innerHTML = '';
    messages.forEach(appendMessage);
}

function appendMessage(msg) {
    const text = msg.content || (msg.message?.conversation || msg.message?.extendedTextMessage?.text || 'Media Message');
    const sender = msg.senderJid || msg.key?.participant || msg.key?.remoteJid;
    const time = msg.timestamp ? new Date(msg.timestamp * 1000) : new Date(msg.messageTimestamp * 1000);

    const msgDiv = document.createElement('div');
    msgDiv.className = 'padding border bottom-margin surface-container';
    msgDiv.style.maxWidth = '80%';
    msgDiv.style.alignSelf = sender.includes('@s.whatsapp.net') ? 'flex-start' : 'flex-end';

    msgDiv.innerHTML = `
        <div class="small bold">${sender}</div>
        <div>${text}</div>
        <div class="right-align tiny">${time.toLocaleTimeString()}</div>
    `;
    chatMessages.appendChild(msgDiv);
}

async function updateStatus() {
    try {
        const res = await fetch('/api/status', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (res.ok) {
            const data = await res.json();
            botStatus.innerText = data.status;
            botUptime.innerText = Math.floor(data.uptime) + 's';
            botMemory.innerText = Math.round(data.memory.rss / 1024 / 1024) + ' MB';
        } else if (res.status === 401) {
            localStorage.removeItem('token');
            checkAuth();
        }
    } catch (e) {}
}

async function updateAnalytics() {
    try {
        const res = await fetch('/api/analytics', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (res.ok) {
            const data = await res.json();
            activeUsers.innerText = data.activeUsers24h;
            topCommands.innerHTML = data.commandStats.map(c => `
                <div class="row">
                    <div class="max">${c.command}</div>
                    <div class="min">${c.count}</div>
                </div>
            `).join('');
        }
    } catch (e) {}
}

setInterval(() => {
    if (localStorage.getItem('token')) {
        updateStatus();
        updateAnalytics();
    }
}, 5000);

checkAuth();
