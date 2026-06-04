// ============================================
// ANIMATION POLISH - Flawless motion system
// ============================================

class AnimationPolish {
    constructor() {
        this.supportedEasing = {
            instant: 'cubic-bezier(0, 0, 1, 1)',
            fast: 'cubic-bezier(0.4, 0, 0.2, 1)',
            smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
            spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            linear: 'linear'
        };
        
        this.init();
    }

    init() {
        this.polishMessageAnimations();
        this.polishHoverStates();
        this.fixAnimationStutter();
        this.optimizePerformance();
    }

    polishMessageAnimations() {
        const messages = document.querySelectorAll('.msg');
        
        messages.forEach((msg, index) => {
            // Stagger incoming messages
            msg.style.animation = `messageEnter 0.48s ${this.supportedEasing.smooth} both`;
            msg.style.animationDelay = `${index * 35}ms`;
            
            // Add will-change for performance
            msg.style.willChange = 'transform, opacity';
        });
    }

    polishHoverStates() {
        const interactiveElements = document.querySelectorAll(
            '.chat-item, .msg-bubble, button, .icon-btn'
        );
        
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                el.style.transition = `all 0.24s ${this.supportedEasing.smooth}`;
            });
            
            el.addEventListener('mouseleave', () => {
                el.style.transition = `all 0.24s ${this.supportedEasing.smooth}`;
            });
        });
    }

    fixAnimationStutter() {
        // Use requestAnimationFrame for smooth animations
        const animateElement = (element, from, to, duration = 300) => {
            const startTime = performance.now();
            
            const animate = (currentTime) => {
                const progress = (currentTime - startTime) / duration;
                
                if (progress <= 1) {
                    const value = from + (to - from) * progress;
                    element.style.opacity = value;
                    requestAnimationFrame(animate);
                } else {
                    element.style.opacity = to;
                }
            };
            
            requestAnimationFrame(animate);
        };
        
        // Export globally
        window.smoothAnimate = animateElement;
    }

    optimizePerformance() {
        // Enable GPU acceleration
        const styled = document.querySelectorAll('.msg, .chat-item, button');
        
        styled.forEach(el => {
            el.style.transform = 'translate3d(0, 0, 0)';
            el.style.backfaceVisibility = 'hidden';
            el.style.perspective = '1000px';
        });
    }

    // Remove abrupt animations
    smoothTransition(element, property, duration = 300) {
        element.style.transition = `${property} ${duration}ms ${this.supportedEasing.smooth}`;
    }
}

const animationPolish = new AnimationPolish();
