import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { registerUser } from '../services/authService.js';
import LeadCharts from '../components/LeadCharts.jsx';

const STATUS_CARDS = [
  { key: 'New', label: 'New', badgeColor: 'bg-[#E3EFE6] text-[#244233] border-[#B8D7C0]' },
  { key: 'Contacted', label: 'Contacted', badgeColor: 'bg-[#F5F2E3] text-[#635520] border-[#E5DEC1]' },
  { key: 'Qualified', label: 'Qualified', badgeColor: 'bg-[#E6EEF5] text-[#1E4363] border-[#C3D6E8]' },
  { key: 'Proposal Sent', label: 'Proposal Sent', badgeColor: 'bg-[#ECE8F5] text-[#3D2963] border-[#D5CBE8]' },
  { key: 'Won', label: 'Won', badgeColor: 'bg-[#DFF0E5] text-[#1A4A2B] border-[#A8DBB8]' },
  { key: 'Lost', label: 'Lost', badgeColor: 'bg-[#F7E7E7] text-[#732424] border-[#E8C6C6]' },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [userSubmitting, setUserSubmitting] = useState(false);
  const { user } = useAuth();

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserSubmitting(true);
    try {
      await registerUser(userForm);
      toast.success(`User "${userForm.name}" created successfully!`);
      setShowUserModal(false);
      setUserForm({ name: '', email: '', password: '', role: 'member' });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to create user');
    } finally {
      setUserSubmitting(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await api.get('/leads/dashboard');
      const payload = data.data || {};
      setStats(payload.stats || payload);
      setActivity(payload.recentActivity || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-sage-200/60 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-28 bg-sage-200/50 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-sage-200/50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl text-center py-16 p-8 border border-sage-200">
        <p className="text-sage-600 font-medium mb-4">Failed to load dashboard metrics</p>
        <button onClick={fetchData} className="btn-forest px-6 py-2.5 rounded-xl text-xs font-bold">
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-sage-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs font-medium text-sage-600 mt-1">
            Overview of qualified sales leads and team performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowUserModal(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-sage-100/90 text-forest-dark border border-sage-300 hover:bg-sage-200/80 transition-all flex items-center gap-1.5"
            >
              <span className="text-base">👤+</span> Add Team Member
            </button>
          )}
          <Link
            to="/leads/new"
            className="btn-forest px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
          >
            <span className="text-base">+</span> New Lead
          </Link>
        </div>
      </div>

      {/* Add User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-sage-200 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-sage-200/60 pb-3">
              <h3 className="font-display text-xl font-bold text-sage-900">Add New Team Member</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="w-8 h-8 rounded-full bg-sage-100 text-sage-600 hover:bg-sage-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-sage-800 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="John Smith"
                  className="w-full px-3.5 py-2.5 rounded-xl input-cream text-xs font-medium text-sage-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-sage-800 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="john@crm.com"
                  className="w-full px-3.5 py-2.5 rounded-xl input-cream text-xs font-medium text-sage-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-sage-800 uppercase tracking-wider mb-1">
                  Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl input-cream text-xs font-medium text-sage-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-sage-800 uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl input-cream text-xs font-medium text-sage-900"
                >
                  <option value="member">Member (Sales Representative)</option>
                  <option value="admin">Admin (Full Control)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-sage-200/60">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-sage-700 hover:bg-sage-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userSubmitting}
                  className="btn-forest px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {userSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        {/* Total Card */}
        <div className="glass-card rounded-2xl p-5 border border-sage-300/80 bg-white/90 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sage-500">
            Total Leads
          </span>
          <div className="mt-3">
            <span className="font-display text-4xl font-extrabold text-sage-900">
              {stats?.total || 0}
            </span>
          </div>
        </div>

        {/* Status Cards */}
        {STATUS_CARDS.map((card) => {
          const count = stats?.[card.key] !== undefined ? stats[card.key] : stats?.[card.key.replace(/\s+/g, '')] || 0;
          return (
            <div
              key={card.key}
              className={`rounded-2xl p-5 border shadow-sm flex flex-col justify-between transition-transform hover:-translate-y-0.5 ${card.badgeColor}`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                {card.label}
              </span>
              <div className="mt-3">
                <span className="font-display text-3xl font-extrabold">
                  {count}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics & Lead Graphs (Bar Chart & Circle Ring) */}
      <LeadCharts stats={stats} />

      {/* Recent Activity Section */}
      <div className="glass-card rounded-2xl border border-sage-200/80 overflow-hidden shadow-glass">
        <div className="px-6 py-4 border-b border-sage-200/60 flex items-center justify-between bg-sage-50/50">
          <h2 className="font-display text-lg font-bold text-sage-900">Recent Activity</h2>
          <Link to="/activity" className="text-xs font-bold text-forest hover:underline">
            View All Activity →
          </Link>
        </div>

        {activity.length === 0 ? (
          <div className="px-6 py-12 text-center text-sage-500 text-sm">
            No recent activity recorded
          </div>
        ) : (
          <div className="divide-y divide-sage-200/50">
            {activity.slice(0, 8).map((item) => (
              <div key={item._id} className="px-6 py-4 flex items-center gap-4 hover:bg-sage-100/30 transition-colors">
                <span className="text-[11px] font-medium text-sage-500 w-24 shrink-0">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sage-100 text-forest-dark border border-sage-200 shrink-0">
                  {item.action}
                </span>
                <p className="text-xs font-semibold text-sage-800 truncate flex-1">
                  {item.description}
                </p>
                {item.actor && (
                  <span className="text-[11px] font-medium text-sage-500 ml-auto shrink-0 hidden sm:inline">
                    by {item.actor.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
