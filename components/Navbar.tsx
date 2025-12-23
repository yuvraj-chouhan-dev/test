import React, { useState } from 'react';
import { Menu, X, BarChart2 } from 'lucide-react';
import { Button } from './Button';

type Page = 'home' | 'integrations' | 'templates' | 'pricing' | 'login' | 'dashboard';

interface NavbarProps {
  onNavigateToLogin: () => void;
  onNavigateToSignup: () => void;
  onNavigateToPage: (page: Page, path?: string) => void;
  currentPage?: Page;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigateToLogin, onNavigateToSignup, onNavigateToPage, currentPage = 'home' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Platform", page: 'home' as Page, path: '/' },
    { name: "Integrations", page: 'integrations' as Page, path: '/data-sources' },
    { name: "Templates", page: 'templates' as Page, path: '/reporting-templates' },
    { name: "Pricing", page: 'pricing' as Page, path: '/pricing' },
  ];

  const handleNavClick = (page: Page, path: string) => {
    onNavigateToPage(page, path);
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div 
            className="flex-shrink-0 flex items-center cursor-pointer" 
            onClick={() => handleNavClick('home', '/')}
          >
            <div className="w-8 h-8 bg-brand-800 rounded-lg flex items-center justify-center mr-2 shadow-md">
              <BarChart2 className="w-5 h-5 text-accent-400" />
            </div>
            <span className="font-bold text-xl text-brand-900 tracking-tight">WebPro<span className="text-accent-500">Metrics</span></span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.path}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.page, link.path);
                }}
                className={`text-sm font-medium transition-colors ${
                  currentPage === link.page 
                    ? 'text-brand-600 font-semibold' 
                    : 'text-gray-600 hover:text-brand-600'
                }`}
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onNavigateToLogin}>SIGN IN</Button>
            <Button variant="accent" size="sm" onClick={onNavigateToSignup}>TRY IT FREE</Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full z-50">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.path}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.page, link.path);
                }}
                className={`block px-3 py-3 rounded-md text-base font-medium transition-colors ${
                  currentPage === link.page
                    ? 'text-brand-600 bg-brand-50 font-semibold'
                    : 'text-gray-700 hover:text-brand-600 hover:bg-gray-50'
                }`}
              >
                {link.name}
              </a>
            ))}
            <div className="mt-4 flex flex-col space-y-3 px-3">
              <Button variant="outline" className="w-full justify-center" onClick={() => { setIsOpen(false); onNavigateToLogin(); }}>SIGN IN</Button>
              <Button variant="accent" className="w-full justify-center" onClick={() => { setIsOpen(false); onNavigateToSignup(); }}>TRY IT FREE</Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
