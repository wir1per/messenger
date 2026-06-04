// ============================================
// LOADING STATES - Polished async behavior
// ============================================

class LoadingStatesManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupSkeletonLoaders();
        this.setupProgressiveRendering();
        this.setupAsyncStateTransitions();
    }

    setupSkeletonLoaders() {
        // Create skeleton UI
        const createSkeleton = (count = 3) => {
            const container = document.createElement('div');
            container.className = 'skeleton-container';
            
            for (let i = 0; i < count; i++) {
                const skeleton = document.createElement('div');
                skeleton.className = 'skeleton-row';
                skeleton.innerHTML = `
                    <div class="skeleton skeleton-av"></div>
                    <div class="skeleton-col">
                        <div class="skeleton skeleton-line"></div>
                        <div class="skeleton skeleton-line short"></div>
                    </div>
                `;
                container.appendChild(skeleton);
            }
            
            return container;
        };
        
        window.createSkeletonLoader = createSkeleton;
    }

    setupProgressiveRendering() {
        // Render items progressively
        const renderProgressive = (items, container, delay = 50) => {
            items.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add('fetch-item');
                    container.appendChild(item);
                }, index * delay);
            });
        };
        
        window.renderProgressive = renderProgressive;
    }

    setupAsyncStateTransitions() {
        // Smooth state transitions
        const transitionState = (element, fromState, toState, duration = 500) => {
            element.style.animation = `asyncTransition ${duration}ms ease-out`;
            element.setAttribute('data-state', toState);
        };
        
        window.transitionState = transitionState;
    }
}

const loadingStatesManager = new LoadingStatesManager();
