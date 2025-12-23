
import React, { useState } from 'react';
import { 
  Search, BarChart2, Facebook, Activity, Youtube, Instagram, 
  Linkedin, MapPin, Monitor, Twitter, Video, Image 
} from 'lucide-react';
import { Button } from './Button';

interface IntegrationsSectionProps {
  onNavigateToSignup?: () => void;
}

const integrationsData = [
  { name: "Google Ads", category: "Ads", icon: <BarChart2 className="w-8 h-8 text-blue-600" />, color: "bg-blue-50" },
  { name: "Facebook Ads", category: "Ads", icon: <Facebook className="w-8 h-8 text-blue-700" />, color: "bg-blue-50" },
  { name: "Facebook", category: "Social", icon: <Facebook className="w-8 h-8 text-blue-700" />, color: "bg-blue-50" },
  { name: "Google Analytics 4", category: "Analytics", icon: <Activity className="w-8 h-8 text-orange-500" />, color: "bg-orange-50" },
  { name: "YouTube", category: "Social", icon: <Youtube className="w-8 h-8 text-red-600" />, color: "bg-red-50" },
  { name: "Instagram Ads", category: "Ads", icon: <Instagram className="w-8 h-8 text-pink-600" />, color: "bg-pink-50" },
  { name: "Instagram", category: "Social", icon: <Instagram className="w-8 h-8 text-pink-600" />, color: "bg-pink-50" },
  { name: "LinkedIn Ads", category: "Ads", icon: <Linkedin className="w-8 h-8 text-blue-800" />, color: "bg-blue-50" },
  { name: "LinkedIn", category: "Social", icon: <Linkedin className="w-8 h-8 text-blue-800" />, color: "bg-blue-50" },
  { name: "Google Local Service Ads", category: "Ads", icon: <MapPin className="w-8 h-8 text-green-600" />, color: "bg-green-50" },
  { name: "Microsoft Ads", category: "Ads", icon: <Monitor className="w-8 h-8 text-cyan-600" />, color: "bg-cyan-50" },
  { name: "X Ads (Twitter Ads)", category: "Ads", icon: <Twitter className="w-8 h-8 text-gray-900" />, color: "bg-gray-100" },
  { name: "X (Twitter)", category: "Social", icon: <Twitter className="w-8 h-8 text-gray-900" />, color: "bg-gray-100" },
  { name: "TikTok Ads", category: "Ads", icon: <Video className="w-8 h-8 text-pink-500" />, color: "bg-pink-50" },
  { name: "Pinterest Ads", category: "Ads", icon: <Image className="w-8 h-8 text-red-500" />, color: "bg-red-50" },
  { name: "Pinterest", category: "Social", icon: <Image className="w-8 h-8 text-red-500" />, color: "bg-red-50" },
  { name: "Google Search Console", category: "SEO", icon: <Search className="w-8 h-8 text-green-500" />, color: "bg-green-50" },
  { name: "Google Business Profile", category: "Social", icon: <MapPin className="w-8 h-8 text-blue-500" />, color: "bg-blue-50" },
];

const IntegrationsSection: React.FC<IntegrationsSectionProps> = ({ onNavigateToSignup }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);

  const filteredIntegrations = integrationsData.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section id="integrations" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Integrate 50+ Marketing Data Sources</h2>
          <p className="text-lg text-gray-600">Quickly Connect Client Data. Automate Reports. Deliver Insights That Matter</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-16 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="text"
                className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-base shadow-sm transition-all"
                placeholder="Search data sources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredIntegrations.slice(0, visibleCount).map((item, idx) => (
            <div 
                key={idx} 
                onClick={onNavigateToSignup}
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-brand-300 transition-all cursor-pointer group flex flex-col items-center text-center"
            >
                <div className={`w-16 h-16 rounded-full ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {item.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">{item.name}</h3>
                <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 uppercase tracking-wide">
                    {item.category}
                </span>
            </div>
          ))}
        </div>

        {/* Load More */}
        {visibleCount < filteredIntegrations.length && (
            <div className="mt-12 text-center">
                <Button 
                    variant="outline" 
                    size="lg" 
                    className="rounded-full px-8 bg-white"
                    onClick={() => setVisibleCount(prev => prev + 8)}
                >
                    Load More
                </Button>
            </div>
        )}

        {filteredIntegrations.length === 0 && (
            <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No data sources found matching "{searchTerm}"</p>
            </div>
        )}

      </div>
    </section>
  );
};

export default IntegrationsSection;
