
import { PlatformData } from '../types';

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

// Meta Graph API limits are complex, usually user-bucket based. 
const metaRateLimiter = new RateLimiter(20, 5);

export const MetaAdsService = {
    /**
     * Simulates Graph API '/insights' endpoint
     * GET graph.facebook.com/v18.0/{act_id}/insights
     */
    async fetchData(accountId: string, dateRange: 'daily' | 'weekly' | 'monthly'): Promise<PlatformData> {
        return this.executeQuery(accountId, dateRange);
    },

    async executeQuery(accountId: string, dateRange: 'daily' | 'weekly' | 'monthly', retryCount = 0): Promise<PlatformData> {
        const MAX_RETRIES = 3;
        try {
            await metaRateLimiter.consume();
            const response = await this.mockApiNetworkCall(accountId, dateRange);
            return this.transformResponse(response, dateRange);
        } catch (error: any) {
            console.error(`[Meta API] Error on attempt ${retryCount + 1}:`, error.message);
            
            if (this.isRetryable(error) && retryCount < MAX_RETRIES) {
                const backoff = Math.pow(2, retryCount) * 1000;
                await new Promise(resolve => setTimeout(resolve, backoff));
                return this.executeQuery(accountId, dateRange, retryCount + 1);
            }
            throw error;
        }
    },

    async mockApiNetworkCall(accountId: string, dateRange: string): Promise<any> {
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 400));

        // Simulate random errors
        const rand = Math.random();
        if (rand < 0.05) throw { code: 500, message: 'Internal Server Error' }; // Retryable
        if (rand >= 0.05 && rand < 0.10) throw { code: 4, message: 'Application request limit reached' }; // Retryable

        const m = dateRange === 'daily' ? 1 : dateRange === 'weekly' ? 7 : 30;
        
        return {
            data: [{
                reach: Math.floor(45000 * m * (0.9 + Math.random() * 0.2)),
                engagement: Math.floor(3200 * m * (0.9 + Math.random() * 0.2)),
                ctr: 1.4 + (Math.random() * 0.4),
                spend: Math.floor(2500 * m)
            }]
        };
    },

    isRetryable(error: any): boolean {
        // Meta API Error codes: 4 (Throttling), 17 (Rate limit), 341, 500+
        return [4, 17, 341, 500, 502, 503].includes(error.code);
    },

    transformResponse(response: any, dateRange: string): PlatformData {
        const data = response.data[0];
        const formatCurrency = (val: number) => `KES ${(val).toLocaleString()}`;

        // Generate chart data (Engagement trend)
        const points = dateRange === 'daily' ? 8 : dateRange === 'weekly' ? 7 : 15;
        const labels = dateRange === 'daily' ? ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'] :
                       dateRange === 'weekly' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
                       Array.from({length: 15}, (_, i) => `Day ${i + 1}`);
        
        const chartData = labels.map(label => ({
            name: label,
            value: Math.floor((data.engagement / points) * (0.8 + Math.random() * 0.4))
        }));

        return {
            id: 'meta_ads',
            metrics: [
                { 
                    label: 'Reach', 
                    value: data.reach.toLocaleString(), 
                    change: '+5%', 
                    trend: 'up' 
                },
                { 
                    label: 'Engagement', 
                    value: data.engagement.toLocaleString(), 
                    change: '+35%', 
                    trend: 'up' 
                },
                { 
                    label: 'CTR (All)', 
                    value: data.ctr.toFixed(2) + '%', 
                    change: '+0.2%', 
                    trend: 'up' 
                },
                { 
                    label: 'Amount Spent', 
                    value: formatCurrency(data.spend), 
                    change: '+10%', 
                    trend: 'neutral' 
                },
            ],
            chartData
        };
    }
};
