import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [lead, setLead] = useState(null);
  const [notes, setNotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      if (isAdmin) {
        const { data: u } = await api.get('/users');
        setUsers(u.data || []);
      }
      const { data } = await api.get(`/leads/${id}`);
      const payload = data.data || {};
      if (payload.lead) {
        setLead(payload.lead);
        setNotes(payload.notes || []);
      } else {
        setLead(payload);
        const { data: n } = await api.get(`/notes/lead/${id}`);
        setNotes(n.data || []);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleStatusChange = async (status) => {
    try {
      const { data } = await api.put(`/leads/${id}`, { status });
      setLead((prev) => ({ ...prev, ...data.data }));
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update status');
    }
  };

  const handleAssign = async (assignedTo) => {
    try {
      const { data } = await api.put(`/leads/${id}`, { assignedTo: assignedTo || null });
      setLead((prev) => ({ ...prev, ...data.data }));
      toast.success(assignedTo ? 'Lead assigned' : 'Lead unassigned');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to assign');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSubmittingNote(true);
    try {
      const { data } = await api.post('/notes', { lead: id, content: newNote });
      const created = data.data;
      setNotes((prev) => [created, ...prev]);
      setNewNote('');
      toast.success('Note added');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to add note');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this lead permanently?')) return;
    try {
      await api.delete(`/leads/${id}`);
      toast.success('Lead deleted');
      navigate('/leads');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete lead');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-sage-200/60 rounded animate-pulse" />
        <div className="h-40 bg-sage-200/50 rounded-2xl animate-pulse" />
        <div className="h-48 bg-sage-200/50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="glass-card rounded-2xl text-center py-16 p-8 border border-sage-200">
        <p className="text-sage-600 font-medium mb-4">Lead not found or access restricted</p>
        <Link to="/leads" className="btn-forest px-6 py-2.5 rounded-xl text-xs font-bold inline-block">
          ← Back to Leads
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <Link to="/leads" className="text-xs font-bold text-forest hover:underline mb-2 inline-block">
          ← Back to Leads
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-black text-sage-900 tracking-tight">
                {lead.name}
              </h1>
              <StatusBadge status={lead.status} />
            </div>
            <p className="text-xs font-semibold text-sage-600 mt-1">
              {lead.company ? `${lead.company} • ` : ''}{lead.email}
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-50/80 hover:bg-red-100 border border-red-200 transition-all self-start sm:self-auto"
            >
              Delete Lead
            </button>
          )}
        </div>
      </div>

      {/* Grid Layout: Left Info & Notes / Right Status & Assignment Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lead Info Card */}
          <div className="glass-card rounded-2xl p-6 border border-sage-200/80 shadow-glass space-y-4">
            <h3 className="font-display text-base font-bold text-sage-900 border-b border-sage-200/60 pb-3">
              Lead Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-bold text-sage-500 uppercase tracking-wider block mb-1">Email</span>
                <span className="font-semibold text-sage-900">{lead.email}</span>
              </div>
              <div>
                <span className="font-bold text-sage-500 uppercase tracking-wider block mb-1">Phone</span>
                <span className="font-semibold text-sage-900">{lead.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="font-bold text-sage-500 uppercase tracking-wider block mb-1">Company</span>
                <span className="font-semibold text-sage-900">{lead.company || 'N/A'}</span>
              </div>
              <div>
                <span className="font-bold text-sage-500 uppercase tracking-wider block mb-1">Lead Source</span>
                <span className="font-semibold text-sage-900">{lead.source || 'Manual'}</span>
              </div>
            </div>
            {lead.message && (
              <div className="pt-2 border-t border-sage-200/40 text-xs">
                <span className="font-bold text-sage-500 uppercase tracking-wider block mb-1">Message / Requirements</span>
                <p className="p-3 rounded-xl bg-sage-100/50 border border-sage-200/60 text-sage-800 font-medium leading-relaxed">
                  {lead.message}
                </p>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="glass-card rounded-2xl p-6 border border-sage-200/80 shadow-glass space-y-4">
            <h3 className="font-display text-base font-bold text-sage-900 border-b border-sage-200/60 pb-3">
              Activity & Notes ({notes.length})
            </h3>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                rows="3"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Write a note or update call notes..."
                className="w-full p-3 rounded-xl input-cream text-xs font-medium text-sage-900 placeholder:text-sage-400"
              />
              <button
                type="submit"
                disabled={submittingNote || !newNote.trim()}
                className="btn-forest px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide shadow-sm disabled:opacity-40"
              >
                {submittingNote ? 'Adding Note...' : 'Add Note'}
              </button>
            </form>

            {/* Notes List */}
            {notes.length === 0 ? (
              <p className="text-xs text-sage-500 py-4 text-center">No notes added yet</p>
            ) : (
              <div className="space-y-3 pt-2">
                {notes.map((note) => (
                  <div key={note._id} className="p-4 rounded-xl bg-white/70 border border-sage-200/60 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-forest-dark">{note.author?.name || 'User'}</span>
                      <span className="text-sage-500">{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-sage-800 font-medium leading-relaxed">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Controls */}
        <div className="space-y-6">
          {/* Change Status Card */}
          <div className="glass-card rounded-2xl p-6 border border-sage-200/80 shadow-glass space-y-3">
            <h3 className="font-display text-sm font-bold text-sage-900 uppercase tracking-wider">
              Update Status
            </h3>
            <div className="space-y-2">
              {STATUSES.map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between border transition-all ${
                    lead.status === st
                      ? 'bg-forest text-white border-forest shadow-sm'
                      : 'bg-sage-100/60 text-sage-800 border-sage-200 hover:bg-sage-200/70'
                  }`}
                >
                  {st}
                  {lead.status === st && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Assign Lead Card */}
          <div className="glass-card rounded-2xl p-6 border border-sage-200/80 shadow-glass space-y-3">
            <h3 className="font-display text-sm font-bold text-sage-900 uppercase tracking-wider">
              Assigned Representative
            </h3>
            {isAdmin ? (
              <select
                value={lead.assignedTo?._id || lead.assignedTo || ''}
                onChange={(e) => handleAssign(e.target.value)}
                className="w-full p-3 rounded-xl input-cream text-xs font-semibold text-sage-800"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-xl bg-sage-100/60 border border-sage-200 text-xs font-semibold text-sage-800">
                {lead.assignedTo?.name || 'Unassigned'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
