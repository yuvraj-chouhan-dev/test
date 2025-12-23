
import React, { useState, useEffect } from 'react';
import { 
  Home, Users, FileText, Settings, LogOut, Plus, 
  Search, Bell, ChevronDown, Briefcase, MoreVertical, X, MapPin, Filter, LayoutTemplate, Trash2, Check, RefreshCw, Activity, Link2, Plug, ExternalLink, BarChart2, DollarSign, CreditCard, Receipt, ArrowUp, ArrowDown, FileEdit, AlignLeft, AlertTriangle, Clock, Calendar, Twitter, Video, MousePointerClick, User, Lock, Palette, Download
} from 'lucide-react';
import { Button } from './Button';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, ComposedChart, AreaChart, Area
} from 'recharts';
import { Client, Report, ReportTemplate, GmbStat, Integration, PlatformData, Invoice, ReportWidgetConfig } from '../types';
import { DataService } from '../services/dataService';
import { GoogleAdsService } from '../services/googleAdsService';
import { SearchConsoleService } from '../services/searchConsoleService';
import { GoogleAnalyticsService } from '../services/googleAnalyticsService';
import { MetaAdsService } from '../services/metaAdsService';
import { LinkedInService } from '../services/linkedInService';
import { XService } from '../services/xService';
import { TikTokService } from '../services/tikTokService';
import { GmbService } from '../services/mockIntegrationServices';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const overviewData = [
    { name: 'Mon', value: 400 },
    { name: 'Tue', value: 300 },
    { name: 'Wed', value: 550 },
    { name: 'Thu', value: 450 },
    { name: 'Fri', value: 650 },
    { name: 'Sat', value: 480 },
    { name: 'Sun', value: 520 },
];

const availableWidgets = [
  { id: 'gmb_insights', label: 'GMB Insights (Views/Actions)', type: 'chart' as const },
  { id: 'gmb_calls', label: 'GMB Calls Chart', type: 'chart' as const },
  { id: 'seo_overview', label: 'SEO Traffic Overview', type: 'chart' as const },
  { id: 'keyword_rank', label: 'Keyword Rankings Table', type: 'table' as const },
  { id: 'google_ads_kpi', label: 'Google Ads KPIs (CPC, CTR)', type: 'metric' as const },
  { id: 'fb_engagement', label: 'Facebook Engagement', type: 'metric' as const },
  { id: 'conversions', label: 'Conversion Goals', type: 'chart' as const },
];

const SidebarItem: React.FC<{ icon: React.ElementType, label: string, active?: boolean, onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center px-4 py-3 mb-1 cursor-pointer rounded-lg transition-colors ${
      active 
        ? 'bg-brand-800 text-accent-400' 
        : 'text-brand-200 hover:bg-brand-800 hover:text-white'
    }`}
  >
    <Icon className="w-5 h-5 mr-3" />
    <span className="font-medium text-sm">{label}</span>
  </div>
);

const OverviewSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Stat Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-32">
          <div className="flex justify-between mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="w-12 h-6 bg-gray-200 rounded-full"></div>
          </div>
          <div className="w-16 h-8 bg-gray-200 rounded mb-2"></div>
          <div className="w-24 h-4 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chart Area Skeleton */}
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
        <div className="w-48 h-6 bg-gray-200 rounded mb-6"></div>
        <div className="w-full h-64 bg-gray-100 rounded-lg"></div>
      </div>

      {/* Recent Activity Skeleton */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
        <div className="w-32 h-6 bg-gray-200 rounded mb-6"></div>
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="w-full h-3 bg-gray-200 rounded"></div>
                <div className="w-1/2 h-2 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ClientsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-40">
         <div className="flex justify-between mb-4">
            <div className="flex gap-3 items-center">
               <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
               <div className="space-y-2">
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  <div className="w-16 h-3 bg-gray-200 rounded"></div>
               </div>
            </div>
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
         </div>
         <div className="border-t border-gray-100 pt-4 flex justify-between mt-6">
            <div className="w-16 h-5 bg-gray-200 rounded"></div>
            <div className="w-24 h-3 bg-gray-200 rounded"></div>
         </div>
      </div>
    ))}
  </div>
);

const ReportsSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
       <div className="w-40 h-6 bg-gray-200 rounded"></div>
       <div className="flex gap-3">
          <div className="w-32 h-9 bg-gray-200 rounded-lg"></div>
          <div className="w-32 h-9 bg-gray-200 rounded-lg"></div>
       </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
       {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-40">
             <div className="flex justify-between mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="space-y-1 flex flex-col items-end">
                   <div className="w-12 h-4 bg-gray-200 rounded"></div>
                   <div className="w-16 h-3 bg-gray-200 rounded"></div>
                </div>
             </div>
             <div className="w-3/4 h-5 bg-gray-200 rounded mb-2"></div>
             <div className="w-1/2 h-3 bg-gray-200 rounded mb-4"></div>
             <div className="border-t border-gray-100 pt-4 flex justify-between">
                <div className="w-20 h-3 bg-gray-200 rounded"></div>
                <div className="w-16 h-3 bg-gray-200 rounded"></div>
             </div>
          </div>
       ))}
    </div>
  </div>
);

const TemplatesSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
     {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-48 flex flex-col">
           <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="w-16 h-5 bg-gray-200 rounded-full"></div>
           </div>
           <div className="w-3/4 h-6 bg-gray-200 rounded mb-2"></div>
           <div className="w-full h-12 bg-gray-200 rounded mb-4 flex-1"></div>
           <div className="w-full h-8 bg-gray-200 rounded mt-auto"></div>
        </div>
     ))}
  </div>
);

// Platform Widget Component
const PlatformWidget: React.FC<{ data: PlatformData | null; title: string; icon: React.ElementType; colorClass: string; error?: string }> = ({ data, title, icon: Icon, colorClass, error }) => {
  if (error) {
      return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-red-50 text-red-600">
                    <Icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            </div>
            <div className="flex flex-col items-center justify-center text-center py-4">
                <AlertTriangle size={24} className="text-red-500 mb-2" />
                <p className="text-sm font-medium text-red-700">Connection Error</p>
                <p className="text-xs text-gray-500">{error}</p>
                <Button size="sm" variant="outline" className="mt-3">Retry Connection</Button>
            </div>
        </div>
      );
  }
  
  if (!data) return null;
  
  // Determine chart color from colorClass text-color
  const chartColor = colorClass.includes('orange') ? '#f97316' : 
                     colorClass.includes('blue') ? '#3b82f6' :
                     colorClass.includes('green') ? '#22c55e' : 
                     colorClass.includes('indigo') ? '#6366f1' : 
                     colorClass.includes('pink') ? '#ec4899' : '#64748b';

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colorClass.replace('text-', 'bg-').replace('600', '50').replace('800', '50')} ${colorClass}`}>
                <Icon size={20} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  {title}
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 border border-green-200 uppercase tracking-wide">
                    Live
                  </span>
                </h3>
                <p className="text-xs text-gray-500">Real-time API Data</p>
            </div>
          </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.metrics.map((metric, idx) => (
            <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">{metric.label}</p>
                <p className="text-lg font-bold text-gray-900">{metric.value}</p>
                <span className={`text-xs font-medium ${metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                  {metric.change}
                </span>
            </div>
          ))}
      </div>

      {data.chartData && (
        <div className="mt-6 h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chartData}>
                    <defs>
                        <linearGradient id={`color-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColor} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={5} />
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} fillOpacity={1} fill={`url(#color-${title.replace(/\s+/g, '')})`} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};


