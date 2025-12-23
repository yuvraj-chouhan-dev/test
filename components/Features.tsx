import React from 'react';
import { Layers, Layout, MousePointerClick, Bot, Palette, ArrowRight } from 'lucide-react';
import { FeatureProps } from '../types';

interface FeatureRowProps extends FeatureProps {
  onAction: () => void;
}

const FeatureRow: React.FC<FeatureRowProps> = ({ id, title, description, linkText, imageSide, icon, children, onAction }) => {
  return (
    <div id={id} className="py-16 lg:py-24 border-t border-gray-50 first:border-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col lg:flex-row items-center gap-12 ${imageSide === 'right' ? '' : 'lg:flex-row-reverse'}`}>
          
          {/* Content Side */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 text-brand-600 mb-6 ring-1 ring-brand-100">
              {icon}
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">{description}</p>
            <button 
              onClick={onAction} 
              className="inline-flex items-center text-brand-700 font-semibold hover:text-brand-800 transition-colors group"
            >
              {linkText} <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Image/Visual Side */}
          <div className="flex-1 w-full">
             <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-100 bg-white min-h-[300px] flex items-center justify-center bg-slate-50 group hover:shadow-2xl transition-shadow duration-300">
               {children ? children : (
                 <img 
                   src={`https://picsum.photos/seed/${title.replace(/\s/g,'')}/600/400`} 
                   alt={title} 
                   className="w-full h-full object-cover"
                 />
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface FeaturesProps {
  onNavigateToSignup: () => void;
}

const Features: React.FC<FeaturesProps> = ({ onNavigateToSignup }) => {
  return (
    <section id="features" className="bg-white">
      <div className="text-center max-w-3xl mx-auto px-4 pt-16 mb-8">
         <h2 className="text-3xl font-bold text-gray-900 mb-4">Slash Reporting Hours. <br/>Maximize Client Success.</h2>
         <p className="text-gray-500">Everything a modern agency needs to scale operations.</p>
      </div>

      <FeatureRow 
        id="integrations"
        title="50+ Integrations"
        description="Bring all your client data together. Save time with seamless integrations across more than 50 marketing platforms including Google Ads, Facebook, Instagram, LinkedIn, and more."
        linkText="See Integrations"
        imageSide="right"
        icon={<Layers className="w-6 h-6" />}
        onAction={onNavigateToSignup}
      >
         {/* Custom visual for integrations - Grid of Icons */}
         <div className="grid grid-cols-4 gap-4 p-8 w-full h-full content-center bg-gray-50">
           {[...Array(12)].map((_, i) => (
             <div key={i} className="aspect-square bg-white rounded-lg shadow-sm flex items-center justify-center border border-gray-200 hover:border-brand-300 transition-colors">
               <div className={`w-8 h-8 rounded-full opacity-80 ${['bg-blue-600', 'bg-red-500', 'bg-yellow-500', 'bg-indigo-600'][i % 4]}`}></div>
             </div>
           ))}
         </div>
      </FeatureRow>

      <FeatureRow 
        title="Ready-Made Templates"
        description="Get started quickly with templates designed for your clients’ needs. Build impressive reports in minutes, not hours. From SEO to Social Media, we have you covered."
        linkText="Explore Templates"
        imageSide="left"
        icon={<Layout className="w-6 h-6" />}
        onAction={onNavigateToSignup}
      >
         <img src="https://picsum.photos/seed/marketing/800/600" alt="Templates UI" className="w-full h-auto opacity-90" />
      </FeatureRow>

      <FeatureRow 
        title="Drag & Drop Builder"
        description="Easily customize reports to match your agency’s style and your clients’ goals with our intuitive drag-and-drop builder. Rearrange widgets, add commentary, and resize elements effortlessly."
        linkText="Customize Now"
        imageSide="right"
        icon={<MousePointerClick className="w-6 h-6" />}
        onAction={onNavigateToSignup}
      >
          <img src="https://picsum.photos/seed/builder/800/600" alt="Drag and Drop UI" className="w-full h-auto opacity-90" />
      </FeatureRow>

      <FeatureRow 
        title="AI-Driven Reporting"
        description="Uncover valuable insights, automate report writing, and deliver faster results with our AI assistant. Let AI analyze the trends while you focus on strategy."
        linkText="Try WebPro AI"
        imageSide="left"
        icon={<Bot className="w-6 h-6" />}
        onAction={onNavigateToSignup}
      >
          <div className="p-8 flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-brand-50 to-accent-50">
              <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full border border-gray-100">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-accent-100 text-accent-600 rounded-full flex items-center justify-center"><Bot size={18}/></div>
                    <span className="font-semibold text-gray-700">AI Insight</span>
                 </div>
                 <div className="space-y-2">
                    <div className="h-2 bg-gray-100 rounded w-full"></div>
                    <div className="h-2 bg-gray-100 rounded w-5/6"></div>
                    <div className="h-2 bg-gray-100 rounded w-4/6"></div>
                 </div>
                 <div className="mt-4 text-sm text-gray-600 italic">
                   "CTR has increased by 15% this month due to the new video campaign..."
                 </div>
              </div>
          </div>
      </FeatureRow>

      <FeatureRow 
        title="Brand It Your Way"
        description="Deliver fully branded reports from your own domain, creating a personalized, on-brand client experience. Upload your logo, choose your color palette, and use your own URL."
        linkText="Start White-Labeling"
        imageSide="right"
        icon={<Palette className="w-6 h-6" />}
        onAction={onNavigateToSignup}
      >
         <img src="https://picsum.photos/seed/branding/800/600" alt="Branding UI" className="w-full h-auto opacity-90" />
      </FeatureRow>

    </section>
  );
};

export default Features;