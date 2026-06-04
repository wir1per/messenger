// ============================================
// TYPING STATE MANAGER - Flawless typing behavior
// ============================================

class TypingStateManager {
    constructor() {
        this.typingUsers = new Map();
        this.debounceTimer = null;
        this.typingDebounce = 300; // ms
        this.typingTimeout = 3000; // ms
        this.isTyping = false;
        this.initTypingHandlers();
    }

    initTypingHandlers() {
        // Listen to input fields
        const inputField = document.querySelector('input[type="text"], textarea');
        if (!inputField) return;

        // Debounced typing detection
        inputField.addEventListener('input', () => this.handleUserTyping());
        inputField.addEventListener('blur', () => this.stopTyping());
        
        // Clear typing on send
        document.addEventListener('message-sent', () => this.clearTyping());
    }

    handleUserTyping() {
        // Only trigger typing state once
        if (!this.isTyping) {
            this.startTyping();
            this.isTyping = true;
        }

        // Reset debounce timer
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.stopTyping();
        }, this.typingTimeout);
    }

    startTyping() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator && !indicator.classList.contains('show')) {
            indicator.classList.add('show');
        }
    }

    stopTyping() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator && indicator.classList.contains('show')) {
            indicator.classList.remove('show');
        }
        this.isTyping = false;
    }

    clearTyping() {
        clearTimeout(this.debounceTimer);
        this.stopTyping();
        this.isTyping = false;
    }

    // Remote user typing
    setRemoteUserTyping(userId, isTyping) {
        if (isTyping) {
            this.typingUsers.set(userId, Date.now());
        } else {
            this.typingUsers.delete(userId);
        }
        this.updateTypingIndicator();
    }

    updateTypingIndicator() {
        const typingCount = this.typingUsers.size;
        const indicator = document.querySelector('.typing-indicator');
        
        if (typingCount > 0) {
            indicator?.classList.add('show');
        } else {
            indicator?.classList.remove('show');
        }
    }

    // Check for stale typing states
    cleanupStaleTyping() {
        const now = Date.now();
        for (const [userId, timestamp] of this.typingUsers.entries()) {
            if (now - timestamp > this.typingTimeout) {
                this.typingUsers.delete(userId);
            }
        }
        this.updateTypingIndicator();
    }
}

const typingStateManager = new TypingStateManager();

// Cleanup stale typing states every second
setInterval(() => typingStateManager.cleanupStaleTyping(), 1000);
