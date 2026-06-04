// ============================================
// CHAT EXPERIENCE - Immersive conversation UX
// ============================================

class ChatExperience {
    constructor() {
        this.init();
    }

    init() {
        this.setupMessageGrouping();
        this.setupReactions();
        this.setupAttachments();
        this.setupRichContent();
    }

    setupMessageGrouping() {
        const msgList = document.querySelector('.msg-list');
        if (!msgList) return;

        const observer = new MutationObserver(() => {
            this.groupConsecutiveMessages();
        });

        observer.observe(msgList, { childList: true });
    }

    groupConsecutiveMessages() {
        const messages = document.querySelectorAll('.msg');
        let lastAuthor = null;
        let group = null;

        messages.forEach((msg, index) => {
            const author = msg.getAttribute('data-author');
            const timestamp = msg.getAttribute('data-timestamp');
            
            // Same author within 5 minutes
            if (author === lastAuthor && group) {
                group.appendChild(msg);
            } else {
                // Create new group
                if (group && group.children.length > 1) {
                    group.classList.add('msg-group');
                }
                
                group = document.createElement('div');
                group.className = 'msg-group';
                group.appendChild(msg);
                lastAuthor = author;
            }
        });
    }

    setupReactions() {
        const messages = document.querySelectorAll('.msg');
        
        messages.forEach(msg => {
            msg.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showReactionMenu(msg, e);
            });
        });
    }

    showReactionMenu(msg, e) {
        const reactions = ['👍', '❤️', '😂', '🤔', '😢', '🔥'];
        const menu = document.createElement('div');
        menu.className = 'reaction-menu';
        menu.style.position = 'absolute';
        menu.style.left = `${e.clientX}px`;
        menu.style.top = `${e.clientY}px`;
        menu.style.background = 'var(--panel)';
        menu.style.borderRadius = 'var(--radius-lg)';
        menu.style.padding = '8px';
        menu.style.display = 'flex';
        menu.style.gap = '4px';
        menu.style.animation = 'dropdownOpen 0.3s ease-out';
        menu.style.zIndex = '1000';

        reactions.forEach(emoji => {
            const btn = document.createElement('button');
            btn.textContent = emoji;
            btn.style.fontSize = '20px';
            btn.style.cursor = 'pointer';
            btn.onclick = () => this.addReaction(msg, emoji);
            menu.appendChild(btn);
        });

        document.body.appendChild(menu);
        
        // Close menu on outside click
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 100);
    }

    addReaction(msg, emoji) {
        let reactionsContainer = msg.querySelector('.reactions');
        if (!reactionsContainer) {
            reactionsContainer = document.createElement('div');
            reactionsContainer.className = 'reactions';
            msg.appendChild(reactionsContainer);
        }

        const reaction = document.createElement('span');
        reaction.className = 'reaction';
        reaction.textContent = emoji;
        reaction.style.animation = 'floatingReaction 1.2s ease-out';
        reactionsContainer.appendChild(reaction);
    }

    setupAttachments() {
        const uploadArea = document.querySelector('.upload-area');
        if (!uploadArea) return;

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            this.handleFileDrop(e.dataTransfer.files);
        });
    }

    handleFileDrop(files) {
        Array.from(files).forEach(file => {
            const preview = document.createElement('div');
            preview.className = 'attachment-preview';
            preview.textContent = `📎 ${file.name}`;
            preview.style.animation = 'attachmentEnter 0.4s ease-out';
            
            document.querySelector('.upload-area')?.appendChild(preview);
        });
    }

    setupRichContent() {
        // Markdown rendering
        const messages = document.querySelectorAll('.msg-content');
        messages.forEach(msg => {
            this.renderMarkdown(msg);
        });
    }

    renderMarkdown(element) {
        let html = element.innerHTML;
        
        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Links
        html = html.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" rel="noopener">$1</a>'
        );
        
        // Code
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');
        
        element.innerHTML = html;
    }
}

const chatExperience = new ChatExperience();
