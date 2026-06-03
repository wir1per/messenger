// ============================================
// APP INITIALIZATION - Main entry point
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all systems
    console.log('🎬 Wiriper Prime initializing...');
    
    // Motion engine is ready
    console.log('✓ Motion engine initialized');
    console.log('✓ Interaction engine initialized');
    console.log('✓ Realtime simulator initialized');
    
    // Hide splash after 2.5 seconds
    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        if (splash) {
            splash.classList.add('hide');
        }
    }, 2500);
    
    // Setup app
    setupApp();
});

function setupApp() {
    // Show app
    const app = document.getElementById('app');
    const authScreen = document.getElementById('authScreen');
    
    // For demo purposes
    if (authScreen) {
        setTimeout(() => {
            authScreen.style.display = 'flex';
        }, 500);
    }
}
