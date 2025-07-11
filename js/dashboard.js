// ==========================================
// MAIN DASHBOARD CONTROLLER
// ==========================================

import { CONFIG } from './config.js';
import { appState } from './state.js';
import { dataService } from './dataService.js';
import { uiManager } from './uiManager.js';
import { cacheManager } from './cache.js';
import { formatNumber } from './utils.js';

class DashboardController {
    constructor() {
        this.isInitialized = false;
        this.refreshInterval = null;
        this.eventListeners = new Map();
    }

    // Initialize the dashboard
    async initialize() {
        if (this.isInitialized) {
            console.log('Dashboard already initialized, skipping...');
            return;
        }

        console.log('Initializing dashboard...');
        
        try {
            // Ensure UI elements exist
            uiManager.ensureStatusElement();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Check configuration
            if (!this.isConfigurationValid()) {
                uiManager.updateStatus('Please configure the Google Apps Script URL', 'error');
                console.error('Google Apps Script URL not configured properly');
                return;
            }

            // Load initial data
            await this.loadInitialData();
            
            // Set up auto-refresh
            this.setupAutoRefresh();
            
            // Set up time updates
            this.setupTimeUpdates();
            
            this.isInitialized = true;
            console.log('Dashboard initialization complete');
            
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            uiManager.updateStatus('Dashboard initialization failed', 'error');
        }
    }

    // Check if configuration is valid
    isConfigurationValid() {
        return CONFIG.GOOGLE_APPS_SCRIPT_URL && 
               !CONFIG.GOOGLE_APPS_SCRIPT_URL.includes('YOUR_GOOGLE_APPS_SCRIPT');
    }

    // Load initial data
    async loadInitialData() {
        try {
            uiManager.showProgress('Loading market share data...', 20);
            
            const data = await dataService.fetchMarketShareData();
            
            if (data) {
                this.updateAllViews();
                uiManager.updateStatus(`Loaded ${Object.keys(data).length} weeks successfully`, 'success');
            }
            
            uiManager.hideProgress();
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
            uiManager.hideProgress();
            uiManager.updateStatus(`Error loading data: ${error.message}`, 'error');
        }
    }

