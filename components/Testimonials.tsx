import React from 'react';
import { Star } from 'lucide-react';
import { Testimonial } from '../types';

const reviews: Testimonial[] = [
  {
    id: '1',
    name: 'Alfredo J.',
    initial: 'A',
    quote: "Easy, useful and pretty dashboards for social media and more. Oviond offered a much nicer result to show our clients, and supports the main platforms such as Google Ads, Facebook, LinkedIn, etc.",
    role: "Marketing Manager"
  },
  {
    id: '2',
    name: 'Péter Dávid S.',
    initial: 'P',
    quote: "Oviond, the all-in-one marketing reporting and dashboard tool. It is very easy to use and set up. The minimalist style helps to see through the data with ease.",
    role: "Agency Owner"
  },
  {
    id: '3',
    name: 'Mohammad B.',
    initial: 'M',
    quote: "Recently I noticed that OVIOND are working hard to be the best of its kind in the market. Clean and beautiful Interface for the whole platform.",
    role: "Digital Specialist"
  },
  {
    id: '4',
    name: 'Christina M.',
    initial: 'C',
    quote: "Easy to set up, great for reporting. You can bring multiple integrations into the reporting so when you need to send a weekly or a monthly summary, you can include multiple pieces.",
    role: "Social Media Manager"
  },
  {
    id: '5',
    name: 'Alexandre P.',
    initial: 'A',
    quote: "I love this tool! The best collection of integrations for digital marketing dashboards and reporting that you simply love. Makes it easy to show your marketing progress.",
    role: "Growth Hacker"
  },
  {
    id: '6',
    name: 'Sarah L.',
    initial: 'S',
    quote: "Finally a reporting tool that my clients actually understand. The drag and drop builder is a lifesaver when customizing reports for different client needs.",
    role: "Director of Operations"
  }
];

const ReviewCard: React.FC<{ review: Testimonial }> = ({ review }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center mb-4">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
      ))}
    </div>
    <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-4">"{review.quote}"</p>
    <div className="flex items-center">
      <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-lg mr-3">
        {review.initial}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 text-sm">{review.name}</h4>
        <span className="text-xs text-gray-500">{review.role || 'Verified User'}</span>
      </div>
    </div>
  </div>
);

const Testimonials: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted by Agencies Worldwide</h2>
          <p className="text-lg text-gray-500">Reviews from Marketing Agencies on Capterra and G2</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;