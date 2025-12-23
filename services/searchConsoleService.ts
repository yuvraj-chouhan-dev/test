import { PlatformData } from '../types';

/**
 * Rate Limiter for Search Console API
 * Google Search Console has strict QPS limits per site and per project.
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

const gscRateLimiter = new RateLimiter(20, 5); // Higher burst, steady refill

export const SearchConsoleService = {

    /**
     * Simulates fetching Search Analytics data
     * Endpoint: POST https://www.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query
     */
    async getSeoPerformance(siteUrl: string, dateRange: 'daily' | 'weekly' | 'monthly'): Promise<PlatformData> {
        
        try {
            await gscRateLimiter.consume();
            
            // Simulate API Latency
            await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 400));

            // Mock Response based on Date Range
            const response = this.generateMockResponse(dateRange);
            
            return this.transformResponse(response, dateRange);

        } catch (error: any) {
            console.error('[Search Console API] Error:', error);
            throw error;
        }
    },

    generateMockResponse(range: string) {
        // Multipliers for realistic data scaling
        const m = range === 'daily' ? 1 : range === 'weekly' ? 7 : 30;
        
        // Base randomizer
        const rand = (base: number) => Math.floor(base * m * (0.8 + Math.random() * 0.4));
        
        return {
            rows: [
                {
                    clicks: rand(120),
                    impressions: rand(4500),
                    ctr: 0.025 + (Math.random() * 0.01), // 2.5% - 3.5%
                    position: 12 + (Math.random() * 4)
                }
            ]
        };
    },

    transformResponse(data: any, dateRange: string): PlatformData {
        const metrics = data.rows[0];
        
        // Generate mock chart data based on date range for visual appeal
        const points = dateRange === 'daily' ? 8 : dateRange === 'weekly' ? 7 : 15;
        const labels = dateRange === 'daily' ? ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'] :
                       dateRange === 'weekly' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
                       Array.from({length: 15}, (_, i) => `${i * 2 + 1}`);
        
        const chartData = labels.map(label => ({
            name: label,
            value: Math.floor(metrics.clicks / points * (0.5 + Math.random()))
        }));

        return {
            id: 'search_console',
            metrics: [
                { 
                    label: 'Total Clicks', 
                    value: metrics.clicks.toLocaleString(), 
                    change: '+15%', 
                    trend: 'up' 
                },
                { 
                    label: 'Total Impressions', 
                    value: metrics.impressions.toLocaleString(), 
                    change: '+8%', 
                    trend: 'up' 
                },
                { 
                    label: 'Avg. CTR', 
                    value: (metrics.ctr * 100).toFixed(1) + '%', 
                    change: '+0.2%', 
                    trend: 'up' 
                },
                { 
                    label: 'Avg. Position', 
                    value: metrics.position.toFixed(1), 
                    change: '+1.2', 
                    trend: 'up' // "Up" in trend usually means green/good, for position lower number is better but for generic KPI "up" trend visual usually means improvement
                },
            ],
            chartData
        };
    }
};