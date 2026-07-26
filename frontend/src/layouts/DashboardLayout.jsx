import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Leads', path: '/leads' },
    { label: 'Activity', path: '/activity' },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-4 z-50 max-w-6xl mx-auto w-[94%] sm:w-full px-4 pt-2 pb-2">
        <div className="glass-pill rounded-full px-5 py-3 flex items-center justify-between shadow-glass">
          {/* Logo & Navigation Tabs */}
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center font-display font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
                L
              </div>
              <span className="font-display text-lg font-extrabold tracking-tight text-sage-900 hidden sm:inline">
                Lead <span className="text-forest-light">Platform</span>
              </span>
            </Link>

            {/* Pill Navigation Links */}
            <nav className="flex items-center gap-1 bg-sage-100/70 p-1 rounded-full border border-sage-200/60">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path === '/leads' && location.pathname.startsWith('/leads'));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                      isActive
                        ? 'bg-forest text-white shadow-sm'
                        : 'text-sage-700 hover:text-forest hover:bg-sage-200/50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Avatar & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-sage-900">{user?.name}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-forest-light">
                {user?.role}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-sage-200 text-forest-dark font-bold text-xs flex items-center justify-center border border-sage-300">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-sage-700 hover:text-red-700 hover:bg-red-50/80 border border-sage-200 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-sage-200/60 py-6 text-center text-xs font-medium text-sage-500">
        Built for{' '}
        <a
          href="https://digitalheroesco.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-forest hover:underline font-semibold"
        >
          Digital Heroes Training Task
        </a>
      </footer>
    </div>
  );
}
