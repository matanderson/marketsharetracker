// ==========================================
// CACHE MANAGEMENT MODULE
// ==========================================

import { CONFIG } from './config.js';
import { DateUtils } from './utils.js';

class CacheManager {
    constructor() {
        this.config = CONFIG.CACHE;
    }

    // Check if cache should be cleared (Monday or 7+ days old)
    shouldClearCache() {
        const lastCacheTime = localStorage.getItem(this.config.TIMESTAMP_KEY);
        if (!lastCacheTime) return true;
        
        const lastCache = new Date(parseInt(lastCacheTime));
        const now = new Date();
        
        // If it's Monday and cache is from before today
        if (DateUtils.isMonday()) {
            const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (lastCache < todayMidnight) {
                console.log('Monday cache clear triggered');
                return true;
            }
        }
        
        // Also clear if cache is older than 7 days
        const daysSinceCache = DateUtils.getDaysSince(lastCache);
        if (daysSinceCache > 7) {
            console.log('Weekly cache expiry triggered');
            return true;
        }
        
        return false;
    }

    // Get cached market share data
    getCachedData() {
        if (this.shouldClearCache()) {
            this.clearCache();
            return null;
        }
        
        try {
            const cached = localStorage.getItem(this.config.MAIN_KEY);
            if (cached) {
                console.log('Loading market share data from cache');
                return JSON.parse(cached);
            }
        } catch (error) {
            console.error('Cache read error:', error);
            this.clearCache();
        }
        return null;
    }

    // Set cached market share data
    setCachedData(data) {
        try {
            localStorage.setItem(this.config.MAIN_KEY, JSON.stringify(data));
            localStorage.setItem(this.config.TIMESTAMP_KEY, Date.now().toString());
            console.log('Market share data cached successfully');
        } catch (error) {
            console.error('Cache write error:', error);
            // If cache is full, clear and try again
            if (error.name === 'QuotaExceededError') {
                this.clearCache();
                try {
                    localStorage.setItem(this.config.MAIN_KEY, JSON.stringify(data));
                    localStorage.setItem(this.config.TIMESTAMP_KEY, Date.now().toString());
                } catch (e2) {
                    console.error('Cache still full after clear:', e2);
                }
            }
        }
    }

    // Get cached charts data
    getChartsCache() {
        try {
            const cached = localStorage.getItem(this.config.CHARTS_KEY);
            if (!cached) return null;
            
            const data = JSON.parse(cached);
            const cacheTime = new Date(data.timestamp);
            const now = new Date();
            const hoursDiff = (now - cacheTime) / (1000 * 60 * 60);
            
            if (hoursDiff > this.config.CHARTS_EXPIRY_HOURS) {
                localStorage.removeItem(this.config.CHARTS_KEY);
                return null;
            }
            
            console.log('Loading charts data from cache');
            return data.charts;
        } catch (error) {
            console.error('Error reading charts cache:', error);
            return null;
        }
    }

    // Set cached charts data
    setChartsCache(data) {
        try {
            const cacheData = {
                charts: data,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(this.config.CHARTS_KEY, JSON.stringify(cacheData));
            console.log('Charts data cached successfully');
        } catch (error) {
            console.error('Error setting charts cache:', error);
        }
    }

    // Clear all cache
    clearCache() {
        localStorage.removeItem(this.config.MAIN_KEY);
        localStorage.removeItem(this.config.VERSION_KEY);
        localStorage.removeItem(this.config.TIMESTAMP_KEY);
        console.log('Market share cache cleared');
    }

    // Clear charts cache
    clearChartsCache() {
        localStorage.removeItem(this.config.CHARTS_KEY);
        localStorage.removeItem(this.config.CHARTS_VERSION_KEY);
        console.log('Charts cache cleared');
    }

    // Clear all caches
    clearAllCaches() {
        this.clearCache();
        this.clearChartsCache();
        console.log('All caches cleared');
    }

    // Get cache statistics
    getCacheStats() {
        const mainCacheSize = this.getItemSize(this.config.MAIN_KEY);
        const chartsCacheSize = this.getItemSize(this.config.CHARTS_KEY);
        const totalSize = mainCacheSize + chartsCacheSize;
        
        return {
            mainCache: {
                size: mainCacheSize,
                exists: localStorage.getItem(this.config.MAIN_KEY) !== null,
                timestamp: localStorage.getItem(this.config.TIMESTAMP_KEY)
            },
            chartsCache: {
                size: chartsCacheSize,
                exists: localStorage.getItem(this.config.CHARTS_KEY) !== null
            },
            totalSize,
            quota: this.getStorageQuota()
        };
    }

    // Get size of localStorage item in bytes
    getItemSize(key) {
        const item = localStorage.getItem(key);
        return item ? new Blob([item]).size : 0;
    }

    // Get storage quota information
    getStorageQuota() {
        try {
            // Estimate storage quota
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                return navigator.storage.estimate();
            }
        } catch (error) {
            console.warn('Cannot estimate storage quota:', error);
        }
        return null;
    }

    // Version management for cache invalidation
    setVersion(version) {
        localStorage.setItem(this.config.VERSION_KEY, version);
    }

    getVersion() {
        return localStorage.getItem(this.config.VERSION_KEY);
    }

    // Check if cached version matches server version
    isVersionCurrent(serverVersion) {
        const cachedVersion = this.getVersion();
        return cachedVersion && cachedVersion === serverVersion;
    }
}

// Create and export singleton instance
export const cacheManager = new CacheManager();

// Export class for testing
export { CacheManager };