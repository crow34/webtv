// API endpoints
export const M3U_URL = 'https://bit.ly/tta-m3u';
export const EPG_URL = 'https://bit.ly/tta-epg';

// Timeouts and delays
export const FETCH_TIMEOUT = 30000;
export const MAX_RETRIES = 5;
export const INITIAL_RETRY_DELAY = 1000;
export const MAX_RETRY_DELAY = 10000;

// Default values
export const DEFAULT_GROUP = 'Uncategorized';
export const DEFAULT_CHANNEL_NAME = 'Unknown Channel';

// CORS Proxies (ordered by reliability)
export const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://cors.eu.org/',
  'https://proxy.cors.sh/',
];