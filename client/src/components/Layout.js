import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';

const navItems = [
  { path: '/', key: 'dashboard', icon: '📊' },
  { path: '/products', key: 'products', icon: '📦' },
  { path: '/warehouses', key: 'warehouses', icon: '🏭' },
  { path: '/transactions', key: 'transactions', icon: '💰' },
  { path: '/billing', key: 'billing', icon: '🧾' },
  { path: '/purchase', key: 'purchase', icon: '🛒' },
  { path: '/customers', key: 'customers', icon: '👤' },
  { path: '/suppliers', key: 'suppliers', icon: '🏢' },
  { path: '/reports', key: 'reports', icon: '📈' },
  { path: '/integration', key: 'integration', icon: '🔗' },
];

const adminItems = [
  { path: '/audit', key: 'auditLogs', icon: '📋' },
  { path: '/users', key: 'users', icon: '👥' },
  { path: '/settings', key: 'settings', icon: '⚙️' },
];

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`sidebar fixed top-0 h-full bg-white shadow-lg z-30 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-primary-700">{t('appName')}</h1>
        </div>
        <nav className="mt-2 px-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 65px)' }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-2.5 mb-0.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="mx-3">{t(item.key)}</span>
            </Link>
          ))}
          {isAdmin && (
            <>
              <hr className="my-2 border-gray-200" />
              <p className="px-4 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{t('admin')}</p>
              {adminItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2.5 mb-0.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="mx-3">{t(item.key)}</span>
                </Link>
              ))}
            </>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <span className="text-sm text-gray-500">{t('welcome')}, {user?.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleLang}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                {lang === 'en' ? 'عربي' : 'English'}
              </button>
              <span className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-700 font-medium">
                {user?.role === 'admin' ? t('admin') : t('staff')}
              </span>
              <button onClick={handleLogout} className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                {t('logout')}
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
