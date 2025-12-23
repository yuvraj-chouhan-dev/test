
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

// TikTok API Limits
const tikTokRateLimiter = new RateLimiter(15, 3);

export const TikTokService = {
    /**
     * Simulates TikTok for Business API
     */
    async fetchData(accountId: string, dateRange: 'daily' | 'weekly' | 'monthly'): Promise<PlatformData> {
        try {
            await tikTokRateLimiter.consume();
            await new Promise(resolve => setTimeout(resolve, 450)); // Latency

            const m = dateRange === 'daily' ? 1 : dateRange === 'weekly' ? 7 : 30;
            const variance = 1 + (Math.random() * 0.3 - 0.15); // Higher variance for TikTok

            // Generate chart data (Video Views)
            const points = dateRange === 'daily' ? 8 : dateRange === 'weekly' ? 7 : 15;
            const labels = dateRange === 'daily' ? ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'] :
                        dateRange === 'weekly' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
                        Array.from({length: 15}, (_, i) => `Day ${i + 1}`);
            
            const chartData = labels.map(label => ({
                name: label,
                value: Math.floor(5000 * m * variance * Math.random() / points)
            }));

            return {
                id: 'tiktok_ads',
                metrics: [
                    { 
                        label: 'Video Views', 
                        value: (250000 * m * variance).toLocaleString(undefined, {maximumFractionDigits: 0}), 
                        change: '+45%', 
                        trend: 'up' 
                    },
                    { 
                        label: 'Likes', 
                        value: (45000 * m * variance).toLocaleString(undefined, {maximumFractionDigits: 0}), 
                        change: '+32%', 
                        trend: 'up' 
                    },
                    { 
                        label: 'Shares', 
                        value: Math.floor(8500 * m * variance).toLocaleString(), 
                        change: '+15%', 
                        trend: 'up' 
                    },
                    { 
                        label: 'Cost', 
                        value: `KES ${(15000 * m).toLocaleString()}`, 
                        change: '+10%', 
                        trend: 'neutral' 
                    },
                ],
                chartData
            };
        } catch