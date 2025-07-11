// Central configuration constants used across the application
// -----------------------------------------------------------------------------
// Feel free to add/adjust values here and import them elsewhere via:
//   import { GOOGLE_APPS_SCRIPT_URL, LABEL_COLORS } from '../config.js';
// -----------------------------------------------------------------------------

// URLs ------------------------------------------------------------------------
export const GOOGLE_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwi63m01Jcwiq1gE7-ML0UXi2_GfEQTCwFmW7KMQpW71n8mf3finsvKXswLnrZShuCdrw/exec';

export const CHARTS_GOOGLE_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzLEoouQy021rmgJ95kVudJz-t6oQybjDK-yn1zRd8J-eUnIFvPz2tnY2WU5dIFvxZvng/exec';

// Cache keys & related values --------------------------------------------------
export const CACHE_KEYS = {
  MARKET_SHARE: 'marketShareData',
  MARKET_SHARE_VERSION: 'marketShareDataVersion',
  MARKET_SHARE_TIMESTAMP: 'marketShareDataTimestamp',
  CHARTS: 'chartsDataCache',
  CHARTS_VERSION: 'chartsDataVersion'
};

export const CHARTS_CACHE_EXPIRY_HOURS = 6;

// Colour palette --------------------------------------------------------------
export const LABEL_COLORS = {
  Provident: '#E25423',
  CCMG: '#1696F3',
  ADA: '#FEAE20',
  'THE ORCHARD': '#3DB5AD',
  'Fair Trade': '#44A700',
  'WORD/CURB': '#A350DD',
  'Total Others': '#95A5A6'
};

// Spotify credentials (client-credential flow) ---------------------------------
// NOTE: in production you would never ship client secrets to the browser.
// Keep these on a backend or use a proxy. They are included here only because
// the original implementation relied on them client-side.
export const SPOTIFY_CLIENT_ID = '4777efa77ba14e3ea18f230c63821ce9';
export const SPOTIFY_CLIENT_SECRET = 'a16a0c1146904826ab8b83d679894d8b';