
import { Client, Report, ReportTemplate, GmbStat, Integration, PlatformData, Invoice, ServicePackage } from '../types';
import { config } from './config';
import { api } from './api';

// --- MOCK DATA CONSTANTS (Keep existing mock data for fallback/demo) ---
const INITIAL_CLIENTS: Client[] = [
  { id: '1', name: 'Safari Travels Ltd', website: 'safari.co.ke', status: 'Active', nextReport: 'Oct 31, 2025', logo: 'https://picsum.photos/seed/safari/200', packageId: 'pkg_1' },
  { id: '2', name: 'Nairobi Estates', website: 'nairobiestates.com', status: 'Active', nextReport: 'Nov 01, 2025', packageId: 'pkg_2' },
  { id: '3', name: 'TechHub Kenya', website: 'techhub.co.ke', status: 'Pending', nextReport: '-', logo: 'https://picsum.photos/seed/techhub/200' },
  { id: '4', name: 'Mombasa Resorts', website: 'coastalliving.com', status: 'Active', nextReport: 'Oct 30, 2025', logo: 'https://picsum.photos/seed/resorts/200', packageId: 'pkg_3' },
  { id: '5', name: 'Kibo Logistics', website: 'kibo.co.ke', status: 'Inactive', nextReport: '-' },
];

const INITIAL_REPORTS: Report[] = [
  { id: '101', clientName: 'Safari Travels Ltd', name: 'Monthly SEO Report - Oct', date: 'Oct 28, 2025', status: 'Sent', platform: 'SEO' },
  { id: '102', clientName: 'Nairobi Estates', name: 'Weekly Ads Performance', date: 'Oct 27, 2025', status: 'Sent', platform: 'Google Ads' },
  { id: '103', clientName: 'Mombasa Resorts', name: 'Social Media Engagement', date: 'Oct 29, 2025', status: 'Draft', platform: 'Facebook' },
  { id: '104', clientName: 'Kibo Logistics', name: 'GMB Profile Insights', date: 'Oct 30, 2025', status: 'Scheduled', platform: 'Google My Business' },
  { id: '105', clientName: 'Nairobi Estates', name: 'GMB Profile Insights', date: 'Oct 30, 2025', status: 'Scheduled', platform: 'Google My Business' },
];

const INITIAL_PACKAGES: ServicePackage[] = [
  { 
    id: 'pkg_1', 
    name: 'SEO Starter', 
    description: 'Essential SEO monitoring and monthly reporting for small businesses.', 
    price: 25000, 
    interval: 'Monthly', 
    features: ['Monthly Site Audit', 'Keyword Tracking (50)', 'Basic Performance Report', 'Email Support'] 
  },
  { 
    id: 'pkg_2', 
    name: 'PPC Growth', 
    description: 'Comprehensive ad management for Google and Meta platforms.', 
    price: 65000, 
    interval: 'Monthly', 
    features: ['Ad Spend Management (< 500k)', 'Weekly Optimization', 'Conversion Tracking Setup', 'Bi-Weekly Calls'] 
  },
  { 
    id: 'pkg_3', 
    name: 'Full Digital Suite', 
    description: 'All-in-one solution including SEO, PPC, and Social Media management.', 
    price: 120000, 
    interval: 'Monthly', 
    features: ['SEO + PPC Management', 'Social Media Content (12 posts)', '24/7 Dashboard Access', 'Dedicated Account Manager'] 
  },
];

const INITIAL_TEMPLATES: ReportTemplate[] = [
  { 
    id: 't1', 
    name: 'Monthly SEO Audit', 
    description: 'Keyword rankings, backlink analysis, and organic traffic overview.', 
    category: 'SEO', 
    isCustom: false, 
    widgets: [
      { id: 'w1', widgetId: 'seo_overview', type: 'chart', title: 'Traffic Overview', chartType: 'line' },
      { id: 'w2', widgetId: 'keyword_rank', type: 'table', title: 'Keyword Rankings' },
      { id: 'w3', widgetId: 'text_block', type: 'text', title: 'Analysis', content: 'Organic traffic has increased by 15% due to recent blog optimizations.' }
    ] 
  },
  { 
    id: 't2', 
    name: 'Facebook & Instagram Ads', 
    description: 'Combined social media performance focused on ROAS and CTR.', 
    category: 'Social', 
    isCustom: false, 
    widgets: [
      { id: 'w1', widgetId: 'fb_engagement', type: 'metric', title: 'Engagement Metrics' },
      { id: 'w2', widgetId: 'conversions', type: 'chart', title: 'Conversion Trend', chartType: 'bar' }
    ] 
  },
  { 
    id: 't3', 
    name: 'Google Business Profile Review', 
    description: 'Local SEO performance, calls, directions, and review summaries.', 
    category: 'General', 
    isCustom: false, 
    widgets: [
      { id: 'w1', widgetId: 'gmb_insights', type: 'chart', title: 'Views & Actions', chartType: 'bar' },
      { id: 'w2', widgetId: 'gmb_calls', type: 'chart', title: 'Call Volume', chartType: 'line' }
    ] 
  },
  { 
    id: 't4', 
    name: 'Executive Summary (PPC)', 
    description: 'High-level overview of Google Ads spend and conversions.', 
    category: 'PPC', 
    isCustom: false, 
    widgets: [
      { id: 'w1', widgetId: 'google_ads_kpi', type: 'metric', title: 'Key Performance Indicators' },
      { id: 'w2', widgetId: 'conversions', type: 'chart', title: 'Conversion Funnel', chartType: 'area' }
    ] 
  },
];

