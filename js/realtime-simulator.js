// ============================================
// REALTIME SIMULATOR - Authentic user behavior
// ============================================

class RealtimeSimulator {
    constructor() {
        this.typingUsers = new Map();
        this.typingDelayMs = 800; // Min delay before showing typing
        this.messageDeliveryMs = 1200; // Message delivery simulation
        this.readReceiptDelayMs = 2000; // Read receipt delay
    }

    // Realistic typing indicator
    simulateTyping(userId, duration = 3000) {
        const indicator = document.querySelector(`.typing-indicator[data-user="${userId}"]`);
        if (!indicator) return;

        setTimeout(() => {
            indicator.classList.add('show');
        }, this.typingDelayMs);

        setTimeout(() => {
            indicator.classList.remove('show');
        }, this.typingDelayMs + duration);
    }

    // Intelligent online/offline transition
    transitionPresence(element, isOnline) {
        element.classList.add('transitioning');
        
        if (isOnline) {
            element.classList.remove('offline');
            element.classList.add('transitioning');
        } else {
            element.classList.add('offline');
        }

        setTimeout(() => {
            element.classList.remove('transitioning');
        }, 800);
    }

    // Animated live presence
    animateLivePresence(element) {
        element.innerHTML = `
            <span class="presence-indicator" data-status="active"></span>
        `;
    }

    // Realtime unread counter with animation
    updateUnreadCount(element, count) {
        if (count > 0) {
            element.classList.add('new');
            element.textContent = count > 99 ? '99+' : count;
            
            setTimeout(() => {
                element.classList.remove('new');
            }, 400);
        } else {
            element.style.display = 'none';
        }
    }

    // Smooth incoming message animation
    animateIncomingMessage(element) {
        element.classList.add('msg');
        element.style.animation = 'messageIncoming 0.5s cubic-bezier(0.22, 1, 0.36, 1) both';
    }

    // Async delivery timing
    simulateMessageDelivery(element) {
        element.classList.add('sending');
        
        setTimeout(() => {
            element.classList.remove('sending');
            this.addReadReceipt(element);
        }, this.messageDeliveryMs);
    }

    // Delayed read receipts
    addReadReceipt(element) {
        setTimeout(() => {
            const receipt = document.createElement('div');
            receipt.className = 'read-receipt';
            receipt.textContent = '✓✓';
            element.appendChild(receipt);
        }, this.readReceiptDelayMs);
    }

    // Subtle activity pulses
    showActivityPulse(parentElement) {
        const pulse = document.createElement('span');
        pulse.className = 'activity-indicator';
        parentElement.appendChild(pulse);
        
        setTimeout(() => pulse.remove(), 2000);
    }

    // Realtime sidebar updates
    updateSidebarItem(element) {
        element.classList.add('updated');
        
        setTimeout(() => {
            element.classList.remove('updated');
        }, 600);
    }

    // Believable typing patterns
    simulateTypingPattern(duration) {
        // Variable typing speed - faster at start, slower for complex words
        return Math.random() * duration * 0.7 + duration * 0.3;
    }

    // Connection status indicator
    createConnectionStatus(isOnline) {
        const status = document.createElement('div');
        status.className = `connection-status ${isOnline ? '' : 'offline'}`;
        status.textContent = isOnline ? 'Connected' : 'Offline';
        return status;
    }
}

const realtimeSimulator = new RealtimeSimulator();
