// ============================================
// SCROLL MANAGER - Flawless scroll behavior
// ============================================

class ScrollManager {
    constructor() {
        this.msgList = document.querySelector('.msg-list');
        this.isScrollLocked = false;
        this.previousScrollHeight = 0;
        this.initScrollHandlers();
    }

    initScrollHandlers() {
        if (!this.msgList) return;

        // Detect if user scrolled to bottom
        this.msgList.addEventListener('scroll', () => this.handleScroll());
        
        // Smooth scroll to bottom
        document.addEventListener('scroll-to-bottom', () => this.scrollToBottom(true));
        
        // Lock scroll during message load
        document.addEventListener('messages-loading', () => this.lockScroll());
        document.addEventListener('messages-loaded', () => this.unlockScroll());
    }

    handleScroll() {
        // Check if at bottom
        const isAtBottom = this.isNearBottom();
        document.body.setAttribute('data-scroll-position', isAtBottom ? 'bottom' : 'top');
    }

    isNearBottom() {
        if (!this.msgList) return true;
        const threshold = 100;
        return (
            this.msgList.scrollTop >=
            this.msgList.scrollHeight - this.msgList.clientHeight - threshold
        );
    }

    scrollToBottom(smooth = true) {
        if (!this.msgList) return;
        
        this.msgList.scrollTo({
            top: this.msgList.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }

    // Preserve scroll position when loading old messages
    preserveScrollPosition() {
        if (!this.msgList) return;
        this.previousScrollHeight = this.msgList.scrollHeight;
    }

    restoreScrollPosition() {
        if (!this.msgList) return;
        
        requestAnimationFrame(() => {
            const newScrollHeight = this.msgList.scrollHeight;
            const scrollDifference = newScrollHeight - this.previousScrollHeight;
            this.msgList.scrollTop += scrollDifference;
        });
    }

    // Smooth transitions
    lockScroll() {
        this.isScrollLocked = true;
        this.msgList?.style.setProperty('scroll-behavior', 'auto');
    }

    unlockScroll() {
        this.isScrollLocked = false;
        this.msgList?.style.setProperty('scroll-behavior', 'smooth');
    }

    // Handle long conversations
    optimizeForLongConversations() {
        if (!this.msgList) return;
        
        // Use virtual scrolling for 1000+ messages
        const msgCount = document.querySelectorAll('.msg').length;
        if (msgCount > 1000) {
            this.msgList.style.willChange = 'scroll-position';
        }
    }
}

const scrollManager = new ScrollManager();
