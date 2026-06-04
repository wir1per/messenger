// ============================================
// PRODUCT IDENTITY - Premium brand experience
// ============================================

class ProductIdentity {
    constructor() {
        this.brandColors = {
            primary: '#e8c372',
            secondary: '#b07cff',
            accent: '#34d399',
            dark: '#0a0a0f',
            light: '#f4f4f7'
        };
        
        this.init();
    }

    init() {
        this.enhanceLogoAnimation();
        this.createBrandedEmptyStates();
        this.setupOnboarding();
        this.enhanceVisualIdentity();
    }

    enhanceLogoAnimation() {
        const logo = document.querySelector('.wiriper-logo');
        if (!logo) return;

        logo.addEventListener('click', () => {
            logo.style.animation = 'none';
            setTimeout(() => {
                logo.style.animation = 'logoShine 0.6s ease-out';
            }, 10);
        });
    }

    createBrandedEmptyStates() {
        const emptyChat = document.querySelector('.empty-chat');
        if (!emptyChat) return;

        emptyChat.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👑</div>
                <div class="empty-state-text">Wiriper Prime</div>
                <div class="empty-state-subtext">Select a conversation to begin</div>
            </div>
        `;
        
        emptyChat.style.animation = 'warmthPulse 6s ease-in-out infinite';
    }

    setupOnboarding() {
        const steps = [
            { text: 'Welcome to Wiriper Prime', icon: '👑' },
            { text: 'Premium Real-Time Messaging', icon: '⚡' },
            { text: 'Cinematic Interactions', icon: '🎬' }
        ];
        
        const onboarding = document.createElement('div');
        onboarding.className = 'onboarding';
        onboarding.style.display = 'none';
        
        steps.forEach((step, index) => {
            const stepEl = document.createElement('div');
            stepEl.className = 'onboarding-step';
            stepEl.style.animation = `onboardingSlide 0.5s ease-out`;
            stepEl.style.animationDelay = `${index * 200}ms`;
            stepEl.innerHTML = `
                <div style="font-size: 48px">${step.icon}</div>
                <div style="font-size: 18px; margin-top: 16px">${step.text}</div>
            `;
            onboarding.appendChild(stepEl);
        });
        
        document.body.appendChild(onboarding);
    }

    enhanceVisualIdentity() {
        // Add brand dividers
        const dividers = document.querySelectorAll('hr');
        dividers.forEach(divider => {
            divider.className = 'wiriper-divider';
        });
        
        // Add brand accents to headings
        const headings = document.querySelectorAll('h1, h2, h3');
        headings.forEach(heading => {
            heading.className = 'brand-accent';
        });
    }
}

const productIdentity = new ProductIdentity();
