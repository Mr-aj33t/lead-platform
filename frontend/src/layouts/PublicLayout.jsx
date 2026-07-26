import { Outlet, Link, useLocation } from 'react-router-dom';

export default function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Floating Header */}
      <header className="sticky top-4 z-50 max-w-6xl mx-auto w-[92%] sm:w-full px-4 pt-2 pb-2">
        <div className="glass-pill rounded-full px-5 py-3 flex items-center justify-between shadow-glass">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-full bg-forest text-white flex items-center justify-center font-display font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              L
            </div>
            <span className="font-display text-xl font-extrabold tracking-tight text-sage-900">
              Lead <span className="text-forest-light">Platform</span>
            </span>
          </Link>

          {/* Navigation Pills */}
          <nav className="flex items-center gap-2">
            <Link
              to="/login"
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
                location.pathname === '/login'
                  ? 'bg-forest text-white shadow-sm'
                  : 'text-sage-700 hover:text-forest hover:bg-sage-100/60'
              }`}
            >
              Login
            </Link>
            <Link
              to="/register-form"
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all ${
                location.pathname === '/register-form'
                  ? 'bg-forest text-white shadow-sm'
                  : 'bg-sage-100/80 text-forest-dark border border-sage-200 hover:bg-sage-200/80'
              }`}
            >
              Register Interest
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
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