const Dashboard: React.FC = () => {
  const { logout, user, updateProfile } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'reports' | 'templates' | 'integrations' | 'billing' | 'settings'>('overview');
  const [clients, setClients] = useState<Client[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [gmbData, setGmbData] = useState<GmbStat[]>([]);
  const [platformStats, setPlatformStats] = useState<Record<string, PlatformData | null>>({});
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({});
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  const [applyingTemplate, setApplyingTemplate] = useState<ReportTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 360 View State
  const [dateRange, setDateRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Report Confirmation State
  const [isReportConfirmationOpen, setIsReportConfirmationOpen] = useState(false);
  const [pendingReportData, setPendingReportData] = useState<{clientName: string, reportName: string, date: string} | null>(null);
  
  // Filtering state
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('All');
  const [reportPlatformFilter, setReportPlatformFilter] = useState<string>('All');

  // Template Builder State
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState<any>('General');
  const [builderWidgets, setBuilderWidgets] = useState<ReportWidgetConfig[]>([]);

  const refreshData = async () => {
    setIsLoading(true);
    setApiErrors({}); // Reset errors
    
    await DataService.simulateDelay(600);
    
    setClients(DataService.getClients());
    setReports(DataService.getReports());
    setTemplates(DataService.getTemplates());
    setInvoices(DataService.getInvoices());
    const currentIntegrations = DataService.getIntegrations();
    setIntegrations(currentIntegrations);
    
    // Fetch Platform Data dynamically based on connected status and dateRange
    const stats: Record<string, PlatformData | null> = {};
    
    for (const integration of currentIntegrations) {
      if (integration.status === 'Connected') {
        try {
            if (integration.id === 'google_ads') {
                const adsData = await GoogleAdsService.getCampaignPerformance(user?.id || 'demo', dateRange);
                stats['google_ads'] = adsData; 
            } else if (integration.id === 'ga4') {
                stats['ga4'] = await GoogleAnalyticsService.fetchData(user?.id || 'demo', dateRange);
            } else if (integration.id === 'meta_ads') {
                stats['meta_ads'] = await MetaAdsService.fetchData(user?.id || 'demo', dateRange);
            } else if (integration.id === 'search_console') {
                stats['search_console'] = await SearchConsoleService.getSeoPerformance('https://client-site.com', dateRange);
            } else if (integration.id === 'linkedin') {
                stats['linkedin'] = await LinkedInService.fetchData(user?.id || 'demo', dateRange);
            } else if (integration.id === 'x_ads') {
                stats['x_ads'] = await XService.fetchData(user?.id || 'demo', dateRange);
            } else if (integration.id === 'tiktok_ads') {
                stats['tiktok_ads'] = await TikTokService.fetchData(user?.id || 'demo', dateRange);
            } else if (integration.id === 'gmb') {
                 const gmb = await GmbService.fetchData(dateRange);
                 setGmbData(gmb);
            }
        } catch (error: any) {
            console.error(`Error fetching ${integration.name}:`, error);
            setApiErrors(prev => ({ ...prev, [integration.id]: 'Failed to sync data.' }));
        }
      } else {
          // Clear data if disconnected
          if (integration.id === 'gmb') setGmbData([]);
      }
    }
    setPlatformStats(stats);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, [dateRange]); // Re-fetch when date range changes

  // Calculate GMB Totals
  const totalViews = gmbData.reduce((acc, curr) => acc + curr.views, 0);
  const totalActions = gmbData.reduce((acc, curr) => acc + curr.interactions, 0);
  const totalCalls = gmbData.reduce((acc, curr) => acc + curr.calls, 0);
  const totalWebsite = gmbData.reduce((acc, curr) => acc + (curr as any).website_clicks || 0, 0);

  // Billing Stats
  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
  const pendingRevenue = invoices.filter(i => i.status !== 'Paid').reduce((acc, curr) => acc + curr.amount, 0);

  // Calculate Trial Days
  const getDaysRemaining = () => {
      if (!user?.trialEndsAt) return 0;
      const end = new Date(user.trialEndsAt);
      const now = new Date();
      const diff = end.getTime() - now.getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleAddClient = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const newClient: Client = {
          id: Date.now().toString(),
          name: formData.get('name') as string,
          website: formData.get('website') as string,
          status: 'Active',
          nextReport: 'Nov 15, 2025',
          logo: formData.get('logo') as string || undefined
      };
      
      const updatedClients = DataService.addClient(newClient);
      setClients(updatedClients);
      setIsAddModalOpen(false);
      addToast('Client added successfully!', 'success');
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const newTemplate: ReportTemplate = {
      id: `t_${Date.now()}`,
      name: newTemplateName,
      description: newTemplateDesc,
      category: newTemplateCategory,
      isCustom: true,
      widgets: builderWidgets,
      lastModified: new Date().toLocaleDateString()
    };
    
    const updatedTemplates = DataService.addTemplate(newTemplate);
    setTemplates(updatedTemplates);
    setIsTemplateModalOpen(false);
    setNewTemplateName('');
    setNewTemplateDesc('');
    setBuilderWidgets([]);
    addToast('Template saved successfully!', 'success');
  };

  const handleDeleteTemplate = (id: string) => {
     if(confirm('Are you sure you want to delete this template?')) {
        const updated = DataService.deleteTemplate(id);
        setTemplates(updated);
        addToast('Template deleted.', 'info');
     }
  };

  const handleReportFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingTemplate) return;

    const formData = new FormData(e.target as HTMLFormElement);
    setPendingReportData({
        clientName: formData.get('clientName') as string,
        reportName: formData.get('reportName') as string,
        date: formData.get('date') as string
    });
    setIsReportConfirmationOpen(true);
  };

  const confirmGenerateReport = () => {
    if (!applyingTemplate || !pendingReportData) return;

    let platform: Report['platform'] = 'Mixed';
    if (applyingTemplate.category === 'SEO') platform = 'SEO';
    else if (applyingTemplate.category === 'PPC') platform = 'Google Ads';
    else if (applyingTemplate.category === 'Social') platform = 'Facebook';
    else if (applyingTemplate.category === 'General' && applyingTemplate.widgets.some(w => w.widgetId === 'gmb_insights')) platform = 'Google My Business';
    else if (applyingTemplate.category === 'Google My Business') platform = 'Google My Business';

    const newReport: Report = {
        id: Date.now().toString(),
        clientName: pendingReportData.clientName,
        name: pendingReportData.reportName,
        date: pendingReportData.date,
        status: 'Draft',
        platform,
        widgets: applyingTemplate.widgets
    };

    const updatedReports = DataService.addReport(newReport);
    setReports(updatedReports);
    
    // Reset states
    setApplyingTemplate(null);
    setPendingReportData(null);
    setIsReportConfirmationOpen(false);
    setActiveTab('reports');
    addToast('Report generated successfully!', 'success');
  };

  const addWidgetToBuilder = (widgetDef: typeof availableWidgets[0]) => {
    const newWidget: ReportWidgetConfig = {
      id: `w_${Date.now()}`,
      widgetId: widgetDef.id,
      title: widgetDef.label,
      type: widgetDef.type,
      chartType: widgetDef.type === 'chart' ? 'bar' : undefined
    };
    setBuilderWidgets([...builderWidgets, newWidget]);
  };

  const addTextBlockToBuilder = () => {
    const newWidget: ReportWidgetConfig = {
      id: `w_${Date.now()}`,
      widgetId: 'text_block',
      title: 'Commentary / Notes',
      type: 'text',
      content: ''
    };
    setBuilderWidgets([...builderWidgets, newWidget]);
  };

  const removeWidgetFromBuilder = (id: string) => {
    setBuilderWidgets(builderWidgets.filter(w => w.id !== id));
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === builderWidgets.length - 1) return;
    
    const newWidgets = [...builderWidgets];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newWidgets[index], newWidgets[swapIndex]] = [newWidgets[swapIndex], newWidgets[index]];
    setBuilderWidgets(newWidgets);
  };

  const updateWidgetConfig = (id: string, updates: Partial<ReportWidgetConfig>) => {
    setBuilderWidgets(builderWidgets.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const handleToggleIntegration = async (id: string) => {
     setConnectingId(id);
     // Simulate OAuth popup delay
     await new Promise(resolve => setTimeout(resolve, 1500));
     
     const updated = DataService.toggleIntegration(id);
     setIntegrations(updated);
     setConnectingId(null);
     
     const wasConnected = updated.find(i => i.id === id)?.status === 'Connected';
     if (wasConnected) {
         addToast(`${updated.find(i => i.id === id)?.name} connected successfully!`, 'success');
     } else {
         addToast('Integration disconnected.', 'info');
     }
     
     // Trigger a data refresh to fetch/clear mock data for that platform
     refreshData(); 
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
     e.preventDefault();
     const formData = new FormData(e.target as HTMLFormElement);
     const newInvoice: Invoice = {
         id: `inv_${Date.now()}`,
         clientName: formData.get('clientName') as string,
         amount: parseFloat(formData.get('amount') as string),
         date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
         dueDate: formData.get('dueDate') as string,
         status: 'Pending',
         items: [{ description: formData.get('description') as string, amount: parseFloat(formData.get('amount') as string) }]
     };
     const updated = DataService.addInvoice(newInvoice);
     setInvoices(updated);
     setIsInvoiceModalOpen(false);
     addToast('Invoice created successfully!', 'success');
  };

  const initiatePayment = (invoice: Invoice) => {
     setSelectedInvoice(invoice);
     setIsPaymentModalOpen(true);
  };

  const processPayment = (method: 'VISA' | 'PAYPAL') => {
     if(!selectedInvoice) return;
     // Simulate processing
     setTimeout(() => {
        const updated = DataService.payInvoice(selectedInvoice.id);
        setInvoices(updated);
        setIsPaymentModalOpen(false);
        setSelectedInvoice(null);
        addToast(`Payment of KES ${selectedInvoice.amount.toLocaleString()} processed via ${method}!`, 'success');
     }, 1000);
  };

  const handleExportReport = () => {
      addToast('Generating PDF Report...', 'info');
      setTimeout(() => {
          addToast('Download started', 'success');
          // In a real app, this would trigger a download. Here we just simulate it.
      }, 2000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      
      await updateProfile({
          name: formData.get('name') as string,
          companyName: formData.get('companyName') as string,
          logoUrl: formData.get('logoUrl') as string,
          brandColor: formData.get('brandColor') as string
      });
      
      addToast('Settings saved successfully!', 'success');
  };

  const filteredReports = reports.filter(report => {
    const statusMatch = reportStatusFilter === 'All' || report.status === reportStatusFilter;
    const platformMatch = reportPlatformFilter === 'All' || report.platform === reportPlatformFilter;
    return statusMatch && platformMatch;
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-900 text-white flex flex-col border-r border-brand-800 hidden md:flex">
        <div className="p-6 border-b border-brand-800 flex items-center">
          <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center mr-3 text-brand-900">
            {user?.logoUrl ? (
                <img src={user.logoUrl} alt="Agency Logo" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
                <Briefcase size={18} className="text-brand-900" />
            )}
          </div>
          <div>
             <h1 className="font-bold text-lg leading-tight text-white">
                 {user?.companyName ? (
                     <span className="text-accent-500">{user.companyName}</span>
                 ) : (
                     <>WebPro<span className="text-accent-500">Metrics</span></>
                 )}
             </h1>
             <span className="text-xs text-brand-400">Admin Dashboard</span>
          </div>
        </div>

        <div className="flex-1 px-3 py-6 overflow-y-auto">
          <SidebarItem icon={Home} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <SidebarItem icon={Users} label="Clients" active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} />
          <SidebarItem icon={FileText} label="Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          <SidebarItem icon={LayoutTemplate} label="Templates" active={activeTab === 'templates'} onClick={() => setActiveTab('templates')} />
          <SidebarItem icon={Plug} label="Integrations" active={activeTab === 'integrations'} onClick={() => setActiveTab('integrations')} />
          <SidebarItem icon={DollarSign} label="Billing" active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
          <SidebarItem icon={Settings} label="Agency Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>

        <div className="p-4 border-t border-brand-800">
          <div className="flex items-center p-2 rounded-lg hover:bg-brand-800 cursor-pointer" onClick={logout}>
            <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-sm font-bold text-white mr-3">
              {user?.name.charAt(0) || 'A'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-brand-400 truncate max-w-[100px]">{user?.companyName || 'Agency'}</p>
            </div>
            <LogOut size={16} className="text-brand-400" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm z-10 h-16 flex items-center justify-between px-6 lg:px-8">
           <div className="flex items-center w-full max-w-md">
             <div className="relative w-full text-gray-500 focus-within:text-brand-600">
               <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-3">
                 <Search size={18} />
               </div>
               <input 
                 type="text" 
                 className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-500 sm:text-sm transition duration-150 ease-in-out"
                 placeholder="Search clients, reports..."
               />
             </div>
           </div>

           <div className="flex items-center space-x-4">
             {/* Date Range Selector (Visible mainly on Overview) */}
             {activeTab === 'overview' && (
                 <div className="hidden md:flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
                    {(['daily', 'weekly', 'monthly'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                                dateRange === range 
                                ? 'bg-white text-brand-600 shadow-sm ring-1 ring-gray-200' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {range}
                        </button>
                    ))}
                 </div>
             )}

             <button 
                onClick={refreshData}
                className={`p-2 text-gray-400 hover:text-brand-600 transition-colors ${isLoading ? 'cursor-not-allowed' : ''}`}
                disabled={isLoading}
                title="Refresh Data"
             >
               <RefreshCw size={20} className={isLoading ? "animate-spin text-brand-600" : ""} />
             </button>
             <button className="p-2 text-gray-400 hover:text-brand-600 transition-colors relative">
               <Bell size={20} />
               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
             </button>
             <div className="h-8 w-px bg-gray-200"></div>
             <Button variant="accent" size="sm" onClick={() => setIsAddModalOpen(true)}>
               <Plus size={16} className="mr-1" /> Add Client
             </Button>
           </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          
          {activeTab === 'overview' && (
            isLoading ? <OverviewSkeleton /> : (
            <div className="space-y-6">
              {user?.isTrial && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between gap-4">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-indigo-900">Free Trial Active</h4>
                            <p className="text-sm text-indigo-700 mt-0.5">
                                You have <span className="font-bold">{getDaysRemaining()} days</span> remaining in your full-access trial.
                            </p>
                        </div>
                     </div>
                     <Button variant="secondary" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">Upgrade Now</Button>
                  </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stat Card 1 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-50 text-brand-600 rounded-lg">
                       <Users size={20} />
                    </div>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{clients.length}</h3>
                  <p className="text-sm text-gray-500">Active Clients</p>
                </div>

                {/* Stat Card 2 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                   <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-50 text-accent-600 rounded-lg">
                       <FileText size={20} />
                    </div>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+5%</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{reports.length}</h3>
                  <p className="text-sm text-gray-500">Reports Generated</p>
                </div>

                {/* Stat Card 3 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                   <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                       <Briefcase size={20} />
                    </div>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+18%</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">KES {totalRevenue.toLocaleString()}</h3>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Chart Area */}
                 <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                         <h3 className="text-lg font-bold text-gray-800">Report Generation Activity</h3>
                         <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">Last 7 Days</span>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={overviewData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                          <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 0}} activeDot={{r: 6}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                 </div>

                 {/* Recent Activity / Notifications */}
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Recent Activity</h3>
                    <div className="space-y-6">
                       {[1,2,3,4].map((i) => (
                         <div key={i} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-500">
                               {['JD', 'ST', 'MK', 'RE'][i-1]}
                            </div>
                            <div>
                               <p className="text-sm text-gray-800 font-medium">
                                 {['Report sent to Safari Travels', 'New client added: TechHub', 'Payment received from Mombasa Resorts', 'Integration updated: Facebook Ads'][i-1]}
                               </p>
                               <p className="text-xs text-gray-400 mt-1">{i} hour ago</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* DYNAMIC PLATFORM WIDGETS */}
              
              {/* Google My Business */}
              {integrations.find(i => i.id === 'gmb')?.status === 'Connected' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            Google Business Profile
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200 uppercase tracking-wide">
                                <Activity size={10} className="mr-1" /> Connected
                            </span>
                            </h3>
                            <p className="text-xs text-gray-500">Performance & Engagement</p>
                        </div>
                    </div>
                    <div className="text-xs font-semibold text-gray-500 uppercase bg-gray-100 px-2 py-1 rounded">{dateRange} view</div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Metrics Side */}
                    <div className="space-y-4 lg:col-span-1">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-sm font-medium text-gray-500">Total Profile Views</p>
                                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">+24%</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-sm font-medium text-gray-500">Total Actions</p>
                                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">+12%</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{totalActions.toLocaleString()}</p>
                            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200">
                                <div>
                                <p className="text-[10px] text-gray-500 uppercase">Website</p>
                                <p className="font-bold text-gray-800">{totalWebsite.toLocaleString()}</p>
                                </div>
                                <div>
                                <p className="text-[10px] text-gray-500 uppercase">Calls</p>
                                <p className="font-bold text-green-600">{totalCalls.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Chart Side */}
                    <div className="lg:col-span-2">
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={gmbData} barSize={12} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#22c55e', fontSize: 12}} />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                                />
                                <Bar yAxisId="left" dataKey="views" name="Views" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar yAxisId="left" dataKey="interactions" name="Actions" fill="#fb923c" radius={[4, 4, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="calls" name="Calls" stroke="#22c55e" strokeWidth={3} dot={{r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff'}} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    </div>
                    
                    {/* Website Clicks Chart Section */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <MousePointerClick size={16} className="text-purple-500"/> Website Clicks Trend
                            </h4>
                            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                                {totalWebsite.toLocaleString()} Total
                            </span>
                        </div>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={gmbData}>
                                    <defs>
                                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                    <Area type="monotone" dataKey="website_clicks" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
              )}

              {/* Google Ads Widget */}
              <PlatformWidget 
                 data={platformStats['google_ads'] || null} 
                 title="Google Ads Performance" 
                 icon={BarChart2} 
                 colorClass="text-blue-600" 
                 error={apiErrors.google_ads}
              />
              
              {/* Google Analytics Widget */}
              <PlatformWidget 
                 data={platformStats['ga4'] || null} 
                 title="Google Analytics 4" 
                 icon={Activity} 
                 colorClass="text-orange-600" 
                 error={apiErrors.ga4}
              />
              
              {/* Meta Ads Widget */}
              <PlatformWidget 
                 data={platformStats['meta_ads'] || null} 
                 title="Meta Ads (Facebook/Instagram)" 
                 icon={Users} 
                 colorClass="text-indigo-600" 
                 error={apiErrors.meta_ads}
              />

               {/* Search Console Widget */}
               <PlatformWidget 
                 data={platformStats['search_console'] || null} 
                 title="Search Console (SEO)" 
                 icon={Search} 
                 colorClass="text-green-600" 
                 error={apiErrors.search_console}
              />

               {/* LinkedIn Widget */}
               <PlatformWidget 
                 data={platformStats['linkedin'] || null} 
                 title="LinkedIn Company Page" 
                 icon={Briefcase} 
                 colorClass="text-blue-800" 
              />

               {/* X Ads Widget */}
               <PlatformWidget 
                 data={platformStats['x_ads'] || null} 
                 title="X (Twitter) Ads" 
                 icon={Twitter} 
                 colorClass="text-gray-800" 
              />

               {/* TikTok Ads Widget */}
               <PlatformWidget 
                 data={platformStats['tiktok_ads'] || null} 
                 title="TikTok Ads" 
                 icon={Video} 
                 colorClass="text-pink-500" 
              />
              
            </div>
            )
          )}
          
          {/* ... (Rest of Dashboard tabs logic: clients, reports, templates, integrations, billing) ... */}
          
          {/* ... (Client tab content) ... */}
          {activeTab === 'clients' && (
            isLoading ? <ClientsSkeleton /> : (
            <div className="space-y-6">
               <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                 <h3 className="text-lg font-bold text-gray-900">My Clients</h3>
                 <Button size="sm" variant="primary" onClick={() => setIsAddModalOpen(true)}>
                    <Plus size={16} className="mr-1" /> Add New Client
                 </Button>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {clients.map((client) => (
                   <div key={client.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                             <div className="flex-shrink-0 w-12 h-12">
                               {client.logo ? (
                                 <img className="w-12 h-12 rounded-lg object-cover border border-gray-100 shadow-sm" src={client.logo} alt={client.name} />
                               ) : (
                                 <div className="w-12 h-12 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-lg border border-brand-100">
                                   {client.name.charAt(0)}
                                 </div>
                               )}
                             </div>
                             <div>
                               <h4 className="font-bold text-gray-900 leading-tight">{client.name}</h4>
                               <a href={`https://${client.website}`} target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-brand-600 transition-colors">
                                 {client.website}
                               </a>
                             </div>
                         </div>
                         <button className="text-gray-400 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical size={18} />
                         </button>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                         <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                             client.status === 'Active' ? 'bg-green-100 text-green-700' : 
                             client.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
                             'bg-red-100 text-red-700'
                           }`}>
                             {client.status}
                         </span>
                         <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                            Next Report: <span className="text-gray-600">{client.nextReport}</span>
                         </span>
                      </div>
                   </div>
                 ))}
                 
                 <div 
                   onClick={() => setIsAddModalOpen(true)}
                   className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-brand-400 hover:bg-brand-50 transition-all cursor-pointer group h-full min-h-[160px]"
                 >
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                       <Plus size={24} className="text-brand-500" />
                    </div>
                    <h4 className="font-bold text-gray-700 group-hover:text-brand-700">Add New Client</h4>
                 </div>
               </div>
            </div>
            )
          )}

          {activeTab === 'reports' && (
            isLoading ? <ReportsSkeleton /> : (
            <div className="space-y-6">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                 <h3 className="text-lg font-bold text-gray-900">Reports Library</h3>
                 <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none min-w-[140px]">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <Filter size={14} className="text-gray-400" />
                       </div>
                       <select 
                         value={reportStatusFilter}
                         onChange={(e) => setReportStatusFilter(e.target.value)}
                         className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer text-gray-600 font-medium"
                       >
                          <option value="All">All Status</option>
                          <option value="Sent">Sent</option>
                          <option value="Draft">Draft</option>
                          <option value="Scheduled">Scheduled</option>
                       </select>
                       <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                    </div>

                    <div className="relative flex-1 sm:flex-none min-w-[160px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <Filter size={14} className="text-gray-400" />
                       </div>
                       <select 
                         value={reportPlatformFilter}
                         onChange={(e) => setReportPlatformFilter(e.target.value)}
                         className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer text-gray-600 font-medium"
                       >
                          <option value="All">All Platforms</option>
                          <option value="Google Ads">Google Ads</option>
                          <option value="Facebook">Facebook</option>
                          <option value="SEO">SEO</option>
                          <option value="Google My Business">Google My Business</option>
                          <option value="Mixed">Mixed</option>
                       </select>
                       <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                    </div>
                 </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredReports.map((report) => {
                    const PlatformIcon = report.platform === 'Google My Business' ? MapPin :
                                         report.platform === 'Google Ads' ? BarChart2 :
                                         report.platform === 'Facebook' ? Users :
                                         report.platform === 'SEO' ? Search : FileText;
                    
                    const iconColorClass = report.platform === 'Google My Business' ? 'bg-blue-50 text-blue-600' :
                                           report.platform === 'Google Ads' ? 'bg-blue-50 text-blue-600' :
                                           report.platform === 'Facebook' ? 'bg-indigo-50 text-indigo-600' :
                                           report.platform === 'SEO' ? 'bg-green-50 text-green-600' : 'bg-brand-50 text-brand-600';

                    return (
                        <div key={report.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColorClass}`}>
                                    <PlatformIcon size={20} />
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wide font-bold rounded mb-1 ${
                                        report.status === 'Sent' ? 'bg-green-100 text-green-700' : 
                                        report.status === 'Draft' ? 'bg-gray-100 text-gray-600' : 
                                        'bg-blue-100 text-blue-600'
                                    }`}>
                                    {report.status}
                                    </span>
                                    <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                                    {report.platform}
                                    </span>
                                </div>
                            </div>
                            <h4 className="font-bold text-gray-900 mb-1">{report.name}</h4>
                            <p className="text-xs text-gray-500 mb-4">For {report.clientName}</p>
                            <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-xs text-gray-500">
                                <span>{report.date}</span>
                                <button onClick={handleExportReport} className="text-brand-600 font-medium hover:underline flex items-center gap-1">
                                    <Download size={12} /> View PDF
                                </button>
                            </div>
                        </div>
                    );
                 })}
                 <div className="bg-gray-50 p-5 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 text-gray-400">
                      <Plus size={20} />
                    </div>
                    <p className="text-sm font-medium text-gray-600">Create New Report</p>
                 </div>
               </div>
            </div>
            )
          )}

          {activeTab === 'templates' && (
            isLoading ? <TemplatesSkeleton /> : (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                 <h3 className="text-lg font-bold text-gray-900">Report Templates</h3>
                 <Button size="sm" variant="primary" onClick={() => setIsTemplateModalOpen(true)}>
                    <Plus size={16} className="mr-1" /> Create New Template
                 </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {templates.map((template) => (
                    <div key={template.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col relative group">
                       <div className="flex justify-between items-start mb-4">
                          <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase ${
                            template.isCustom ? 'bg-purple-100 text-purple-700' : 'bg-brand-100 text-brand-700'
                          }`}>
                            {template.isCustom ? 'Custom' : 'Standard'}
                          </span>
                          {template.isCustom && (
                             <button 
                               onClick={() => handleDeleteTemplate(template.id)} 
                               className="text-gray-300 hover:text-red-500 transition-colors"
                             >
                               <Trash2 size={18} />
                             </button>
                          )}
                       </div>
                       
                       <h4 className="font-bold text-lg text-gray-900 mb-2">{template.name}</h4>
                       <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">{template.description}</p>
                       
                       <div className="mb-4 flex flex-wrap gap-2">
                          {template.widgets.slice(0, 3).map((w, idx) => (
                             <span key={idx} className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] text-gray-600">
                                {w.title || w.widgetId}
                             </span>
                          ))}
                          {template.widgets.length > 3 && (
                            <span className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] text-gray-500">
                               +{template.widgets.length - 3} more
                            </span>
                          )}
                       </div>

                       <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                          <span className="text-xs text-gray-400">{template.category}</span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs"
                            onClick={() => setApplyingTemplate(template)}
                          >
                            Apply Template
                          </Button>
                       </div>
                    </div>
                 ))}
                 
                 <div 
                   onClick={() => setIsTemplateModalOpen(true)}
                   className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-brand-400 hover:bg-brand-50 transition-all cursor-pointer group min-h-[250px]"
                 >
                    <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                       <Plus size={28} className="text-brand-500" />
                    </div>
                    <h4 className="font-bold text-gray-700 text-lg group-hover:text-brand-700">Create Custom Template</h4>
                    <p className="text-sm text-gray-500 mt-2 max-w-[200px]">Design a report layout specific to your client's needs.</p>
                 </div>
              </div>
            </div>
            )
          )}

          {activeTab === 'integrations' && (
             <div className="space-y-6">
               <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Platform Integrations</h3>
                  <p className="text-gray-500">Connect your marketing accounts to sync data automatically. All data is encrypted and secure.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {integrations.map((integration) => {
                   const hasError = !!apiErrors[integration.id];
                   const statusLabel = hasError ? 'Error' : integration.status;

                   return (
                   <div key={integration.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                         <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                            integration.provider === 'google' ? 'bg-blue-50 text-blue-600' :
                            integration.provider === 'meta' ? 'bg-indigo-50 text-indigo-600' :
                            integration.provider === 'linkedin' ? 'bg-blue-50 text-blue-800' :
                            integration.provider === 'tiktok' ? 'bg-pink-50 text-pink-500' :
                            integration.provider === 'x' ? 'bg-gray-100 text-gray-900' :
                            'bg-gray-100 text-gray-800'
                         }`}>
                            {integration.id === 'gmb' ? <MapPin size={24} /> : 
                             integration.id.includes('google') || integration.id === 'search_console' ? <BarChart2 size={24} /> :
                             integration.id.includes('meta') ? <Users size={24} /> :
                             integration.id === 'linkedin' ? <Briefcase size={24} /> :
                             integration.id === 'x_ads' ? <Twitter size={24} /> :
                             integration.id === 'tiktok_ads' ? <Video size={24} /> :
                             <Link2 size={24} />
                            }
                         </div>
                         <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                           statusLabel === 'Connected' ? 'bg-green-100 text-green-700' : 
                           statusLabel === 'Error' ? 'bg-red-100 text-red-700' :
                           'bg-gray-100 text-gray-500'
                         }`}>
                           {statusLabel}
                         </span>
                      </div>
                      
                      <h4 className="font-bold text-lg text-gray-900 mb-1">{integration.name}</h4>
                      {hasError && <p className="text-xs text-red-500 mb-2 font-medium">Connection failed. Please reconnect.</p>}
                      <p className="text-sm text-gray-500 mb-6 flex-grow">{integration.description}</p>

                      <div className="mt-auto">
                         {integration.status === 'Connected' && !hasError ? (
                            <div className="space-y-3">
                               <div className="flex items-center text-xs text-gray-500">
                                 <Check size={14} className="text-green-500 mr-1" /> Last synced: {integration.lastSync || 'Just now'}
                               </div>
                               <Button 
                                  variant="outline" 
                                  className="w-full justify-center text-red-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                                  onClick={() => handleToggleIntegration(integration.id)}
                               >
                                  Disconnect
                               </Button>
                            </div>
                         ) : (
                            <Button 
                               variant="primary" 
                               className="w-full justify-center"
                               disabled={connectingId === integration.id}
                               onClick={() => handleToggleIntegration(integration.id)}
                            >
                               {connectingId === integration.id ? (
                                   <div className="flex items-center">
                                       <RefreshCw size={16} className="animate-spin mr-2" /> Connecting...
                                   </div>
                               ) : (
                                   hasError ? "Retry Connection" : "Connect Account"
                               )}
                            </Button>
                         )}
                      </div>
                   </div>
                 )})}
               </div>
             </div>
          )}

          {activeTab === 'billing' && (
             <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                       <p className="text-sm text-gray-500 mb-1">Total Revenue (YTD)</p>
                       <h3 className="text-2xl font-bold text-gray-900">KES {totalRevenue.toLocaleString()}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                       <p className="text-sm text-gray-500 mb-1">Outstanding Invoices</p>
                       <h3 className="text-2xl font-bold text-orange-600">KES {pendingRevenue.toLocaleString()}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                       <p className="text-sm text-gray-500 mb-1">Paid Invoices</p>
                       <h3 className="text-2xl font-bold text-green-600">{invoices.filter(i => i.status === 'Paid').length}</h3>
                    </div>
                 </div>

                 <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                       <h3 className="text-lg font-bold text-gray-900">Invoices</h3>
                       <Button size="sm" variant="primary" onClick={() => setIsInvoiceModalOpen(true)}>
                          <Plus size={16} className="mr-1" /> Create Invoice
                       </Button>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                             <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                             </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                             {invoices.map((invoice) => (
                                <tr key={invoice.id}>
                                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{invoice.id.split('_')[1]}</td>
                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.clientName}</td>
                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">KES {invoice.amount.toLocaleString()}</td>
                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.date}</td>
                                   <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                         invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 
                                         invoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                                         'bg-red-100 text-red-800'
                                      }`}>
                                         {invoice.status}
                                      </span>
                                   </td>
                                   <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                      {invoice.status !== 'Paid' && (
                                         <Button size="sm" variant="outline" onClick={() => initiatePayment(invoice)}>Pay Now</Button>
                                      )}
                                      {invoice.status === 'Paid' && (
                                          <span className="text-green-600 flex items-center justify-end gap-1"><Check size={14}/> Paid</span>
                                      )}
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
             </div>
          )}

          {activeTab === 'settings' && (
              <div className="max-w-4xl mx-auto space-y-8">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-gray-100">
                          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                              <User size={20} className="text-brand-600" /> User Profile
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">Manage your account details and preferences.</p>
                      </div>
                      <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                  <input name="name" defaultValue={user?.name} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500" />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                  <input name="email" defaultValue={user?.email} disabled className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed" />
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name</label>
                              <input name="companyName" defaultValue={user?.companyName} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500" />
                          </div>
                          
                          <div className="pt-4 flex justify-end">
                              <Button type="submit" variant="primary">Save Profile</Button>
                          </div>
                      </form>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-gray-100">
                          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                              <Palette size={20} className="text-purple-600" /> White-Labeling Settings
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">Customize the look and feel of your client reports.</p>
                      </div>
                      <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Agency Logo URL</label>
                              <input name="logoUrl" defaultValue={user?.logoUrl} placeholder="https://example.com/logo.png" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500" />
                              <p className="text-xs text-gray-500 mt-1">This logo will appear on the dashboard and all generated reports.</p>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Brand Color</label>
                              <div className="flex items-center gap-2">
                                  <input type="color" name="brandColor" defaultValue={user?.brandColor || '#253b65'} className="h-10 w-16 p-1 rounded border border-gray-300" />
                                  <span className="text-sm text-gray-600">Select your primary brand color.</span>
                              </div>
                          </div>
                          
                          <div className="pt-4 flex justify-end">
                              <Button type="submit" variant="primary">Save Branding</Button>
                          </div>
                      </form>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-gray-100">
                          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                              <Lock size={20} className="text-gray-600" /> Security
                          </h3>
                      </div>
                      <div className="p-6">
                          <Button variant="outline">Change Password</Button>
                      </div>
                  </div>
              </div>
          )}

        </main>
      </div>

      {/* ... (Modals: Add Client, Create Invoice, Payment, Create Template, Apply Template, Confirmation) ... */}
      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Add New Client</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
              </div>
              <form onSubmit={handleAddClient} className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Agency/Client Name</label>
                   <input name="name" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500" placeholder="e.g. Nairobi Ventures" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                   <input name="website" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500" placeholder="e.g. nairobieventures.co.ke" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (Optional)</label>
                   <input name="logo" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500" placeholder="https://..." />
                 </div>
                 <div className="pt-2 flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="primary" className="flex-1">Add Client</Button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {isInvoiceModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-gray-900">Create New Invoice</h3>
                 <button onClick={() => setIsInvoiceModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
               </div>
               <form onSubmit={handleCreateInvoice} className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                     <select name="clientName" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500 bg-white">
                        {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                     <input name="description" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500" placeholder="e.g. Monthly SEO Services" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
                     <input name="amount" type="number" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500" placeholder="0.00" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                     <input name="dueDate" type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500" />
                  </div>
                  <div className="pt-4 flex gap-3">
                     <Button type="button" variant="outline" className="flex-1" onClick={() => setIsInvoiceModalOpen(false)}>Cancel</Button>
                     <Button type="submit" variant="primary" className="flex-1">Create Invoice</Button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedInvoice && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-gray-900">Pay Invoice #{selectedInvoice.id.split('_')[1]}</h3>
                 <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
               </div>
               <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-500">Amount Due</p>
                  <p className="text-3xl font-bold text-gray-900">KES {selectedInvoice.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">For {selectedInvoice.clientName}</p>
               </div>
               
               <div className="space-y-3">
                  <button 
                     onClick={() => processPayment('VISA')}
                     className="w-full p-4 border border-gray-200 rounded-xl flex items-center justify-between hover:border-brand-500 hover:bg-brand-50 transition-all group"
                  >
                     <div className="flex items-center gap-3">
                        <CreditCard className="text-gray-600 group-hover:text-brand-600" />
                        <span className="font-medium text-gray-700 group-hover:text-brand-700">Pay with VISA</span>
                     </div>
                     <div className="h-4 w-4 rounded-full border border-gray-300 group-hover:border-brand-500"></div>
                  </button>
                  <button 
                     onClick={() => processPayment('PAYPAL')}
                     className="w-full p-4 border border-gray-200 rounded-xl flex items-center justify-between hover:border-brand-500 hover:bg-brand-50 transition-all group"
                  >
                     <div className="flex items-center gap-3">
                        {/* Simple PayPal Icon Representation */}
                        <div className="w-6 h-6 rounded bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">P</div>
                        <span className="font-medium text-gray-700 group-hover:text-brand-700">Pay with PayPal</span>
                     </div>
                     <div className="h-4 w-4 rounded-full border border-gray-300 group-hover:border-brand-500"></div>
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Create Template Modal - REBUILT AS BUILDER */}
      {isTemplateModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl flex flex-col h-[90vh]">
               <div className="flex justify-between items-center p-6 border-b border-gray-100">
                 <div>
                    <h3 className="text-xl font-bold text-gray-900">Report Template Builder</h3>
                    <p className="text-sm text-gray-500">Drag, drop, and customize your report structure.</p>
                 </div>
                 <button onClick={() => setIsTemplateModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
               </div>
               
               <div className="flex flex-1 overflow-hidden">
                 {/* Left Panel - Settings & Widget Library */}
                 <div className="w-1/3 border-r border-gray-200 overflow-y-auto p-6 bg-gray-50">
                    <form id="templateForm" onSubmit={handleCreateTemplate} className="space-y-6 mb-8">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                          <input 
                            required 
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500 bg-white" 
                            placeholder="e.g. Quarterly Business Review" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea 
                            required 
                            value={newTemplateDesc}
                            onChange={(e) => setNewTemplateDesc(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500 bg-white" 
                            placeholder="Brief description..."
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <select 
                            value={newTemplateCategory}
                            onChange={(e) => setNewTemplateCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500 bg-white"
                          >
                             <option value="General">General</option>
                             <option value="SEO">SEO</option>
                             <option value="Social">Social Media</option>
                             <option value="PPC">PPC / Ads</option>
                             <option value="Mixed">Mixed</option>
                             <option value="Google My Business">Google My Business</option>
                          </select>
                        </div>
                    </form>

                    <div>
                       <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wider">Add Widgets</h4>
                       <div className="space-y-2">
                          {/* Text Block Special Widget */}
                          <div 
                             onClick={addTextBlockToBuilder}
                             className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:border-brand-500 hover:shadow-md transition-all flex items-center group"
                          >
                             <div className="bg-purple-50 p-2 rounded text-purple-600 mr-3 group-hover:bg-purple-100">
                                <FileEdit size={16} />
                             </div>
                             <span className="text-sm font-medium text-gray-700">Text Block / Commentary</span>
                             <Plus size={16} className="ml-auto text-gray-400 group-hover:text-brand-500" />
                          </div>

                          {/* Available Data Widgets */}
                          {availableWidgets.map((widget) => (
                             <div 
                               key={widget.id}
                               onClick={() => addWidgetToBuilder(widget)}
                               className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:border-brand-500 hover:shadow-md transition-all flex items-center group"
                             >
                                <div className="bg-brand-50 p-2 rounded text-brand-600 mr-3 group-hover:bg-brand-100">
                                   {widget.type === 'chart' ? <BarChart2 size={16} /> : widget.type === 'table' ? <LayoutTemplate size={16} /> : <Activity size={16} />}
                                </div>
                                <div>
                                   <p className="text-sm font-medium text-gray-700">{widget.label}</p>
                                   <p className="text-[10px] text-gray-400 capitalize">{widget.type}</p>
                                </div>
                                <Plus size={16} className="ml-auto text-gray-400 group-hover:text-brand-500" />
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Right Panel - Canvas / Preview */}
                 <div className="w-2/3 p-6 overflow-y-auto bg-gray-100">
                    <div className="max-w-3xl mx-auto">
                       <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-gray-700">Report Structure ({builderWidgets.length} items)</h4>
                          {builderWidgets.length === 0 && (
                             <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100">Add at least one widget</span>
                          )}
                       </div>
                       
                       {builderWidgets.length === 0 ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-center">
                             <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                <LayoutTemplate size={32} />
                             </div>
                             <h3 className="text-lg font-medium text-gray-500">Your canvas is empty</h3>
                             <p className="text-sm text-gray-400 mt-1">Select widgets from the left sidebar to build your report.</p>
                          </div>
                       ) : (
                          <div className="space-y-4">
                             {builderWidgets.map((widget, index) => (
                                <div key={widget.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group transition-all hover:shadow-md">
                                   {/* Widget Header */}
                                   <div className="bg-gray-50 p-3 border-b border-gray-100 flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                         <div className="flex flex-col gap-1">
                                            <button 
                                              type="button"
                                              onClick={() => moveWidget(index, 'up')}
                                              disabled={index === 0}
                                              className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 text-gray-500"
                                            >
                                               <ArrowUp size={12} />
                                            </button>
                                            <button 
                                              type="button"
                                              onClick={() => moveWidget(index, 'down')}
                                              disabled={index === builderWidgets.length - 1}
                                              className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 text-gray-500"
                                            >
                                               <ArrowDown size={12} />
                                            </button>
                                         </div>
                                         <span className="font-semibold text-gray-700 text-sm">{widget.title}</span>
                                         <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded uppercase">{widget.type}</span>
                                      </div>
                                      
                                      <button 
                                        onClick={() => removeWidgetFromBuilder(widget.id)}
                                        className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                                      >
                                         <Trash2 size={16} />
                                      </button>
                                   </div>
                                   
                                   {/* Widget Configuration Body */}
                                   <div className="p-4">
                                      {widget.type === 'chart' && (
                                         <div className="flex items-center gap-4">
                                            <label className="text-xs font-medium text-gray-500">Chart Type:</label>
                                            <div className="flex bg-gray-100 rounded-md p-1">
                                               {(['bar', 'line', 'area'] as const).map((type) => (
                                                  <button
                                                     key={type}
                                                     type="button"
                                                     onClick={() => updateWidgetConfig(widget.id, { chartType: type })}
                                                     className={`px-3 py-1 text-xs font-medium rounded-sm capitalize transition-all ${
                                                        widget.chartType === type ? 'bg-white shadow text-brand-600' : 'text-gray-500 hover:text-gray-700'
                                                     }`}
                                                  >
                                                     {type}
                                                  </button>
                                               ))}
                                            </div>
                                         </div>
                                      )}

                                      {widget.type === 'text' && (
                                         <div className="space-y-2">
                                            <label className="text-xs font-medium text-gray-500">Commentary Content:</label>
                                            <textarea
                                               value={widget.content}
                                               onChange={(e) => updateWidgetConfig(widget.id, { content: e.target.value })}
                                               className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                                               rows={3}
                                               placeholder="Enter your analysis here..."
                                            />
                                         </div>
                                      )}

                                      {widget.type === 'table' && (
                                         <p className="text-xs text-gray-400 italic flex items-center">
                                            <AlignLeft size={12} className="mr-1"/> Table view is fixed for this data source.
                                         </p>
                                      )}
                                   </div>
                                </div>
                             ))}
                          </div>
                       )}
                    </div>
                 </div>
               </div>

               <div className="p-6 border-t border-gray-100 bg-white rounded-b-xl flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                     {builderWidgets.length} widgets added
                  </div>
                  <div className="flex gap-3 w-1/3">
                     <Button type="button" variant="outline" className="flex-1" onClick={() => setIsTemplateModalOpen(false)}>Cancel</Button>
                     <Button 
                        type="submit" 
                        form="templateForm" 
                        variant="primary" 
                        className="flex-1"
                        disabled={builderWidgets.length === 0}
                     >
                        Save Template
                     </Button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Apply Template / Generate Report Modal */}
      {applyingTemplate && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
               <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="text-xl font-bold text-gray-900">Generate Report</h3>
                    <p className="text-sm text-gray-500">Using template: <span className="font-semibold text-gray-700">{applyingTemplate.name}</span></p>
                 </div>
                 <button onClick={() => setApplyingTemplate(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
               </div>
               
               <form id="applyTemplateForm" onSubmit={handleReportFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Client</label>
                    <select 
                      name="clientName"
                      required 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500 bg-white"
                    >
                       <option value="">-- Choose a Client --</option>
                       {clients.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                       ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Report Name</label>
                    <input 
                      name="reportName"
                      required 
                      defaultValue={`${applyingTemplate.name} - ${new Date().toLocaleString('default', { month: 'short' })}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Report Date</label>
                    <input 
                      name="date"
                      type="date"
                      required 
                      defaultValue={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-500 focus:border-brand-500" 
                    />
                  </div>
               </form>

               <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setApplyingTemplate(null)}>Cancel</Button>
                  <Button type="submit" form="applyTemplateForm" variant="primary" className="flex-1">Create Report</Button>
               </div>
            </div>
         </div>
      )}

      {/* Confirmation Modal */}
      {isReportConfirmationOpen && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
                 <div className="flex flex-col items-center text-center mb-6">
                     <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4">
                         <AlertTriangle size={24} />
                     </div>
                     <h3 className="text-xl font-bold text-gray-900">Confirm Report Generation</h3>
                     <p className="text-sm text-gray-500 mt-2">
                         Are you sure you want to generate this report? It will be saved as a Draft.
                     </p>
                 </div>
                 <div className="flex gap-3">
                     <Button variant="outline" className="flex-1" onClick={() => setIsReportConfirmationOpen(false)}>Cancel</Button>
                     <Button variant="primary" className="flex-1" onClick={confirmGenerateReport}>Confirm</Button>
                 </div>
             </div>
         </div>
      )}

    </div>
  );
};

export default Dashboard;
