// ============================================
// MOBILE OPTIMIZATION - Perfect mobile UX
// ============================================

class MobileOptimization {
    constructor() {
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        this.keyboardHeight = 0;
        this.init();
    }

    init() {
        if (!this.isMobile) return;

        this.optimizeKeyboardBehavior();
        this.improveScrolling();
        this.enhanceTouchTargets();
        this.fixViewportIssues();
    }

    optimizeKeyboardBehavior() {
        const inputs = document.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            // Detect keyboard show
            window.visualViewport?.addEventListener('resize', () => {
                this.handleKeyboardToggle();
            });
            
            // Smooth focus with safe area
            input.addEventListener('focus', () => {
                this.scrollInputIntoView(input);
            });
        });
    }

    handleKeyboardToggle() {
        const chatPanel = document.querySelector('.chat-panel');
        if (!chatPanel) return;
        
        // Add padding when keyboard is visible
        if (window.innerHeight < window.screen.height) {
            this.keyboardHeight = window.screen.height - window.innerHeight;
            chatPanel.style.paddingBottom = `${this.keyboardHeight}px`;
        } else {
            chatPanel.style.paddingBottom = '0';
        }
    }

    scrollInputIntoView(input) {
        // Scroll input above keyboard
        setTimeout(() => {
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    }

    improveScrolling() {
        const scrollables = document.querySelectorAll('.chat-list, .msg-list');
        
        scrollables.forEach(el => {
            // Enable momentum scrolling
            el.style.webkitOverflowScrolling = 'touch';
            el.style.overscrollBehavior = 'contain';
        });
    }

    enhanceTouchTargets() {
        // Minimum 44x44px touch targets
        const buttons = document.querySelectorAll('button, .icon-btn');
        
        buttons.forEach(btn => {
            const width = btn.offsetWidth;
            const height = btn.offsetHeight;
            
            if (width < 44 || height < 44) {
                btn.style.padding = '12px 16px';
                btn.style.minWidth = '44px';
                btn.style.minHeight = '44px';
            }
        });
    }

    fixViewportIssues() {
        // Prevent viewport zoom on input focus
        const meta = document.querySelector('meta[name="viewport"]');
        if (meta) {
            meta.setAttribute(
                'content',
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
            );
        }

        // Handle safe areas
        document.documentElement.style.setProperty(
            '--safe-area-inset-left',
            'env(safe-area-inset-left)'
        );
        document.documentElement.style.setProperty(
            '--safe-area-inset-right',
            'env(safe-area-inset-right)'
        );
    }
}

const mobileOptimization = new MobileOptimization();
