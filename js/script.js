import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, getDocs, limit, increment, arrayUnion, arrayRemove, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyAZOVyp3r8rPsLHQDUOHsodNZA6BP_pEh0",
    authDomain: "messagerin.firebaseapp.com",
    projectId: "messagerin",
    storageBucket: "messagerin.firebasestorage.app",
    messagingSenderId: "1071488457159",
    appId: "1:1071488457159:web:56c84b88f196ccbed1a1e2",
    measurementId: "G-WN2SYBQN1W"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ---------- STATE ----------
let ME = null;
let activeChatId = null;
let activeChat = null;
let msgUnsub = null;
let chatsUnsub = null;
let typingUnsub = null;
let actionState = { type: null, id: null };
let viewedUser = null;
let isRoyalDecreeMode = false;
let currentMainTab = 'chats';
let allMyChats = [];
let presenceInterval = null;
let typingTimer = null;
let authReady = false;
let splashDone = false;
let pendingAuthUser = null;
let offlineDetected = false;
let lastMessageDates = {};

const BACKGROUNDS = ['', 'linear-gradient(135deg,#0a090b,#161014)', 'radial-gradient(circle at center, #1a0f13, #060506)', 'linear-gradient(135deg,#06080a,#10161a)', 'linear-gradient(135deg,#120e11,#2b0a11)'];

function $(id) { return document.getElementById(id); }

function toast(t, icon = '') {
    const el = $('toast');
    el.innerHTML = icon + ' <span>' + t + '</span>';
    el.classList.add('show');
    applyAppleEmojis(el);
    setTimeout(() => el.classList.remove('show'), 3500);
}

function esc(s) {
    return (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

function emailFor(u) { return u.toLowerCase() + "@wiriper.app"; }

function initials(name) { return (name || '?').trim().charAt(0).toUpperCase(); }

function timeStr(ts) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function dateStr(ts) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === now.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function privateChatId(a, b) { return [a, b].sort().join('_'); }

function getLastSeenText(timestamp) {
    if (!timestamp) return 'Recently';
    const diff = Date.now() - timestamp.toMillis();
    if (diff < 120000) return 'Online';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' min ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' hr ago';
    return Math.floor(diff / 86400000) + ' days ago';
}

function getLastSeenExactText(timestamp) {
    if (!timestamp) return 'Recently';
    const diff = Date.now() - timestamp.toMillis();
    if (diff < 120000) return 'Online';
    const d = new Date(timestamp.toMillis());
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' Last Ping';
}

// Global outside click handler to fix Dropdown Bug
document.addEventListener('click', (e) => {
    const mainMenu = $('mainMenu');
    const chatMenu = $('chatMenu');
    if (!e.target.closest('#mainMenu') && !e.target.closest('.icon-btn')) {
        if(mainMenu) mainMenu.style.display = 'none';
    }
    if (!e.target.closest('#chatMenu') && !e.target.closest('.icon-btn')) {
        if(chatMenu) chatMenu.style.display = 'none';
    }
});

window.toggleMenu = function(e) {
    e.stopPropagation();
    const m = $('mainMenu');
    const isBlock = m.style.display === 'block';
    document.querySelectorAll('.menu-pop').forEach(el => el.style.display = 'none');
    m.style.display = isBlock ? 'none' : 'block';
};

window.toggleChatMenu = function(e) {
    e.stopPropagation();
    const m = $('chatMenu');
    const isBlock = m.style.display === 'block';
    document.querySelectorAll('.menu-pop').forEach(el => el.style.display = 'none');
    m.style.display = isBlock ? 'none' : 'block';
};

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.menu-pop').forEach(el => el.style.display = 'none');
        if ($('lightbox').classList.contains('show')) closeLightbox();
    }
});

// Emoji Integration via Twemoji (Apple-like consistent rendering)
function applyAppleEmojis(node = document.body) {
    if (window.twemoji) {
        twemoji.parse(node, {
            folder: 'svg',
            ext: '.svg',
            base: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/'
        });
    }
}

// Helper to handle avatar loading seamlessly
function renderAvatar(imgEl, fallbackEl, url, name) {
    if (url) {
        imgEl.src = url;
        imgEl.style.display = 'block';
        if(fallbackEl) fallbackEl.style.display = 'none';
        imgEl.onerror = () => {
            imgEl.style.display = 'none';
            if(fallbackEl) {
                fallbackEl.style.display = 'flex';
                fallbackEl.textContent = initials(name);
            }
        };
    } else {
        imgEl.style.display = 'none';
        if(fallbackEl) {
            fallbackEl.style.display = 'flex';
            fallbackEl.textContent = initials(name);
        }
    }
}

window.showMockModal = function(text) {
    $('mockText').textContent = text;
    let icon = '🚀';
    if (text.includes('Audio') || text.includes('Call')) icon = '📞';
    if (text.includes('Video')) icon = '📹';
    if (text.includes('Quantum') || text.includes('Secure')) icon = '🔒';
    if (text.includes('Voice') || text.includes('Recording')) icon = '🎤';
    $('mockIcon').textContent = icon;
    applyAppleEmojis($('mockIcon'));
    openModal('mockModal');
    setTimeout(() => closeModal('mockModal'), 2500);
};

window.switchTab = function(t) {
    $('tabLogin').classList.toggle('active', t === 'login');
    $('tabReg').classList.toggle('active', t === 'reg');
    $('loginForm').style.display = t === 'login' ? 'block' : 'none';
    $('regForm').style.display = t === 'reg' ? 'block' : 'none';
    $('authMsg').classList.remove('show');
};

function authMsg(t, ok) {
    const m = $('authMsg');
    m.textContent = t;
    m.className = 'auth-msg show ' + (ok ? 'ok' : 'err');
}

// ---------- SPLASH ----------
setTimeout(() => { splashDone = true; checkAndProceed(); }, 2800);
function checkAndProceed() {
    if (!splashDone || !authReady) return;
    if (offlineDetected) {
        $('splashScreen').classList.add('hide');
        $('authScreen').style.display = 'flex';
        $('app').style.display = 'none';
        $('offlineOverlay').classList.add('show');
        return;
    }
    $('splashScreen').classList.add('hide');
    setTimeout(() => {
        if (ME && pendingAuthUser) { enterApp(); }
        else if (!ME && !pendingAuthUser) { $('authScreen').style.display = 'flex'; $('app').style.display = 'none'; }
    }, 500);
}

window.retryConnection = function() {
    offlineDetected = false;
    $('offlineOverlay').classList.remove('show');
    authReady = false;
    pendingAuthUser = null;
    location.reload();
};

// ---------- AUTH ----------
window.doRegister = async function() {
    const name = $('rName').value.trim(), username = $('rUser').value.trim(), pass = $('rPass').value;
    if (!name || !username || !pass) return authMsg('Incomplete criteria');
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return authMsg('Invalid ID format');
    if (pass.length < 6) return authMsg('Passcode too short');
    const uLower = username.toLowerCase();
    try {
        authMsg('Establishing connection...', true);
        const taken = await getDoc(doc(db, 'usernames', uLower));
        if (taken.exists()) return authMsg('Identity ID already claimed');
        const cred = await createUserWithEmailAndPassword(auth, emailFor(username), pass);
        const uid = cred.user.uid;
        await setDoc(doc(db, 'users', uid), { uid, username, usernameLower: uLower, displayName: name, bio: '', photoURL: '', birthDate: '', credits: 500, isPremium: false, receivedGifts: [], giftScore: 0, createdAt: serverTimestamp(), lastOnline: serverTimestamp() });
        await setDoc(doc(db, 'usernames', uLower), { uid });
        authMsg('Identity Established!', true);
    } catch (e) { authMsg('Error: ' + (e.message)); }
};

