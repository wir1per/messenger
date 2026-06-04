// ============================================
// MOTION QUALITY ENHANCER - Premium mobile motion
// ============================================

class MotionQualityEnhancer {
    constructor() {
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        this.supportsReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.init();
    }

    init() {
        if (this.supportsReducedMotion) return;

        this.enhanceMessageAnimations();
        this.smoothHoverStates();
        this.improveTransitionTiming();
        this.fixAnimationStutter();
    }

    enhanceMessageAnimations() {
        const messages = document.querySelectorAll('.msg');
        
        messages.forEach((msg, index) => {
            // Staggered entrance
            msg.style.animation = `springEnter 0.4s cubic-bezier(0.22, 1, 0.36, 1) both`;
            msg.style.animationDelay = `${index * 35}ms`;
            msg.style.willChange = 'transform, opacity';
        });
    }

    smoothHoverStates() {
        const interactiveElements = document.querySelectorAll(
            '.chat-item, .msg-bubble, button, .icon-btn'
        );
        
        interactiveElements.forEach(el => {
            // Use transform instead of position changes
            el.style.transition = 'all 0.24s cubic-bezier(0.22, 1, 0.36, 1)';
            
            el.addEventListener('mouseenter', () => {
                el.style.transform = 'translateY(-2px)';
            });
            
            el.addEventListener('mouseleave', () => {
                el.style.transform = 'translateY(0)';
            });
        });
    }

    improveTransitionTiming() {
        // Reduce motion on mobile for better performance
        if (this.isMobile) {
            document.documentElement.style.setProperty(
                '--transition-fast',
                '0.12s cubic-bezier(0.4, 0, 0.2, 1)'
            );
            document.documentElement.style.setProperty(
                '--transition-smooth',
                '0.24s cubic-bezier(0.22, 1, 0.36, 1)'
            );
        }
    }

    fixAnimationStutter() {
        // Enable GPU acceleration
        const elements = document.querySelectorAll('.msg, .chat-item, button');
        elements.forEach(el => {
            el.style.transform = 'translate3d(0, 0, 0)';
            el.style.backfaceVisibility = 'hidden';
            el.style.perspective = '1000px';
        });
    }
}

const motionQualityEnhancer = new MotionQualityEnhancer();