const INITIAL_INTEGRATIONS: Integration[] = [
  { id: 'google_ads', name: 'Google Ads', provider: 'google', status: 'Disconnected', description: 'Campaign performance, CPC, and conversion tracking.' },
  { id: 'ga4', name: 'Google Analytics 4', provider: 'google', status: 'Disconnected', description: 'Web traffic, user behavior, and acquisition reports.' },
  { id: 'meta_ads', name: 'Meta Ads (FB/Insta)', provider: 'meta', status: 'Connected', lastSync: '5 mins ago', description: 'Social campaign reach, engagement, and ad spend.' },
  { id: 'search_console', name: 'Google Search Console', provider: 'google', status: 'Connected', lastSync: '1 hour ago', description: 'Organic search performance, indexing, and click-through rates.' },
  { id: 'linkedin', name: 'LinkedIn Ads', provider: 'linkedin', status: 'Connected', lastSync: '30 mins ago', description: 'B2B campaign performance and professional demographics.' },
  { id: 'x_ads', name: 'X (Twitter) Ads', provider: 'x', status: 'Connected', lastSync: '15 mins ago', description: 'Tweet engagement, followers, and ad impressions.' },
  { id: 'tiktok_ads', name: 'TikTok Ads', provider: 'tiktok', status: 'Disconnected', description: 'Video views, shares, likes, and campaign costs.' },
  { id: 'gmb', name: 'Google My Business', provider: 'google', status: 'Disconnected', description: 'Local profile views, calls, and directions.' },
];

const INITIAL_INVOICES: Invoice[] = [
  { id: 'inv_001', clientName: 'Safari Travels Ltd', amount: 45000, date: 'Oct 15, 2025', dueDate: 'Oct 30, 2025', status: 'Pending', items: [{ description: 'Monthly SEO Retainer', amount: 45000 }] },
  { id: 'inv_002', clientName: 'Nairobi Estates', amount: 120000, date: 'Oct 01, 2025', dueDate: 'Oct 15, 2025', status: 'Paid', items: [{ description: 'Q4 Ad Spend Management', amount: 120000 }] },
  { id: 'inv_003', clientName: 'TechHub Kenya', amount: 30000, date: 'Sep 15, 2025', dueDate: 'Sep 30, 2025', status: 'Overdue', items: [{ description: 'Social Media Content', amount: 30000 }] },
];

const STORAGE_KEYS = {
  CLIENTS: 'wpm_clients',
  REPORTS: 'wpm_reports',
  TEMPLATES: 'wpm_templates',
  INTEGRATIONS: 'wpm_integrations_v4',
  INVOICES: 'wpm_invoices',
  PACKAGES: 'wpm_packages',
};

// --- REAL API IMPLEMENTATION ---

const DataServiceReal = {
    // In a real implementation, these would be async calls to the backend
    getClients: async () => api.get<Client[]>('/clients'),
    addClient: async (client: Client) => api.post<Client>('/clients', client),
    getReports: async () => api.get<Report[]>('/reports'),
    addReport: async (report: Report) => api.post<Report>('/reports', report),
    getTemplates: async () => api.get<ReportTemplate[]>('/templates'),
    addTemplate: async (template: ReportTemplate) => api.post<ReportTemplate>('/templates', template),
    deleteTemplate: async (id: string) => api.delete(`/templates/${id}`),
    getPackages: async () => api.get<ServicePackage[]>('/packages'),
    addPackage: async (pkg: ServicePackage) => api.post<ServicePackage>('/packages', pkg),
    deletePackage: async (id: string) => api.delete(`/packages/${id}`),
    getIntegrations: async () => api.get<Integration[]>('/integrations'),
    toggleIntegration: async (id: string) => api.post<Integration[]>(`/integrations/${id}/toggle`, {}),
    getInvoices: async () => api.get<Invoice[]>('/invoices'),
    addInvoice: async (invoice: Invoice) => api.post<Invoice>('/invoices', invoice),
    payInvoice: async (id: string) => api.post<Invoice>(`/invoices/${id}/pay`, {}),
};

// --- MOCK API IMPLEMENTATION ---