window.doLogin = async function() {
    const username = $('lUser').value.trim(), pass = $('lPass').value;
    if (!username || !pass) return authMsg('Provide credentials');
    try {
        authMsg('Authenticating...', true);
        await signInWithEmailAndPassword(auth, emailFor(username), pass);
    } catch (e) { authMsg('Verification failed'); }
};

window.doLogout = async function() {
    if (!confirm('Sever network connection?')) return;
    if (presenceInterval) clearInterval(presenceInterval);
    await signOut(auth);
    location.reload();
};

onAuthStateChanged(auth, async function(user) {
    pendingAuthUser = user;
    if (user) {
        try {
            const snap = await getDoc(doc(db, 'users', user.uid));
            if (!snap.exists()) { await signOut(auth); pendingAuthUser = null; }
            else { ME = snap.data(); }
            offlineDetected = false;
        } catch (e) { offlineDetected = true; ME = null; pendingAuthUser = null; toast('Network failure', '❌'); }
    } else {
        ME = null; pendingAuthUser = null;
        $('authScreen').style.display = 'flex';
        $('app').style.display = 'none';
    }
    authReady = true;
    checkAndProceed();
});

async function updatePresence() {
    if (ME) { try { await updateDoc(doc(db, 'users', ME.uid), { lastOnline: serverTimestamp() }); } catch (e) {} }
}

function enterApp() {
    $('authScreen').style.display = 'none';
    $('app').style.display = 'block';
    renderMeHeader();
    subscribeChats();
    updatePresence();
    presenceInterval = setInterval(updatePresence, 60000);
    onSnapshot(doc(db, 'users', ME.uid), function(s) {
        if (s.exists()) { ME = s.data(); renderMeHeader(); }
    });
}

function renderMeHeader() {
    const title = ME.isPremium ? '💠 ' + ME.displayName : ME.displayName;
    $('meName').textContent = title;
    $('meId').textContent = '@' + ME.username;
    
    renderAvatar($('meAvatar'), $('meAvatarFallback'), ME.photoURL, ME.displayName);
    
    if (ME.isPremium) $('meAvatar').style.borderColor = 'var(--color-primary)';
    
    $('btnRoyalDecree').style.display = ME.isPremium ? 'flex' : 'none';
    applyAppleEmojis($('meName'));
}

window.openModal = function(id) { $(id).classList.add('show'); };
window.closeModal = function(id) { $(id).classList.remove('show'); };
window.closeLightbox = function() { $('lightbox').classList.remove('show'); setTimeout(() => $('lightbox').style.display = 'none', 300); };

