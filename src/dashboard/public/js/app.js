const socket = io();

const loginPage = document.getElementById('login-page');
const mainContent = document.getElementById('main-content');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

const botStatus = document.getElementById('bot-status');
const botStatusBadge = document.getElementById('bot-status-badge');
const statusIcon = document.getElementById('status-icon');
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

        // Restore view from hash or default
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        showView(hash);

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

    // Update URL hash
    window.location.hash = view;

    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    viewEl.style.display = 'block';

    const titleMap = {
        'dashboard': 'Dashboard',
        'chat': 'Messages',
        'groups': 'Group Management',
        'osint': 'Intelligence Tools',
        'owner': 'Owner Panel',
        'settings': 'System Settings'
    };
    document.getElementById('view-title').innerText = titleMap[view] || view;

    // Active state for both desktop and mobile nav
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));

    // Find and activate the link
    const navLinks = document.querySelectorAll(`nav a[onclick*="'${view}'"]`);
    navLinks.forEach(link => link.classList.add('active'));

    if (view === 'chat') loadChats();
    else if (view === 'groups') loadGroups();
}
window.showView = showView;

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
        } else alert('Login failed: ' + (data.error || 'Unknown error'));
    } catch (e) {
        alert('Network error');
    }
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
            <i>account_circle</i>
            <div class="max">
                <div class="bold small">${chat.chatJid.split('@')[0]}</div>
                <div class="tiny opacity">${chat.lastMessage?.substring(0, 35) || 'No messages'}</div>
            </div>
            <div class="tiny opacity">${new Date(chat.lastTimestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
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
    const text = msg.content || msg.message?.conversation || msg.message?.extendedTextMessage?.text || '<i>Non-text content</i>';

    const div = document.createElement('div');
    div.className = `chat-bubble ${isMe ? 'sent' : 'received'}`;
    div.innerHTML = `
        <div>${text}</div>
        <div class="tiny right-align opacity" style="margin-top: 4px; font-size: 10px;">
            ${new Date(msg.timestamp * 1000 || msg.messageTimestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendBtn.addEventListener('click', async () => {
    if (!selectedChatJid || !chatInput.value) return;
    const text = chatInput.value;
    chatInput.value = '';

    // Optimistic UI could be added here

    await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ jid: selectedChatJid, text })
    });
});

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
});

// Group Logic
async function loadGroups() {
    const res = await fetch('/api/groups', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const groups = await res.json();
    document.getElementById('groups-list').innerHTML = groups.map(g => `
        <div class="s12 m6 l4">
            <article class="elevate round">
                <div class="row">
                    <i class="large">group</i>
                    <div class="max">
                        <h6>${g.subject}</h6>
                        <p class="tiny opacity">${g.id}</p>
                    </div>
                </div>
                <nav class="right-align">
                    <button class="border round" onclick="showGroupDetails('${g.id}')">Manage</button>
                </nav>
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
            <div class="max">
                <b>${p.id}</b>
                <div class="chip small border">${p.admin || 'member'}</div>
            </div>
            <button class="circle transparent text-red" onclick="groupAction('${jid}', 'kick', ['${p.id}'])"><i>person_remove</i></button>
        </div>
    `).join('');
}
window.showGroupDetails = showGroupDetails;

async function groupAction(jid, action, participants) {
    if (!confirm(`Are you sure you want to ${action}?`)) return;

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
    if (!query) return alert('Please enter a target');

    const resEl = document.getElementById('osint-result');
    resEl.innerHTML += `\n<span style="color: #2196f3;">> .${command} ${query}</span>\n`;
    resEl.scrollTop = resEl.scrollHeight;

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
        const output = data.result || data.error || 'No result returned';
        resEl.innerHTML += output + '\n';
        resEl.scrollTop = resEl.scrollHeight;
    } catch (e) {
        resEl.innerHTML += `<span style="color: var(--error);">Error: ${e.message}</span>\n`;
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
        div.className = log.level;
        div.innerText = `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.msg}`;
        consoleEl.appendChild(div);
        if (consoleEl.childNodes.length > 100) consoleEl.removeChild(consoleEl.firstChild);
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
    try {
        const res = await fetch('/api/status', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        if (res.ok) {
            const data = await res.json();
            botStatus.innerText = data.status.toUpperCase();
            botStatusBadge.innerText = data.status.toUpperCase();

            if (data.status === 'connected') {
                statusIcon.innerText = 'check_circle';
                statusIcon.style.color = '#4caf50';
            } else {
                statusIcon.innerText = 'error';
                statusIcon.style.color = '#f44336';
            }

            botUptime.innerText = formatUptime(data.uptime);
            botMemory.innerText = Math.round(data.memory.rss / 1024 / 1024) + ' MB';
        }
    } catch (e) {
        console.error('Status update failed');
    }
}

function formatUptime(seconds) {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
}

async function updateAnalytics() {
    try {
        const res = await fetch('/api/analytics', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        if (res.ok) {
            const data = await res.json();
            activeUsers.innerText = data.activeUsers24h;
            const statsHtml = data.commandStats.slice(0, 5).map(c => `
                <div class="row padding">
                    <div class="max">${c.command}</div>
                    <div class="bold">${c.count}</div>
                </div>
            `).join('');
            topCommands.innerHTML = statsHtml || '<div class="padding center-align opacity">No recent activity</div>';
        }
    } catch (e) {}
}

async function saveBotSettings() {
    const name = document.getElementById('bot-display-name').value;
    const bio = document.getElementById('bot-bio').value;
    const pfpUrl = document.getElementById('bot-pfp').value;

    const res = await fetch('/api/bot/settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name, bio, pfpUrl })
    });

    if (res.ok) alert('Settings saved successfully');
    else alert('Failed to save settings');
}
window.saveBotSettings = saveBotSettings;

setInterval(() => {
    if (localStorage.getItem('token')) {
        updateStatus();
    }
}, 5000);

setInterval(() => {
    if (localStorage.getItem('token')) {
        updateAnalytics();
    }
}, 30000);

checkAuth();
