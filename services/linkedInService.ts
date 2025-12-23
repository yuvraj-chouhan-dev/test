
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

// LinkedIn API limits
const linkedInRateLimiter = new RateLimiter(10, 2);

export const LinkedInService = {
    /**
     * Simulates LinkedIn 'organizationalEntityShareStatistics'
     */
    async fetchData(urn: string, dateRange: 'daily' | 'weekly' | 'monthly'): Promise<PlatformData> {
        try {
            await linkedInRateLimiter.consume();
            await new Promise(resolve => setTimeout(resolve, 400)); 

            const m = dateRange === 'daily' ? 1 : dateRange === 'weekly' ? 7 : 30;
            const variance = 1 + (Math.random() * 0.2 - 0.1);

            return {
                id: 'linkedin',
                metrics: [
                    { 
                        label: 'Followers', 
                        value: Math.floor(5230 + (50 * m)).toLocaleString(), 
                        change: `+${Math.floor(15 * m)}`, 
                        trend: 'up' 
                    },
                    { 
                        label: 'Page Views', 
                        value: Math.floor(120 * m * variance).toLocaleString(), 
                        change: '+8%', 
                        trend: 'up' 
                    },
                    { 
                        label: 'Unique Visitors', 
                        value: Math.floor(85 * m * variance).toLocaleString(), 
                        change: '+5%', 
                        trend: 'up' 
                    },
                    { 
                        label: 'Custom Button Clicks', 
                        value: Math.floor(8 * m * variance).toLocaleString(), 
                        change: '+2%', 
                        trend: 'up' 
                    },
                ]
            };
        } catch (error) {
            console.error("LinkedIn API Error:", error);
            throw error;
        }
    }
};