// ---------- TABS ----------
window.switchMainTab = function(tab) {
    currentMainTab = tab;
    ['tabChats', 'tabDiscover', 'tabLeaders'].forEach(t => $(t).classList.remove('active'));
    $('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
    $('newMenuControls').style.display = tab === 'chats' ? 'flex' : 'none';
    $('globalSearch').parentElement.style.display = (tab === 'chats' || tab === 'discover') ? 'block' : 'none';
    if (tab === 'chats') {
        $('listTitle').textContent = 'Active Links';
        renderChatList(allMyChats);
    } else if (tab === 'discover') {
        $('listTitle').textContent = 'Global Network';
        loadDiscover();
    } else if (tab === 'leaders') {
        $('listTitle').textContent = 'Network Elite';
        loadLeaders();
    }
};

function subscribeChats() {
    const q = query(collection(db, 'chats'), where('members', 'array-contains', ME.uid));
    chatsUnsub = onSnapshot(q, function(snap) {
        allMyChats = [];
        snap.forEach(d => allMyChats.push({ id: d.id, ...d.data() }));
        allMyChats.sort((a, b) => { const ta = a.lastTime?.toMillis?.() || 0, tb = b.lastTime?.toMillis?.() || 0; return tb - ta; });
        if (currentMainTab === 'chats') renderChatList(allMyChats);
        if (activeChatId) {
            const updated = allMyChats.find(c => c.id === activeChatId);
            if (updated) { activeChat = updated; renderChatHeader(); checkJoinStatus(); checkPinnedMsg(); }
        }
    });
}

async function renderChatList(chats, isDiscover = false) {
    const list = $('mainList');
    list.innerHTML = '';
    if (chats.length === 0 && !isDiscover) {
        list.innerHTML = '<div style="padding:40px;text-align:center;color:var(--color-text-muted)"><div style="font-size:56px;margin-bottom:16px;opacity:0.4;">📭</div><div style="font-size:16px;font-weight:600;" class="luxury-font">Void Space</div><div style="font-size:13px;margin-top:8px;">Establish new parameters</div></div>';
        applyAppleEmojis(list);
        return;
    }
    for (const c of chats) {
        if (!c.type || (!c.name && c.type !== 'private')) continue;
        const meta = await chatDisplay(c);
        const div = document.createElement('div');
        div.className = 'chat-item' + (c.id === activeChatId ? ' active' : '');
        div.onclick = () => openChat(c.id, c);
        const tag = c.type === 'group' ? '<span class="tag">Assembly</span>' : c.type === 'channel' ? '<span class="tag">Broadcast</span>' : '';
        const sub = isDiscover ? c.members.length + ' entities' : esc(c.lastMessage || '');
        let dot = '';
        if (c.type === 'private' && meta.userData && getLastSeenText(meta.userData.lastOnline) === 'Online') dot = '<span class="online-dot"></span>';
        let unreadHTML = '';
        if (c.unreadCount && c.unreadCount > 0) unreadHTML = '<span class="unread-badge">' + Math.min(c.unreadCount, 99) + '</span>';
        
        const avatarHTML = meta.photo ? 
            `<img class="av" src="${meta.photo}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
             <div class="av p-av-fallback" style="display:none;">${meta.icon}</div>` : 
            `<div class="av p-av-fallback">${meta.icon}</div>`;
            
        div.innerHTML = avatarHTML + '<div class="ci-main"><div class="ci-name luxury-font">' + esc(meta.name) + ' ' + tag + ' ' + dot + '</div><div class="ci-last">' + sub + '</div></div>' + unreadHTML + (!isDiscover ? '<div class="ci-time">' + timeStr(c.lastTime) + '</div>' : '');
        list.appendChild(div);
    }
    applyAppleEmojis(list);
}

async function loadDiscover() {
    const list = $('mainList');
    list.innerHTML = '<div style="padding:30px;text-align:center;color:var(--color-text-muted);font-weight:600;">Scanning spectrum... 🌍</div>';
    applyAppleEmojis(list);
    try {
        const q = query(collection(db, 'chats'), where('type', '==', 'channel'), limit(30));
        const snap = await getDocs(q);
        let channels = [];
        snap.forEach(d => channels.push({ id: d.id, ...d.data() }));
        channels.sort((a, b) => b.members.length - a.members.length);
        if (channels.length === 0) list.innerHTML = '<div style="padding:30px;text-align:center;color:var(--color-text-muted);">No signals detected.</div>';
        else renderChatList(channels, true);
    } catch (e) { list.innerHTML = '<div style="padding:30px;text-align:center;color:var(--color-danger)">Protocol failed</div>'; }
}

async function loadLeaders() {
    const list = $('mainList');
    list.innerHTML = '<div style="padding:30px;text-align:center;color:var(--color-text-muted);font-weight:600;">Analyzing elites... 💠</div>';
    applyAppleEmojis(list);
    try {
        const q = query(collection(db, 'users'), orderBy('giftScore', 'desc'), limit(25));
        const snap = await getDocs(q);
        list.innerHTML = '';
        let rank = 1;
        snap.forEach(d => {
            const u = d.data();
            const div = document.createElement('div');
            div.className = 'chat-item';
            div.onclick = () => viewUser(u.uid);
            const icon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank;
            
            const avatarHTML = u.photoURL ? 
                `<img class="av" src="${u.photoURL}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                 <div class="av p-av-fallback" style="display:none;">${initials(u.displayName)}</div>` : 
                `<div class="av p-av-fallback">${initials(u.displayName)}</div>`;
                
            div.innerHTML = avatarHTML + '<div class="ci-main"><div class="ci-name luxury-font">' + (u.isPremium ? '💠' : '') + esc(u.displayName) + ' <span style="font-size:14px;margin-left:8px;">' + icon + '</span></div><div class="ci-last" style="color:var(--color-primary);">⭐ ' + (u.giftScore || 0) + ' Net Worth</div></div>';
            list.appendChild(div);
            rank++;
        });
        applyAppleEmojis(list);
    } catch (e) { list.innerHTML = '<div style="padding:30px;text-align:center;color:var(--color-danger)">Sync required</div>'; }
}

const userCache = {};
async function getUser(uid) {
    if (userCache[uid]) return userCache[uid];
    try { const s = await getDoc(doc(db, 'users', uid)); if (s.exists()) { userCache[uid] = s.data(); return userCache[uid]; } } catch (e) {}
    return { displayName: 'Unknown Entity', username: '', photoURL: '', uid: uid };
}

async function chatDisplay(c) {
    if (c.type === 'private') {
        const other = c.members.find(m => m !== ME.uid) || ME.uid;
        const u = await getUser(other);
        const title = u.isPremium ? '💠 ' + u.displayName : u.displayName;
        return { name: title, photo: u.photoURL, icon: initials(u.displayName), userData: u };
    }
    return { name: c.name, photo: c.photoURL, icon: c.type === 'channel' ? '📢' : '👥' };
}

// ---------- TYPING INDICATOR ----------
function subscribeTyping(chatId) {
    if (typingUnsub) typingUnsub();
    typingUnsub = onSnapshot(doc(db, 'chats', chatId, 'typing', 'status'), function(snap) {
        if (snap.exists() && snap.data().users && snap.data().users.length > 0) {
            const typingUsers = snap.data().users.filter(uid => uid !== ME.uid);
            if (typingUsers.length > 0) { showTyping(typingUsers); } else { hideTyping(); }
        } else { hideTyping(); }
    });
}
async function showTyping(uids) {
    if (uids.length === 0) return hideTyping();
    const u = await getUser(uids[0]);
    $('typingName').textContent = u.displayName || 'Entity';
    $('typingIndicator').classList.add('show');
}
function hideTyping() { $('typingIndicator').classList.remove('show'); }
window.handleTyping = function() {
    if (!activeChatId) return;
    if (typingTimer) clearTimeout(typingTimer);
    updateDoc(doc(db, 'chats', activeChatId, 'typing', 'status'), { users: arrayUnion(ME.uid) }).catch(() => {});
    typingTimer = setTimeout(() => { updateDoc(doc(db, 'chats', activeChatId, 'typing', 'status'), { users: arrayRemove(ME.uid) }).catch(() => {}); }, 3000);
};

// ---------- OPEN CHAT ----------
window.openChat = async function(chatId, chatDataObj) {
    activeChatId = chatId;
    if (chatDataObj) activeChat = chatDataObj;
    else { const s = await getDoc(doc(db, 'chats', chatId)); if (!s.exists()) return toast('Link Corrupted', '❌'); activeChat = { id: chatId, ...s.data() }; }
    $('emptyChat').style.display = 'none';
    $('activeChat').style.display = 'flex';
    $('chatPanel').classList.add('open');
    $('giftBtn').style.display = activeChat.type === 'private' ? 'block' : 'none';
    $('boostBtn').style.display = activeChat.type === 'channel' ? 'block' : 'none';
    $('callActionsBar').style.display = activeChat.type === 'channel' ? 'none' : 'flex';
    cancelAction();
    lastMessageDates = {};
    await renderChatHeader();
    applyBackground(activeChat.background);
    checkJoinStatus();
    checkPinnedMsg();
    subscribeMessages(chatId);
    subscribeTyping(chatId);
    document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
};
window.closeChat = function() { $('chatPanel').classList.remove('open'); activeChatId = null; if (typingUnsub) typingUnsub(); };

async function renderChatHeader() {
    if (!activeChat) return;
    const meta = await chatDisplay(activeChat);
    $('hName').textContent = meta.name;
    renderAvatar($('hAvImg'), $('hAvFallback'), meta.photo, meta.icon);
    
    if (activeChat.type === 'private') {
        const u = meta.userData;
        $('hSub').textContent = getLastSeenText(u.lastOnline);
        $('hSub').style.color = getLastSeenText(u.lastOnline) === 'Online' ? 'var(--color-success)' : 'var(--color-primary)';
    } else if (activeChat.type === 'group') {
        $('hSub').textContent = activeChat.members.length + ' Linked';
        $('hSub').style.color = 'var(--color-primary)';
    } else {
        const lvl = Math.floor((activeChat.boosts || 0) / 5) + 1;
        $('hSub').textContent = 'Tier ' + lvl + ' (' + (activeChat.boosts || 0) + ' 🚀)';
        $('hSub').style.color = 'var(--color-primary)';
    }
    applyAppleEmojis($('hName'));
}

function applyBackground(bg) {
    $('messages').style.backgroundImage = bg || '';
}

function checkJoinStatus() {
    if (activeChat.type === 'channel' && !activeChat.members.includes(ME.uid)) {
        $('inputBar').style.display = 'none';
        $('joinBar').style.display = 'block';
    } else {
        $('joinBar').style.display = 'none';
        $('inputBar').style.display = 'flex';
    }
}

function checkPinnedMsg() {
    if (activeChat && activeChat.pinnedMsg) {
        $('pinnedBar').style.display = 'block';
        $('pinnedText').textContent = activeChat.pinnedMsg.text;
        $('pinnedBar').dataset.id = activeChat.pinnedMsg.id;
        applyAppleEmojis($('pinnedBar'));
    } else { $('pinnedBar').style.display = 'none'; }
}
window.scrollToPinned = function() {
    const id = $('pinnedBar').dataset.id;
    const el = document.getElementById('msg_' + id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const bub = el.querySelector('.bubble');
        if (bub) {
            bub.style.boxShadow = '0 0 30px var(--color-primary-glow)';
            setTimeout(() => { if (bub) bub.style.boxShadow = ''; }, 2000);
        }
    }
};

window.joinCurrentChannel = async function() {
    if (!activeChatId) return;
    toast('Routing...', '⏳');
    await updateDoc(doc(db, 'chats', activeChatId), { members: arrayUnion(ME.uid) });
    activeChat.members.push(ME.uid);
    checkJoinStatus();
    renderChatHeader();
    toast('Link established!', '✅');
};

// ---------- MESSAGES ----------
function subscribeMessages(chatId) {
    if (msgUnsub) msgUnsub();
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'), limit(300));
    msgUnsub = onSnapshot(q, function(snap) {
        const box = $('messages');
        const wasAtBottom = box.scrollHeight - box.scrollTop <= box.clientHeight + 100;
        box.innerHTML = '';
        lastMessageDates = {};
        let prevDate = null;
        
        snap.forEach(d => {
            const m = d.data();
            if (m.createdAt) {
                const curDate = dateStr(m.createdAt);
                if (curDate !== prevDate) {
                    const sep = document.createElement('div');
                    sep.className = 'date-separator luxury-font';
                    sep.innerHTML = '<span>' + curDate + '</span>';
                    box.appendChild(sep);
                    prevDate = curDate;
                }
            }
            renderMessage(d.id, m);
        });
        applyAppleEmojis(box);
        if (wasAtBottom) setTimeout(() => box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' }), 50);
    });
}

function renderMessage(id, m) {
    const box = $('messages');
    const mine = m.senderId === ME.uid;
    const row = document.createElement('div');
    row.className = 'msg-row' + (mine ? ' me' : '');
    row.id = 'msg_' + id;
    const showSender = !mine && (activeChat.type !== 'private');
    const isPremiumUser = m.senderIsPremium;
    const tempClass = m.temp ? 'temp-msg' : '';
    
    let inner = '';
    let replyHTML = '';
    if (m.replyTo) {
        replyHTML = '<div class="reply-box" onclick="document.getElementById(\'msg_' + m.replyTo.id + '\')?.scrollIntoView({behavior:\'smooth\',block:\'center\'})"><div class="r-sender">' + esc(m.replyTo.sender) + '</div><div class="r-text">' + esc(m.replyTo.text) + '</div></div>';
    }
    
    if (m.type === 'gift') {
        row.innerHTML = '<div class="bubble gift-bubble" style="text-align:center; padding: 20px;"><div style="font-size:48px;">' + m.gift + '</div><div style="font-size:13px; color:var(--color-primary); margin-top:12px; font-weight:bold; letter-spacing:1px;" class="luxury-font">Asset Transferred ⭐' + m.giftValue + '</div><div class="b-meta" style="justify-content:center; margin-top:8px;">' + timeStr(m.createdAt) + '</div></div>';
        box.appendChild(row); return;
    } else if (m.type === 'image') {
        inner = '<img class="b-img" src="' + m.mediaURL + '" loading="lazy" onclick="if(!\'' + m.temp + '\')showLightbox(\'' + m.mediaURL + '\')">';
        if (m.text) inner += '<div class="b-text" style="margin-top:8px">' + esc(m.text) + '</div>';
    } else if (m.type === 'video') {
        inner = '<video class="b-video" src="' + m.mediaURL + '" controls preload="metadata"></video>';
        if (m.text) inner += '<div class="b-text" style="margin-top:8px">' + esc(m.text) + '</div>';
    } else if (m.type === 'file' || m.type === 'audio') {
        let fIcon = m.type === 'audio' ? '🎵' : '📄';
        inner = '<a class="b-file" href="' + m.mediaURL + '" target="_blank" download style="display:flex; align-items:center; gap:10px; padding:12px; background:rgba(0,0,0,0.3); border-radius:12px; border:1px solid var(--color-border-light); text-decoration:none;"><span style="font-size:24px;">' + fIcon + '</span><span style="color:var(--color-text-main); font-size:13px; font-weight:600;">' + esc(m.fileName || 'Encrypted File') + '</span></a>';
        if (m.text) inner += '<div class="b-text" style="margin-top:8px">' + esc(m.text) + '</div>';
    } else {
        inner = '<div class="b-text" id="txt_' + id + '">' + esc(m.text) + '</div>';
    }
    
    if (!mine && !m.temp && (!m.readBy || !m.readBy.includes(ME.uid))) {
        updateDoc(doc(db, 'chats', activeChatId, 'messages', id), { readBy: arrayUnion(ME.uid) }).catch(() => {});
    }
    
    let reactHTML = '';
    if (m.reactions && Object.keys(m.reactions).length > 0 && !m.temp) {
        reactHTML = '<div class="reactions-display">';
        for (const [emoji, users] of Object.entries(m.reactions)) {
            if (users.length > 0) {
                const iReacted = users.includes(ME.uid);
                reactHTML += '<div class="react-badge ' + (iReacted ? 'reacted' : '') + '" onclick="toggleReaction(\'' + id + '\',\'' + emoji + '\')">' + emoji + ' <span style="margin-left:2px; font-weight:bold;">' + users.length + '</span></div>';
            }
        }
        reactHTML += '</div>';
    }
    
    const editedTag = m.edited ? '<span style="font-size:10px; opacity:0.5; margin-right:6px;">edited</span>' : '';
    const senderTag = showSender ? '<div class="b-sender" style="color:' + (isPremiumUser ? 'var(--color-primary)' : 'var(--color-text-muted)') + '" onclick="viewUser(\'' + m.senderId + '\')">' + (isPremiumUser ? '💠 ' : '') + esc(m.senderName) + '</div>' : '';
    const isSeen = m.readBy && m.readBy.length > 0;
    const tickIcon = mine && !m.temp ? (isSeen ? '<span class="tick seen">✓✓</span>' : '<span class="tick">✓</span>') : (m.temp ? '<span class="tick">⏳</span>' : '');
    const lvl = Math.floor((activeChat ? activeChat.boosts || 0 : 0) / 5) + 1;
    const customReact = lvl >= 2 ? '<button onclick="toggleReaction(\'' + id + '\',\'🥂\')" title="Premium">🥂</button>' : '';
    
    const actions = !m.temp && m.type !== 'gift' ? '<div class="msg-actions"><button onclick="startReply(\'' + id + '\',this)" title="Reply">↩️</button><button onclick="pinMsg(\'' + id + '\',this)" title="Pin">📌</button><span style="width:1px;background:var(--color-border-light);margin:4px;"></span><button onclick="toggleReaction(\'' + id + '\',\'❤️\')">❤️</button><button onclick="toggleReaction(\'' + id + '\',\'🔥\')">🔥</button><button onclick="toggleReaction(\'' + id + '\',\'😂\')">😂</button>' + customReact + (mine && m.type === 'text' ? '<button onclick="startEdit(\'' + id + '\',this)" title="Edit">✏️</button>' : '') + (mine ? '<button onclick="deleteMessage(\'' + id + '\')" style="color:var(--color-danger)" title="Delete">🗑</button>' : '') + '</div>' : '';
    
    let isDecreeStyle = '';
    if(m.isRoyalDecree) {
        isDecreeStyle = 'border: 2px solid var(--color-primary); box-shadow: inset 0 0 20px var(--color-primary-glow);';
    }

    row.innerHTML = '<div class="bubble ' + tempClass + '" style="' + isDecreeStyle + '">' + actions + senderTag + replyHTML + inner + reactHTML + '<div class="b-meta">' + editedTag + '<span>' + timeStr(m.createdAt) + '</span>' + tickIcon + '</div></div>';
    
    let pureText = m.text || '';
    if (m.type === 'image' && pureText === '') pureText = '📷 Visual';
    if (m.type === 'video' && pureText === '') pureText = '🎬 Neural Feed';
    if ((m.type === 'file' || m.type === 'audio') && pureText === '') pureText = '📄 Encrypted Data';
    
    row.querySelector('.bubble').dataset.text = pureText;
    row.querySelector('.bubble').dataset.senderName = m.senderName;
    box.appendChild(row);
}

window.toggleReaction = async function(msgId, emoji) {
    if (!activeChatId) return;
    const msgRef = doc(db, 'chats', activeChatId, 'messages', msgId);
    const snap = await getDoc(msgRef);
    if (snap.exists()) {
        let data = snap.data();
        let reactions = data.reactions || {};
        if (!reactions[emoji]) reactions[emoji] = [];
        if (reactions[emoji].includes(ME.uid)) reactions[emoji] = reactions[emoji].filter(id => id !== ME.uid);
        else reactions[emoji].push(ME.uid);
        await updateDoc(msgRef, { reactions });
    }
};

window.showLightbox = function(url) {
    $('lbImg').src = url;
    $('lightbox').style.display = 'flex';
    requestAnimationFrame(() => {
        $('lightbox').classList.add('show');
    });
};

// ---------- ACTIONS ----------
window.startReply = function(id, btn) {
    const bubble = btn.closest('.bubble');
    actionState = { type: 'reply', id, sender: bubble.dataset.senderName, text: bubble.dataset.text };
    $('abIcon').textContent = '↩️';
    $('abTitle').textContent = 'Link with ' + actionState.sender;
    $('abText').textContent = actionState.text;
    $('actionBanner').style.display = 'flex';
    applyAppleEmojis($('actionBanner'));
    $('msgInput').focus();
};
window.startEdit = function(id, btn) {
    const bubble = btn.closest('.bubble');
    actionState = { type: 'edit', id };
    $('abIcon').textContent = '✏️';
    $('abTitle').textContent = 'Reconfigure Protocol';
    $('abText').textContent = bubble.dataset.text;
    $('actionBanner').style.display = 'flex';
    $('msgInput').value = bubble.dataset.text;
    $('msgInput').focus();
    autoGrow($('msgInput'));
};
window.cancelAction = function() {
    actionState = { type: null, id: null };
    $('actionBanner').style.display = 'none';
    $('msgInput').value = '';
};
window.pinMsg = async function(id, btn) {
    if (!activeChatId) return;
    const bubble = btn.closest('.bubble');
    let text = bubble.dataset.text;
    if (text.length > 40) text = text.substring(0, 40) + '...';
    await updateDoc(doc(db, 'chats', activeChatId), { pinnedMsg: { id, text } });
    toast('Data pinned 📌', '✔');
};
window.deleteMessage = async function(id) {
    try {
        await deleteDoc(doc(db, 'chats', activeChatId, 'messages', id));
        toast('Trace wiped 🧹');
    } catch (e) { toast('Clearance failed', '❌'); }
};
window.deleteActiveChat = async function() {
    if (!confirm('Obliterate this connection completely?')) return;
    try {
        await deleteDoc(doc(db, 'chats', activeChatId));
        closeModal('chatInfoModal');
        clearActiveChat();
        toast('Connection vaporized', '🗑️');
    } catch (e) { toast('Error', '❌'); }
};

// ---------- SEND ----------
window.autoGrow = function(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 150) + 'px';
};
window.toggleRoyalDecree = function() {
    isRoyalDecreeMode = !isRoyalDecreeMode;
    $('btnRoyalDecree').style.background = isRoyalDecreeMode ? 'rgba(212,175,55,0.2)' : 'transparent';
    $('btnRoyalDecree').style.color = isRoyalDecreeMode ? '#fff' : 'var(--color-primary)';
    toast(isRoyalDecreeMode ? 'Decree Armed 📜' : 'Standard Mode');
};

window.sendMessage = async function() {
    const input = $('msgInput');
    const text = input.value.trim();
    if (!activeChatId) return;
    if (actionState.type === 'edit') {
        if (!text) return;
        await updateDoc(doc(db, 'chats', activeChatId, 'messages', actionState.id), { text, edited: true });
        cancelAction();
        input.value = '';
        autoGrow(input); return;
    }
    if (activeChat.type === 'channel' && activeChat.owner !== ME.uid && !(activeChat.admins || []).includes(ME.uid)) return toast('Architect privileges required', '⚠️');
    if (!text) return;
    
    let payload = { type: 'text', text, isRoyalDecree: isRoyalDecreeMode && ME.isPremium };
    if (actionState.type === 'reply') payload.replyTo = { id: actionState.id, sender: actionState.sender, text: actionState.text.substring(0, 60) };
    
    input.value = '';
    autoGrow(input);
    cancelAction();
    const tempId = 'optimistic_' + Date.now();
    const tempMsg = { id: tempId, senderId: ME.uid, senderName: ME.displayName, senderIsPremium: ME.isPremium || false, createdAt: new Date(), edited: false, deleted: false, reactions: {}, readBy: [], ...payload, temp: true };
    renderMessage(tempId, tempMsg);
    applyAppleEmojis(document.getElementById('msg_' + tempId));
    
    const box = $('messages');
    box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
    await pushMessage(payload);
    
    const tempEl = document.getElementById('msg_' + tempId);
    if (tempEl) tempEl.remove();
    
    isRoyalDecreeMode = false;
    $('btnRoyalDecree').style.background = 'transparent';
    $('btnRoyalDecree').style.color = 'var(--color-primary)';
    updateDoc(doc(db, 'chats', activeChatId, 'typing', 'status'), { users: arrayRemove(ME.uid) }).catch(() => {});
};

async function pushMessage(data) {
    const msg = { senderId: ME.uid, senderName: ME.displayName, senderIsPremium: ME.isPremium || false, createdAt: serverTimestamp(), edited: false, deleted: false, reactions: {}, readBy: [], ...data };
    await addDoc(collection(db, 'chats', activeChatId, 'messages'), msg);
    let preview = data.text || (data.type === 'image' ? '📷 Visual' : data.type === 'video' ? '🎬 Neural' : (data.type === 'file' || data.type === 'audio') ? '📄 Data' : data.type === 'gift' ? '🎁 Asset' : 'Signal');
    if (data.isRoyalDecree) preview = '📜 Decree: ' + preview;
    await updateDoc(doc(db, 'chats', activeChatId), { lastMessage: preview.slice(0, 45), lastTime: serverTimestamp() });
}

// ---------- SECURE FIREBASE STORAGE INTEGRATION (FIXED UPLOAD BUG) ----------
window.handleFileSelect = async function(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || !activeChatId) return;
    if (file.size > 80 * 1024 * 1024) return toast('Mass exceeds limits', '⚠️');
    
    const previewId = 'temp_' + Date.now();
    let type = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';
    
    const tempMsg = { id: previewId, senderId: ME.uid, senderName: ME.displayName, type: 'text', mediaURL: '', fileName: file.name, text: '⏳ Routing matrix payload...', createdAt: new Date(), temp: true, reactions: {} };
    renderMessage(previewId, tempMsg);
    $('messages').scrollTo({ top: $('messages').scrollHeight, behavior: 'smooth' });
    
    try {
        const fRef = storageRef(storage, `network_transfers/${Date.now()}_${file.name}`);
        await uploadBytes(fRef, file);
        const directUrl = await getDownloadURL(fRef);
        
        let payload = { type, mediaURL: directUrl, fileName: file.name, text: '' };
        if (actionState.type === 'reply') payload.replyTo = { id: actionState.id, sender: actionState.sender, text: actionState.text };
        
        await pushMessage(payload);
        cancelAction();
        const tempEl = document.getElementById('msg_' + previewId);
        if (tempEl) tempEl.remove();
        toast('Transfer Complete', '✔');
    } catch (err) {
        console.error(err);
        toast('Connection severed', '❌');
        const tempEl = document.getElementById('msg_' + previewId);
        if (tempEl) tempEl.remove();
    }
};

