// ==========================================
// UI MANAGER MODULE
// ==========================================

import { DOM } from './utils.js';

class UIManager {
    constructor() {
        this.statusElement = null;
        this.progressOverlay = null;
    }

    // Ensure status element exists
    ensureStatusElement() {
        if (!this.statusElement) {
            this.statusElement = document.getElementById('dataStatus');
            if (!this.statusElement) {
                console.warn('Creating dataStatus element...');
                
                const container = document.querySelector('.controls') || 
                                 document.querySelector('.header') || 
                                 document.querySelector('.container') ||
                                 document.body;
                
                this.statusElement = document.createElement('div');
                this.statusElement.id = 'dataStatus';
                this.statusElement.style.cssText = 'padding: 10px; text-align: center; font-size: 14px; color: #888;';
                
                if (container.firstChild) {
                    container.insertBefore(this.statusElement, container.firstChild);
                } else {
                    container.appendChild(this.statusElement);
                }
            }
        }
        return this.statusElement;
    }

    // Show progress overlay
    showProgress(message, percent) {
        if (!this.progressOverlay) {
            this.progressOverlay = document.createElement('div');
            this.progressOverlay.id = 'progressOverlay';
            this.progressOverlay.className = 'progress-overlay';
            document.body.appendChild(this.progressOverlay);
        }

        this.progressOverlay.innerHTML = `
            <div class="progress-content">
                <div class="progress-spinner"></div>
                <div class="progress-message">${message || 'Loading...'}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percent || 0}%"></div>
                </div>
            </div>
        `;
        
        this.progressOverlay.classList.add('active');
    }

    // Update progress
    updateProgress(message, percent) {
        if (this.progressOverlay) {
            const messageEl = this.progressOverlay.querySelector('.progress-message');
            const fillEl = this.progressOverlay.querySelector('.progress-fill');
            
            if (messageEl) messageEl.textContent = message || 'Loading...';
            if (fillEl) fillEl.style.width = (percent || 0) + '%';
        }
    }

    // Hide progress overlay
    hideProgress() {
        if (this.progressOverlay) {
            this.progressOverlay.classList.remove('active');
        }
    }

    // Update status message
    updateStatus(message, type = 'info') {
        const statusEl = this.ensureStatusElement();
        
        const typeStyles = {
            success: 'color: #4ade80;',
            error: 'color: #f87171;',
            warning: 'color: #fbbf24;',
            info: 'color: #888;'
        };
        
        const icon = {
            success: '✓',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        statusEl.innerHTML = `<span style="${typeStyles[type]}">${icon[type]} ${message}</span>`;
    }

    // Show temporary status message
    showTemporaryStatus(message, type = 'success', duration = 3000) {
        const statusEl = this.ensureStatusElement();
        const originalText = statusEl.innerHTML;
        
        this.updateStatus(message, type);
        
        setTimeout(() => {
            statusEl.innerHTML = originalText;
        }, duration);
    }

    // Tab management
    switchTab(tabName, element) {
        console.log('Switching to tab:', tabName);
        
        // Update active tab styling
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        if (element) {
            element.classList.add('active');
        }
        
        // Hide all tab panels
        document.querySelectorAll('.tab-content').forEach(panel => {
            panel.style.display = 'none';
            panel.classList.remove('active');
        });
        
        // Show the selected tab panel
        const selectedPanel = document.getElementById(tabName + '-tab');
        if (selectedPanel) {
            selectedPanel.style.display = 'block';
            selectedPanel.classList.add('active');
        }
        
        return tabName;
    }

    // Mobile tab switching
    switchTabMobile(value) {
        const tabButtons = document.querySelectorAll('.tab');
        tabButtons.forEach(button => {
            if (button.textContent.toLowerCase().includes(value.toLowerCase()) || 
                button.onclick.toString().includes(`'${value}'`)) {
                this.switchTab(value, button);
            }
        });
    }

    // Update week selector dropdowns
    updateWeekSelectors(weeks, currentWeek) {
        const selectors = [
            'weekDropdown',
            'mobileWeekDropdown', 
            'drawerWeekDropdown'
        ];
        
        selectors.forEach(selectorId => {
            const selector = document.getElementById(selectorId);
            if (selector) {
                const currentValue = selector.value || currentWeek;
                selector.innerHTML = '';
                
                weeks.forEach(week => {
                    const option = document.createElement('option');
                    option.value = week;
                    option.textContent = week;
                    option.selected = week === currentValue;
                    selector.appendChild(option);
                });
            }
        });
    }

    // Mobile drawer functions
    toggleMobileDrawer() {
        const drawer = document.querySelector('.mobile-drawer');
        const overlay = document.querySelector('.mobile-drawer-overlay');
        const hamburger = document.querySelector('.hamburger-menu');
        
        [drawer, overlay, hamburger].forEach(element => {
            if (element) element.classList.toggle('active');
        });
    }

    closeMobileDrawer() {
        const drawer = document.querySelector('.mobile-drawer');
        const overlay = document.querySelector('.mobile-drawer-overlay');
        const hamburger = document.querySelector('.hamburger-menu');
        
        [drawer, overlay, hamburger].forEach(element => {
            if (element) element.classList.remove('active');
        });
    }

    switchTabDrawer(tabName, element) {
        // Switch the tab
        const newTab = this.switchTab(tabName, element);
        
        // Update active state in drawer
        document.querySelectorAll('.drawer-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        if (element) element.classList.add('active');
        
        // Close drawer
        this.closeMobileDrawer();
        
        return newTab;
    }

    // Show loading message for charts
    showChartsLoading() {
        const containers = ['songsChartContainer', 'albumsChartContainer'];
        
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '<div class="loading-message">Loading charts data for selected week...</div>';
            }
        });
        
