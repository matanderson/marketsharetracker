// ==========================================
// DATA SERVICE MODULE
// ==========================================

import { CONFIG } from './config.js';
import { cacheManager } from './cache.js';
import { appState } from './state.js';
import { mapLabelName, calculateMovement } from './utils.js';

class DataService {
    constructor() {
        this.config = CONFIG;
    }

    // Fetch market share data from Google Drive
    async fetchMarketShareData(forceRefresh = false) {
        const startTime = performance.now();
        
        try {
            // Check cache first unless force refresh
            if (!forceRefresh) {
                const cachedData = cacheManager.getCachedData();
                if (cachedData && Object.keys(cachedData).length > 0) {
                    appState.setWeeklyData(cachedData);
                    console.log(`Loaded ${Object.keys(cachedData).length} weeks from cache`);
                    
                    // Check for updates in background
                    this.checkForUpdatesInBackground();
                    return cachedData;
                }
            }
            
            // First, fetch recent 8 weeks for fast initial load
            console.log('Fetching recent 8 weeks...');
            const recentUrl = `${this.config.GOOGLE_APPS_SCRIPT_URL}?action=getRecentData&weeks=8`;
            
            const recentResponse = await fetch(recentUrl);
            if (!recentResponse.ok) {
                throw new Error(`HTTP error! status: ${recentResponse.status}`);
            }
            
            const recentData = await recentResponse.json();
            
            if (recentData && !recentData.error && Object.keys(recentData).length > 0) {
                appState.setWeeklyData(recentData);
                
                const loadTime = ((performance.now() - startTime) / 1000).toFixed(2);
                console.log(`Loaded recent ${Object.keys(recentData).length} weeks in ${loadTime}s`);
                
                // Save recent data to cache
                cacheManager.setCachedData(recentData);
                
                // Load remaining data in background
                this.loadRemainingDataInBackground();
                
                return recentData;
            } else {
                throw new Error('No recent data received');
            }
            
        } catch (error) {
            console.error('Error fetching market share data:', error);
            
            // Try to use cached data as fallback
            const cachedData = cacheManager.getCachedData();
            if (cachedData && Object.keys(cachedData).length > 0) {
                appState.setWeeklyData(cachedData);
                console.log('Using cached data as fallback');
                return cachedData;
            } else {
                throw error;
            }
        }
    }

    // Load remaining historical data in background
    async loadRemainingDataInBackground() {
        try {
            console.log('Loading historical data in background...');
            
            const allUrl = `${this.config.GOOGLE_APPS_SCRIPT_URL}?action=getAllData`;
            const response = await fetch(allUrl);
            
            if (response.ok) {
                const allData = await response.json();
                
                if (allData && !allData.error && Object.keys(allData).length > Object.keys(appState.weeklyData).length) {
                    // Merge with existing data
                    const mergedData = { ...appState.weeklyData, ...allData };
                    appState.setWeeklyData(mergedData);
                    
                    // Update cache with complete data
                    cacheManager.setCachedData(mergedData);
                    
                    console.log('Background loading complete:', Object.keys(mergedData).length, 'weeks');
                    return mergedData;
                }
            }
        } catch (error) {
            console.warn('Background loading failed:', error);
        }
    }