// ---------- PREMIUM ----------
window.openPremiumModal = function() {
    $('mainMenu').style.display = 'none';
    if (ME.isPremium) return toast('You already hold Prime status! 💠');
    openModal('premiumModal');
};
window.buyPremium = async function() {
    if ((ME.credits || 0) < 500) return toast('Insufficient Assets', '⚠️');
    await updateDoc(doc(db, 'users', ME.uid), { credits: increment(-500), isPremium: true });
    ME.credits -= 500;
    ME.isPremium = true;
    closeModal('premiumModal');
    toast('Ascension Complete! 💠', '🎉');
    renderMeHeader();
};
window.boostChannel = async function() {
    if (!activeChat || activeChat.type !== 'channel') return;
    if ((ME.credits || 0) < 50) return toast('Requires 50 Assets', '⚠️');
    await updateDoc(doc(db, 'users', ME.uid), { credits: increment(-50) });
    await updateDoc(doc(db, 'chats', activeChatId), { boosts: increment(1) });
    ME.credits -= 50;
    activeChat.boosts = (activeChat.boosts || 0) + 1;
    renderChatHeader();
    toast('Channel frequency amplified! 🚀', '⚡');
};

// ---------- PROFILE ----------
window.openMyProfile = function() {
    $('mainMenu').style.display = 'none';
    $('ppName').value = ME.displayName;
    $('ppBirth').value = ME.birthDate || '';
    $('ppBio').value = ME.bio || '';
    $('ppUser').value = '@' + ME.username;
    $('ppCredit').textContent = ME.credits || 0;
    $('ppGiftScore').textContent = ME.giftScore || 0;
    
    renderAvatar($('ppAv'), $('ppAvFallback'), ME.photoURL, ME.displayName);
    if (ME.isPremium) $('ppAv').style.borderColor = 'var(--color-primary)';
    
    const gBox = $('myGiftsGallery');
    if (ME.receivedGifts && ME.receivedGifts.length > 0) {
        gBox.innerHTML = ME.receivedGifts.map(g => '<div class="gift-gallery-item"><div style="font-size:36px;">' + g.emoji + '</div><div style="font-size:12px;color:var(--color-primary);margin-top:8px;font-weight:600;">via ' + g.sender + '</div></div>').reverse().join('');
        applyAppleEmojis(gBox);
    } else gBox.innerHTML = '<div style="color:var(--color-text-muted);padding:12px;font-weight:600;">Vault is empty</div>';
    
    openModal('myProfileModal');
};

