
import { PlatformData } from '../types';

/**
 * Rate Limiter to ensure we don't exceed Google Ads API quotas.
 * Implements a Token Bucket algorithm to smooth out request bursts.
 */
class RateLimiter {
    private tokens: number;
    private maxTokens: number;
    private refillRatePerSecond: number;
    private lastRefillTimestamp: number;

    constructor(maxTokens: number, refillRatePerSecond: number) {
        this.maxTokens = maxTokens;
        this.tokens = maxTokens;
        this.refillRatePerSecond = refillRatePerSecond;
        this.lastRefillTimestamp = Date.now();
    }

    /**
     * Attempts to consume a token. If none available, waits until one is.
     */
    async consume(): Promise<void> {
        this.refill();
        
        if (this.tokens < 1) {
            const waitTime = 1000 / this.refillRatePerSecond;
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return this.consume();
        }

        this.tokens -= 1;
    }

    private refill() {
        const now = Date.now();
        const timePassed = (now - this.lastRefillTimestamp) / 1000;
        const newTokens = timePassed * this.refillRatePerSecond;
        
        this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
        this.lastRefillTimestamp = now;
    }
}

// Initialize rate limiter: 5 requests per second max burst, refilling at 2 req/sec
const apiRateLimiter = new RateLimiter(5, 2);

/**
 * Google Ads Service
 * Handles fetching campaign data via Google Ads API (Simulated)
 * Includes: Rate Limiting, Error Handling, Retry Logic, and Data Transformation.
 */
export const GoogleAdsService = {
    
    /**
     * Fetch campaign performance metrics for a specific customer
     * @param customerId - The Google Ads Customer ID
     * @param dateRange - The selected timeframe for reporting
     */
    async getCampaignPerformance(customerId: string, dateRange: 'daily' | 'weekly' | 'monthly'): Promise<PlatformData> {
        // Google Ads Query Language (GAQL)
        // We simulate adjusting the date range in the query
        const dateFilter = dateRange === 'daily' ? 'TODAY' : dateRange === 'weekly' ? 'LAST_7_DAYS' : 'LAST_30_DAYS';
        
        const query = `
            SELECT 
                metrics.impressions, 
                metrics.clicks, 
                metrics.average_cpc, 
                metrics.conversions,
                metrics.cost_micros 
            FROM campaign 
            WHERE segments.date DURING ${dateFilter}
        `;

        return this.executeQuery(customerId, query, dateRange);
    },

    /**
     * Executes a GAQL query against the API with retries and rate limiting.
     */
    async executeQuery(customerId: string, query: string, dateRange: string, retryCount = 0): Promise<PlatformData> {
        const MAX_RETRIES = 3;
        
        try {
            // 1. Apply Rate Limiting
            await apiRateLimiter.consume();

            // 2. Execute API Call (Simulated)
            const response = await this.mockApiNetworkCall(customerId, query, dateRange);
            
            // 3. Transform Response
            return this.transformResponse(response, dateRange);

        } catch (error: any) {
            // 4. Error Handling & Retries
            console.error(`[Google Ads API] Error on attempt ${retryCount + 1}:`, error.message);

            // Check if error is transient/retryable
            if (this.isRetryable(error) && retryCount < MAX_RETRIES) {
                // Exponential backoff: 1s, 2s, 4s
                const backoff = Math.pow(2, retryCount) * 1000; 
                console.log(`[Google Ads API] Retrying request in ${backoff}ms...`);
                await new Promise(resolve => setTimeout(resolve, backoff));
                return this.executeQuery(customerId, query, dateRange, retryCount + 1);
            }

            // If retries exhausted or fatal error, throw to caller
            throw error;
        }
    },

    /**
     * Mock the network request to Google's servers
     */
    async mockApiNetworkCall(customerId: string, query: string, dateRange: string): Promise<any> {
        // Simulate network latency (600ms - 1200ms)
        const latency = 600 + Math.random() * 600;
        await new Promise(resolve => setTimeout(resolve, latency));

        // Simulate random errors to test robustness
        const rand = Math.random();
        
        // 5% chance of Service Unavailable (503) - Retryable
        if (rand < 0.05) throw { code: 503, message: 'Service Unavailable' };
        
        // 5% chance of Rate Limit (429) - Retryable
        if (rand >= 0.05 && rand < 0.10) throw { code: 429, message: 'Resource Exhausted' };
        
        // 1% chance of Auth Error (401) - Fatal
        if (rand >= 0.10 && rand < 0.11) throw { code: 401, message: 'Unauthenticated' };

        // Multiplier logic to scale data based on time range
        const m = dateRange === 'daily' ? 1 : dateRange === 'weekly' ? 7 : 30;
        const variance = () => 0.9 + Math.random() * 0.2; // +/- 10%

        // Success Response Structure (Google Ads API format)
        return {
            results: [{
                metrics: {
                    impressions: Math.floor(41000 * m * variance()), 
                    clicks: Math.floor(1500 * m * variance()),       
                    average_cpc: 45000000, // micros (45.00)
                    conversions: Math.floor(40 * m * variance()),
                    cost_micros: 2034000000
                }
            }]
        };
    },

    /**
     * Determines if an error code is transient and worth retrying
     */
    isRetryable(error: any): boolean {
        return [503, 500, 502, 429].includes(error.code);
    },

    /**
     * Transforms raw Google Ads API response into Dashboard PlatformData
     */
    transformResponse(data: any, dateRange: string): PlatformData {
        const m = data.results[0].metrics;
        
        // Generate mock chart data for visual appeal
        const points = dateRange === 'daily' ? 8 : dateRange === 'weekly' ? 7 : 15;
        const labels = dateRange === 'daily' ? ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'] :
                       dateRange === 'weekly' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
                       Array.from({length: 15}, (_, i) => `Day ${i + 1}`);
        
        const chartData = labels.map(label => ({
            name: label,
            value: Math.floor((m.clicks / points) * (0.5 + Math.random()))
        }));

        return {
            id: 'google_ads',
            metrics: [
                { label: 'Impressions', value: (m.impressions >= 1000000 ? (m.impressions / 1000000).toFixed(1) + 'M' : (m.impressions / 1000).toFixed(1) + 'K'), change: '+12%', trend: 'up' },
                { label: 'Clicks', value: m.clicks.toLocaleString(), change: '+8%', trend: 'up' },
                { label: 'Avg. CPC', value: 'KES ' + (m.average_cpc / 1000000).toFixed(0), change: '-2%', trend: 'down' },
                { label: 'Conversions', value: m.conversions.toLocaleString(), change: '+15%', trend: 'up' },
            ],
            chartData
        };
    }
};
