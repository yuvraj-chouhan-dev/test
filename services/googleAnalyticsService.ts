
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

// GA4 Rate Limits: 10 requests/sec per IP (Simulated)
const ga4RateLimiter = new RateLimiter(10, 2);

export const GoogleAnalyticsService = {
    /**
     * Simulates GA4 Data API 'runReport'
     * POST https://analyticsdata.googleapis.com/v1beta/properties/{propertyId}:runReport
     */
    async fetchData(propertyId: string, dateRange: 'daily' | 'weekly' | 'monthly'): Promise<PlatformData> {
        return this.executeQuery(propertyId, dateRange);
    },

    async executeQuery(propertyId: string, dateRange: 'daily' | 'weekly' | 'monthly', retryCount = 0): Promise<PlatformData> {
        const MAX_RETRIES = 3;
        try {
            await ga4RateLimiter.consume();
            const response = await this.mockApiNetworkCall(propertyId, dateRange);
            return this.transformResponse(response, dateRange);
        } catch (error: any) {
            console.error(`[GA4 API] Error on attempt ${retryCount + 1}:`, error.message);
            
            if (this.isRetryable(error) && retryCount < MAX_RETRIES) {
                const backoff = Math.pow(2, retryCount) * 1000;
                await new Promise(resolve => setTimeout(resolve, backoff));
                return this.executeQuery(propertyId, dateRange, retryCount + 1);
            }
            throw error;
        }
    },

    async mockApiNetworkCall(propertyId: string, dateRange: string): Promise<any> {
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));

        // Simulate random errors
        const rand = Math.random();
        if (rand < 0.05) throw { code: 503, message: 'Service Unavailable' }; // Retryable
        if (rand >= 0.05 && rand < 0.10) throw { code: 429, message: 'Resource Exhausted' }; // Retryable
        if (rand >= 0.10 && rand < 0.11) throw { code: 403, message: 'Permission Denied' }; // Fatal

        // Determine multiplier based on date range
        const m = dateRange === 'daily' ? 1 : dateRange === 'weekly' ? 7 : 30;
        const variance = () => 0.9 + Math.random() * 0.2; // +/- 10%

        return {
            rows: [
                {
                    metricValues: [
                        { value: Math.floor(12500 * m * variance()).toString() }, // Users
                        { value: Math.floor(18000 * m * variance()).toString() }, // Sessions
                        { value: (42 + (Math.random() * 5 - 2.5)).toFixed(2) },   // Bounce Rate
                        { value: Math.floor(165 + (Math.random() * 20)).toString() } // Avg Engagement (seconds)
                    ]
                }
            ]
        };
    },

    isRetryable(error: any): boolean {
        return [429, 500, 503].includes(error.code);
    },

    transformResponse(response: any, dateRange: string): PlatformData {
        const metrics = response.rows[0].metricValues;
        const users = parseInt(metrics[0].value);
        const sessions = parseInt(metrics[1].value);
        const bounceRate = parseFloat(metrics[2].value);
        const avgEngagement = parseInt(metrics[3].value);

        // Format time (seconds to m s)
        const mins = Math.floor(avgEngagement / 60);
        const secs = avgEngagement % 60;
        const timeString = `${mins}m ${secs}s`;

        // Generate mock chart data for visual appeal
        const points = dateRange === 'daily' ? 8 : dateRange === 'weekly' ? 7 : 15;
        const labels = dateRange === 'daily' ? ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'] :
                       dateRange === 'weekly' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
                       Array.from({length: 15}, (_, i) => `Day ${i + 1}`);
        
        const chartData = labels.map(label => ({
            name: label,
            value: Math.floor((users / points) * (0.8 + Math.random() * 0.4))
        }));

        return {
            id: 'ga4',
            metrics: [
                { 
                    label: 'Users', 
                    value: users.toLocaleString(), 
                    change: '+22%', 
                    trend: 'up' 
                },
                { 
                    label: 'Sessions', 
                    value: sessions.toLocaleString(), 
                    change: '+18%', 
                    trend: 'up' 
                },
                { 
                    label: 'Bounce Rate', 
                    value: bounceRate.toFixed(1) + '%', 
                    change: '-5%', 
                    trend: 'down' // Down is good for bounce rate
                },
                { 
                    label: 'Avg. Engagement', 
                    value: timeString, 
                    change: '+10%', 
                    trend: 'up' 
                },
            ],
            chartData
        };
    }
};
