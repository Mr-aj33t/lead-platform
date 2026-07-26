import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];

export default function LeadList() {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0, limit: 10 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const fetchLeads = useCallback(async (page = 1) => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ page, limit: pagination.limit, sortBy, sortOrder });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/leads?${params}`);
      const res = data.data;
      setLeads(res.leads || []);
      setPagination((prev) => ({
        ...prev,
        page: res.page || res.pagination?.page || page,
        total: res.total || res.pagination?.total || 0,
        pages: res.totalPages || res.pagination?.pages || 1,
      }));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortBy, sortOrder, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => fetchLeads(1), 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        {isAdmin && (
          <Link
            to="/leads/new"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            + New Lead
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name, email, company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">Failed to load leads</p>
          <button onClick={() => fetchLeads(1)} className="text-primary-600 hover:underline text-sm">Retry</button>
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400">No leads found</p>
          {search && <p className="text-sm text-gray-400 mt-1">Try a different search term</p>}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th onClick={() => handleSort('name')} className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700">
                      Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Company</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Email</th>
                    <th onClick={() => handleSort('status')} className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700">
                      Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    {isAdmin && <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Assigned</th>}
                    <th onClick={() => handleSort('createdAt')} className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700 hidden sm:table-cell">
                      Created {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leads.map((lead) => (
                    <tr key={lead._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/leads/${lead._id}`} className="text-primary-600 hover:underline font-medium">
                          {lead.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{lead.company}</td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{lead.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          lead.status === 'Won' ? 'bg-green-100 text-green-800' :
                          lead.status === 'Lost' ? 'bg-red-100 text-red-800' :
                          lead.status === 'New' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                          {lead.assignedTo?.name || '—'}
                        </td>
                      )}
                      <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchLeads(pagination.page - 1)}
                  className="px-3 py-1.5 rounded border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchLeads(pagination.page + 1)}
                  className="px-3 py-1.5 rounded border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