    // Check for updates in background
    async checkForUpdatesInBackground() {
        try {
            const versionUrl = `${this.config.GOOGLE_APPS_SCRIPT_URL}?action=getVersion`;
            const response = await fetch(versionUrl);
            
            if (response.ok) {
                const versionData = await response.json();
                
                if (!cacheManager.isVersionCurrent(versionData.version)) {
                    console.log('New data available, updating...');
                    
                    // Fetch new data in background
                    const allUrl = `${this.config.GOOGLE_APPS_SCRIPT_URL}?action=getAllData`;
                    const dataResponse = await fetch(allUrl);
                    
                    if (dataResponse.ok) {
                        const newData = await dataResponse.json();
                        if (newData && !newData.error) {
                            appState.setWeeklyData(newData);
                            cacheManager.setCachedData(newData);
                            cacheManager.setVersion(versionData.version);
                            
                            console.log(`Updated to latest data (${Object.keys(newData).length} weeks)`);
                            return newData;
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Update check failed:', error);
        }
    }

    // Fetch charts data from Google Drive
    async fetchChartsData(forceRefresh = false) {
        try {
            // Check cache first unless force refresh
            if (!forceRefresh) {
                const cachedData = cacheManager.getChartsCache();
                if (cachedData) {
                    const processedData = this.processChartsData(cachedData);
                    appState.setChartsData(processedData.songs, processedData.albums);
                    return processedData;
                }
            }
            
            // Clear cache if force refresh
            if (forceRefresh) {
                cacheManager.clearChartsCache();
            }
            
            // Add timestamp to prevent caching
            const timestamp = forceRefresh ? `&_t=${Date.now()}` : '';
            const response = await fetch(`${this.config.CHARTS_GOOGLE_APPS_SCRIPT_URL}?action=getChartsData${timestamp}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const rawData = await response.json();
            console.log('Charts data received:', rawData);
            
            if (rawData.error) {
                throw new Error(rawData.error);
            }
            
            // Process the data
            const processedData = this.processChartsData(rawData);
            appState.setChartsData(processedData.songs, processedData.albums);
            
            // Cache the processed data
            cacheManager.setChartsCache(processedData);
            
            console.log(`Loaded ${processedData.songs.length} songs, ${processedData.albums.length} albums`);
            return processedData;
            
        } catch (error) {
            console.error('Error fetching charts data:', error);
            throw error;
        }
    }

    // Fetch charts data for specific week
    async fetchChartsDataForWeek(week) {
        try {
            const response = await fetch(`${this.config.CHARTS_GOOGLE_APPS_SCRIPT_URL}?action=getChartsData&week=${week}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const rawData = await response.json();
            
            if (rawData.error) {
                throw new Error(rawData.error);
            }
            
            // Process the week-specific data
            return this.processChartsData(rawData);
        } catch (error) {
            console.error('Error fetching charts data for week:', error);
            throw error;
        }
    }

    // Process charts data from Google Drive
    processChartsData(rawData) {
        console.log('Processing charts data...');
        
        // Process songs data
        const songs = this.processNewFormatSongs(rawData.songs || []);
        
        // Process albums data  
        const albums = this.processNewFormatAlbums(rawData.albums || []);
        
        console.log(`Processed ${songs.length} songs and ${albums.length} albums`);
        
        return { songs, albums };
    }

    // Process songs data with new format
    processNewFormatSongs(songsArray) {
        if (!songsArray || songsArray.length === 0) {
            console.log('No songs data to process');
            return [];
        }
        
        console.log('Processing', songsArray.length, 'songs');
        
        const songs = songsArray.map((song, index) => {
            const item = {
                rank: parseInt(song.thisWeekRank) || index + 1,
                artist: song.artist || 'Unknown Artist',
                title: song.title || 'Unknown Title',
                label: mapLabelName(song.label),
                streams: parseInt(song.streams) || 0,
                lastWeek: parseInt(song.lastWeekRank) || 0,
                twoWeeksAgo: parseInt(song.twoWeekRank) || 0,
                percentChange: parseFloat(song.percentChange) || 0,
                weeksOnChart: parseInt(song.weeksOn) || 1,
                rtdStreams: parseInt(song.rtdStreams) || 0,
                movement: calculateMovement(parseInt(song.thisWeekRank), parseInt(song.lastWeekRank)),
                isNew: !song.lastWeekRank || parseInt(song.lastWeekRank) === 0
            };
            
            return item;
        }).filter(song => song.rank > 0 && song.artist !== 'Unknown Artist')
          .sort((a, b) => a.rank - b.rank);
        
        console.log('Processed', songs.length, 'valid songs');
        return songs;
    }

    // Process albums data with new format
    processNewFormatAlbums(albumsArray) {
        if (!albumsArray || albumsArray.length === 0) {
            console.log('No albums data to process');
            return [];
        }
        
        console.log('Processing', albumsArray.length, 'albums');
        
        const albums = albumsArray.map((album, index) => {
            const item = {
                rank: parseInt(album.thisWeekRank) || index + 1,
                artist: album.artist || 'Unknown Artist',
                title: album.title || 'Unknown Title',
                label: mapLabelName(album.label),
                sales: parseInt(album.activity) || 0,
                streams: parseInt(album.streams) || 0,
                lastWeek: parseInt(album.lastWeekRank) || 0,
                peakPosition: parseInt(album.peakRank) || index + 1,
                percentChange: parseFloat(album.percentChange) || 0,
                weeksOnChart: parseInt(album.weeksOn) || 1,
                albumSales: parseInt(album.albumSales) || 0,
                totalStreams: parseInt(album.totalStreams) || 0,
                movement: calculateMovement(parseInt(album.thisWeekRank), parseInt(album.lastWeekRank)),
                isNew: !album.lastWeekRank || parseInt(album.lastWeekRank) === 0
            };
            
            return item;
        }).filter(album => album.rank > 0 && album.artist !== 'Unknown Artist')
          .sort((a, b) => a.rank - b.rank);
        
        console.log('Processed', albums.length, 'valid albums');
        return albums;
    }
}

// Create and export singleton instance
export const dataService = new DataService();

// Export class for testing
export { DataService };