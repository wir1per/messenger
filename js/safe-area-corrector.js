// ============================================
// SAFE AREA CORRECTOR - Proper notch and safe area support
// ============================================

class SafeAreaCorrector {
    constructor() {
        this.init();
    }

    init() {
        this.applySafeAreas();
        this.fixViewportMetaTags();
        this.handleDynamicNotch();
        this.handleBottomSafeArea();
    }

    applySafeAreas() {
        const root = document.documentElement;

        // Set CSS variables for safe areas
        const setProperty = (name, inset) => {
            const value = getComputedStyle(root).getPropertyValue(inset).trim() || '0';
            root.style.setProperty(name, value);
        };

        setProperty('--safe-top', 'env(safe-area-inset-top)');
        setProperty('--safe-bottom', 'env(safe-area-inset-bottom)');
        setProperty('--safe-left', 'env(safe-area-inset-left)');
        setProperty('--safe-right', 'env(safe-area-inset-right)');
    }

    fixViewportMetaTags() {
        // Ensure viewport-fit=cover for notch support
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        if (!viewportMeta) {
            viewportMeta = document.createElement('meta');
            viewportMeta.name = 'viewport';
            document.head.appendChild(viewportMeta);
        }

        const content = viewportMeta.getAttribute('content') || '';
        if (!content.includes('viewport-fit=cover')) {
            viewportMeta.setAttribute(
                'content',
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover, user-scalable=no'
            );
        }
    }

    handleDynamicNotch() {
        const header = document.querySelector('.header');
        if (!header) return;

        // Apply top safe area padding
        const update = () => {
            const safeTop = parseInt(
                getComputedStyle(document.documentElement).getPropertyValue('--safe-top') || '0'
            );
            header.style.paddingTop = `max(12px, ${safeTop}px)`;
        };

        update();
        window.addEventListener('orientationchange', update);
    }

    handleBottomSafeArea() {
        const inputContainer = document.querySelector('.input-container');
        if (!inputContainer) return;

        const update = () => {
            const safeBottom = parseInt(
                getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom') || '0'
            );
            inputContainer.style.paddingBottom = `max(12px, ${safeBottom}px)`;
        };

        update();
        window.addEventListener('orientationchange', update);
    }
}

const safeAreaCorrector = new SafeAreaCorrector();
