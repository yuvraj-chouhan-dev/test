
import React from 'react';
import { Check } from 'lucide-react';
import { Button } from './Button';

interface PricingProps {
  onNavigateToSignup: () => void;
}

const Pricing: React.FC<PricingProps> = ({ onNavigateToSignup }) => {
  const plans = [
    {
      name: 'Starter',
      price: 'KES 2,500',
      period: '/mo',
      description: 'Perfect for freelancers managing a few clients.',
      features: ['5 Clients', 'Google Ads & Facebook Ads', 'Standard Templates', 'PDF Export'],
      cta: 'Start Free Trial',
      variant: 'outline' as const
    },
    {
      name: 'Agency',
      price: 'KES 7,500',
      period: '/mo',
      description: 'For growing agencies needing more power.',
      features: ['20 Clients', 'All 50+ Integrations', 'White-label Reports', 'Custom Domain', 'Client Portal'],
      cta: 'Start Free Trial',
      variant: 'primary' as const,
      featured: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large teams requiring tailored solutions.',
      features: ['Unlimited Clients', 'API Access', 'Dedicated Account Manager', 'SSO & Advanced Security', 'Custom Onboarding'],
      cta: 'Contact Sales',
      variant: 'outline' as const
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-gray-600">Choose the plan that fits your agency's stage of growth. No hidden fees.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <div 
              key={idx} 
              className={`rounded-2xl p-8 flex flex-col ${
                plan.featured 
                  ? 'border-2 border-brand-500 shadow-xl relative bg-white' 
                  : 'border border-gray-200 shadow-sm bg-gray-50'
              }`}
            >
              {plan.featured && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-brand-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  Most Popular
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="ml-1 text-gray-500">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant={plan.variant} 
                className="w-full justify-center"
                onClick={onNavigateToSignup}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
