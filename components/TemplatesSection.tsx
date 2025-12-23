import React from 'react';
import { ArrowRight, BarChart3, ShoppingCart, Globe, Share2 } from 'lucide-react';
import { Button } from './Button';

const templates = [
  {
    title: "Google Analytics 4",
    desc: "Track sessions, users, and traffic sources with insights by country, device, age.",
    icon: <BarChart3 className="w-5 h-5 text-orange-500" />,
    color: "bg-orange-50"
  },
  {
    title: "E-commerce",
    desc: "Analyze e-commerce sales, conversions, and traffic insights with interactive metrics.",
    icon: <ShoppingCart className="w-5 h-5 text-green-500" />,
    color: "bg-green-50"
  },
  {
    title: "Website Performance",
    desc: "Monitor website traffic, user demographics, and page performance insights.",
    icon: <Globe className="w-5 h-5 text-blue-500" />,
    color: "bg-blue-50"
  },
  {
    title: "Social Media Ads",
    desc: "Track impressions, clicks, CTR, and ad spend across Facebook, Instagram, LinkedIn.",
    icon: <Share2 className="w-5 h-5 text-pink-500" />,
    color: "bg-pink-50"
  }
];

const TemplatesSection: React.FC = () => {
  return (
    <section id="templates" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Start with a Template</h2>
            <p className="text-lg text-gray-600">Save time with agency-ready templates—deliver powerful, results-focused reports in minutes.</p>
          </div>
          <Button variant="outline" className="whitespace-nowrap">
            Explore More Templates
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((t, idx) => (
            <div key={idx} className="group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
              {/* Preview Image Placeholder */}
              <div className="h-40 bg-gray-100 w-full relative overflow-hidden">
                <img 
                    src={`https://picsum.photos/seed/${t.title.replace(/\s/g,'')}/400/250`} 
                    alt={t.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="bg-white text-xs font-bold px-3 py-1.5 rounded-full shadow">Preview</span>
                </div>
              </div>
              
              <div className="p-5 flex flex-col flex-grow">
                <div className={`w-10 h-10 rounded-lg ${t.color} flex items-center justify-center mb-4`}>
                   {t.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t.title}</h3>
                <p className="text-sm text-gray-600 mb-4 flex-grow">{t.desc}</p>
                <a href="#" className="inline-flex items-center text-sm font-semibold text-brand-600 group-hover:text-brand-700">
                  Use Template <ArrowRight className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TemplatesSection;