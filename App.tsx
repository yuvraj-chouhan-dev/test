import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Testimonials from './components/Testimonials';
import TemplatesSection from './components/TemplatesSection';
import IntegrationsSection from './components/IntegrationsSection';
import Pricing from './components/Pricing';
import CTA from './components/CTA';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import IntegrationsPage from './components/IntegrationsPage';
import TemplatesPage from './components/TemplatesPage';
import PricingPage from './components/PricingPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

type Page = 'home' | 'integrations' | 'templates' | 'pricing' | 'login' | 'dashboard';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const { isAuthenticated, isLoading } = useAuth();

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/') setCurrentPage('home');
      else if (path === '/integrations' || path === '/data-sources') setCurrentPage('integrations');
      else if (path === '/templates' || path === '/reporting-templates') setCurrentPage('templates');
      else if (path === '/pricing') setCurrentPage('pricing');
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState(); // Initial load

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Effect to handle automatic navigation if user is already logged in
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      setCurrentPage('dashboard');
    }
  }, [isAuthenticated, isLoading]);

  const navigateToPage = (page: Page, path: string = '') => {
    setCurrentPage(page);
    window.history.pushState({}, '', path || (page === 'home' ? '/' : `/${page}`));
    window.scrollTo(0, 0);
  };

  const navigateToLogin = () => {
    setAuthMode('login');
    setCurrentPage('login');
    window.history.pushState({}, '', '/login');
    window.scrollTo(0, 0);
  };

  const navigateToSignup = () => {
    setAuthMode('signup');
    setCurrentPage('login');
    window.history.pushState({}, '', '/signup');
    window.scrollTo(0, 0);
  };

  const navigateToLanding = () => {
    setCurrentPage('home');
    window.history.pushState({}, '', '/');
    window.scrollTo(0, 0);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;
  }

  // Protected Route Logic
  if (isAuthenticated && currentPage !== 'login') {
    return <Dashboard />;
  }

  if (currentPage === 'login') {
    return <Login onBack={navigateToLanding} initialMode={authMode} />;
  }

  // Render pages based on current route
  const renderPage = () => {
    switch (currentPage) {
      case 'integrations':
        return <IntegrationsPage onNavigateToSignup={navigateToSignup} />;
      case 'templates':
        return <TemplatesPage onNavigateToSignup={navigateToSignup} />;
      case 'pricing':
        return <PricingPage onNavigateToSignup={navigateToSignup} />;
      case 'home':
      default:
        return (
          <>
            <Hero onNavigateToSignup={navigateToSignup} />
            <IntegrationsSection onNavigateToSignup={navigateToSignup} />
            <Features onNavigateToSignup={navigateToSignup} />
            <Testimonials />
            <TemplatesSection />
            <Pricing onNavigateToSignup={navigateToSignup} />
            <CTA onNavigateToSignup={navigateToSignup} />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <Navbar 
        onNavigateToLogin={navigateToLogin} 
        onNavigateToSignup={navigateToSignup}
        onNavigateToPage={navigateToPage}
        currentPage={currentPage}
      />
      <main>
        {renderPage()}
      </main>
      <Footer onNavigateToPage={navigateToPage} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
