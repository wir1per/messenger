
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
        import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
        import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, getDocs, limit, increment, arrayUnion, arrayRemove, deleteDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

        const firebaseConfig = { apiKey: "AIzaSyAZOVyp3r8rPsLHQDUOHsodNZA6BP_pEh0", authDomain: "messagerin.firebaseapp.com", projectId: "messagerin", storageBucket: "messagerin.firebasestorage.app", messagingSenderId: "1071488457159", appId: "1:1071488457159:web:56c84b88f196ccbed1a1e2", measurementId: "G-WN2SYBQN1W" };
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

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
        const BACKGROUNDS = ['', 'linear-gradient(135deg,#1a1a24,#030305)', 'linear-gradient(135deg,#231610,#0a0502)', 'linear-gradient(135deg,#0a151b,#061015)', 'linear-gradient(135deg,#2e1a42,#110217)', 'url("https://www.transparenttextures.com/patterns/stardust.png")'];

        function $(id) { return document.getElementById(id); }

        function toast(t, icon) { icon = icon || '';
            const el = $('toast');
            el.innerHTML = icon + ' <span>' + t + '</span>';
            el.classList.add('show');
            setTimeout(() => el.classList.remove('show'), 3000); }

        function esc(s) { return (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }

        function emailFor(u) { return u.toLowerCase() + "@wiriper.app"; }

        function initials(name) { return (name || '?').trim().charAt(0).toUpperCase(); }

        function timeStr(ts) { if (!ts) return '';
            const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }); }

        function dateStr(ts) { if (!ts) return '';
            const d = ts.toDate ? ts.toDate() : new Date(ts); const now = new Date(); const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1); if (d.toDateString() === now.toDateString()) return 'امروز'; if (d
                .toDateString() === yesterday.toDateString()) return 'دیروز'; return d.toLocaleDateString('fa-IR', { month: 'long',
                day: 'numeric' }); }

        function privateChatId(a, b) { return [a, b].sort().join('_'); }

        function getLastSeenText(timestamp) { if (!timestamp) return 'اخیراً';
            const diff = Date.now() - timestamp.toMillis(); if (diff < 120000) return 'آنلاین'; if (diff < 3600000) return Math
                .floor(diff / 60000) + ' دقیقه پیش'; if (diff < 86400000) return Math.floor(diff / 3600000) + ' ساعت پیش'; return Math
                .floor(diff / 86400000) + ' روز پیش'; }

        function addRipple(e) { const btn = e.currentTarget;
            const ripple = document.createElement('span');
            ripple.className = 'ripple-effect';
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            btn.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600); }
        document.addEventListener('click', function(e) { const btn = e.target.closest('button'); if (btn && !btn.closest(
                '.msg-actions') && !btn.closest('.react-badge')) addRipple(e); });

        window.showMockModal = function(text) { $('mockText').textContent = text;
            let icon = '🚀'; if (text.includes('تماس')) icon = '📞'; if (text.includes('تصویری')) icon = '📹'; if (text.includes(
                'Secret')) icon = '🔒'; if (text.includes('صدا')) icon = '🎤';
            $('mockIcon').textContent = icon;
            openModal('mockModal');
            setTimeout(() => closeModal('mockModal'), 2200); };
        window.switchTab = function(t) { $('tabLogin').classList.toggle('active', t === 'login');
            $('tabReg').classList.toggle('active', t === 'reg');
            $('loginForm').style.display = t === 'login' ? 'block' : 'none';
            $('regForm').style.display = t === 'reg' ? 'block' : 'none';
            $('authMsg').classList.remove('show'); };

        function authMsg(t, ok) { const m = $('authMsg');
            m.textContent = t;
            m.className = 'auth-msg show ' + (ok ? 'ok' : 'err'); }
        window.toggleRoyalAudio = function() { const audio = $('royalAudio'); if (audio.paused) { audio.play();
                toast('سمفونی نهم در حال پخش...', '🎵'); } else { audio.pause();
                toast('پخش متوقف شد', '⏸️'); } };

        // ---------- SPLASH ----------
        setTimeout(() => { splashDone = true;
            checkAndProceed(); }, 2400);

        function checkAndProceed() { if (!splashDone || !authReady) return; if (offlineDetected) { $('splashScreen')
                .classList.add('hide');
                $('authScreen').style.display = 'flex';
                $('app').style.display = 'none';
                $('offlineOverlay').classList.add('show'); return; } $('splashScreen').classList.add('hide');
            setTimeout(() => { if (ME && pendingAuthUser) { enterApp(); } else if (!ME && !pendingAuthUser) { $('authScreen')
                    .style.display = 'flex';
                    $('app').style.display = 'none'; } }, 600); }
        window.retryConnection = function() { offlineDetected = false;
            $('offlineOverlay').classList.remove('show');
            authReady = false;
            pendingAuthUser = null;
            location.reload(); };

        // ---------- AUTH ----------
        window.doRegister = async function() { const name = $('rName').value.trim(),
                username = $('rUser').value.trim(), pass = $('rPass').value; if (!name || !username || !pass) return authMsg(
                    'همه فیلدها را پر کنید'); if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return authMsg(
                    'نام کاربری فقط انگلیسی و اعداد'); if (pass.length < 6) return authMsg('رمز حداقل ۶ کاراکتر');
            const uLower = username.toLowerCase(); try { authMsg('در حال ساخت قصر...', true);
                const taken = await getDoc(doc(db, 'usernames', uLower)); if (taken.exists()) return authMsg(
                    'این نام کاربری تصرف شده');
                const cred = await createUserWithEmailAndPassword(auth, emailFor(username), pass);
                const uid = cred.user.uid;
                await setDoc(doc(db, 'users', uid), { uid, username, usernameLower: uLower, displayName: name, bio: '',
                    photoURL: '', birthDate: '', credits: 500, isPremium: false, receivedGifts: [], giftScore: 0,
                    createdAt: serverTimestamp(), lastOnline: serverTimestamp() });
                await setDoc(doc(db, 'usernames', uLower), { uid });
                authMsg('تاج‌گذاری موفقیت‌آمیز!', true); } catch (e) { authMsg('خطا: ' + (e.message)); } };
        window.doLogin = async function() { const username = $('lUser').value.trim(),
            pass = $('lPass').value; if (!username || !pass) return authMsg('نام و رمز را وارد کنید'); try { authMsg(
                'در حال گشودن دروازه...', true);
            await signInWithEmailAndPassword(auth, emailFor(username), pass); } catch (e) { authMsg('اطلاعات ورود اشتباه است'); } };
        window.doLogout = async function() { if (!confirm('خروج کامل از قصر؟')) return; if (presenceInterval) clearInterval(
                presenceInterval);
            await signOut(auth);
            location.reload(); };
        onAuthStateChanged(auth, async function(user) { pendingAuthUser = user; if (user) { try { const snap = await getDoc(
                        doc(db, 'users', user.uid)); if (!snap.exists()) { await signOut(auth);
                        pendingAuthUser = null; } else { ME = snap.data(); }
                    offlineDetected = false; } catch (e) { offlineDetected = true;
                    ME = null;
                    pendingAuthUser = null;
                    toast('خطا در اتصال به سرور', '❌'); } } else { ME = null;
                pendingAuthUser = null;
                $('authScreen').style.display = 'flex';
                $('app').style.display = 'none'; }
            authReady = true;
            checkAndProceed(); });
        async function updatePresence() { if (ME) { try { await updateDoc(doc(db, 'users', ME.uid), { lastOnline: serverTimestamp() }); } catch (
                e) {} } }

        function enterApp() { $('authScreen').style.display = 'none';
            $('app').style.display = 'block';
            renderMeHeader();
            subscribeChats();
            updatePresence();
            presenceInterval = setInterval(updatePresence, 60000);
            onSnapshot(doc(db, 'users', ME.uid), function(s) { if (s.exists()) { ME = s.data();
                    renderMeHeader(); } }); }

        function renderMeHeader() { const title = ME.isPremium ? '👑 ' + ME.displayName : ME.displayName;
            $('meName').textContent = title;
            $('meId').textContent = '@' + ME.username;
            const av = $('meAvatar'); if (ME.photoURL) av.src = ME.photoURL;
            else { av.removeAttribute('src');
                av.style.background = 'var(--panel2)'; } if (ME.isPremium) av.classList.add('premium');
            else av.classList.remove('premium');
            $('btnRoyalDecree').style.display = ME.isPremium ? 'flex' : 'none'; }
        window.toggleMenu = function(e) { e.stopPropagation();
            const m = $('mainMenu');
            m.style.display = m.style.display === 'block' ? 'none' : 'block'; };
        window.toggleChatMenu = function(e) { e.stopPropagation();
            const m = $('chatMenu');
            m.style.display = m.style.display === 'block' ? 'none' : 'block'; };
        document.addEventListener('click', () => { $('mainMenu').style.display = 'none';
            $('chatMenu').style.display = 'none'; });
        document.addEventListener('keydown', function(e) { if (e.key === 'Escape') { $('mainMenu').style.display = 'none';
                $('chatMenu').style.display = 'none'; if ($('lightbox').classList.contains('show')) closeLightbox(); } });
        window.openModal = function(id) { $(id).classList.add('show'); };
        window.closeModal = function(id) { $(id).classList.remove('show'); };
        window.closeLightbox = function() { $('lightbox').classList.remove('show');
            setTimeout(() => $('lightbox').style.display = 'none', 260); };

        // ---------- TABS ----------
        window.switchMainTab = function(tab) { currentMainTab = tab;
            ['tabChats', 'tabDiscover', 'tabLeaders'].forEach(t => $(t).classList.remove('active'));
            $('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
            $('newMenuControls').style.display = tab === 'chats' ? 'flex' : 'none';
            $('globalSearch').parentElement.style.display = (tab === 'chats' || tab === 'discover') ? 'block' : 'none'; if (
                tab === 'chats') { $('listTitle').textContent = 'عمارت‌های شما';
                renderChatList(allMyChats); } else if (tab === 'discover') { $('listTitle').textContent =
                'دیوان‌های برتر';
                loadDiscover(); } else if (tab === 'leaders') { $('listTitle').textContent = 'تالار افتخارات';
                loadLeaders(); } };

        function subscribeChats() { const q = query(collection(db, 'chats'), where('members', 'array-contains', ME.uid));
            chatsUnsub = onSnapshot(q, function(snap) { allMyChats = [];
                snap.forEach(d => allMyChats.push({ id: d.id, ...d.data() }));
                allMyChats.sort((a, b) => { const ta = a.lastTime?.toMillis?.() || 0,
                    tb = b.lastTime?.toMillis?.() || 0; return tb - ta; }); if (currentMainTab === 'chats')
                    renderChatList(allMyChats); if (activeChatId) { const updated = allMyChats.find(c => c.id ===
                        activeChatId); if (updated) { activeChat = updated;
                        renderChatHeader();
                        checkJoinStatus();
                        checkPinnedMsg(); } } }); }

        async function renderChatList(chats, isDiscover) { isDiscover = isDiscover || false;
            const list = $('mainList');
            list.innerHTML = ''; if (chats.length === 0 && !isDiscover) { list.innerHTML =
                    '<div style="padding:30px;text-align:center;color:var(--muted)"><div style="font-size:50px;margin-bottom:10px;">📭</div><div>هنوز گفتگویی ندارید</div><div style="font-size:10px;margin-top:4px;">یک محفل یا دیوان بسازید</div></div>'; return; } for (
                const c of chats) { if (!c.type || (!c.name && c.type !== 'private')) continue;
                const meta = await chatDisplay(c);
                const div = document.createElement('div');
                div.className = 'chat-item' + (c.id === activeChatId ? ' active' : '');
                div.onclick = () => openChat(c.id, c);
                const tag = c.type === 'group' ? '<span class="tag">محفل</span>' : c.type === 'channel' ?
                    '<span class="tag">دیوان</span>' : '';
                const sub = isDiscover ? c.members.length + ' عضو' : esc(c.lastMessage || '');
                let dot = ''; if (c.type === 'private' && meta.userData && getLastSeenText(meta.userData.lastOnline) ===
                    'آنلاین') dot = '<span class="online-dot"></span>';
                let unreadHTML = ''; if (c.unreadCount && c.unreadCount > 0) unreadHTML = '<span class="unread-badge">' +
                    Math.min(c.unreadCount, 99) + '</span>';
                div.innerHTML = (meta.photo ? '<img class="av" src="' + meta.photo + '" loading="lazy">' :
                        '<div class="av">' + meta.icon + '</div>') + '<div class="ci-main"><div class="ci-name">' + esc(meta
                        .name) + ' ' + tag + ' ' + dot +
                    '</div><div class="ci-last">' + sub + '</div></div>' + unreadHTML + (!isDiscover ?
                    '<div class="ci-time">' + timeStr(c.lastTime) + '</div>' : '');
                list.appendChild(div); } }

        async function loadDiscover() { const list = $('mainList');
            list.innerHTML =
            '<div style="padding:24px;text-align:center;color:var(--muted)">در حال کاوش... 🌍</div>'; try { const q = query(
                    collection(db, 'chats'), where('type', '==', 'channel'), limit(30));
                const snap = await getDocs(q);
                let channels = [];
                snap.forEach(d => channels.push({ id: d.id, ...d.data() }));
                channels.sort((a, b) => b.members.length - a.members.length); if (channels.length === 0) list.innerHTML =
                    '<div style="padding:24px;text-align:center;color:var(--muted)">دیوانی یافت نشد.</div>';
                else renderChatList(channels, true); } catch (e) { list.innerHTML =
                '<div style="padding:24px;text-align:center;color:var(--danger)">خطا در شبکه</div>'; } }

        async function loadLeaders() { const list = $('mainList');
            list.innerHTML =
            '<div style="padding:24px;text-align:center;color:var(--muted)">احضار اشراف... 👑</div>'; try { const q = query(
                    collection(db, 'users'), orderBy('giftScore', 'desc'), limit(25));
                const snap = await getDocs(q);
                list.innerHTML = '';
                let rank = 1;
                snap.forEach(d => { const u = d.data();
                    const div = document.createElement('div');
                    div.className = 'chat-item';
                    div.onclick = () => viewUser(u.uid);
                    const icon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank;
                    div.innerHTML = (u.photoURL ? '<img class="av" src="' + u.photoURL + '" loading="lazy">' :
                        '<div class="av">' + initials(u.displayName) + '</div>') +
                        '<div class="ci-main"><div class="ci-name">' + (u.isPremium ? '👑' : '') + esc(u.displayName) +
                        ' <span>' + icon + '</span></div><div class="ci-last" style="color:var(--gold2);">⭐ ' + (u
                            .giftScore || 0) + '</div></div>';
                    list.appendChild(div);
                    rank++; }); } catch (e) { list.innerHTML =
                '<div style="padding:24px;text-align:center;color:var(--danger)">نیاز به Index در فایربیس</div>'; } }
        const userCache = {};
        async function getUser(uid) { if (userCache[uid]) return userCache[uid]; try { const s = await getDoc(doc(db,
                    'users', uid)); if (s.exists()) { userCache[uid] = s.data(); return userCache[uid]; } } catch (e) {} return {
                displayName: 'کاربر غایب',
                username: '',
                photoURL: '',
                uid: uid }; }

        async function chatDisplay(c) { if (c.type === 'private') { const other = c.members.find(m => m !== ME.uid) || ME
                    .uid;
                const u = await getUser(other);
                const title = u.isPremium ? '👑 ' + u.displayName : u.displayName; return { name: title, photo: u.photoURL,
                    icon: initials(u.displayName), userData: u }; } return { name: c.name, photo: c.photoURL, icon: c.type ===
                    'channel' ? '📢' : '👥' }; }

        // ---------- TYPING INDICATOR ----------
        function subscribeTyping(chatId) { if (typingUnsub) typingUnsub();
            typingUnsub = onSnapshot(doc(db, 'chats', chatId, 'typing', 'status'), function(snap) { if (snap.exists() && snap
                    .data().users && snap.data().users.length > 0) { const typingUsers = snap.data().users.filter(uid =>
                        uid !== ME.uid); if (typingUsers.length > 0) { showTyping(typingUsers); } else { hideTyping(); } } else {
                    hideTyping(); } }); }
        async function showTyping(uids) { if (uids.length === 0) return hideTyping();
            const u = await getUser(uids[0]);
            const name = u.displayName || 'کاربر';
            $('typingName').textContent = name;
            $('typingIndicator').classList.add('show'); }
        function hideTyping() { $('typingIndicator').classList.remove('show'); }
        window.handleTyping = function() { if (!activeChatId) return; if (typingTimer) clearTimeout(typingTimer);
            updateDoc(doc(db, 'chats', activeChatId, 'typing', 'status'), { users: arrayUnion(ME.uid) }).catch(() => {});
            typingTimer = setTimeout(() => { updateDoc(doc(db, 'chats', activeChatId, 'typing', 'status'), { users: arrayRemove(
                        ME.uid) }).catch(() => {}); }, 3000); };

        // ---------- OPEN CHAT ----------
        window.openChat = async function(chatId, chatDataObj) { activeChatId = chatId; if (chatDataObj) activeChat =
                chatDataObj;
            else { const s = await getDoc(doc(db, 'chats', chatId)); if (!s.exists()) return toast('عمارت یافت نشد',
                '❌');
                activeChat = { id: chatId, ...s.data() }; } $('emptyChat').style.display = 'none';
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
            document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active')); };
        window.closeChat = function() { $('chatPanel').classList.remove('open');
            activeChatId = null; if (typingUnsub) typingUnsub(); };

        async function renderChatHeader() { if (!activeChat) return;
            const meta = await chatDisplay(activeChat);
            $('hName').textContent = meta.name;
            const hav = $('hAv'); if (meta.photo) hav.innerHTML = '<img src="' + meta.photo +
                '" style="width:100%;height:100%;border-radius:50%;object-fit:cover" loading="lazy">';
            else hav.textContent = meta.icon; if (activeChat.type === 'private') { const u = meta.userData;
                $('hSub').textContent = getLastSeenText(u.lastOnline);
                $('hSub').style.color = getLastSeenText(u.lastOnline) === 'آنلاین' ? 'var(--green)' : 'var(--gold2)'; } else if (
                activeChat.type === 'group') { $('hSub').textContent = activeChat.members.length + ' حاضر';
                $('hSub').style.color = 'var(--gold2)'; } else { const lvl = Math.floor((activeChat.boosts || 0) / 5) + 1;
                $('hSub').textContent = 'دیوان سطح ' + lvl + ' (' + (activeChat.boosts || 0) + ' 🚀)';
                $('hSub').style.color = 'var(--gold2)'; } }

        function applyBackground(bg) { $('messages').style.backgroundImage = bg || '';
            $('messages').style.backgroundColor = bg ? '' : 'var(--bg)'; }

        function checkJoinStatus() { if (activeChat.type === 'channel' && !activeChat.members.includes(ME.uid)) { $(
                'inputBar').style.display = 'none';
                $('joinBar').style.display = 'block'; } else { $('joinBar').style.display = 'none';
                $('inputBar').style.display = 'flex'; } }

        function checkPinnedMsg() { if (activeChat && activeChat.pinnedMsg) { $('pinnedBar').style.display = 'block';
                $('pinnedText').textContent = activeChat.pinnedMsg.text;
                $('pinnedBar').dataset.id = activeChat.pinnedMsg.id; } else { $('pinnedBar').style.display = 'none'; } }
        window.scrollToPinned = function() { const id = $('pinnedBar').dataset.id;
            const el = document.getElementById('msg_' + id); if (el) { el.scrollIntoView({ behavior: 'smooth',
                    block: 'center' });
                const bub = el.querySelector('.bubble'); if (bub) { bub.style.boxShadow = '0 0 30px rgba(212,168,50,0.65)';
                    setTimeout(() => { if (bub) bub.style.boxShadow = ''; }, 2000); } } };
        window.joinCurrentChannel = async function() { if (!activeChatId) return;
            toast('در حال ورود...', '⏳');
            await updateDoc(doc(db, 'chats', activeChatId), { members: arrayUnion(ME.uid) });
            activeChat.members.push(ME.uid);
            checkJoinStatus();
            renderChatHeader();
            toast('به دیوان پیوستید!', '✅'); };

        // ---------- MESSAGES WITH DATE SEPARATORS ----------
        function subscribeMessages(chatId) { if (msgUnsub) msgUnsub();
            const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'), limit(300));
            msgUnsub = onSnapshot(q, function(snap) { const box = $('messages');
                const wasAtBottom = box.scrollHeight - box.scrollTop <= box.clientHeight + 100;
                box.innerHTML = '';
                lastMessageDates = {};
                let prevDate = null;
                snap.forEach(d => { const m = d.data(); if (m.createdAt) { const curDate = dateStr(m.createdAt); if (
                        curDate !== prevDate) { const sep = document.createElement('div');
                        sep.className = 'date-separator';
                        sep.innerHTML = '<span>' + curDate + '</span>';
                        box.appendChild(sep);
                        prevDate = curDate; } }
                    renderMessage(d.id, m); }); if (wasAtBottom) setTimeout(() => box.scrollTo({ top: box.scrollHeight,
                        behavior: 'smooth' }), 30); }); }

        function renderMessage(id, m) { const box = $('messages');
            const mine = m.senderId === ME.uid;
            const row = document.createElement('div');
            row.className = 'msg-row' + (mine ? ' me' : '');
            row.id = 'msg_' + id;
            const showSender = !mine && (activeChat.type !== 'private');
            const isPremiumUser = m.senderIsPremium;
            const isDecree = m.isRoyalDecree ? 'royal-decree' : (isPremiumUser && mine ? 'premium-msg' : '');
            const tempClass = m.temp ? 'temp-msg' : '';
            let inner = '';
            let replyHTML = ''; if (m.replyTo) { replyHTML = '<div class="reply-box" onclick="document.getElementById(\'msg_' +
                    m.replyTo.id + '\')?.scrollIntoView({behavior:\'smooth\',block:\'center\'})"><div class="r-sender">' +
                    esc(m.replyTo.sender) + '</div><div class="r-text">' + esc(m.replyTo.text) + '</div></div>'; } if (m.type ===
                'gift') { row.innerHTML = '<div class="bubble gift-bubble pop-in"><div class="g-emoji">' + m.gift +
                    '</div><div class="g-txt">پیشکش ⭐' + m.giftValue + '</div><div class="b-meta">' + timeStr(m.createdAt) +
                    '</div></div>';
                box.appendChild(row); return; } else if (m.type === 'image') { inner = '<img class="b-img" src="' + m.mediaURL +
                    '" loading="lazy" onclick="if(!\'' + m.temp + '\')showLightbox(\'' + m.mediaURL + '\')">'; if (m.text)
                    inner += '<div class="b-text" style="margin-top:4px">' + esc(m.text) + '</div>'; } else if (m.type ===
                'video') { inner = '<video class="b-video" src="' + m.mediaURL +
                '" controls preload="metadata"></video>'; if (m.text) inner += '<div class="b-text" style="margin-top:4px">' +
                    esc(m.text) + '</div>'; } else if (m.type === 'file') { inner = '<a class="b-file" href="' + m.mediaURL +
                    '" target="_blank" download><span class="fi">📜</span><span class="f-name">' + esc(m.fileName || 'طومار') +
                    '</span></a>'; } else { inner = '<div class="b-text" id="txt_' + id + '">' + esc(m.text) + '</div>'; } if (
                !mine && !m.temp && (!m.readBy || !m.readBy.includes(ME.uid))) { updateDoc(doc(db, 'chats', activeChatId,
                    'messages', id), { readBy: arrayUnion(ME.uid) }).catch(() => {}); }
            let reactHTML = ''; if (m.reactions && Object.keys(m.reactions).length > 0 && !m.temp) { reactHTML =
                    '<div class="reactions-display">'; for (const [emoji, users] of Object.entries(m.reactions)) { if (users
                        .length > 0) { const iReacted = users.includes(ME.uid);
                        reactHTML += '<div class="react-badge ' + (iReacted ? 'reacted' : '') +
                            '" onclick="toggleReaction(\'' + id + '\',\'' + emoji + '\')">' + emoji + ' <span>' + users
                            .length + '</span></div>'; } }
                reactHTML += '</div>'; }
            const editedTag = m.edited ?
                '<span style="font-size:6px;font-style:italic;opacity:0.5;">ویرایش</span>' : '';
            const senderTag = showSender ? '<div class="b-sender" style="color:' + (isPremiumUser ? 'var(--gold)' :
                    'var(--gold2)') + '" onclick="viewUser(\'' + m.senderId + '\')">' + (isPremiumUser ? '👑' : '') + esc(m
                    .senderName) + '</div>' : '';
            const isSeen = m.readBy && m.readBy.length > 0;
            const tickIcon = mine && !m.temp ? (isSeen ? '<span class="tick seen">✓✓</span>' :
                '<span class="tick sent">✓</span>') : (m.temp ? '<span class="tick sent">⏳</span>' : '');
            const lvl = Math.floor((activeChat ? activeChat.boosts || 0 : 0) / 5) + 1;
            const customReact = lvl >= 2 ? '<button onclick="toggleReaction(\'' + id +
                '\',\'🦄\')" title="لول۲">🦄</button>' : '';
            const actions = !m.temp && m.type !== 'gift' ? '<div class="msg-actions"><button onclick="startReply(\'' + id +
                '\',this)" title="پاسخ">↩️</button><button onclick="pinMsg(\'' + id +
                '\',this)" title="سنجاق">📌</button><button onclick="translateMsg(\'' + id +
                '\')" title="ترجمه">🌍</button><span style="width:1px;background:rgba(255,255,255,0.12);margin:0 2px;"></span><button onclick="toggleReaction(\'' +
                id + '\',\'❤️\')">❤️</button><button onclick="toggleReaction(\'' + id +
                '\',\'🔥\')">🔥</button><button onclick="toggleReaction(\'' + id + '\',\'😂\')">😂</button>' + customReact + (
                mine && m.type === 'text' ? '<button onclick="startEdit(\'' + id +
                '\',this)" title="ویرایش">✏️</button>' : '') + (mine ? '<button onclick="deleteMessage(\'' + id +
                '\')" style="color:var(--danger)" title="حذف">🗑</button>' : '') + '</div>' : '';
            row.innerHTML = '<div class="bubble ' + isDecree + ' ' + tempClass + '">' + actions + senderTag + replyHTML +
                inner + '<div id="trans_' + id + '" class="translated-txt" style="display:none;"></div>' + reactHTML +
                '<div class="b-meta">' + editedTag + '<span>' + timeStr(m.createdAt) + '</span>' + tickIcon +
                '</div></div>';
            let pureText = m.text || ''; if (m.type === 'image' && pureText === '') pureText = '📷 تصویر'; if (m.type ===
                'video' && pureText === '') pureText = '🎬 ویدیو'; if (m.type === 'file' && pureText === '') pureText =
                '📜 فایل';
            row.querySelector('.bubble').dataset.text = pureText;
            row.querySelector('.bubble').dataset.senderName = m.senderName;
            box.appendChild(row); }

        window.toggleReaction = async function(msgId, emoji) { if (!activeChatId) return;
            const msgRef = doc(db, 'chats', activeChatId, 'messages', msgId);
            const snap = await getDoc(msgRef); if (snap.exists()) { let data = snap.data(); let reactions = data.reactions ||
                {}; if (!reactions[emoji]) reactions[emoji] = []; if (reactions[emoji].includes(ME.uid)) reactions[emoji] =
                    reactions[emoji].filter(id => id !== ME.uid);
                else reactions[emoji].push(ME.uid);
                await updateDoc(msgRef, { reactions }); } };
        window.showLightbox = function(url) { $('lbImg').src = url;
            $('lightbox').style.display = 'flex';
            requestAnimationFrame(() => { $('lightbox').classList.add('show');
                $('lightbox').style.opacity = '1'; }); };

        // ---------- ACTIONS ----------
        window.startReply = function(id, btn) { const bubble = btn.closest('.bubble');
            actionState = { type: 'reply', id, sender: bubble.dataset.senderName, text: bubble.dataset.text };
            $('abIcon').textContent = '↩️';
            $('abTitle').textContent = 'پاسخ به ' + actionState.sender;
            $('abText').textContent = actionState.text;
            $('actionBanner').style.display = 'flex';
            $('msgInput').focus(); };
        window.startEdit = function(id, btn) { const bubble = btn.closest('.bubble');
            actionState = { type: 'edit', id };
            $('abIcon').textContent = '✏️';
            $('abTitle').textContent = 'ویرایش';
            $('abText').textContent = bubble.dataset.text;
            $('actionBanner').style.display = 'flex';
            $('msgInput').value = bubble.dataset.text;
            $('msgInput').focus();
            autoGrow($('msgInput')); };
        window.cancelAction = function() { actionState = { type: null, id: null };
            $('actionBanner').style.display = 'none';
            $('msgInput').value = ''; };
        window.pinMsg = async function(id, btn) { if (!activeChatId) return;
            const bubble = btn.closest('.bubble');
            let text = bubble.dataset.text; if (text.length > 40) text = text.substring(0, 40) + '...';
            await updateDoc(doc(db, 'chats', activeChatId), { pinnedMsg: { id, text } });
            toast('سنجاق شد 📌', '✔'); };
        window.translateMsg = function(id) { const txtDiv = document.getElementById('txt_' + id),
                transDiv = document.getElementById('trans_' + id); if (!txtDiv || !transDiv) return toast('فقط متن',
                '⚠️'); if (transDiv.style.display === 'block') { transDiv.style.display = 'none'; return; }
            transDiv.style.display = 'block';
            transDiv.textContent = '⏳ ترجمه...';
            setTimeout(() => { transDiv.textContent = 'ترجمه: ' + txtDiv.textContent; }, 800); };
        window.deleteMessage = async function(id) { try { await deleteDoc(doc(db, 'chats', activeChatId, 'messages', id));
                toast('پاک شد 🧹', '✨'); } catch (e) { toast('خطا', '❌'); } };
        window.deleteActiveChat = async function() { if (!confirm('انحلال کامل؟')) return; try { await deleteDoc(doc(db,
                    'chats', activeChatId));
                closeModal('chatInfoModal');
                clearActiveChat();
                toast('منحل شد', '🗑️'); } catch (e) { toast('خطا', '❌'); } };

        // ---------- SEND WITH OPTIMISTIC UI ----------
        window.autoGrow = function(el) { el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 110) + 'px'; };
        window.toggleRoyalDecree = function() { isRoyalDecreeMode = !isRoyalDecreeMode;
            $('btnRoyalDecree').style.background = isRoyalDecreeMode ? 'rgba(212,168,50,0.25)' : 'rgba(255,255,255,0.025)';
            $('btnRoyalDecree').style.boxShadow = isRoyalDecreeMode ? 'var(--gold-glow)' : 'none';
            $('btnRoyalDecree').style.color = isRoyalDecreeMode ? '#fff' : 'var(--gold2)';
            toast(isRoyalDecreeMode ? 'فرمان سلطنتی روشن 📜' : 'حالت عادی'); };
        window.sendMessage = async function() { const input = $('msgInput');
            const text = input.value.trim(); if (!activeChatId) return; if (actionState.type === 'edit') { if (!text) return;
                await updateDoc(doc(db, 'chats', activeChatId, 'messages', actionState.id), { text, edited: true });
                cancelAction();
                input.value = '';
                autoGrow(input); return; } if (activeChat.type === 'channel' && activeChat.owner !== ME.uid && !(activeChat
                    .admins || []).includes(ME.uid)) return toast('فقط مالک و وزرا', '⚠️'); if (!text) return;
            let payload = { type: 'text', text, isRoyalDecree: isRoyalDecreeMode && ME.isPremium }; if (actionState.type ===
                'reply') payload.replyTo = { id: actionState.id, sender: actionState.sender, text: actionState.text.substring(
                    0, 60) };
            input.value = '';
            autoGrow(input);
            cancelAction();
            const tempId = 'optimistic_' + Date.now();
            const tempMsg = { id: tempId, senderId: ME.uid, senderName: ME.displayName, senderIsPremium: ME.isPremium ||
                    false, createdAt: new Date(), edited: false, deleted: false, reactions: {}, readBy: [], ...payload,
                temp: true };
            renderMessage(tempId, tempMsg);
            const box = $('messages');
            box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
            await pushMessage(payload);
            const tempEl = document.getElementById('msg_' + tempId); if (tempEl) tempEl.remove();
            isRoyalDecreeMode = false;
            $('btnRoyalDecree').style.background = 'rgba(255,255,255,0.025)';
            $('btnRoyalDecree').style.boxShadow = 'none';
            $('btnRoyalDecree').style.color = 'var(--gold2)';
            updateDoc(doc(db, 'chats', activeChatId, 'typing', 'status'), { users: arrayRemove(ME.uid) }).catch(() => {}); };
        async function pushMessage(data) { const msg = { senderId: ME.uid, senderName: ME.displayName,
                senderIsPremium: ME.isPremium || false, createdAt: serverTimestamp(), edited: false, deleted: false,
                reactions: {}, readBy: [], ...data };
            await addDoc(collection(db, 'chats', activeChatId, 'messages'), msg);
            let preview = data.text || (data.type === 'image' ? '📷' : data.type === 'video' ? '🎬' : data.type === 'file' ?
                '📜' : data.type === 'gift' ? '🎁' : 'پیام'); if (data.isRoyalDecree) preview = '📜 فرمان';
            await updateDoc(doc(db, 'chats', activeChatId), { lastMessage: preview.slice(0, 40), lastTime: serverTimestamp() }); }

        // ---------- FILE UPLOAD ----------
        window.handleFileSelect = async function(e) { const file = e.target.files[0];
            e.target.value = ''; if (!file || !activeChatId) return; if (file.size > 40 * 1024 * 1024) return toast(
                'حجم زیاد', '⚠️');
            const previewId = 'temp_' + Date.now();
            const reader = new FileReader();
            reader.onload = async function(event) { let type = 'file'; if (file.type.startsWith('image/')) type = 'image';
                else if (file.type.startsWith('video/')) type = 'video';
                const tempMsg = { id: previewId, senderId: ME.uid, senderName: ME.displayName, type, mediaURL: event.target
                        .result, fileName: file.name, text: '⏳ در حال ارسال...', createdAt: new Date(), temp: true,
                    reactions: {} };
                renderMessage(previewId, tempMsg);
                $('messages').scrollTo({ top: $('messages').scrollHeight, behavior: 'smooth' }); try { const formData =
                        new FormData();
                    formData.append('image', file);
                    formData.append('key', '39ff6b8fa6551faed4ba25549faf1211');
                    const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
                    const data = await res.json(); if (data.success) { const url = data.data.url;
                        let payload = { type, mediaURL: url, fileName: file.name, text: '' }; if (actionState.type ===
                            'reply') payload.replyTo = { id: actionState.id, sender: actionState.sender, text: actionState
                                .text };
                        await pushMessage(payload);
                        cancelAction();
                        const tempEl = document.getElementById('msg_' + previewId); if (tempEl) tempEl.remove();
                        toast('ارسال شد', '✔'); } else { const tempEl = document.getElementById('msg_' + previewId); if (
                            tempEl) tempEl.remove();
                        toast('ImgBB فقط تصویر', '🚨'); } } catch (err) { toast('خطای سرور', '❌');
                    const tempEl = document.getElementById('msg_' + previewId); if (tempEl) tempEl.remove(); } };
            reader.readAsDataURL(file); };

        // ---------- PREMIUM ----------
        window.openPremiumModal = function() { $('mainMenu').style.display = 'none'; if (ME.isPremium) return toast(
                'شما پادشاه هستید! 👑');
            openModal('premiumModal'); };
        window.buyPremium = async function() { if ((ME.credits || 0) < 500) return toast('اعتبار ناکافی', '⚠️');
            await updateDoc(doc(db, 'users', ME.uid), { credits: increment(-500), isPremium: true });
            ME.credits -= 500;
            ME.isPremium = true;
            closeModal('premiumModal');
            toast('ارتقا یافتید! 👑', '🎉');
            renderMeHeader(); };
        window.boostChannel = async function() { if (!activeChat || activeChat.type !== 'channel') return; if ((ME.credits ||
                0) < 50) return toast('نیاز به ۵۰ سکه', '⚠️');
            await updateDoc(doc(db, 'users', ME.uid), { credits: increment(-50) });
            await updateDoc(doc(db, 'chats', activeChatId), { boosts: increment(1) });
            ME.credits -= 50;
            activeChat.boosts = (activeChat.boosts || 0) + 1;
            renderChatHeader();
            toast('دیوان ارتقا یافت! 🚀', '⚡'); };

        // ---------- PROFILE ----------
        window.openMyProfile = function() { $('mainMenu').style.display = 'none';
            $('ppName').value = ME.displayName;
            $('ppBirth').value = ME.birthDate || '';
            $('ppBio').value = ME.bio || '';
            $('ppUser').value = '@' + ME.username;
            $('ppCredit').textContent = ME.credits || 0;
            $('ppGiftScore').textContent = ME.giftScore || 0;
            const av = $('ppAv'); if (ME.photoURL) { av.src = ME.photoURL;
                av.style.display = 'block'; } else av.removeAttribute('src'); if (ME.isPremium) av.style.borderColor =
                '#8957e5';
            const gBox = $('myGiftsGallery'); if (ME.receivedGifts && ME.receivedGifts.length > 0) { gBox.innerHTML = ME
                    .receivedGifts.map(g => '<div class="gift-gallery-item"><div style="font-size:28px;">' + g.emoji +
                        '</div><div style="font-size:10px;color:var(--gold);margin-top:5px;">از ' + g.sender +
                        '</div></div>').reverse().join(''); } else gBox.innerHTML =
                '<div style="color:var(--muted);padding:6px;">خالی</div>';
            openModal('myProfileModal'); };
        window.saveProfile = async function() { const name = $('ppName').value.trim(),
            bio = $('ppBio').value.trim(), birth = $('ppBirth').value; if (!name) return toast('نام خالی', '⚠️'); try {
                await updateDoc(doc(db, 'users', ME.uid), { displayName: name, bio, birthDate: birth });
                ME.displayName = name;
                ME.bio = bio;
                ME.birthDate = birth;
                renderMeHeader();
                toast('ذخیره شد', '✔');
                closeModal('myProfileModal'); } catch (e) { toast('خطا', '❌'); } };
        window.uploadAvatar = async function(e) { const file = e.target.files[0];
            e.target.value = ''; if (!file) return;
            toast('⏳ آپلود...'); try { const formData = new FormData();
            formData.append('image', file);
            formData.append('key', '39ff6b8fa6551faed4ba25549faf1211');
            const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
            const data = await res.json(); if (data.success) { const url = data.data.url;
                await updateDoc(doc(db, 'users', ME.uid), { photoURL: url });
                ME.photoURL = url;
                $('ppAv').src = url;
                renderMeHeader();
                toast('پرتره ذخیره شد 🎨', '✔'); } else toast('خطا', '🚨'); } catch (err) { toast('خطای سرور', '❌'); } };
        window.viewUser = async function(uid) { if (uid === ME.uid) { openMyProfile(); return; }
            const u = await getUser(uid);
            viewedUser = u;
            const title = u.isPremium ? '👑 ' + u.displayName : u.displayName;
            $('upName').textContent = title;
            $('upId').textContent = '@' + u.username;
            $('upStatus').textContent = getLastSeenText(u.lastOnline);
            $('upStatus').style.color = getLastSeenText(u.lastOnline) === 'آنلاین' ? 'var(--green)' : 'var(--muted)'; if (u
                .birthDate) { $('upBirth').style.display = 'block';
                $('upBirthVal').textContent = '🎂 ' + u.birthDate; } else $('upBirth').style.display = 'none';
            const av = $('upAv'); if (u.photoURL) av.innerHTML = '<img src="' + u.photoURL +
                '" style="width:100%;height:100%;border-radius:50%;object-fit:cover" loading="lazy">';
            else av.textContent = initials(u.displayName);
            av.style.border = u.isPremium ? '3px solid #8957e5' : '3px solid var(--gold2)'; if (u.bio) { $('upBio').style
                    .display = 'block';
                $('upBio').textContent = u.bio; } else $('upBio').style.display = 'none';
            const gBox = $('userGiftsGallery'); if (u.receivedGifts && u.receivedGifts.length > 0) { gBox.innerHTML = u
                    .receivedGifts.map(g => '<div class="gift-gallery-item"><div style="font-size:28px;">' + g.emoji +
                        '</div><div style="font-size:10px;color:var(--gold);margin-top:5px;">از ' + g.sender +
                        '</div></div>').reverse().join(''); } else gBox.innerHTML =
                '<div style="color:var(--muted);padding:6px;">خالی</div>';
            openModal('userProfileModal'); };
        window.startChatWithViewedUser = async function() { closeModal('userProfileModal'); await openOrCreatePrivate(
                viewedUser.uid, viewedUser); };
        async function openOrCreatePrivate(otherUid, otherData) { const cid = privateChatId(ME.uid, otherUid);
            const ref = doc(db, 'chats', cid);
            const s = await getDoc(ref); if (!s.exists()) await setDoc(ref, { type: 'private', members: [ME.uid, otherUid]
                    .sort(), lastMessage: '', lastTime: serverTimestamp(), background: '' });
            userCache[otherUid] = otherData;
            openChat(cid); }

        // ---------- SEARCH ----------
        let searchTimer = null;
        window.onSearchInput = function() { clearTimeout(searchTimer);
            searchTimer = setTimeout(runSearch, 260); };
        async function runSearch() { let term = $('globalSearch').value.trim().toLowerCase().replace(/^@/, '');
            const box = $('mainList'); if (!term) { switchMainTab(currentMainTab); return; }
            $('listTitle').textContent = 'نتایج جستجو';
            box.innerHTML = '<div style="padding:24px;text-align:center;color:var(--muted)">🔍 جستجو...</div>'; try { const
                    uQ = query(collection(db, 'users'), where('usernameLower', '>=', term), where('usernameLower', '<=',
                        term + '\uf8ff'), limit(15));
                const uSnap = await getDocs(uQ);
                const cQ = query(collection(db, 'chats'), where('type', '==', 'channel'), limit(30));
                const cSnap = await getDocs(cQ);
                box.innerHTML = '';
                let found = false;
                uSnap.forEach(d => { const u = d.data(); if (u.uid === ME.uid) return;
                    found = true;
                    const div = document.createElement('div');
                    div.className = 'chat-item';
                    div.onclick = () => { openOrCreatePrivate(u.uid, u);
                        $('globalSearch').value = '';
                        switchMainTab('chats'); };
                    let dot = getLastSeenText(u.lastOnline) === 'آنلاین' ? '<span class="online-dot"></span>' : '';
                    div.innerHTML = (u.photoURL ? '<img class="av" src="' + u.photoURL + '" loading="lazy">' :
                        '<div class="av">' + initials(u.displayName) + '</div>') +
                        '<div class="ci-main"><div class="ci-name">' + (u.isPremium ? '👑' : '') + esc(u.displayName) +
                        ' ' + dot + '</div><div class="ci-last">@' + esc(u.username) + '</div></div>';
                    box.appendChild(div); });
                cSnap.forEach(d => { const c = d.data(); if (c.name && c.name.toLowerCase().includes(term)) { found =
                        true;
                        const div = document.createElement('div');
                        div.className = 'chat-item';
                        div.onclick = () => { openChat(d.id, { id: d.id, ...c });
                            $('globalSearch').value = '';
                            switchMainTab('chats'); };
                        div.innerHTML = '<div class="av">📢</div><div class="ci-main"><div class="ci-name">' + esc(c
                            .name) + ' <span class="tag">دیوان</span></div><div class="ci-last">' + c.members
                            .length + ' عضو</div></div>';
                        box.appendChild(div); } }); if (!found) box.innerHTML =
                    '<div style="padding:24px;text-align:center;color:var(--muted)">نتیجه‌ای یافت نشد</div>'; } catch (e) {
                box.innerHTML = '<div style="padding:24px;text-align:center;color:var(--danger)">خطا</div>'; } }

        // ---------- GROUPS & CHANNELS ----------
        window.loadMemberPicker = async function() { const box = $('grpMembers');
            box.innerHTML = 'فراخوانی...';
            const snap = await getDocs(query(collection(db, 'users'), limit(50)));
            box.innerHTML = '';
            snap.forEach(d => { const u = d.data(); if (u.uid === ME.uid) return;
                const div = document.createElement('div');
                div.className = 'member-pick';
                div.dataset.uid = u.uid;
                div.onclick = () => div.classList.toggle('sel');
                div.innerHTML = (u.photoURL ? '<img class="av" style="width:32px;height:32px" src="' + u.photoURL +
                    '" loading="lazy">' : '<div class="av" style="width:32px;height:32px">' + initials(u.displayName) +
                    '</div>') + '<div class="ci-main"><div class="ci-name" style="font-size:12px">' + (u.isPremium ? '👑' :
                        '') + esc(u.displayName) + '</div><div class="ci-last" style="font-size:9px">@' + esc(u.username) +
                    '</div></div><span style="color:var(--gold2);">انتخاب</span>';
                box.appendChild(div); }); };
        window.createGroup = async function() { const name = $('grpName').value.trim(); if (!name) return toast('نام وارد شود',
                '⚠️');
            const sel = [...document.querySelectorAll('#grpMembers .member-pick.sel')].map(e => e.dataset.uid);
            const ref = await addDoc(collection(db, 'chats'), { type: 'group', name, photoURL: '', owner: ME.uid, admins: [],
                members: [ME.uid, ...sel], lastMessage: 'محفل دایر شد', lastTime: serverTimestamp(), background: '' });
            closeModal('newGroupModal');
            $('grpName').value = '';
            toast('محفل ساخته شد', '✔');
            openChat(ref.id); };
        window.createChannel = async function() { const name = $('chName').value.trim(),
            desc = $('chDesc').value.trim(); if (!name) return toast('نام وارد شود', '⚠️');
            const ref = await addDoc(collection(db, 'chats'), { type: 'channel', name, nameLower: name.toLowerCase(),
                description: desc, photoURL: '', owner: ME.uid, admins: [], members: [ME.uid], boosts: 0, lastMessage: 'دیوان دایر شد',
                lastTime: serverTimestamp(), background: '' });
            closeModal('newChannelModal');
            $('chName').value = '';
            $('chDesc').value = '';
            toast('دیوان ساخته شد', '✔');
            openChat(ref.id); };

        // ---------- CHAT INFO ----------
        window.openChatInfo = async function() { if (!activeChat) return;
            const meta = await chatDisplay(activeChat);
            $('ciName').textContent = meta.name;
            const av = $('ciAv'); if (meta.photo) av.innerHTML = '<img src="' + meta.photo +
                '" style="width:100%;height:100%;border-radius:50%;object-fit:cover" loading="lazy">';
            else av.textContent = meta.icon; if (activeChat.type === 'private') { const other = activeChat.members.find(m =>
                    m !== ME.uid) || ME.uid;
                closeModal('chatInfoModal');
                viewUser(other); return; }
            $('ciMembersTitle').style.display = 'block';
            $('ciMembers').style.display = 'block'; if (activeChat.type === 'channel') { const lvl = Math.floor((activeChat
                        .boosts || 0) / 5) + 1;
                $('ciBoosts').style.display = 'inline-block';
                $('ciBoosts').textContent = 'لول ' + lvl + ' (' + (activeChat.boosts || 0) + ' 🚀)';
                $('ciSub').textContent = activeChat.members.length + ' دنبال‌کننده';
                $('channelSettingsUI').style.display = activeChat.owner === ME.uid ? 'block' : 'none'; } else { $('ciBoosts')
                    .style.display = 'none';
                $('channelSettingsUI').style.display = activeChat.owner === ME.uid ? 'block' : 'none';
                $('ciSub').textContent = activeChat.members.length + ' عضو'; } if (activeChat.description) { $('ciDesc').style
                    .display = 'block';
                $('ciDesc').textContent = activeChat.description; } else $('ciDesc').style.display = 'none';
            const mbox = $('ciMembers');
            mbox.innerHTML = ''; for (const uid of activeChat.members) { const u = await getUser(uid);
                const div = document.createElement('div');
                div.className = 'member-pick';
                div.style.background = 'rgba(0,0,0,0.4)';
                const isOwner = uid === activeChat.owner;
                const isAdmin = (activeChat.admins || []).includes(uid);
                const badge = isOwner ?
                    '<span style="background:var(--danger);color:#fff;padding:2px 5px;border-radius:5px;font-size:8px;">👑 مالک</span>' :
                    (isAdmin ?
                        '<span style="background:#007aff;color:#fff;padding:2px 5px;border-radius:5px;font-size:8px;">🛡️ وزیر</span>' :
                        '');
                div.innerHTML = (u.photoURL ? '<img class="av" style="width:32px;height:32px" src="' + u.photoURL +
                    '" loading="lazy">' : '<div class="av" style="width:32px;height:32px">' + initials(u.displayName) +
                    '</div>') + '<div class="ci-main" onclick="closeModal(\'chatInfoModal\');viewUser(\'' + uid +
                    '\');"><div class="ci-name" style="font-size:12px">' + (u.isPremium ? '👑' : '') + esc(u.displayName) +
                    ' ' + badge + '</div><div class="ci-last" style="font-size:9px">@' + esc(u.username) + '</div></div>'; if (
                    ME.uid === activeChat.owner && !isOwner) { const btn = document.createElement('button');
                    btn.textContent = isAdmin ? 'عزل' : 'نصب';
                    btn.style.cssText =
                        'padding:4px 8px;font-size:9px;background:rgba(212,168,50,0.12);color:var(--gold2);border-radius:8px;font-weight:800;cursor:pointer;border:1px solid rgba(212,168,50,0.2);';
                    btn.onclick = (e) => { e.stopPropagation();
                        toggleAdmin(uid, isAdmin); };
                    div.appendChild(btn); }
                mbox.appendChild(div); }
            openModal('chatInfoModal'); };
        window.toggleAdmin = async function(uid, isAdmin) { if (!activeChatId || ME.uid !== activeChat.owner) return;
            const ref = doc(db, 'chats', activeChatId); if (isAdmin) { await updateDoc(ref, { admins: arrayRemove(uid) });
                activeChat.admins = activeChat.admins.filter(a => a !== uid); } else { await updateDoc(ref, { admins: arrayUnion(
                        uid) }); if (!activeChat.admins) activeChat.admins = [];
                activeChat.admins.push(uid); }
            openChatInfo(); };
        window.clearActiveChat = function() { activeChatId = null;
            activeChat = null; if (msgUnsub) msgUnsub(); if (typingUnsub) typingUnsub();
            $('activeChat').style.display = 'none';
            $('emptyChat').style.display = 'flex';
            $('chatPanel').classList.remove('open');
            hideTyping(); };

        // ---------- CREDITS & GIFTS ----------
        window.openCreditModal = function() { $('mainMenu').style.display = 'none';
            $('cmCredit').textContent = ME.credits || 0;
            openModal('creditModal'); };
        window.addCredits = async function(n) { await updateDoc(doc(db, 'users', ME.uid), { credits: increment(n) });
            ME.credits = (ME.credits || 0) + n;
            $('cmCredit').textContent = ME.credits;
            toast('+' + n + ' سکه ⭐'); };
        let giftTargetUid = null;
        window.openGiftModal = function() { $('chatMenu').style.display = 'none'; if (activeChat && activeChat.type ===
                'private') giftTargetUid = activeChat.members.find(m => m !== ME.uid) || ME.uid;
            else if (activeChat && activeChat.type === 'channel') giftTargetUid = 'CHANNEL_GIFT';
            else giftTargetUid = null;
            $('gmCredit').textContent = ME.credits || 0;
            openModal('giftModal'); };
        window.openGiftToViewedUser = function() { closeModal('userProfileModal');
            giftTargetUid = viewedUser.uid;
            $('gmCredit').textContent = ME.credits || 0;
            openModal('giftModal'); };
        window.sendGift = async function(emoji, value) { if ((ME.credits || 0) < value) return toast('خزانه خالی', '⚠️'); if (
                giftTargetUid === 'CHANNEL_GIFT') { await updateDoc(doc(db, 'users', ME.uid), { credits: increment(-
                        value) });
                await updateDoc(doc(db, 'chats', activeChatId), { boosts: increment(Math.floor(value / 10)) });
                ME.credits -= value;
                activeChat.boosts = (activeChat.boosts || 0) + Math.floor(value / 10);
                await pushMessage({ type: 'gift', gift: emoji, giftValue: value, text: '' });
                closeModal('giftModal');
                renderChatHeader(); return toast('پیشکش به دیوان! 🚀', '👑'); }
            let chatId = activeChatId; if (giftTargetUid && (!activeChat || activeChat.type !== 'private' || !activeChat
                    .members.includes(giftTargetUid))) { const u = await getUser(giftTargetUid);
                await openOrCreatePrivate(giftTargetUid, u);
                chatId = activeChatId; } if (!chatId) return toast('مسیر ارتباطی ایجاد کنید');
            await updateDoc(doc(db, 'users', ME.uid), { credits: increment(-value) }); if (giftTargetUid) { await updateDoc(
                    doc(db, 'users', giftTargetUid), { credits: increment(value), giftScore: increment(value),
                    receivedGifts: arrayUnion({ emoji, sender: ME.displayName, value }) }); }
            ME.credits -= value;
            await pushMessage({ type: 'gift', gift: emoji, giftValue: value, text: '' });
            closeModal('giftModal');
            toast('پیشکش ارسال شد ' + emoji, '🎁'); };

        // ---------- BACKGROUND ----------
        window.openBgModal = function() { $('chatMenu').style.display = 'none';
            const grid = $('bgGrid');
            grid.innerHTML = '';
            BACKGROUNDS.forEach(bg => { const d = document.createElement('div');
                d.className = 'bg-opt' + (activeChat && activeChat.background === bg ? ' sel' : '');
                d.style.background = bg || 'var(--bg2)';
                d.onclick = () => setBackground(bg);
                grid.appendChild(d); });
            openModal('bgModal'); };
        window.setBackground = async function(bg) { await updateDoc(doc(db, 'chats', activeChatId), { background: bg });
            activeChat.background = bg;
            applyBackground(bg);
            closeModal('bgModal');
            toast('پرده‌خوانی تغییر کرد', '🖼️'); };
        $('msgInput').addEventListener('keydown', function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault();
                sendMessage(); } });

        // ---------- SWIPE GESTURE (MOBILE) ----------
        let touchStartX = 0;
        document.addEventListener('touchstart', function(e) { touchStartX = e.touches[0].clientX; }, { passive: true });
        document.addEventListener('touchend', function(e) { if (!activeChatId) return;
            const diff = e.changedTouches[0].clientX - touchStartX; if (Math.abs(diff) > 80 && diff > 0 && window
                .innerWidth <= 800) { closeChat(); } });

        
/* ===== Wiriper Optimization Pack ===== */
(function(){
window.formatLastSeenExact=function(ts){
 const d=new Date(ts||Date.now());
 return d.toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'});
};

window.formatLastSeenRelative=function(ts){
 const diff=Math.floor((Date.now()-ts)/60000);
 if(diff<1)return 'همین الان';
 if(diff<60)return diff+' دقیقه پیش';
 if(diff<1440)return Math.floor(diff/60)+' ساعت پیش';
 return Math.floor(diff/1440)+' روز پیش';
};

let ticking=false;
window.addEventListener('scroll',()=>{
 if(!ticking){
   requestAnimationFrame(()=>{ticking=false;});
   ticking=true;
 }
},{passive:true});

document.documentElement.style.setProperty('text-rendering','optimizeLegibility');
console.log('🚀 Wiriper Optimization Pack Loaded');
})();

console.log('👑 Wiriper Prime v4.0 — Ready for Royal Command');
    