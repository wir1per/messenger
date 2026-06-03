// ============================================
// INTERACTION ENGINE - Premium micro-interactions
// ============================================

class InteractionEngine {
    constructor() {
        this.initHoverMagnetism();
        this.initTactileFeedback();
        this.initGestureDetection();
    }

    // Hover magnetism effect
    initHoverMagnetism() {
        document.addEventListener('mousemove', (e) => {
            const magnetItems = document.querySelectorAll('.chat-item');
            
            magnetItems.forEach(item => {
                const rect = item.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                const distance = Math.sqrt(
                    Math.pow(e.clientX - centerX, 2) + 
                    Math.pow(e.clientY - centerY, 2)
                );
                
                const maxDistance = 100;
                if (distance < maxDistance) {
                    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
                    const pull = (maxDistance - distance) / maxDistance * 8;
                    
                    item.style.setProperty('--mouse-x', `${50 + Math.cos(angle) * 50}%`);
                    item.style.setProperty('--mouse-y', `${50 + Math.sin(angle) * 50}%`);
                }
            });
        });
    }

    // Tactile button feedback with ripple
    initTactileFeedback() {
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            const rect = button.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'ripple-effect';
            ripple.style.left = `${e.clientX - rect.left}px`;
            ripple.style.top = `${e.clientY - rect.top}px`;
            
            button.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    }

    // Gesture detection (swipe, long-press)
    initGestureDetection() {
        let touchStartX = 0;
        let touchStartTime = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartTime = Date.now();
        });

        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const swipeDistance = touchStartX - touchEndX;
            const swipeTime = Date.now() - touchStartTime;

            // Swipe detection
            if (Math.abs(swipeDistance) > 50 && swipeTime < 300) {
                const direction = swipeDistance > 0 ? 'left' : 'right';
                this.onSwipeGesture(e.target, direction);
            }
        });

        // Long-press detection
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const msg = e.target.closest('.msg');
            if (msg) {
                msg.classList.add('long-press');
                setTimeout(() => msg.classList.remove('long-press'), 500);
            }
        });
    }

    // Handle swipe gestures
    onSwipeGesture(element, direction) {
        const msg = element.closest('.msg');
        if (!msg) return;

        msg.classList.add('swipe-active');
        
        if (direction === 'right') {
            // Swipe to reply
            console.log('Swipe to reply triggered');
        }
    }

    // Soft scaling on hover
    addSoftScale(element, scale = 1.05) {
        element.addEventListener('mouseenter', () => {
            element.style.transform = `scale(${scale})`;
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'scale(1)';
        });
    }

    // Active press animation
    addPressAnimation(element) {
        element.addEventListener('pointerdown', () => {
            element.style.animation = 'pressDown 0.15s ease-out both';
        });
    }
}

const interactionEngine = new InteractionEngine();
