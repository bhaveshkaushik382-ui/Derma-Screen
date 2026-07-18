import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

export default function Layout({ children }) {
  const { user, logout } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const isPublicPage = location.pathname === '/' || location.pathname === '/auth';

  if (isPublicPage) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'New Scan', path: '/new-scan', icon: 'add_a_photo' },
    { name: 'Scan History', path: '/history', icon: 'history' },
    { name: 'AI Assistant', path: '/assistant', icon: 'smart_toy' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-margin-desktop h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary font-bold text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
            <span className="font-headline-md text-headline-md font-bold text-primary">DermaScreen</span>
          </Link>

        </div>
        
        <div className="flex items-center gap-4">
          <button className="p-2 text-on-surface-variant hover:bg-surface-container-low transition-colors rounded-full relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
          </button>
          <Link to="/assistant" className="p-2 text-on-surface-variant hover:bg-surface-container-low transition-colors rounded-full">
            <span className="material-symbols-outlined">help</span>
          </Link>
          <div className="h-8 w-[1px] bg-outline-variant mx-2"></div>
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="text-right hidden sm:block">
              <p className="font-label-md text-on-surface text-sm font-semibold">{user.name || 'Dr. Sarah Mitchell'}</p>
              <p className="text-xs text-on-surface-variant">Dermatologist</p>
            </div>
            <img 
              className="w-10 h-10 rounded-full object-cover border-2 border-primary-fixed" 
              src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"}
              alt="Profile"
            />
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-primary p-2 focus:outline-none"
          >
            <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 p-4 z-40 bg-surface border-r border-outline-variant pt-20">
        <div className="flex flex-col gap-1 flex-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path || (link.path === '/new-scan' && (location.pathname === '/quality' || location.pathname === '/result'));
            return (
              <Link 
                key={link.path}
                to={link.path} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-secondary-container text-on-secondary-container font-semibold translate-x-1' 
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined">{link.icon}</span>
                <span className="font-label-md">{link.name}</span>
              </Link>
            );
          })}
        </div>
        <div className="mt-auto pt-4 border-t border-outline-variant space-y-1">
          <button 
            onClick={toggleTheme}
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all rounded-xl w-full text-left cursor-pointer"
          >
            <span className="material-symbols-outlined">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
            <span className="font-label-md">
              {theme === 'light' ? 'Dark Theme' : 'Light Theme'}
            </span>
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-error hover:bg-error-container/20 transition-all rounded-xl w-full text-left cursor-pointer"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (Overlay and Menu) */}
      {mobileMenuOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 z-30 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="lg:hidden flex flex-col fixed left-0 top-0 h-full w-64 p-4 z-40 bg-surface border-r border-outline-variant pt-20 transition-transform duration-300">
            <div className="flex flex-col gap-1 flex-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path || (link.path === '/new-scan' && (location.pathname === '/quality' || location.pathname === '/result'));
                return (
                  <Link 
                    key={link.path}
                    to={link.path} 
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-secondary-container text-on-secondary-container font-semibold' 
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined">{link.icon}</span>
                    <span className="font-label-md">{link.name}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-auto pt-4 border-t border-outline-variant space-y-1">
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  toggleTheme();
                }}
                className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all rounded-xl w-full text-left cursor-pointer"
              >
                <span className="material-symbols-outlined">
                  {theme === 'light' ? 'dark_mode' : 'light_mode'}
                </span>
                <span className="font-label-md">
                  {theme === 'light' ? 'Dark Theme' : 'Light Theme'}
                </span>
              </button>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 px-4 py-3 text-error hover:bg-error-container/20 transition-all rounded-xl w-full text-left cursor-pointer"
              >
                <span className="material-symbols-outlined">logout</span>
                <span className="font-label-md">Logout</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <main className="lg:ml-64 pt-24 pb-20 px-4 md:px-margin-desktop min-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
