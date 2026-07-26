import { useState, useEffect } from 'react';
import api from '../services/api.js';

export default function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchActivities = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await api.get('/activity');
      setActivities(data.data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchActivities(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-black text-sage-900 tracking-tight">
          Activity Log
        </h1>
        <p className="text-xs font-medium text-sage-600 mt-1">
          Complete audit trail of system events, lead creations, and status changes
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-sage-200/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="glass-card rounded-2xl text-center py-16 p-8 border border-sage-200">
          <p className="text-sage-600 font-medium mb-4">Failed to load activity logs</p>
          <button onClick={fetchActivities} className="btn-forest px-6 py-2.5 rounded-xl text-xs font-bold">
            Retry Loading
          </button>
        </div>
      ) : activities.length === 0 ? (
        <div className="glass-card rounded-2xl text-center py-16 text-sage-500 text-sm">
          No activity recorded yet
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-sage-200/80 divide-y divide-sage-200/50 overflow-hidden shadow-glass">
          {activities.map((item) => (
            <div key={item._id} className="px-6 py-4 flex items-start gap-4 hover:bg-sage-100/30 transition-colors">
              <div
                className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                  item.action === 'Lead Created'
                    ? 'bg-forest-light'
                    : item.action === 'Lead Deleted'
                    ? 'bg-red-500'
                    : item.action === 'Status Changed'
                    ? 'bg-blue-500'
                    : item.action === 'Note Added'
                    ? 'bg-purple-500'
                    : 'bg-sage-400'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-forest-dark bg-sage-100 px-2.5 py-0.5 rounded-full border border-sage-200">
                    {item.action}
                  </span>
                  <span className="text-[11px] font-medium text-sage-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs font-semibold text-sage-800 mt-1.5 leading-relaxed">
                  {item.description}
                </p>
                <p className="text-[11px] font-medium text-sage-500 mt-1">
                  by {item.actor?.name || 'System User'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
