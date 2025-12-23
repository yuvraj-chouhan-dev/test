
import { GmbStat } from '../types';

type TimeRange = 'daily' | 'weekly' | 'monthly';

/**
 * Base class for generating realistic mock data based on time ranges.
 */
export class BaseMockService {
    protected getMultiplier(range: TimeRange): number {
        switch (range) {
            case 'daily': return 1;
            case 'weekly': return 7;
            case 'monthly': return 30;
        }
    }

    protected randomize(base: number, variance: number = 0.1): number {
        const min = base * (1 - variance);
        const max = base * (1 + variance);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

// Kept here as it returns a specific custom array type (GmbStat[]) rather than generic PlatformData
export const GmbService = new class extends BaseMockService {
    async fetchData(range: TimeRange): Promise<GmbStat[]> {
        const days = range === 'daily' ? 1 : range === 'weekly' ? 7 : 30;
        const data: GmbStat[] = [];
        
        const labels = range === 'daily' ? ['12 AM', '4 AM', '8 AM', '12 PM', '4 PM', '8 PM'] :
                       range === 'weekly' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
                       Array.from({length: 10}, (_, i) => `Day ${i*3+1}`);

        // Generate data points matching labels
        for (let i = 0; i < labels.length; i++) {
             data.push({
                 name: labels[i],
                 views: this.randomize(100),
                 interactions: this.randomize(40),
                 calls: this.randomize(15)
             });
        }
        return data;
    }
};
