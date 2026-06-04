// ============================================
// MOBILE SPACING CORRECTOR - Fixes all spacing issues
// ============================================

class MobileSpacingCorrector {
    constructor() {
        this.spacing = {
            xs: 4,
            sm: 8,
            md: 12,
            lg: 16,
            xl: 24,
            '2xl': 32
        };
        this.init();
    }

    init() {
        this.applyConsistentSpacing();
        this.balanceVerticalRhythm();
        this.fixHorizontalPadding();
        this.removeExcessiveGaps();
        this.optimizeResponsiveSpacing();
    }

    applyConsistentSpacing() {
        // Messages
        const messages = document.querySelectorAll('.msg');
        messages.forEach(msg => {
            msg.style.marginBottom = this.spacing.sm + 'px';
        });

        // Message groups
        const msgGroups = document.querySelectorAll('.msg-group');
        msgGroups.forEach(group => {
            group.style.marginBottom = this.spacing.md + 'px';
        });

        // Chat items
        const chatItems = document.querySelectorAll('.chat-item');
        chatItems.forEach(item => {
            item.style.padding = this.spacing.md + 'px';
            item.style.borderBottom = '1px solid var(--line)';
        });
    }

    balanceVerticalRhythm() {
        // Headers
        const headers = document.querySelectorAll('.header, .list-title');
        headers.forEach(header => {
            header.style.paddingTop = this.spacing.md + 'px';
            header.style.paddingBottom = this.spacing.md + 'px';
        });

        // Footers and dividers
        const dividers = document.querySelectorAll('hr, .divider');
        dividers.forEach(div => {
            div.style.margin = this.spacing.lg + 'px 0';
        });

        // Sections
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            section.style.marginBottom = this.spacing.xl + 'px';
        });
    }

    fixHorizontalPadding() {
        // Chat list
        const chatList = document.querySelector('.chat-list');
        if (chatList) {
            chatList.style.paddingLeft = this.spacing.lg + 'px';
            chatList.style.paddingRight = this.spacing.lg + 'px';
        }

        // Message list
        const msgList = document.querySelector('.msg-list');
        if (msgList) {
            msgList.style.paddingLeft = this.spacing.lg + 'px';
            msgList.style.paddingRight = this.spacing.lg + 'px';
        }

        // Sidebar
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.style.paddingLeft = this.spacing.lg + 'px';
            sidebar.style.paddingRight = this.spacing.lg + 'px';
        }
    }

    removeExcessiveGaps() {
        // Remove margin: 0 to all elements
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            const styles = window.getComputedStyle(el);
            const margin = styles.margin;
            
            if (margin === '0px 0px 0px 0px') {
                el.style.margin = '0';
            }
        });

        // Fix floating gaps
        const inputs = document.querySelector('.input-container');
        if (inputs) {
            inputs.style.marginBottom = '0';
            inputs.style.marginTop = '0';
        }
    }

    optimizeResponsiveSpacing() {
        // Mobile: 320px - 480px
        if (window.innerWidth <= 480) {
            document.documentElement.style.setProperty('--space-lg', '12px');
            document.documentElement.style.setProperty('--space-md', '10px');
        }
        // Tablet: 481px - 768px
        else if (window.innerWidth <= 768) {
            document.documentElement.style.setProperty('--space-lg', '16px');
            document.documentElement.style.setProperty('--space-md', '12px');
        }
        // Desktop: 769px+
        else {
            document.documentElement.style.setProperty('--space-lg', '20px');
            document.documentElement.style.setProperty('--space-md', '16px');
        }
    }
}

const mobileSpacingCorrector = new MobileSpacingCorrector();
