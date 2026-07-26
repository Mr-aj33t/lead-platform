import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getLeads } from '../services/leadService.js';
import { useDebounce } from '../hooks/useDebounce.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { TableSkeleton } from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';

const statuses = ['', 'New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];

export default function Leads() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const debouncedSearch = useDebounce(search, 300);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (status) params.status = status;
      const res = await getLeads(params);
      setLeads(res.data.leads);
      setPagination(res.data.pagination);
    } catch {
      setError('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, page]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const updateParams = (updates) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    if (updates.search !== undefined || updates.status !== undefined) params.set('page', '1');
    setSearchParams(params);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-sage-900 tracking-tight">Leads</h1>
          <p className="text-xs font-medium text-sage-600 mt-1">Manage and track your active sales prospects</p>
        </div>
        <Link
          to="/leads/new"
          className="btn-forest px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm inline-flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <span className="text-base">+</span> New Lead
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card rounded-2xl p-4 border border-sage-200/80 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={(e) => updateParams({ search: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl input-cream text-xs font-medium text-sage-900 placeholder:text-sage-400"
          />
        </div>
        <select
          value={status}
          onChange={(e) => updateParams({ status: e.target.value })}
          className="px-4 py-2.5 rounded-xl input-cream text-xs font-semibold text-sage-800 border-sage-200"
        >
          <option value="">All Statuses</option>
          {statuses.slice(1).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table Section */}
      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchLeads} />
      ) : leads.length === 0 ? (
        <EmptyState
          title="No leads found"
          description={search || status ? 'Try adjusting your search or filter terms' : 'Create your first lead to get started'}
        />
      ) : (
        <>
          <div className="glass-card rounded-2xl border border-sage-200/80 overflow-hidden shadow-glass">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-sage-200/60">
                <thead className="bg-sage-100/50">
                  <tr>
                    {['Name', 'Email', 'Company', 'Status', 'Assigned To', 'Created'].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-sage-600 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage-200/40 bg-white/40">
                  {leads.map((lead) => (
                    <tr
                      key={lead._id}
                      className="hover:bg-sage-100/40 cursor-pointer transition-colors"
                      onClick={() => window.location.href = `/leads/${lead._id}`}
                    >
                      <td className="px-5 py-4 text-xs font-bold text-sage-900">{lead.name}</td>
                      <td className="px-5 py-4 text-xs font-medium text-sage-600">{lead.email}</td>
                      <td className="px-5 py-4 text-xs font-semibold text-sage-800">{lead.company || '-'}</td>
                      <td className="px-5 py-4"><StatusBadge status={lead.status} /></td>
                      <td className="px-5 py-4 text-xs font-medium text-sage-700">{lead.assignedTo?.name || 'Unassigned'}</td>
                      <td className="px-5 py-4 text-xs font-medium text-sage-500">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-2 pt-2">
            <p className="text-xs font-semibold text-sage-600">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total leads)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => updateParams({ page: String(page - 1) })}
                disabled={page <= 1}
                className="px-4 py-2 border border-sage-200 rounded-xl text-xs font-semibold text-sage-700 bg-white/80 hover:bg-sage-100 disabled:opacity-40 transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => updateParams({ page: String(page + 1) })}
                disabled={page >= pagination.pages}
                className="px-4 py-2 border border-sage-200 rounded-xl text-xs font-semibold text-sage-700 bg-white/80 hover:bg-sage-100 disabled:opacity-40 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
