// ==========================================
// STATE MANAGEMENT MODULE
// ==========================================

import { DateUtils } from './utils.js';

class AppState {
    constructor() {
        // Core data
        this.weeklyData = {};
        this.songsData = [];
        this.albumsData = [];
        
        // UI state
        this.currentWeek = '';
        this.currentTab = 'overview';
        this.currentChartsView = 'summary';
        this.currentSongFilter = 'all';
        this.currentAlbumFilter = 'all';
        
        // Context and projections
        this.weekContexts = {};
        this.futureProjections = [];
        this.appliedGeneralContext = null;
        
        // Authentication state
        this.isSettingsAuthenticated = false;
        this.spotifyAccessToken = null;
        
        // Initialize state from localStorage
        this.loadPersistedState();
    }

    // Load persisted state from localStorage
    loadPersistedState() {
        try {
            const savedContexts = localStorage.getItem('weekContexts');
            if (savedContexts) {
                this.weekContexts = JSON.parse(savedContexts);
            }

            const savedProjections = localStorage.getItem('futureProjections');
            if (savedProjections) {
                this.futureProjections = JSON.parse(savedProjections);
            }

            const savedGeneralContext = localStorage.getItem('appliedGeneralContext');
            if (savedGeneralContext) {
                this.appliedGeneralContext = savedGeneralContext;
            }
        } catch (error) {
            console.error('Error loading persisted state:', error);
        }
    }

    // Save state to localStorage
    savePersistedState() {
        try {
            localStorage.setItem('weekContexts', JSON.stringify(this.weekContexts));
            localStorage.setItem('futureProjections', JSON.stringify(this.futureProjections));
            if (this.appliedGeneralContext) {
                localStorage.setItem('appliedGeneralContext', this.appliedGeneralContext);
            }
        } catch (error) {
            console.error('Error saving persisted state:', error);
        }
    }

    // Update weekly data
    setWeeklyData(data) {
        this.weeklyData = data;
        this.setCurrentWeek();
    }

    // Set current week to most recent
    setCurrentWeek() {
        if (this.weeklyData && Object.keys(this.weeklyData).length > 0) {
            const weeks = Object.keys(this.weeklyData).sort();
            this.currentWeek = weeks[weeks.length - 1];
            console.log('Current week set to:', this.currentWeek);
        }
    }

    // Get current week data
    getCurrentWeekData() {
        return this.weeklyData[this.currentWeek] || null;
    }

    // Get previous week data
    getPreviousWeekData() {
        const weeks = Object.keys(this.weeklyData).sort();
        const currentIndex = weeks.indexOf(this.currentWeek);
        if (currentIndex > 0) {
            const prevWeek = weeks[currentIndex - 1];
            return this.weeklyData[prevWeek];
        }
        return null;
    }

    // Get all sorted weeks
    getSortedWeeks() {
        return Object.keys(this.weeklyData).sort();
    }

    // Update charts data
    setChartsData(songs, albums) {
        this.songsData = songs || [];
        this.albumsData = albums || [];
    }

    // Tab management
    setCurrentTab(tab) {
        this.currentTab = tab;
    }

    // Charts view management
    setCurrentChartsView(view) {
        this.currentChartsView = view;
    }

    // Filter management
    setSongFilter(filter) {
        this.currentSongFilter = filter;
    }

    setAlbumFilter(filter) {
        this.currentAlbumFilter = filter;
    }

    // Context management
    addWeekContext(week, context) {
        this.weekContexts[week] = context;
        this.savePersistedState();
    }

    removeWeekContext(week) {
        delete this.weekContexts[week];
        this.savePersistedState();
    }

    getWeekContext(week) {
        return this.weekContexts[week] || this.appliedGeneralContext;
    }

    clearAllContexts() {
        this.weekContexts = {};
        this.appliedGeneralContext = null;
        localStorage.removeItem('weekContexts');
        localStorage.removeItem('appliedGeneralContext');
    }

    // Projection management
    addProjection(projection) {
        this.futureProjections.push(projection);
        this.savePersistedState();
    }

    removeProjection(index) {
        this.futureProjections.splice(index, 1);
        this.savePersistedState();
    }

    clearAllProjections() {
        this.futureProjections = [];
        localStorage.removeItem('futureProjections');
    }

    // Authentication
    setSettingsAuthenticated(authenticated) {
        this.isSettingsAuthenticated = authenticated;
    }

    setSpotifyToken(token) {
        this.spotifyAccessToken = token;
    }

    // Get filtered songs based on current filter
    getFilteredSongs() {
        let filtered = [...this.songsData];
        
        switch (this.currentSongFilter) {
            case 'fresh':
                filtered = this.songsData.filter(song => song.weeksOnChart <= 52);
                break;
            case 'new':
                filtered = this.songsData.filter(song => song.isNew);
                break;
            case 'increases':
                filtered = this.songsData.filter(song => song.movement === 'up' || song.percentChange > 0);
                break;
            case 'decreases':
                filtered = this.songsData.filter(song => song.movement === 'down' || song.percentChange < 0);
                break;
        }
        
        return filtered;
    }

    // Get filtered albums based on current filter
    getFilteredAlbums() {
        let filtered = [...this.albumsData];
        
        switch (this.currentAlbumFilter) {
            case 'new':
                filtered = this.albumsData.filter(album => album.isNew);
                break;
            case 'increases':
                filtered = this.albumsData.filter(album => album.movement === 'up' || album.percentChange > 0);
                break;
            case 'decreases':
                filtered = this.albumsData.filter(album => album.movement === 'down' || album.percentChange < 0);
                break;
        }
        
        return filtered;
    }

    // Get analytics data
    getAnalyticsData() {
        const currentData = this.getCurrentWeekData();
        const previousData = this.getPreviousWeekData();
        
        return {
            current: currentData,
            previous: previousData,
            totalWeeks: Object.keys(this.weeklyData).length,
            hasChartsData: this.songsData.length > 0 || this.albumsData.length > 0
        };
    }

    // Reset state
    reset() {
        this.weeklyData = {};
        this.songsData = [];
        this.albumsData = [];
        this.currentWeek = '';
        this.currentTab = 'overview';
        this.currentChartsView = 'summary';
        this.currentSongFilter = 'all';
        this.currentAlbumFilter = 'all';
        this.isSettingsAuthenticated = false;
        this.spotifyAccessToken = null;
    }
}

// Create and export singleton instance
export const appState = new AppState();

// Export class for testing
export { AppState };