const DataServiceMock = {
    init: () => {
        if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
        if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
        if (!localStorage.getItem(STORAGE_KEYS.TEMPLATES)) localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(INITIAL_TEMPLATES));
        if (!localStorage.getItem(STORAGE_KEYS.INTEGRATIONS)) localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(INITIAL_INTEGRATIONS));
        if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
        if (!localStorage.getItem(STORAGE_KEYS.PACKAGES)) localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(INITIAL_PACKAGES));
    },

    getClients: (): Client[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]'),
    addClient: (client: Client): Client[] => {
        const clients = DataServiceMock.getClients();
        const updated = [...clients, client];
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(updated));
        return updated;
    },
    
    getReports: (): Report[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '[]'),
    addReport: (report: Report): Report[] => {
        const reports = DataServiceMock.getReports();
        const updated = [...reports, report];
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
        return updated;
    },

    getTemplates: (): ReportTemplate[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATES) || '[]'),
    addTemplate: (template: ReportTemplate): ReportTemplate[] => {
        const templates = DataServiceMock.getTemplates();
        const updated = [...templates, template];
        localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(updated));
        return updated;
    },
    deleteTemplate: (id: string): ReportTemplate[] => {
        const templates = DataServiceMock.getTemplates();
        const updated = templates.filter(t => t.id !== id);
        localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(updated));
        return updated;
    },

    getPackages: (): ServicePackage[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.PACKAGES) || '[]'),
    addPackage: (pkg: ServicePackage): ServicePackage[] => {
        const packages = DataServiceMock.getPackages();
        const updated = [...packages, pkg];
        localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(updated));
        return updated;
    },
    deletePackage: (id: string): ServicePackage[] => {
        const packages = DataServiceMock.getPackages();
        const updated = packages.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(updated));
        return updated;
    },

    getIntegrations: (): Integration[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.INTEGRATIONS) || JSON.stringify(INITIAL_INTEGRATIONS)),
    toggleIntegration: (id: string): Integration[] => {
        const integrations = DataServiceMock.getIntegrations();
        const updated = integrations.map(int => {
            if (int.id === id) {
                return {
                    ...int,
                    status: int.status === 'Connected' ? 'Disconnected' : 'Connected',
                    lastSync: int.status === 'Connected' ? undefined : 'Just now'
                } as Integration;
            }
            return int;
        });
        localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(updated));
        return updated;
    },

    getInvoices: (): Invoice[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.INVOICES) || '[]'),
    addInvoice: (invoice: Invoice): Invoice[] => {
        const invoices = DataServiceMock.getInvoices();
        const updated = [invoice, ...invoices];
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updated));
        return updated;
    },
    payInvoice: (id: string): Invoice[] => {
        const invoices = DataServiceMock.getInvoices();
        const updated = invoices.map(inv => inv.id === id ? { ...inv, status: 'Paid' as const } : inv);
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updated));
        return updated;
    }
};

// Initialize Mock DB if using mock
if (config.USE_MOCK_DATA) {
    DataServiceMock.init();
}

// Export a wrapper that checks config
export const DataService = {
    getClients: () => config.USE_MOCK_DATA ? DataServiceMock.getClients() : DataServiceReal.getClients(),
    addClient: (c: Client) => config.USE_MOCK_DATA ? DataServiceMock.addClient(c) : DataServiceReal.addClient(c),
    
    getReports: () => config.USE_MOCK_DATA ? DataServiceMock.getReports() : DataServiceReal.getReports(),
    addReport: (r: Report) => config.USE_MOCK_DATA ? DataServiceMock.addReport(r) : DataServiceReal.addReport(r),
    
    getTemplates: () => config.USE_MOCK_DATA ? DataServiceMock.getTemplates() : DataServiceReal.getTemplates(),
    addTemplate: (t: ReportTemplate) => config.USE_MOCK_DATA ? DataServiceMock.addTemplate(t) : DataServiceReal.addTemplate(t),
    deleteTemplate: (id: string) => config.USE_MOCK_DATA ? DataServiceMock.deleteTemplate(id) : DataServiceReal.deleteTemplate(id),
    
    getPackages: () => config.USE_MOCK_DATA ? DataServiceMock.getPackages() : DataServiceReal.getPackages(),
    addPackage: (p: ServicePackage) => config.USE_MOCK_DATA ? DataServiceMock.addPackage(p) : DataServiceReal.addPackage(p),
    deletePackage: (id: string) => config.USE_MOCK_DATA ? DataServiceMock.deletePackage(id) : DataServiceReal.deletePackage(id),

    getIntegrations: () => config.USE_MOCK_DATA ? DataServiceMock.getIntegrations() : DataServiceReal.getIntegrations(),
    toggleIntegration: (id: string) => config.USE_MOCK_DATA ? DataServiceMock.toggleIntegration(id) : DataServiceReal.toggleIntegration(id),
    
    getInvoices: () => config.USE_MOCK_DATA ? DataServiceMock.getInvoices() : DataServiceReal.getInvoices(),
    addInvoice: (inv: Invoice) => config.USE_MOCK_DATA ? DataServiceMock.addInvoice(inv) : DataServiceReal.addInvoice(inv),
    payInvoice: (id: string) => config.USE_MOCK_DATA ? DataServiceMock.payInvoice(id) : DataServiceReal.payInvoice(id),
    
    simulateDelay: async (ms: number = 500) => {
        if (!config.USE_MOCK_DATA) return; // No artificial delay for real API
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