        // Update overview insights
        const overviewElements = document.querySelectorAll('.charts-overview p');
        overviewElements.forEach(element => {
            element.textContent = 'Loading chart insights for selected week...';
        });
    }

    // Show message when no charts data is available
    showNoChartsDataMessage(week) {
        const containers = ['songsChartContainer', 'albumsChartContainer'];
        
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `<div class="no-data">No charts data available for ${week}. Please select a different week.</div>`;
            }
        });
        
        // Update insights
        const overviewElements = document.querySelectorAll('.charts-overview p');
        overviewElements.forEach(element => {
            element.textContent = `Charts data is not available for the selected week (${week}). Please choose a different week from the dropdown.`;
        });
    }

    // Show charts error message
    showChartsError() {
        const containers = ['songsChartContainer', 'albumsChartContainer'];
        
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '<div class="loading-message">Error loading charts data. Please try again.</div>';
            }
        });
    }

    // Update loading insights
    updateLoadingInsights() {
        const overviewElements = document.querySelectorAll('.charts-overview p');
        overviewElements.forEach(element => {
            element.textContent = 'Loading chart data to generate insights...';
        });
    }

    // Animation utilities
    fadeIn(element, duration = 300) {
        if (!element) return;
        
        element.style.opacity = '0';
        element.style.display = 'block';
        
        const start = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = progress.toString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    fadeOut(element, duration = 300) {
        if (!element) return;
        
        const start = performance.now();
        const startOpacity = parseFloat(getComputedStyle(element).opacity);
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = (startOpacity * (1 - progress)).toString();
            
            if (progress >= 1) {
                element.style.display = 'none';
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    // Form utilities
    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });
        }
    }

    // Notification system
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add to notification container or create one
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
        
        notification.style.pointerEvents = 'auto';
        container.appendChild(notification);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, duration);
        }
        
        return notification;
    }

    // Loading states for different sections
    setLoadingState(sectionId, isLoading, message = 'Loading...') {
        const section = document.getElementById(sectionId);
        if (!section) return;
        
        if (isLoading) {
            section.classList.add('loading');
            const loadingEl = section.querySelector('.loading-message');
            if (loadingEl) {
                loadingEl.textContent = message;
            } else {
                const newLoadingEl = document.createElement('div');
                newLoadingEl.className = 'loading-message';
                newLoadingEl.textContent = message;
                section.appendChild(newLoadingEl);
            }
        } else {
            section.classList.remove('loading');
            const loadingEl = section.querySelector('.loading-message');
            if (loadingEl) {
                loadingEl.remove();
            }
        }
    }
}

// Create and export singleton instance
export const uiManager = new UIManager();

// Export class for testing
export { UIManager };