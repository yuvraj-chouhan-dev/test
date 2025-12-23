import React, { useState } from 'react';
import { 
  Search, BarChart2, Facebook, Activity, Youtube, Instagram, 
  Linkedin, MapPin, Monitor, Twitter, Video, Image, ArrowRight, ShoppingCart
} from 'lucide-react';
import { Button } from './Button';

interface IntegrationsPageProps {
  onNavigateToSignup: () => void;
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
  { name: "Snapchat Ads", category: "Ads", icon: <Video className="w-8 h-8 text-yellow-500" />, color: "bg-yellow-50" },
  { name: "Reddit Ads", category: "Ads", icon: <Image className="w-8 h-8 text-orange-600" />, color: "bg-orange-50" },
  { name: "Amazon Ads", category: "Ads", icon: <ShoppingCart className="w-8 h-8 text-orange-500" />, color: "bg-orange-50" },
  { name: "Shopify", category: "E-commerce", icon: <ShoppingCart className="w-8 h-8 text-green-600" />, color: "bg-green-50" },
  { name: "WooCommerce", category: "E-commerce", icon: <ShoppingCart className="w-8 h-8 text-purple-600" />, color: "bg-purple-50" },
  { name: "Mailchimp", category: "Email", icon: <Activity className="w-8 h-8 text-yellow-600" />, color: "bg-yellow-50" },
  { name: "HubSpot", category: "CRM", icon: <BarChart2 className="w-8 h-8 text-orange-500" />, color: "bg-orange-50" },
];

const IntegrationsPage: React.FC<IntegrationsPageProps> = ({ onNavigateToSignup }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(integrationsData.map(item => item.category)))];

  const filteredIntegrations = integrationsData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-brand-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              50+ Integrations
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Bring all your client data together. Save time with seamless integrations across more than 50 marketing platforms.
            </p>
            <Button variant="accent" size="lg" onClick={onNavigateToSignup}>
              Start Free Trial
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Search and Filter */}
          <div className="mb-12">
            <div className="max-w-md mx-auto mb-8 relative">
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

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {filteredIntegrations.map((item, idx) => (
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

          {filteredIntegrations.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No data sources found matching "{searchTerm}"</p>
            </div>
          )}

          {/* CTA Section */}
          <div className="text-center mt-16 pt-16 border-t border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Connect Your Data Sources?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Start your free trial and connect all your marketing platforms in minutes.
            </p>
            <Button variant="accent" size="lg" onClick={onNavigateToSignup}>
              Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default IntegrationsPage;

