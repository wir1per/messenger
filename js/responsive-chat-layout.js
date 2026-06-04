// ============================================
// RESPONSIVE CHAT LAYOUT - Fixes all layout issues
// ============================================

class ResponsiveChatLayout {
    constructor() {
        this.init();
    }

    init() {
        this.fixMessageBubbles();
        this.fixMessageGrouping();
        this.fixAttachments();
        this.fixTimestamps();
        this.handleResponsiveReflow();
    }

    fixMessageBubbles() {
        const bubbles = document.querySelectorAll('.msg-bubble');
        
        bubbles.forEach(bubble => {
            // Set max width based on viewport
            if (window.innerWidth <= 480) {
                bubble.style.maxWidth = '85vw';
            } else if (window.innerWidth <= 768) {
                bubble.style.maxWidth = '70vw';
            } else {
                bubble.style.maxWidth = '400px';
            }

            // Enable text wrapping
            bubble.style.wordWrap = 'break-word';
            bubble.style.wordBreak = 'break-word';
            bubble.style.overflowWrap = 'break-word';
            bubble.style.whiteSpace = 'pre-wrap';

            // Proper padding
            bubble.style.padding = '12px 16px';
            bubble.style.borderRadius = 'var(--radius-lg)';
            bubble.style.display = 'inline-block';
        });
    }

    fixMessageGrouping() {
        const groups = document.querySelectorAll('.msg-group');
        
        groups.forEach(group => {
            // Flex layout
            group.style.display = 'flex';
            group.style.flexDirection = 'column';
            group.style.gap = '2px';
            group.style.marginBottom = '12px';
            group.style.marginTop = '0';
            group.style.marginLeft = '0';
            group.style.marginRight = '0';

            // Fix first and last child border radius
            const children = group.children;
            if (children.length > 1) {
                children[0].style.borderRadius = 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-sm)';
                children[children.length - 1].style.borderRadius = 'var(--radius-sm) var(--radius-sm) var(--radius-lg) var(--radius-lg)';
                
                // Middle children
                for (let i = 1; i < children.length - 1; i++) {
                    children[i].style.borderRadius = 'var(--radius-sm)';
                }
            }
        });
    }

    fixAttachments() {
        const attachments = document.querySelectorAll('.attachment-preview');
        
        attachments.forEach(attachment => {
            // Responsive sizing
            attachment.style.maxWidth = window.innerWidth <= 480 ? '80vw' : '500px';
            attachment.style.maxHeight = '200px';
            attachment.style.objectFit = 'cover';
            
            // Proper styling
            attachment.style.borderRadius = 'var(--radius)';
            attachment.style.display = 'block';
            attachment.style.margin = '8px 0';
        });
    }

    fixTimestamps() {
        const timestamps = document.querySelectorAll('.msg-timestamp');
        
        timestamps.forEach(timestamp => {
            timestamp.style.fontSize = '11px';
            timestamp.style.textAlign = 'center';
            timestamp.style.margin = '12px 0';
            timestamp.style.color = 'var(--muted)';
            timestamp.style.marginBottom = '12px';
        });
    }

    handleResponsiveReflow() {
        // Re-layout on resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.fixMessageBubbles();
                this.fixMessageGrouping();
                this.fixAttachments();
            }, 100);
        });
    }
}

const responsiveChatLayout = new ResponsiveChatLayout();