window.saveProfile = async function() {
    const name = $('ppName').value.trim(), bio = $('ppBio').value.trim(), birth = $('ppBirth').value;
    if (!name) return toast('Designation required', '⚠️');
    try {
        await updateDoc(doc(db, 'users', ME.uid), { displayName: name, bio, birthDate: birth });
        ME.displayName = name;
        ME.bio = bio;
        ME.birthDate = birth;
        renderMeHeader();
        toast('Identity Synchronized', '✔');
        closeModal('myProfileModal');
    } catch (e) { toast('System Error', '❌'); }
};

// Profile Image Upload Fix using robust Firebase Storage directly
window.uploadAvatar = async function(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    toast('⏳ Integrating new visual...');
    try {
        const fRef = storageRef(storage, `avatars/${ME.uid}_${Date.now()}`);
        await uploadBytes(fRef, file);
        const url = await getDownloadURL(fRef);
        
        await updateDoc(doc(db, 'users', ME.uid), { photoURL: url });
        ME.photoURL = url;
        
        // Instantly reflect in all UI elements
        renderAvatar($('ppAv'), $('ppAvFallback'), url, ME.displayName);
        renderMeHeader();
        toast('Visual Identity Updated 💠', '✔');
    } catch (err) { 
        toast('Upload failed. Integrity compromised.', '❌');
    }
};

