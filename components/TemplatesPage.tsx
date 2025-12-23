import React from 'react';
import { ArrowRight, BarChart3, ShoppingCart, Globe, Share2, TrendingUp, Users, Zap } from 'lucide-react';
import { Button } from './Button';

interface TemplatesPageProps {
  onNavigateToSignup: () => void;
}

const templates = [
  {
    title: "Digital Marketing Dashboard",
    desc: "Track conversions and revenue while analyzing traffic and customer engagement metrics.",
    icon: <BarChart3 className="w-5 h-5 text-orange-500" />,
    color: "bg-orange-50",
    image: "https://picsum.photos/seed/digital-marketing/600/400"
  },
  {
    title: "E-commerce",
    desc: "Analyze e-commerce sales, conversions, and traffic insights with interactive, real-time performance metrics.",
    icon: <ShoppingCart className="w-5 h-5 text-green-500" />,
    color: "bg-green-50",
    image: "https://picsum.photos/seed/ecommerce/600/400"
  },
  {
    title: "Google Analytics 4",
    desc: "Track sessions, users, and traffic sources with insights by country, device, age, gender, and channel performance analysis.",
    icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
    color: "bg-blue-50",
    image: "https://picsum.photos/seed/ga4/600/400"
  },
  {
    title: "Website Performance",
    desc: "Monitor website traffic, user demographics, and page performance with insights from Google Analytics 4, Search Console, and Page Speed Insights.",
    icon: <Globe className="w-5 h-5 text-indigo-500" />,
    color: "bg-indigo-50",
    image: "https://picsum.photos/seed/website/600/400"
  },
  {
    title: "PPC Dashboard",
    desc: "Track and compare reach, clicks, impressions, and CTR across Google, Facebook, Instagram, LinkedIn, and Twitter Ads over time.",
    icon: <Zap className="w-5 h-5 text-yellow-500" />,
    color: "bg-yellow-50",
    image: "https://picsum.photos/seed/ppc/600/400"
  },
  {
    title: "Social Media Ads",
    desc: "Track impressions, clicks, CTR, and ad spend across Facebook, Instagram, LinkedIn, TikTok, and Twitter Ads with insights on engagement & conversions.",
    icon: <Share2 className="w-5 h-5 text-pink-500" />,
    color: "bg-pink-50",
    image: "https://picsum.photos/seed/social/600/400"
  },
  {
    title: "SEO Performance",
    desc: "Monitor keyword rankings, organic traffic, backlinks, and search visibility across multiple search engines.",
    icon: <TrendingUp className="w-5 h-5 text-purple-500" />,
    color: "bg-purple-50",
    image: "https://picsum.photos/seed/seo/600/400"
  },
  {
    title: "Content Marketing",
    desc: "Track content performance, engagement rates, and audience growth across all your content channels.",
    icon: <Users className="w-5 h-5 text-cyan-500" />,
    color: "bg-cyan-50",
    image: "https://picsum.photos/seed/content/600/400"
  }
];

const TemplatesPage: React.FC<TemplatesPageProps> = ({ onNavigateToSignup }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-brand-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Start with a Template
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Save time with agency-ready templates—deliver powerful, results-focused reports in minutes.
            </p>
            <Button variant="accent" size="lg" onClick={onNavigateToSignup}>
              Start Free Trial
            </Button>
          </div>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {templates.map((t, idx) => (
              <div 
                key={idx} 
                onClick={onNavigateToSignup}
                className="group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
              >
                {/* Preview Image */}
                <div className="h-48 bg-gray-100 w-full relative overflow-hidden">
                  <img 
                    src={t.image}
                    alt={t.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="bg-white text-xs font-bold px-3 py-1.5 rounded-full shadow">Preview</span>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <div className={`w-10 h-10 rounded-lg ${t.color} flex items-center justify-center mb-4`}>
                    {t.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{t.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 flex-grow">{t.desc}</p>
                  <button className="inline-flex items-center text-sm font-semibold text-brand-600 group-hover:text-brand-700">
                    Use Template <ArrowRight className="w-3 h-3 ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16 pt-16 border-t border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Need a Custom Template?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Our drag-and-drop builder lets you create custom templates tailored to your clients' needs.
            </p>
            <Button variant="accent" size="lg" onClick={onNavigateToSignup}>
              Start Building <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TemplatesPage;

