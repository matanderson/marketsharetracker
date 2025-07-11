// ==========================================
// CONFIGURATION MODULE
// ==========================================

export const CONFIG = {
    // Google Apps Script URLs
    GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwi63m01Jcwiq1gE7-ML0UXi2_GfEQTCwFmW7KMQpW71n8mf3finsvKXswLnrZShuCdrw/exec',
    CHARTS_GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzLEoouQy021rmgJ95kVudJz-t6oQybjDK-yn1zRd8J-eUnIFvPz2tnY2WU5dIFvxZvng/exec',
    
    // Spotify API Configuration
    SPOTIFY_CLIENT_ID: '4777efa77ba14e3ea18f230c63821ce9',
    SPOTIFY_CLIENT_SECRET: 'a16a0c1146904826ab8b83d679894d8b',
    
    // Cache Configuration
    CACHE: {
        MAIN_KEY: 'marketShareData',
        VERSION_KEY: 'marketShareDataVersion',
        TIMESTAMP_KEY: 'marketShareDataTimestamp',
        CHARTS_KEY: 'chartsDataCache',
        CHARTS_VERSION_KEY: 'chartsDataVersion',
        CHARTS_EXPIRY_HOURS: 6
    },
    
    // UI Configuration
    UI: {
        REFRESH_INTERVAL: 30 * 60 * 1000, // 30 minutes
        CHART_ANIMATION_DURATION: 0.5,
        SPOTIFY_REQUEST_DELAY: 200
    }
};

// Color configuration for labels
export const LABEL_COLORS = {
    'Provident': '#E25423',
    'CCMG': '#1696F3',
    'ADA': '#FEAE20',
    'THE ORCHARD': '#3DB5AD',
    'Fair Trade': '#44A700',
    'WORD/CURB': '#A350DD',
    'Total Others': '#95A5A6'
};

export function getLabelColor(label) {
    return LABEL_COLORS[label] || '#888888';
}