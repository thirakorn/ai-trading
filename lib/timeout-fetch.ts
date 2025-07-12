// Enhanced fetch with timeout and retry capabilities for production reliability

interface TimeoutFetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export async function timeoutFetch(
  url: string, 
  options: TimeoutFetchOptions = {}
): Promise<Response> {
  const {
    timeout = 10000, // 10 seconds default
    retries = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      // Return response if successful or if it's the last attempt
      if (response.ok || attempt === retries) {
        return response;
      }

      // Log non-ok responses but continue retrying
      console.warn(`Fetch attempt ${attempt + 1} failed with status:`, response.status);
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(`Unknown error: ${error}`);
      
      console.warn(`Fetch attempt ${attempt + 1} failed:`, lastError.message);
      
      // Don't retry on abort (timeout) for the last attempt
      if (attempt === retries) {
        throw lastError;
      }

      // Wait before retry (with exponential backoff)
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('All fetch attempts failed');
}

// Specific timeout fetch for Binance API with appropriate defaults
export async function binanceFetch(
  url: string,
  options: TimeoutFetchOptions = {}
): Promise<Response> {
  return timeoutFetch(url, {
    timeout: 15000, // 15 seconds for Binance API
    retries: 2, // 2 retries
    retryDelay: 2000, // 2 second delay
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; BTC-Trading-Analyzer/1.0)',
      ...options.headers
    },
    cache: 'no-store',
    ...options
  });
}