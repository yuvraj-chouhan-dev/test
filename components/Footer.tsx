import React from 'react';
import { BarChart2 } from 'lucide-react';

type Page = 'home' | 'integrations' | 'templates' | 'pricing';

interface FooterProps {
  onNavigateToPage?: (page: Page, path?: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigateToPage }) => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, page?: Page, path?: string) => {
    if (page && onNavigateToPage) {
      e.preventDefault();
      onNavigateToPage(page, path);
    }
  };

  const columns = [
    {
      title: "Platform",
      links: [
        { name: "Platform", page: 'home' as Page, path: '/' },
        { name: "Data Sources", page: 'integrations' as Page, path: '/data-sources' },
        { name: "Templates", page: 'templates' as Page, path: '/reporting-templates' },
        { name: "Dashboards", href: "#" },
        { name: "Reporting", href: "#" },
        { name: "Pricing", page: 'pricing' as Page, path: '/pricing' }
      ]
    },
    {
      title: "Solution For",
      links: [
        { name: "Marketing Agencies", href: "#" },
        { name: "Marketing Teams", href: "#" },
        { name: "Small Business", href: "#" }
      ]
    },
    {
      title: "Resources",
      links: [
        { name: "Interactive Demo", href: "#" },
        { name: "Help Center", href: "#" },
        { name: "Updates", href: "#" },
        { name: "Roadmap", href: "#" },
        { name: "Blog", href: "#" }
      ]
    },
    {
      title: "Company",
      links: [
        { name: "Contact", href: "#" },
        { name: "Reviews", href: "#" },
        { name: "Legal", href: "#" }
      ]
    }
  ];

  return (
    <footer className="bg-brand-950 text-white pt-16 pb-8 border-t border-brand-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center mb-4">
              <div className="w-6 h-6 bg-brand-800 rounded flex items-center justify-center mr-2">
                 <BarChart2 className="w-4 h-4 text-accent-400" />
              </div>
              <span className="font-bold text-xl">WebProMetrics</span>
            </div>
            <p className="text-brand-200 text-sm mb-6">
              Digital Marketing reporting software for marketing agencies.
            </p>
          </div>

          {/* Link Columns */}
          {columns.map((col, idx) => (
            <div key={idx} className="col-span-1">
              <h4 className="font-bold text-sm uppercase tracking-wider text-brand-400 mb-4">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <a 
                      href={link.href || link.path || '#'} 
                      onClick={(e) => handleLinkClick(e, link.page, link.path)}
                      className="text-brand-200 hover:text-white text-sm transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-brand-900 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-brand-400 text-sm">
            &copy; 2025 WebProMetrics, Inc. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
             {/* Social Icons */}
             <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-5 h-5 bg-brand-800 rounded-full hover:bg-accent-500 transition-colors cursor-pointer flex items-center justify-center">
               <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
             </a>
             <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-5 h-5 bg-brand-800 rounded-full hover:bg-accent-500 transition-colors cursor-pointer flex items-center justify-center">
               <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
             </a>
             <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-5 h-5 bg-brand-800 rounded-full hover:bg-accent-500 transition-colors cursor-pointer flex items-center justify-center">
               <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
             </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
