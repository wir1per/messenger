
// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                         WIRIPER PRIME - APP.JS                             ║
// ║                    نسخه جدید سامانه پیام‌رسانی سلطنتی                        ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

document.addEventListener('DOMContentLoaded', () => {
    // ─────────────────────────────────────────────────────────────────────────
    // Initialize App
    // ──────────���──────────────────────────────────────────────────────────────
    
    const splashScreen = document.getElementById('splashScreen');
    const authScreen = document.getElementById('authScreen');
    const appContainer = document.getElementById('app');

    // Hide splash after 2.5 seconds
    setTimeout(() => {
        if (splashScreen) {
            splashScreen.classList.add('hide');
        }
        // Show auth screen
        if (authScreen) {
            authScreen.style.display = 'flex';
        }
    }, 2500);

    // ─────────────────────────────────────────────────────────────────────────
    // Authentication Logic
    // ─────────────────────────────────────────────────────────────────────────

    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const authMsg = document.querySelector('.auth-msg');

    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }

    if (signupBtn) {
        signupBtn.addEventListener('click', handleSignup);
    }

    function handleLogin() {
        const username = document.querySelector('input[placeholder*="نام کاربری"]')?.value ||
                        document.querySelector('input[placeholder*="username"]')?.value || '';
        const password = document.querySelector('input[type="password"]')?.value || '';

        if (!username || !password) {
            showMessage('تمام فیلدها الزامی هستند', 'err');
            return;
        }

        // Simulate login
        loginBtn.classList.add('loading');
        setTimeout(() => {
            loginBtn.classList.remove('loading');
            showMessage('ورود موفق!', 'ok');
            setTimeout(() => {
                if (authScreen) authScreen.style.display = 'none';
                if (appContainer) appContainer.style.display = 'flex';
                initializeChat();
            }, 500);
        }, 1200);
    }

    function handleSignup() {
        const email = document.querySelector('input[type="email"]')?.value || '';
        const username = document.querySelector('input[placeholder*="نام کاربری"]')?.value ||
                        document.querySelector('input[placeholder*="username"]')?.value || '';
        const password = document.querySelector('input[type="password"]')?.value || '';

        if (!email || !username || !password) {
            showMessage('تمام فیلدها الزامی هستند', 'err');
            return;
        }

        signupBtn.classList.add('loading');
        setTimeout(() => {
            signupBtn.classList.remove('loading');
            showMessage('ثبت‌نام موفق!', 'ok');
            setTimeout(() => {
                if (authScreen) authScreen.style.display = 'none';
                if (appContainer) appContainer.style.display = 'flex';
                initializeChat();
            }, 500);
        }, 1200);
    }

    function showMessage(text, type) {
        if (!authMsg) return;
        authMsg.textContent = text;
        authMsg.className = `auth-msg show ${type}`;
        setTimeout(() => {
            authMsg.classList.remove('show');
        }, 3000);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Chat Initialization
    // ─────────────────────────────────────────────────────────────────────────

    function initializeChat() {
        // Initialize chat functionality
        console.log('Chat initialized!');
        
        // Load sample messages
        const chatMessages = document.querySelector('.messages');
        if (chatMessages) {
            chatMessages.innerHTML = `
                <div class="date-separator">
                    <span>امروز</span>
                </div>
                <div class="message msg-other" style="animation: msgIn 0.4s ease forwards;">
                    <div class="msg-avatar">👤</div>
                    <div class="msg-bubble other">
                        <p>سلام! چطور می‌تونم کمکت کنم؟</p>
                        <span class="msg-time">۱۲:۳۰</span>
                    </div>
                </div>
            `;
        }
    }

    // ─────���───────────────────────────────────────────────────────────────────
    // Tab Switching
    // ─────────────────────────────────────────────────────────────────────────

    const authTabButtons = document.querySelectorAll('.auth-tabs button');
    authTabButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            authTabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Switch form
            const forms = document.querySelectorAll('.auth-form');
            forms.forEach(f => f.style.display = 'none');
            if (forms[index]) forms[index].style.display = 'block';
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Input Focus Effects
    // ─────────────────────────────────────────────────────────────────────────

    document.querySelectorAll('.field input, .field textarea').forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.style.borderColor = 'rgba(232, 195, 114, 0.55)';
        });
        input.addEventListener('blur', () => {
            input.parentElement.style.borderColor = 'transparent';
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Ripple Effect
    // ─────────────────────────────────────────────────────────────────────────

    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const ripple = document.createElement('div');
            ripple.className = 'ripple-effect';
            
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 650);
        });
    });

    console.log('✨ Wiriper Prime initialized!');
});
