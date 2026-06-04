// ============================================
// FINAL MOBILE INTEGRATION - Orchestrates all mobile fixes
// ============================================

class FinalMobileIntegration {
    constructor() {
        this.systems = [];
        this.initializeAll();
    }

    initializeAll() {
        console.log('📱 Mobile UI Polish: Final Integration');

        this.systems = [
            { name: 'MobileLayoutManager', instance: mobileLayoutManager },
            { name: 'MobileSpacingCorrector', instance: mobileSpacingCorrector },
            { name: 'ResponsiveChatLayout', instance: responsiveChatLayout },
            { name: 'SafeAreaCorrector', instance: safeAreaCorrector },
            { name: 'MotionQualityEnhancer', instance: motionQualityEnhancer }
        ];

        this.systems.forEach(sys => {
            console.log(`✓ ${sys.name} initialized`);
        });

        // Setup comprehensive event listeners
        this.setupEventListeners();
        
        // Polish final details
        this.polishFinalDetails();
    }

    setupEventListeners() {
        // Handle viewport changes
        window.addEventListener('resize', () => {
            this.handleLayoutReflow();
        });

        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleLayoutReflow();
            }, 100);
        });

        // Handle keyboard show/hide
        document.addEventListener('focusin', (e) => {
            if (e.target.matches('input, textarea')) {
                document.body.classList.add('keyboard-visible');
            }
        });

        document.addEventListener('focusout', (e) => {
            if (e.target.matches('input, textarea')) {
                document.body.classList.remove('keyboard-visible');
            }
        });
    }

    handleLayoutReflow() {
        console.log('🔄 Reflow triggered');
        
        // Re-apply all fixes
        mobileLayoutManager.fixInputAreaPosition();
        mobileLayoutManager.fixHeaderLayout();
        mobileSpacingCorrector.optimizeResponsiveSpacing();
        responsiveChatLayout.fixMessageBubbles();
        responsiveChatLayout.fixMessageGrouping();
        safeAreaCorrector.applySafeAreas();
    }

    polishFinalDetails() {
        // Ensure smooth scrolling
        document.body.style.scrollBehavior = 'smooth';

        // Optimize touch feedback
        document.body.style.webkitTouchCallout = 'none';
        document.body.style.webkitUserSelect = 'none';

        // Prevent zoom on input focus
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.style.fontSize = '16px'; // Prevents iOS zoom
        });

        // Fix font smoothing
        document.body.style.webkitFontSmoothing = 'antialiased';
        document.body.style.mozOsxFontSmoothing = 'grayscale';
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.finalMobileIntegration = new FinalMobileIntegration();
    });
} else {
    window.finalMobileIntegration = new FinalMobileIntegration();
}
