import { CORS_PROXIES, FETCH_TIMEOUT, MAX_RETRIES, INITIAL_RETRY_DELAY } from '../config/constants';

const proxyCache = new Map<string, string>();

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
  });
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    timeout(FETCH_TIMEOUT)
  ]);
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<Response> {
  const headers = {
    ...options.headers,
    'Accept': '*/*',
    'Origin': window.location.origin,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  };

  // Try direct fetch first
  try {
    const response = await fetchWithTimeout(url, { ...options, headers });
    if (response.ok) {
      return response;
    }
  } catch (error) {
    console.warn('Direct fetch failed:', error);
  }

  // Try cached proxy
  const cachedProxy = proxyCache.get(url);
  if (cachedProxy) {
    try {
      const response = await fetchWithTimeout(
        `${cachedProxy}${encodeURIComponent(url)}`,
        { ...options, headers }
      );
      if (response.ok) {
        return response;
      }
    } catch (error) {
      console.warn('Cached proxy failed:', error);
      proxyCache.delete(url);
    }
  }

  // Try each proxy in sequence
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
      const response = await fetchWithTimeout(proxyUrl, { ...options, headers });

      if (response.ok) {
        proxyCache.set(url, proxy);
        return response;
      }
    } catch (error) {
      console.warn(`Proxy ${proxy} failed:`, error);
      continue;
    }
  }

  if (retryCount < MAX_RETRIES) {
    const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCount), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retryCount + 1);
  }

  throw new Error('Failed to fetch resource after all attempts');
}