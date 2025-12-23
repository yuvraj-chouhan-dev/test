import React from 'react';
import { Button } from './Button';

interface HeroProps {
  onNavigateToSignup: () => void;
}

const Hero: React.FC<HeroProps> = ({ onNavigateToSignup }) => {
  return (
    <section className="relative pt-20 pb-16 lg:pt-28 lg:pb-24 overflow-hidden bg-gradient-to-b from-white via-brand-50/30 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Text Content */}
          <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-[1.15] mb-6">
              Simple Marketing Reporting <br className="hidden lg:block" />
              <span className="text-brand-800">Software for Agencies</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-8">
              Automate branded marketing reports from 50+ platforms.<br />
              Save time and impress your clients.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12">
              <Button variant="accent" size="lg" onClick={onNavigateToSignup} className="w-full sm:w-auto font-bold shadow-lg shadow-accent-200 text-brand-950">
                TRY IT FREE
              </Button>
            </div>
          </div>

          {/* Video/Visual Section */}
          <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
            <div className="relative rounded-2xl shadow-2xl bg-white border border-gray-200 overflow-hidden aspect-video">
              {/* Video Placeholder - In production, replace with actual video embed */}
              <div className="w-full h-full bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <svg className="w-10 h-10 text-brand-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">Product Demo Video</p>
                </div>
              </div>
              
              {/* Optional: Add actual video embed here */}
              {/* <iframe 
                className="w-full h-full"
                src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                title="Product Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe> */}
            </div>
          </div>

        </div>

        {/* Trusted By Section */}
        <div className="mt-16 pt-12 border-t border-gray-200">
          <p className="text-center text-sm uppercase tracking-wider text-gray-500 font-semibold mb-8">
            Trusted by 3,000+ Marketing Agencies to Simplify Reporting
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all">
            {/* Logo Placeholders - Replace with actual client logos */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 w-24 bg-gray-300 rounded flex items-center justify-center">
                <span className="text-xs text-gray-500 font-medium">Client {i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
