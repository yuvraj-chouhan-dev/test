
import { ReactNode } from 'react';

export interface Testimonial {
  id: string;
  name: string;
  initial: string;
  quote: string;
  role?: string;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  tag: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface FeatureProps {
  id?: string;
  title: string;
  description: string;
  linkText: string;
  imageSide: 'left' | 'right';
  icon: ReactNode;
  children?: ReactNode;
}

export interface ReportWidgetConfig {
  id: string;
  widgetId: string; // 'text_block' or data source id like 'seo_overview'
  type: 'chart' | 'table' | 'metric' | 'text';
  title: string;
  chartType?: 'bar' | 'line' | 'area';
  content?: string; // For text/commentary
}

// Dashboard Types
export interface Client {
  id: string;
  name: string;
  website: string;
  status: 'Active' | 'Pending' | 'Inactive';
  nextReport: string;
  logo?: string;
}

export interface Report {
  id: string;
  clientName: string;
  name: string;
  date: string;
  status: 'Sent' | 'Draft' | 'Scheduled';
  platform: 'Google Ads' | 'Facebook' | 'SEO' | 'Mixed' | 'Google My Business';
  widgets?: ReportWidgetConfig[];
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'SEO' | 'Social' | 'PPC' | 'General' | 'Mixed' | 'Google My Business';
  isCustom: boolean;
  widgets: ReportWidgetConfig[];
  lastModified?: string;
}

export interface GmbStat {
  name: string;
  views: number;
  interactions: number;
  calls: number;
}

export interface Integration {
  id: string;
  name: string;
  provider: 'google' | 'meta' | 'linkedin' | 'x' | 'tiktok' | 'generic';
  status: 'Connected' | 'Disconnected';
  lastSync?: string;
  description: string;
}

export interface PlatformMetric {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface PlatformData {
  id: string;
  metrics: PlatformMetric[];
  chartData?: any[];
}
export interface Invoice {
    id: string;
    clientName: string;
    amount: number;
    date: string;
    dueDate: string;
    status: 'Paid' | 'Pending' | 'Overdue';
    items: { description: string; amount: number }[];
}