    // Set up event listeners
    setupEventListeners() {
        // Refresh button
        const refreshButton = document.getElementById('refreshButton');
        if (refreshButton && !this.eventListeners.has('refresh')) {
            const handler = () => this.handleRefresh();
            refreshButton.addEventListener('click', handler);
            this.eventListeners.set('refresh', { element: refreshButton, handler });
        }

        // Week selectors
        this.setupWeekSelectorListeners();
        
        // Tab switching
        this.setupTabListeners();
        
        // Mobile drawer
        this.setupMobileDrawerListeners();
        
        // Visibility change for background updates
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.checkForUpdates();
            }
        });
    }

    // Set up week selector listeners
    setupWeekSelectorListeners() {
        const weekSelectors = ['weekDropdown', 'mobileWeekDropdown', 'drawerWeekDropdown'];
        
        weekSelectors.forEach(selectorId => {
            const selector = document.getElementById(selectorId);
            if (selector && !this.eventListeners.has(selectorId)) {
                const handler = (event) => this.handleWeekChange(event.target.value);
                selector.addEventListener('change', handler);
                this.eventListeners.set(selectorId, { element: selector, handler });
            }
        });
    }

    // Set up tab listeners
    setupTabListeners() {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            if (!tab.dataset.listenerAttached) {
                tab.addEventListener('click', (event) => {
                    const tabName = event.target.dataset.tab || event.target.textContent.toLowerCase();
                    this.handleTabSwitch(tabName, event.target);
                });
                tab.dataset.listenerAttached = 'true';
            }
        });
    }

    // Set up mobile drawer listeners
    setupMobileDrawerListeners() {
        const hamburger = document.querySelector('.hamburger-menu');
        const overlay = document.querySelector('.mobile-drawer-overlay');
        
        if (hamburger && !hamburger.dataset.listenerAttached) {
            hamburger.addEventListener('click', () => uiManager.toggleMobileDrawer());
            hamburger.dataset.listenerAttached = 'true';
        }
        
        if (overlay && !overlay.dataset.listenerAttached) {
            overlay.addEventListener('click', () => uiManager.closeMobileDrawer());
            overlay.dataset.listenerAttached = 'true';
        }
    }

    // Handle refresh
    async handleRefresh() {
        try {
            uiManager.showProgress('Refreshing data...', 0);
            
            // Force refresh both market share and charts data
            await Promise.all([
                dataService.fetchMarketShareData(true),
                dataService.fetchChartsData(true).catch(err => console.warn('Charts refresh failed:', err))
            ]);
            
            this.updateAllViews();
            uiManager.showTemporaryStatus('Data refreshed successfully', 'success');
            
        } catch (error) {
            console.error('Refresh failed:', error);
            uiManager.updateStatus(`Refresh failed: ${error.message}`, 'error');
        } finally {
            uiManager.hideProgress();
        }
    }

    // Handle week change
    handleWeekChange(week) {
        console.log('Week changed to:', week);
        appState.currentWeek = week;
        this.updateAllViews();
        
        // Update other week selectors
        const weeks = appState.getSortedWeeks();
        uiManager.updateWeekSelectors(weeks, week);
    }

    // Handle tab switch
    handleTabSwitch(tabName, element) {
        const newTab = uiManager.switchTab(tabName, element);
        appState.setCurrentTab(newTab);
        this.updateViewForTab(newTab);
    }

    // Update all views
    updateAllViews() {
        console.log('Updating all views...');
        
        // Check if we have data
        if (!appState.weeklyData || Object.keys(appState.weeklyData).length === 0) {
            console.log('No data available to display');
            return;
        }

        // Update week selectors
        const weeks = appState.getSortedWeeks();
        uiManager.updateWeekSelectors(weeks, appState.currentWeek);
        
        // Update current tab
        this.updateViewForTab(appState.currentTab);
    }

    // Update view for specific tab
    updateViewForTab(tabName) {
        console.log('Updating view for tab:', tabName);
        
        switch (tabName) {
            case 'overview':
                this.updateOverviewTab();
                break;
            case 'analytics':
                this.updateAnalyticsTab();
                break;
            case 'performance':
                this.updatePerformanceTab();
                break;
            case 'comparison':
                this.updateComparisonTab();
                break;
            case 'charts':
                this.updateChartsTab();
                break;
            case 'export':
                this.updateExportTab();
                break;
            default:
                console.warn('Unknown tab:', tabName);
        }
    }

    // Overview tab update
    updateOverviewTab() {
        console.log('Updating overview tab...');
        
        const currentData = appState.getCurrentWeekData();
        const previousData = appState.getPreviousWeekData();
        
        if (!currentData) {
            console.log('No current week data');
            return;
        }

        this.updateWeeklySummary(currentData, previousData);
        this.updateTotalMarketCard(currentData, previousData);
        this.updateMetricsGrid(currentData, previousData);
        this.updateCharts();
    }

    // Update weekly summary
    updateWeeklySummary(currentData, previousData) {
        const summaryEl = document.getElementById('weeklySummaryText');
        if (!summaryEl) return;
        
        let summaryText = `<strong>Week ending ${appState.currentWeek}:</strong><br>`;
        
        // Basic stats
        const totalLabels = Object.keys(currentData.marketShares || {}).length;
        summaryText += `Tracking ${totalLabels} labels in the market.<br>`;
        
        // Market leader
        const sortedLabels = Object.entries(currentData.marketShares || {})
            .sort((a, b) => b[1].percentage - a[1].percentage);
        
        if (sortedLabels.length > 0) {
            const [leader, leaderData] = sortedLabels[0];
            summaryText += `<br><strong>${leader}</strong> leads with ${leaderData.percentage.toFixed(1)}% market share`;
            
            if (previousData && previousData.marketShares[leader]) {
                const prevShare = previousData.marketShares[leader].percentage;
                const change = leaderData.percentage - prevShare;
                if (Math.abs(change) > 0.1) {
                    summaryText += ` (${change > 0 ? '+' : ''}${change.toFixed(1)}% from last week)`;
                }
            }
            summaryText += '.<br>';
        }
        
        // Add context if available
        const context = appState.getWeekContext(appState.currentWeek);
        if (context) {
            summaryText += `<br><br><em style="color: #667eea;">Context: ${context}</em>`;
        }
        
        summaryEl.innerHTML = summaryText;
    }

    // Update other tab methods (simplified for brevity)
    updateAnalyticsTab() {
        console.log('Updating analytics tab...');
        // Implementation would go here
    }

    updatePerformanceTab() {
        console.log('Updating performance tab...');
        // Implementation would go here
    }

    updateComparisonTab() {
        console.log('Updating comparison tab...');
        // Implementation would go here
    }

    updateChartsTab() {
        console.log('Updating charts tab...');
        // Implementation would go here - could integrate with charts module
    }

    updateExportTab() {
        console.log('Updating export tab...');
        // Implementation would go here
    }

    // Update total market card
    updateTotalMarketCard(currentData, previousData) {
        const card = document.getElementById('totalMarketCard');
        if (!card) return;
        
        let totalChange = 'N/A';
        let streamChange = 'N/A';
        
        if (previousData && currentData.totalMarketShareVolume && previousData.totalMarketShareVolume) {
            const change = ((currentData.totalMarketShareVolume.value - previousData.totalMarketShareVolume.value) / 
                           previousData.totalMarketShareVolume.value * 100);
            totalChange = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
        }
        
        if (previousData && currentData.totalStreaming && previousData.totalStreaming) {
            const change = ((currentData.totalStreaming - previousData.totalStreaming) / 
                           previousData.totalStreaming * 100);
            streamChange = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
        }
        
        card.innerHTML = `
            <h3>Total Market Overview</h3>
            <div class="metric">
                <span>Total Volume</span>
                <span>${formatNumber(currentData.totalMarketShareVolume?.value || 0)}</span>
                <span class="change">${totalChange} WoW</span>
            </div>
            <div class="metric">
                <span>Total Streaming</span>
                <span>${formatNumber(currentData.totalStreaming || 0)}</span>
                <span class="change">${streamChange} WoW</span>
            </div>
        `;
    }

    // Update metrics grid
    updateMetricsGrid(currentData, previousData) {
        const grid = document.getElementById('metricsGrid');
        if (!grid) return;
        
        const labels = Object.entries(currentData.marketShares)
            .sort((a, b) => b[1].percentage - a[1].percentage);
        
        grid.innerHTML = labels.map(([label, info]) => {
            let change = 'N/A';
            let changeClass = '';
            
            if (previousData && previousData.marketShares[label]) {
                const diff = info.percentage - previousData.marketShares[label].percentage;
                change = `${diff > 0 ? '+' : ''}${diff.toFixed(2)}%`;
                changeClass = diff > 0 ? 'positive' : diff < 0 ? 'negative' : '';
            }
            
            return `
                <div class="metric-card">
                    <div class="metric-label">${label}</div>
                    <div class="metric-value">${info.percentage.toFixed(1)}%</div>
                    <div class="metric-change ${changeClass}">${change} WoW</div>
                </div>
            `;
        }).join('');
    }

    // Update charts (placeholder)
    updateCharts() {
        // Chart updates would be implemented here
        console.log('Updating charts...');
    }

    // Set up auto-refresh
    setupAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.checkForUpdates();
            }
        }, CONFIG.UI.REFRESH_INTERVAL);
    }

    // Check for updates
    async checkForUpdates() {
        try {
            await dataService.checkForUpdatesInBackground();
        } catch (error) {
            console.warn('Background update check failed:', error);
        }
    }

    // Set up time updates
    setupTimeUpdates() {
        setInterval(() => {
            const timeEl = document.getElementById('lastUpdateTime');
            if (timeEl) {
                timeEl.textContent = new Date().toLocaleTimeString();
            }
        }, 1000);
    }

    // Cleanup
    destroy() {
        // Clear intervals
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        // Remove event listeners
        this.eventListeners.forEach(({ element, handler }) => {
            element.removeEventListener('click', handler);
            element.removeEventListener('change', handler);
        });
        this.eventListeners.clear();
        
        // Reset state
        this.isInitialized = false;
    }
}

// Create and export singleton instance
export const dashboard = new DashboardController();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => dashboard.initialize(), 100);
    });
} else {
    setTimeout(() => dashboard.initialize(), 100);
}

// Export class for testing
export { DashboardController };