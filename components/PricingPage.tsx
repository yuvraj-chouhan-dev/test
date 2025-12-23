import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from './Button';

interface PricingPageProps {
  onNavigateToSignup: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onNavigateToSignup }) => {
  const plans = [
    {
      name: 'Starter',
      price: 'KES 2,500',
      period: '/mo',
      description: 'Perfect for freelancers managing a few clients.',
      features: ['5 Clients', 'Google Ads & Facebook Ads', 'Standard Templates', 'PDF Export', 'Email Support'],
      cta: 'Start Free Trial',
      variant: 'outline' as const
    },
    {
      name: 'Agency',
      price: 'KES 7,500',
      period: '/mo',
      description: 'For growing agencies needing more power.',
      features: ['20 Clients', 'All 50+ Integrations', 'White-label Reports', 'Custom Domain', 'Client Portal', 'Priority Support'],
      cta: 'Start Free Trial',
      variant: 'primary' as const,
      featured: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large teams requiring tailored solutions.',
      features: ['Unlimited Clients', 'API Access', 'Dedicated Account Manager', 'SSO & Advanced Security', 'Custom Onboarding', '24/7 Support'],
      cta: 'Contact Sales',
      variant: 'outline' as const
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-b from-brand-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Choose the plan that fits your agency's stage of growth. No hidden fees. Start with a 15-day free trial.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, idx) => (
              <div 
                key={idx} 
                className={`rounded-2xl p-8 flex flex-col transition-all ${
                  plan.featured 
                    ? 'border-2 border-brand-500 shadow-xl relative bg-white scale-105' 
                    : 'border border-gray-200 shadow-sm bg-gray-50 hover:shadow-md'
                }`}
              >
                {plan.featured && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-brand-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                    Most Popular
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    <span className="ml-2 text-gray-500 text-lg">{plan.period}</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start">
                      <Check className={`w-5 h-5 ${plan.featured ? 'text-brand-600' : 'text-green-500'} mr-3 flex-shrink-0 mt-0.5`} />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.variant} 
                  className="w-full justify-center"
                  onClick={onNavigateToSignup}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto mt-20">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I change plans later?</h3>
                <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">What happens after my free trial?</h3>
                <p className="text-gray-600">After your 15-day free trial, you'll be automatically moved to the plan you selected. No charges until the trial ends.</p>
              </div>
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Do you offer refunds?</h3>
                <p className="text-gray-600">We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.</p>
              </div>
              <div className="pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-600">We accept all major credit cards, M-Pesa, and bank transfers for Enterprise plans.</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-20 pt-16 border-t border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Start your free 15-day trial today. No credit card required.
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

export default PricingPage;