window.viewUser = async function(uid) {
    if (uid === ME.uid) { openMyProfile(); return; }
    const u = await getUser(uid);
    viewedUser = u;
    const title = u.isPremium ? '💠 ' + u.displayName : u.displayName;
    $('upName').textContent = title;
    $('upId').textContent = '@' + u.username;
    
    $('upStatus').textContent = getLastSeenExactText(u.lastOnline);
    $('upStatus').style.color = getLastSeenExactText(u.lastOnline) === 'Online' ? 'var(--color-success)' : 'var(--color-primary)';
    
    if (u.birthDate) { $('upBirth').style.display = 'block'; $('upBirthVal').textContent = u.birthDate; }
    else $('upBirth').style.display = 'none';
    
    renderAvatar($('upAv'), null, u.photoURL, u.displayName);
    $('upAv').style.border = u.isPremium ? '3px solid var(--color-primary)' : '3px solid var(--color-border)';
    
    if (u.bio) { $('upBio').style.display = 'block'; $('upBio').textContent = u.bio; }
    else $('upBio').style.display = 'none';
    
    const gBox = $('userGiftsGallery');
    if (u.receivedGifts && u.receivedGifts.length > 0) {
        gBox.innerHTML = u.receivedGifts.map(g => '<div class="gift-gallery-item"><div style="font-size:36px;">' + g.emoji + '</div><div style="font-size:12px;color:var(--color-primary);margin-top:8px;font-weight:600;">via ' + g.sender + '</div></div>').reverse().join('');
        applyAppleEmojis(gBox);
    } else gBox.innerHTML = '<div style="color:var(--color-text-muted);padding:12px;font-weight:600;">Vault is empty</div>';
    
    openModal('userProfileModal');
    applyAppleEmojis($('userProfileModal'));
};

window.startChatWithViewedUser = async function() {
    closeModal('userProfileModal');
    await openOrCreatePrivate(viewedUser.uid, viewedUser);
};
async function openOrCreatePrivate(otherUid, otherData) {
    const cid = privateChatId(ME.uid, otherUid);
    const ref = doc(db, 'chats', cid);
    const s = await getDoc(ref);
    if (!s.exists()) await setDoc(ref, { type: 'private', members: [ME.uid, otherUid].sort(), lastMessage: '', lastTime: serverTimestamp(), background: '' });
    userCache[otherUid] = otherData;
    openChat(cid);
}

