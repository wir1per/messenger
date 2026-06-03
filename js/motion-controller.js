// ============================================
// MOTION CONTROLLER - Manages advanced animations
// ============================================

class MotionController {
    constructor() {
        this.isEnabled = true;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.observeMotionPreference();
    }

    observeMotionPreference() {
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.reducedMotion = e.matches;
            this.updateMotionSettings();
        });
    }

    updateMotionSettings() {
        if (this.reducedMotion) {
            document.documentElement.style.setProperty('--transition-fast', '0.01s ease');
            document.documentElement.style.setProperty('--transition-smooth', '0.01s ease');
            document.documentElement.style.setProperty('--spring-stiff', '0.01s ease');
        } else {
            this.restoreMotionSettings();
        }
    }

    restoreMotionSettings() {
        document.documentElement.style.setProperty('--transition-fast', '0.16s cubic-bezier(0.4, 0, 0.2, 1)');
        document.documentElement.style.setProperty('--transition-smooth', '0.32s cubic-bezier(0.22, 1, 0.36, 1)');
        document.documentElement.style.setProperty('--spring-stiff', '300ms cubic-bezier(0.34, 1.56, 0.64, 1)');
    }

    // Staggered cascade animation for lists
    animateCascade(elements, delay = 35) {
        if (this.reducedMotion) return;
        
        elements.forEach((el, idx) => {
            el.style.animationDelay = `${idx * delay}ms`;
        });
    }

    // Spring physics animation
    springAnimate(element, config = {}) {
        if (this.reducedMotion) return;
        
        const defaults = {
            stiffness: 300,
            damping: 10,
            duration: 0.5
        };
        const options = { ...defaults, ...config };
        
        element.style.animation = `springBounce ${options.duration}s cubic-bezier(0.34, 1.56, 0.64, 1)`;
    }

    // Velocity-aware animation
    velocityAnimate(element, velocity = 1) {
        if (this.reducedMotion) return;
        
        const duration = 0.3 / velocity;
        element.style.animation = `velocityEnter ${duration}s ease-out both`;
    }

    // Gesture-driven swipe animation
    swipeAnimate(element, direction = 'left') {
        if (this.reducedMotion) return;
        
        const transform = direction === 'left' ? 'translateX(-100%)' : 'translateX(100%)';
        element.animate([
            { transform: 'translateX(0)', opacity: 1 },
            { transform, opacity: 0 }
        ], {
            duration: 400,
            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            fill: 'forwards'
        });
    }

    // Shared layout animation
    layoutTransition(element) {
        if (this.reducedMotion) return;
        
        element.style.animation = 'layoutShift 0.5s cubic-bezier(0.22, 1, 0.36, 1) both';
    }

    // Inertia-based bounce
    inertiaBounce(element) {
        if (this.reducedMotion) return;
        
        element.style.animation = 'inertiaBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both';
    }
}

const motionController = new MotionController();
