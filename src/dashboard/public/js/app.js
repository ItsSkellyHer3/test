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
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const currentChatName = document.getElementById('current-chat-name');

let currentView = 'dashboard';
let selectedChatJid = null;

function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        loginPage.style.display = 'none';
        mainContent.style.display = 'block';
        showView('dashboard', document.querySelector('nav.drawer a:nth-child(2)'));
        updateStatus();
        updateAnalytics();
    } else {
        loginPage.style.display = 'flex';
        mainContent.style.display = 'none';
    }
}

function showView(view, el) {
    currentView = view;
    const viewEl = document.getElementById(`${view}-view`);
    if (!viewEl) return;

    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    viewEl.style.display = 'block';
    document.getElementById('view-title').innerText = view.charAt(0).toUpperCase() + view.slice(1);

    document.querySelectorAll('nav.drawer a').forEach(a => a.classList.remove('active'));
    if (el) el.classList.add('active');

    if (view === 'chat') loadChats();
    else if (view === 'groups') loadGroups();
}
window.showView = showView;

loginBtn.addEventListener('click', async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.token) {
        localStorage.setItem('token', data.token);
        checkAuth();
    } else alert('Login failed');
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    checkAuth();
});

// Chat Logic
async function loadChats() {
    const res = await fetch('/api/chats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const chats = await res.json();
    chatList.innerHTML = chats.map(chat => `
        <div class="row padding clickable border-bottom ${selectedChatJid === chat.chatJid ? 'primary-container' : ''}" onclick="selectChat('${chat.chatJid}')">
            <div class="max">
                <div class="bold small">${chat.chatJid.split('@')[0]}</div>
                <div class="tiny opacity">${chat.lastMessage?.substring(0, 30) || ''}</div>
            </div>
        </div>
    `).join('');
}
window.selectChat = selectChat;

async function selectChat(jid) {
    selectedChatJid = jid;
    currentChatName.innerText = jid;
    const res = await fetch(`/api/messages?jid=${jid}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const messages = await res.json();
    chatMessages.innerHTML = '';
    messages.reverse().forEach(appendMessage);
    loadChats();
}

function appendMessage(msg) {
    const isMe = msg.senderJid?.includes('96190322475148') || msg.key?.fromMe;
    const text = msg.content || msg.message?.conversation || msg.message?.extendedTextMessage?.text || 'Media';

    const div = document.createElement('div');
    div.className = `chat-bubble ${isMe ? 'sent' : 'received'}`;
    div.innerHTML = `<div>${text}</div><div class="tiny right-align opacity">${new Date(msg.timestamp * 1000 || msg.messageTimestamp * 1000).toLocaleTimeString()}</div>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendBtn.addEventListener('click', async () => {
    if (!selectedChatJid || !chatInput.value) return;
    const text = chatInput.value;
    chatInput.value = '';
    await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ jid: selectedChatJid, text })
    });
});

// Group Logic
async function loadGroups() {
    const res = await fetch('/api/groups', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const groups = await res.json();
    document.getElementById('groups-list').innerHTML = groups.map(g => `
        <div class="s12 m6 l4">
            <article class="elevate">
                <div class="row">
                    <div class="max"><h6>${g.subject}</h6><p class="tiny">${g.id}</p></div>
                </div>
                <nav><button class="border" onclick="showGroupDetails('${g.id}')">Manage</button></nav>
            </article>
        </div>
    `).join('');
}

async function showGroupDetails(jid) {
    const res = await fetch(`/api/groups/${jid}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const group = await res.json();
    document.getElementById('groups-list').style.display = 'none';
    document.getElementById('group-detail-view').style.display = 'block';
    document.getElementById('detail-group-name').innerText = group.subject;

    document.getElementById('member-list').innerHTML = group.participants.map(p => `
        <div class="row padding border-bottom">
            <div class="max"><b>${p.id}</b><br><span class="tiny">${p.admin || 'member'}</span></div>
            <button class="circle transparent text-red" onclick="groupAction('${jid}', 'kick', ['${p.id}'])"><i>person_remove</i></button>
        </div>
    `).join('');
}
window.showGroupDetails = showGroupDetails;

async function groupAction(jid, action, participants) {
    if (!confirm(`Are you sure you want to ${action} these participants?`)) return;

    const res = await fetch(`/api/groups/${jid}/action`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action, participants })
    });

    if (res.ok) {
        alert('Action successful');
        showGroupDetails(jid);
    } else {
        alert('Action failed');
    }
}
window.groupAction = groupAction;

// OSINT & Owner Console
async function runWebCommand(command) {
    const query = document.getElementById('osint-query').value;
    const resEl = document.getElementById('osint-result');
    resEl.innerText = 'Processing...';

    try {
        const res = await fetch('/api/osint/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ command, query })
        });
        const data = await res.json();
        resEl.innerText = data.result || data.error || 'No result';
    } catch (e) {
        resEl.innerText = 'Error: ' + e.message;
    }
}
window.runWebCommand = runWebCommand;

async function botAction(action) {
    const message = action === 'broadcast' ? prompt('Enter broadcast message:') : null;
    if (action === 'broadcast' && !message) return;

    const res = await fetch('/api/bot/action', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action, message })
    });

    if (res.ok) alert('Action successful');
    else alert('Action failed');
}
window.botAction = botAction;

socket.on('terminal_log', (log) => {
    const consoleEl = document.getElementById('owner-console');
    if (consoleEl) {
        const div = document.createElement('div');
        div.innerText = `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.msg}`;
        consoleEl.appendChild(div);
        consoleEl.scrollTop = consoleEl.scrollHeight;
    }
});

socket.on('new_message', (messages) => {
    messages.forEach(msg => {
        if (selectedChatJid === msg.key.remoteJid) appendMessage(msg);
        if (currentView === 'chat') loadChats();
    });
});

// Periodic updates
async function updateStatus() {
    const res = await fetch('/api/status', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
    if (res.ok) {
        const data = await res.json();
        botStatus.innerText = data.status;
        botUptime.innerText = Math.floor(data.uptime) + 's';
        botMemory.innerText = Math.round(data.memory.rss / 1024 / 1024) + ' MB';
    }
}

async function updateAnalytics() {
    const res = await fetch('/api/analytics', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
    if (res.ok) {
        const data = await res.json();
        activeUsers.innerText = data.activeUsers24h;
        const statsHtml = data.commandStats.map(c => `<div class="row"><div class="max">${c.command}</div><div>${c.count}</div></div>`).join('');
        topCommands.innerHTML = statsHtml;
    }
}

async function saveBotSettings() {
    const name = document.getElementById('bot-display-name').value;
    const bio = document.getElementById('bot-bio').value;

    const res = await fetch('/api/bot/settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name, bio })
    });

    if (res.ok) alert('Settings saved successfully');
    else alert('Failed to save settings');
}
window.saveBotSettings = saveBotSettings;

setInterval(() => { if (localStorage.getItem('token')) { updateStatus(); updateAnalytics(); } }, 5000);
checkAuth();
