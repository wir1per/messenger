// ============================================
// MOBILE LAYOUT MANAGER - Handles all mobile-specific layout issues
// ============================================

class MobileLayoutManager {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isTablet = this.detectTablet();
        this.keyboardHeight = 0;
        this.isKeyboardOpen = false;
        this.init();
    }

    detectMobile() {
        return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        ) || window.innerWidth <= 768;
    }

    detectTablet() {
        return /iPad|Android/i.test(navigator.userAgent) && window.innerWidth > 768;
    }

    init() {
        if (!this.isMobile && !this.isTablet) return;

        this.fixViewportHeight();
        this.handleKeyboardBehavior();
        this.fixInputAreaPosition();
        this.fixHeaderLayout();
        this.optimizeScrolling();
        this.handleOrientationChange();
    }

    // Fix 100vh issues on mobile
    fixViewportHeight() {
        const updateHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        updateHeight();
        window.addEventListener('resize', () => updateHeight());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => updateHeight(), 100);
        });
    }

    // Handle keyboard appearance/disappearance
    handleKeyboardBehavior() {
        const inputField = document.querySelector('.msg-input, input[type="text"], textarea');
        if (!inputField) return;

        inputField.addEventListener('focus', () => {
            this.isKeyboardOpen = true;
            document.body.classList.add('keyboard-open');
            this.adjustLayoutForKeyboard();
        });

        inputField.addEventListener('blur', () => {
            this.isKeyboardOpen = false;
            document.body.classList.remove('keyboard-open');
            this.resetLayout();
        });

        // Handle visual viewport changes
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                this.handleViewportResize();
            });
        }
    }

    adjustLayoutForKeyboard() {
        const msgList = document.querySelector('.msg-list');
        if (!msgList) return;

        // Scroll to bottom when keyboard opens
        setTimeout(() => {
            msgList.scrollTop = msgList.scrollHeight;
        }, 300);

        // Reduce message list padding
        msgList.style.paddingBottom = '0';
    }

    resetLayout() {
        const msgList = document.querySelector('.msg-list');
        if (!msgList) return;

        msgList.style.paddingBottom = '16px';
    }

    handleViewportResize() {
        if (!this.isKeyboardOpen) return;

        const msgList = document.querySelector('.msg-list');
        if (msgList) {
            msgList.scrollTop = msgList.scrollHeight;
        }
    }

    // Fix input area anchoring
    fixInputAreaPosition() {
        const inputContainer = document.querySelector('.input-container');
        if (!inputContainer) return;

        // Ensure fixed positioning
        inputContainer.style.position = 'fixed';
        inputContainer.style.bottom = '0';
        inputContainer.style.left = '0';
        inputContainer.style.right = '0';
        inputContainer.style.zIndex = '100';

        // Add margin to chat panel to prevent overlap
        const chatPanel = document.querySelector('.chat-panel');
        if (chatPanel) {
            const inputHeight = inputContainer.offsetHeight;
            chatPanel.style.paddingBottom = `${inputHeight}px`;
        }
    }

    // Fix header layout issues
    fixHeaderLayout() {
        const header = document.querySelector('.header');
        if (!header) return;

        // Ensure proper flex layout
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';

        // Fix profile section
        const profileSection = header.querySelector('.profile-section');
        if (profileSection) {
            profileSection.style.flex = '1';
            profileSection.style.minWidth = '0';
            profileSection.style.display = 'flex';
            profileSection.style.alignItems = 'center';
            profileSection.style.gap = '12px';
        }

        // Ensure avatar doesn't shrink
        const avatar = header.querySelector('.avatar');
        if (avatar) {
            avatar.style.flexShrink = '0';
            avatar.style.width = '44px';
            avatar.style.height = '44px';
        }

        // Prevent text overflow
        const profileName = header.querySelector('.profile-name');
        if (profileName) {
            profileName.style.overflow = 'hidden';
            profileName.style.textOverflow = 'ellipsis';
            profileName.style.whiteSpace = 'nowrap';
        }
    }

    // Optimize scrolling behavior
    optimizeScrolling() {
        const scrollableElements = document.querySelectorAll('.msg-list, .chat-list, .sidebar');
        
        scrollableElements.forEach(el => {
            // Enable momentum scrolling
            el.style.webkitOverflowScrolling = 'touch';
            el.style.overscrollBehavior = 'contain';
            el.style.willChange = 'scroll-position';
        });
    }

    // Handle orientation changes
    handleOrientationChange() {
        window.addEventListener('orientationchange', () => {
            // Fix layout after orientation change
            setTimeout(() => {
                this.fixInputAreaPosition();
                this.fixHeaderLayout();
                
                // Scroll to bottom if keyboard is open
                if (this.isKeyboardOpen) {
                    const msgList = document.querySelector('.msg-list');
                    if (msgList) {
                        msgList.scrollTop = msgList.scrollHeight;
                    }
                }
            }, 100);
        });
    }

    // Enhance touch targets
    enhanceTouchTargets() {
        const interactiveElements = document.querySelectorAll(
            'button, .icon-btn, .chat-item, input[type="button"]'
        );

        interactiveElements.forEach(el => {
            const width = el.offsetWidth;
            const height = el.offsetHeight;

            if (width < 44 || height < 44) {
                el.style.minWidth = '44px';
                el.style.minHeight = '44px';
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
            }
        });
    }
}

const mobileLayoutManager = new MobileLayoutManager();