// ---------- SEARCH ----------
let searchTimer = null;
window.onSearchInput = function() { clearTimeout(searchTimer); searchTimer = setTimeout(runSearch, 300); };
async function runSearch() {
    let term = $('globalSearch').value.trim().toLowerCase().replace(/^@/, '');
    const box = $('mainList');
    if (!term) { switchMainTab(currentMainTab); return; }
    $('listTitle').textContent = 'Scan Results';
    box.innerHTML = '<div style="padding:30px;text-align:center;color:var(--color-text-muted);font-weight:600;">🔍 Scanning...</div>';
    applyAppleEmojis(box);
    try {
        const uQ = query(collection(db, 'users'), where('usernameLower', '>=', term), where('usernameLower', '<=', term + '\uf8ff'), limit(15));
        const uSnap = await getDocs(uQ);
        const cQ = query(collection(db, 'chats'), where('type', '==', 'channel'), limit(30));
        const cSnap = await getDocs(cQ);
        box.innerHTML = '';
        let found = false;
        
        uSnap.forEach(d => {
            const u = d.data();
            if (u.uid === ME.uid) return;
            found = true;
            const div = document.createElement('div');
            div.className = 'chat-item';
            div.onclick = () => { openOrCreatePrivate(u.uid, u); $('globalSearch').value = ''; switchMainTab('chats'); };
            let dot = getLastSeenText(u.lastOnline) === 'Online' ? '<span class="online-dot"></span>' : '';
            
            const avatarHTML = u.photoURL ? 
                `<img class="av" src="${u.photoURL}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                 <div class="av p-av-fallback" style="display:none;">${initials(u.displayName)}</div>` : 
                `<div class="av p-av-fallback">${initials(u.displayName)}</div>`;
                
            div.innerHTML = avatarHTML + '<div class="ci-main"><div class="ci-name luxury-font">' + (u.isPremium ? '💠 ' : '') + esc(u.displayName) + ' ' + dot + '</div><div class="ci-last">@' + esc(u.username) + '</div></div>';
            box.appendChild(div);
        });
        cSnap.forEach(d => {
            const c = d.data();
            if (c.name && c.name.toLowerCase().includes(term)) {
                found = true;
                const div = document.createElement('div');
                div.className = 'chat-item';
                div.onclick = () => { openChat(d.id, { id: d.id, ...c }); $('globalSearch').value = ''; switchMainTab('chats'); };
                div.innerHTML = '<div class="av p-av-fallback">📢</div><div class="ci-main"><div class="ci-name luxury-font">' + esc(c.name) + ' <span class="tag">Broadcast</span></div><div class="ci-last">' + c.members.length + ' Linked</div></div>';
                box.appendChild(div);
            }
        });
        if (!found) box.innerHTML = '<div style="padding:30px;text-align:center;color:var(--color-text-muted);font-weight:600;">Entity Not Found</div>';
        applyAppleEmojis(box);
    } catch (e) { box.innerHTML = '<div style="padding:30px;text-align:center;color:var(--color-danger)">Protocol Error</div>'; }
}

// ---------- GROUPS & CHANNELS ----------
window.loadMemberPicker = async function() {
    const box = $('grpMembers');
    box.innerHTML = 'Scanning local entities...';
    const snap = await getDocs(query(collection(db, 'users'), limit(50)));
    box.innerHTML = '';
    snap.forEach(d => {
        const u = d.data();
        if (u.uid === ME.uid) return;
        const div = document.createElement('div');
        div.className = 'chat-item';
        div.style.padding = '10px';
        div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        div.dataset.uid = u.uid;
        div.onclick = () => div.classList.toggle('active');
        
        const avatarHTML = u.photoURL ? 
            `<img class="av" style="width:40px;height:40px" src="${u.photoURL}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
             <div class="av p-av-fallback" style="width:40px;height:40px;display:none;">${initials(u.displayName)}</div>` : 
            `<div class="av p-av-fallback" style="width:40px;height:40px">${initials(u.displayName)}</div>`;
            
        div.innerHTML = avatarHTML + '<div class="ci-main"><div class="ci-name luxury-font" style="font-size:14px">' + (u.isPremium ? '💠 ' : '') + esc(u.displayName) + '</div><div class="ci-last" style="font-size:12px">@' + esc(u.username) + '</div></div><span style="color:var(--color-primary);font-weight:bold;font-size:12px;margin-right:8px;">Add</span>';
        box.appendChild(div);
    });
    applyAppleEmojis(box);
};
window.createGroup = async function() {
    const name = $('grpName').value.trim();
    if (!name) return toast('Designation required', '⚠️');
    const sel = [...document.querySelectorAll('#grpMembers .chat-item.active')].map(e => e.dataset.uid);
    const ref = await addDoc(collection(db, 'chats'), { type: 'group', name, photoURL: '', owner: ME.uid, admins: [], members: [ME.uid, ...sel], lastMessage: 'Assembly initialized', lastTime: serverTimestamp(), background: '' });
    closeModal('newGroupModal');
    $('grpName').value = '';
    toast('Assembly formed', '✔');
    openChat(ref.id);
};
window.createChannel = async function() {
    const name = $('chName').value.trim(), desc = $('chDesc').value.trim();
    if (!name) return toast('Broadcast designation required', '⚠️');
    const ref = await addDoc(collection(db, 'chats'), { type: 'channel', name, nameLower: name.toLowerCase(), description: desc, photoURL: '', owner: ME.uid, admins: [], members: [ME.uid], boosts: 0, lastMessage: 'Broadcast initialized', lastTime: serverTimestamp(), background: '' });
    closeModal('newChannelModal');
    $('chName').value = '';
    $('chDesc').value = '';
    toast('Broadcast ready', '✔');
    openChat(ref.id);
};

