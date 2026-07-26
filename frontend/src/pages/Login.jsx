import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('admin@crm.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="glass-card rounded-3xl p-8 sm:p-10 border border-sage-200/80 shadow-glass space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-forest text-white flex items-center justify-center font-display font-extrabold text-2xl mx-auto mb-3 shadow-sm">
            L
          </div>
          <h2 className="font-display text-2xl font-black text-sage-900 tracking-tight">
            Welcome Back
          </h2>
          <p className="text-xs text-sage-600 font-medium">
            Sign in to access your Lead Platform CRM workspace
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-sage-800 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@crm.com"
              className="w-full px-4 py-3 rounded-xl input-cream text-sm font-medium text-sage-900 placeholder:text-sage-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-sage-800 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl input-cream text-sm font-medium text-sage-900 placeholder:text-sage-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-forest py-3.5 rounded-xl text-sm font-bold tracking-wide shadow-md transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Accounts Panel */}
        <div className="pt-4 border-t border-sage-200/60">
          <p className="text-[11px] font-bold text-sage-500 uppercase tracking-wider mb-2 text-center">
            Demo Credentials
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => { setEmail('admin@crm.com'); setPassword('password123'); }}
              className="p-2.5 rounded-xl bg-sage-100/70 hover:bg-sage-200/80 border border-sage-200 text-left transition-all"
            >
              <div className="font-bold text-forest-dark">Admin</div>
              <div className="text-[10px] text-sage-600 truncate">admin@crm.com</div>
            </button>
            <button
              type="button"
              onClick={() => { setEmail('alice@crm.com'); setPassword('password123'); }}
              className="p-2.5 rounded-xl bg-sage-100/70 hover:bg-sage-200/80 border border-sage-200 text-left transition-all"
            >
              <div className="font-bold text-forest-dark">Member</div>
              <div className="text-[10px] text-sage-600 truncate">alice@crm.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
