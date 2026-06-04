// ============================================
// REALTIME SYNC - Flawless state synchronization
// ============================================

class RealtimeSyncManager {
    constructor() {
        this.unreadCounts = new Map();
        this.onlineStatus = new Map();
        this.messageCache = new Map();
        this.syncQueue = [];
        this.isSyncing = false;
        this.initSync();
    }

    initSync() {
        // Process sync queue
        setInterval(() => this.processSyncQueue(), 100);
        
        // Validate state consistency
        setInterval(() => this.validateStateConsistency(), 5000);
    }

    // Queue operations to prevent race conditions
    queueSync(operation) {
        this.syncQueue.push(operation);
    }

    processSyncQueue() {
        if (this.isSyncing || this.syncQueue.length === 0) return;
        
        this.isSyncing = true;
        const operation = this.syncQueue.shift();
        
        Promise.resolve(operation()).then(() => {
            this.isSyncing = false;
        });
    }

    // Unread count synchronization
    updateUnreadCount(chatId, count) {
        this.queueSync(async () => {
            const badge = document.querySelector(`[data-chat-id="${chatId}"] .unread-badge`);
            if (!badge) return;

            // Animate only if changed
            if (this.unreadCounts.get(chatId) !== count) {
                this.unreadCounts.set(chatId, count);
                
                if (count > 0) {
                    badge.textContent = count > 99 ? '99+' : count;
                    badge.classList.add('new');
                    
                    // Remove animation class after animation
                    await new Promise(resolve => {
                        setTimeout(resolve, 400);
                    });
                    badge.classList.remove('new');
                } else {
                    badge.style.display = 'none';
                }
            }
        });
    }

    // Online status synchronization
    updateOnlineStatus(userId, isOnline) {
        this.queueSync(async () => {
            const currentStatus = this.onlineStatus.get(userId);
            
            // Only update if changed
            if (currentStatus === isOnline) return;
            
            this.onlineStatus.set(userId, isOnline);
            
            const dot = document.querySelector(`[data-user-id="${userId}"] .online-dot`);
            if (!dot) return;
            
            // Smooth transition
            dot.classList.add('transitioning');
            
            if (isOnline) {
                dot.classList.remove('offline');
            } else {
                dot.classList.add('offline');
            }
            
            await new Promise(resolve => setTimeout(resolve, 800));
            dot.classList.remove('transitioning');
        });
    }

    // Message deduplication
    addMessage(messageId, message) {
        if (this.messageCache.has(messageId)) {
            return; // Prevent duplicates
        }
        
        this.messageCache.set(messageId, message);
    }

    // State consistency validation
    validateStateConsistency() {
        // Check for stale unread counts
        for (const [chatId, count] of this.unreadCounts.entries()) {
            const actualCount = document.querySelectorAll(
                `[data-chat-id="${chatId}"] .msg.unread`
            ).length;
            
            if (count !== actualCount) {
                this.updateUnreadCount(chatId, actualCount);
            }
        }
    }

    // Optimistic UI updates with rollback
    optimisticUpdate(chatId, message) {
        const msgList = document.querySelector('.msg-list');
        const tempMsg = document.createElement('div');
        tempMsg.className = 'msg from-me sending';
        tempMsg.innerHTML = `<div class="msg-bubble">${message}</div>`;
        tempMsg.id = `temp-${Date.now()}`;
        
        msgList?.appendChild(tempMsg);
        
        return {
            rollback: () => tempMsg.remove(),
            confirm: (realId) => {
                tempMsg.id = realId;
                tempMsg.classList.remove('sending');
            }
        };
    }
}

const realtimeSyncManager = new RealtimeSyncManager();