// ---------- CHAT INFO ----------
window.openChatInfo = async function() {
    if (!activeChat) return;
    const meta = await chatDisplay(activeChat);
    $('ciName').textContent = meta.name;
    renderAvatar($('ciAv'), null, meta.photo, meta.icon);
    
    if (activeChat.type === 'private') {
        const other = activeChat.members.find(m => m !== ME.uid) || ME.uid;
        closeModal('chatInfoModal');
        viewUser(other); return;
    }
    $('ciMembersTitle').style.display = 'block';
    $('ciMembers').style.display = 'block';
    
    if (activeChat.type === 'channel') {
        const lvl = Math.floor((activeChat.boosts || 0) / 5) + 1;
        $('ciBoosts').style.display = 'inline-block';
        $('ciBoosts').textContent = 'Frequency Tier: ' + lvl + ' (' + (activeChat.boosts || 0) + ' 🚀)';
        $('ciSub').textContent = activeChat.members.length + ' Observers';
        $('channelSettingsUI').style.display = activeChat.owner === ME.uid ? 'block' : 'none';
    } else {
        $('ciBoosts').style.display = 'none';
        $('channelSettingsUI').style.display = activeChat.owner === ME.uid ? 'block' : 'none';
        $('ciSub').textContent = activeChat.members.length + ' Assembly Entities';
    }
    
    if (activeChat.description) {
        $('ciDesc').style.display = 'block';
        $('ciDesc').textContent = activeChat.description;
    } else $('ciDesc').style.display = 'none';
    
    const mbox = $('ciMembers');
    mbox.innerHTML = '';
    for (const uid of activeChat.members) {
        const u = await getUser(uid);
        const div = document.createElement('div');
        div.className = 'chat-item';
        div.style.padding = '10px';
        div.style.background = 'transparent';
        div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        const isOwner = uid === activeChat.owner;
        const isAdmin = (activeChat.admins || []).includes(uid);
        const badge = isOwner ? '<span style="background:var(--color-danger);color:#fff;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:bold;">👑 Architect</span>' : (isAdmin ? '<span style="background:var(--color-primary);color:#000;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:bold;">🛡️ Operator</span>' : '');
        
        const avatarHTML = u.photoURL ? 
            `<img class="av" style="width:40px;height:40px" src="${u.photoURL}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
             <div class="av p-av-fallback" style="width:40px;height:40px;display:none;">${initials(u.displayName)}</div>` : 
            `<div class="av p-av-fallback" style="width:40px;height:40px">${initials(u.displayName)}</div>`;
            
        div.innerHTML = avatarHTML + '<div class="ci-main" onclick="closeModal(\'chatInfoModal\');viewUser(\'' + uid + '\');"><div class="ci-name luxury-font" style="font-size:14px">' + (u.isPremium ? '💠 ' : '') + esc(u.displayName) + ' ' + badge + '</div><div class="ci-last" style="font-size:12px">@' + esc(u.username) + '</div></div>';
        if (ME.uid === activeChat.owner && !isOwner) {
            const btn = document.createElement('button');
            btn.textContent = isAdmin ? 'Demote' : 'Promote';
            btn.style.cssText = 'padding:8px 12px;font-size:12px;background:rgba(212,175,55,0.1);color:var(--color-primary);border-radius:12px;font-weight:600;cursor:pointer;border:1px solid var(--color-border);';
            btn.onclick = (e) => { e.stopPropagation(); toggleAdmin(uid, isAdmin); };
            div.appendChild(btn);
        }
        mbox.appendChild(div);
    }
    applyAppleEmojis(mbox);
    openModal('chatInfoModal');
};
window.toggleAdmin = async function(uid, isAdmin) {
    if (!activeChatId || ME.uid !== activeChat.owner) return;
    const ref = doc(db, 'chats', activeChatId);
    if (isAdmin) {
        await updateDoc(ref, { admins: arrayRemove(uid) });
        activeChat.admins = activeChat.admins.filter(a => a !== uid);
    } else {
        await updateDoc(ref, { admins: arrayUnion(uid) });
        if (!activeChat.admins) activeChat.admins = [];
        activeChat.admins.push(uid);
    }
    openChatInfo();
};
window.clearActiveChat = function() {
    activeChatId = null;
    activeChat = null;
    if (msgUnsub) msgUnsub();
    if (typingUnsub) typingUnsub();
    $('activeChat').style.display = 'none';
    $('emptyChat').style.display = 'flex';
    $('chatPanel').classList.remove('open');
    hideTyping();
};

// ---------- CREDITS & GIFTS ----------
window.openCreditModal = function() {
    $('mainMenu').style.display = 'none';
    $('cmCredit').textContent = ME.credits || 0;
    openModal('creditModal');
};
window.addCredits = async function(n) {
    await updateDoc(doc(db, 'users', ME.uid), { credits: increment(n) });
    ME.credits = (ME.credits || 0) + n;
    $('cmCredit').textContent = ME.credits;
    toast('+' + n + ' Assets Reclaimed ⭐');
};
let giftTargetUid = null;
window.openGiftModal = function() {
    $('chatMenu').style.display = 'none';
    if (activeChat && activeChat.type === 'private') giftTargetUid = activeChat.members.find(m => m !== ME.uid) || ME.uid;
    else if (activeChat && activeChat.type === 'channel') giftTargetUid = 'CHANNEL_GIFT';
    else giftTargetUid = null;
    $('gmCredit').textContent = ME.credits || 0;
    openModal('giftModal');
    applyAppleEmojis($('giftModal'));
};
window.openGiftToViewedUser = function() {
    closeModal('userProfileModal');
    giftTargetUid = viewedUser.uid;
    $('gmCredit').textContent = ME.credits || 0;
    openModal('giftModal');
    applyAppleEmojis($('giftModal'));
};
window.sendGift = async function(emoji, value) {
    if ((ME.credits || 0) < value) return toast('Insufficient Assets', '⚠️');
    if (giftTargetUid === 'CHANNEL_GIFT') {
        await updateDoc(doc(db, 'users', ME.uid), { credits: increment(-value) });
        await updateDoc(doc(db, 'chats', activeChatId), { boosts: increment(Math.floor(value / 10)) });
        ME.credits -= value;
        activeChat.boosts = (activeChat.boosts || 0) + Math.floor(value / 10);
        await pushMessage({ type: 'gift', gift: emoji, giftValue: value, text: '' });
        closeModal('giftModal');
        renderChatHeader();
        return toast('Broadcast frequency amplified! 🚀', '💠');
    }
    
    let chatId = activeChatId;
    if (giftTargetUid && (!activeChat || activeChat.type !== 'private' || !activeChat.members.includes(giftTargetUid))) {
        const u = await getUser(giftTargetUid);
        await openOrCreatePrivate(giftTargetUid, u);
        chatId = activeChatId;
    }
    if (!chatId) return toast('Target unreachable');
    await updateDoc(doc(db, 'users', ME.uid), { credits: increment(-value) });
    if (giftTargetUid) {
        await updateDoc(doc(db, 'users', giftTargetUid), { credits: increment(value), giftScore: increment(value), receivedGifts: arrayUnion({ emoji, sender: ME.displayName, value }) });
    }
    ME.credits -= value;
    await pushMessage({ type: 'gift', gift: emoji, giftValue: value, text: '' });
    closeModal('giftModal');
    toast('Transfer secured', '🎁');
};

// ---------- BACKGROUND ----------
window.openBgModal = function() {
    $('chatMenu').style.display = 'none';
    const grid = $('bgGrid');
    grid.innerHTML = '';
    BACKGROUNDS.forEach(bg => {
        const d = document.createElement('div');
        d.className = 'bg-opt' + (activeChat && activeChat.background === bg ? ' sel' : '');
        d.style.height = '120px';
        d.style.borderRadius = 'var(--radius-lg)';
        d.style.cursor = 'pointer';
        d.style.border = '3px solid transparent';
        d.style.backgroundSize = 'cover';
        d.style.backgroundPosition = 'center';
        d.style.transition = 'var(--transition-smooth)';
        d.style.boxShadow = 'var(--shadow-glass)';
        d.style.background = bg || 'var(--color-bg-base)';
        d.onclick = () => setBackground(bg);
        d.onmouseover = () => { d.style.transform = 'scale(1.03)'; d.style.borderColor = 'rgba(212,175,55,0.4)'; };
        d.onmouseout = () => { d.style.transform = 'scale(1)'; d.style.borderColor = (activeChat && activeChat.background === bg ? 'var(--color-primary)' : 'transparent'); };
        grid.appendChild(d);
    });
    openModal('bgModal');
};
window.setBackground = async function(bg) {
    await updateDoc(doc(db, 'chats', activeChatId), { background: bg });
    activeChat.background = bg;
    applyBackground(bg);
    closeModal('bgModal');
    toast('Aesthetic environment applied', '🖼️');
};

$('msgInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

// ---------- SWIPE GESTURE (MOBILE) ----------
let touchStartX = 0;
document.addEventListener('touchstart', function(e) { touchStartX = e.touches[0].clientX; }, { passive: true });
document.addEventListener('touchend', function(e) {
    if (!activeChatId) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 80 && diff > 0 && window.innerWidth <= 850) { closeChat(); }
});
console.log('💠 Wiriper Prime — Premium Ascendant Online');
</script>
