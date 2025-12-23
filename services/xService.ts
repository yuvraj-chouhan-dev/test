
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

// X API Limits
const xRateLimiter = new RateLimiter(10, 2);

export const XService = {
    /**
     * Simulates X Ads API fetching campaign data
     */
    async fetchData(accountId: string, dateRange: 'daily' | 'weekly' | 'monthly'): Promise<PlatformData> {
        try {
            await xRateLimiter.consume();
            await new Promise(resolve => setTimeout(resolve, 350)); // Latency

            const m = dateRange === 'daily' ? 1 : dateRange === 'weekly' ? 7 : 30;
            const variance = 1 + (Math.random() * 0.2 - 0.1);

            // Generate chart data
            const points = dateRange === 'daily' ? 8 : dateRange === 'weekly' ? 7 : 15;
            const labels = dateRange === 'daily' ? ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'] :
                        dateRange === 'weekly' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
                        Array.from({length: 15}, (_, i) => `Day ${i + 1}`);
            
            const chartData = labels.map(label => ({
                name: label,
                value: Math.floor(1200 * m * variance * Math.random() / points)
            }));

            return {
                id: 'x_ads',
                metrics: [
                    { 
                        label: 'Tweet Impressions', 
                        value: (125000 * m * variance).toLocaleString(undefined, {maximumFractionDigits: 0}), 
                        change: '-2%', 
                        trend: 'down' 
                    },
                    { 
                        label: 'Profile Visits', 
                        value: (3400 * m * variance).toLocaleString(undefined, {maximumFractionDigits: 0}), 
                        change: '+5%', 
                        trend: 'up' 
                    },
                    { 
                        label: 'Mentions', 
                        value: Math.floor(450 * m * variance).toLocaleString(), 
                        change: '+12%', 
                        trend: 'up' 
                    },
                    { 
                        label: 'Followers', 
                        value: '10.5K', 
                        change: '+15', 
                        trend: 'neutral' 
                    },
                ],
                chartData
            };
        } catch (error) {
            console.error("X API Error:", error);
            throw error;
        }
    }
};