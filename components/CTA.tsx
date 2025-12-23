
import React from 'react';
import { Button } from './Button';

interface CTAProps {
  onNavigateToSignup: () => void;
}

const CTA: React.FC<CTAProps> = ({ onNavigateToSignup }) => {
  return (
    <section className="bg-brand-900 py-20">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Marketing Reporting Software Designed to Simplify
        </h2>
        <p className="text-brand-100 text-lg mb-10 max-w-2xl mx-auto">
          Stop juggling multiple tools. Deliver clear, automated reports your clients will love.
        </p>
        <Button variant="accent" size="lg" onClick={onNavigateToSignup} className="font-bold shadow-lg shadow-accent-500/20 text-brand-900">
          Start Your Free 7-Day Trial
        </Button>
        <p className="mt-4 text-brand-200 text-sm">No credit card required</p>
      </div>
    </section>
  );
};

export default CTA;
