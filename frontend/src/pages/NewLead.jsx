import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createLead } from '../services/leadService.js';

export default function NewLead() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await createLead(form);
      toast.success('Lead created successfully');
      navigate('/leads');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to create lead');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-4">
      <div className="glass-card rounded-3xl p-8 border border-sage-200/80 shadow-glass space-y-6">
        <div>
          <h1 className="font-display text-2xl font-black text-sage-900 tracking-tight">Create New Lead</h1>
          <p className="text-xs font-medium text-sage-600 mt-1">Enter prospect details to add to pipeline</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Full Name', name: 'name', type: 'text', placeholder: 'e.g. Sarah Connor', required: true },
            { label: 'Email Address', name: 'email', type: 'email', placeholder: 'sarah@cyberdyne.com', required: true },
            { label: 'Phone Number', name: 'phone', type: 'tel', placeholder: '+1-555-0199', required: true },
            { label: 'Company Name', name: 'company', type: 'text', placeholder: 'Cyberdyne Systems', required: false },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-xs font-bold text-sage-800 uppercase tracking-wider mb-1.5">
                {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input
                type={field.type}
                value={form[field.name]}
                placeholder={field.placeholder}
                onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl input-cream text-xs font-medium text-sage-900 placeholder:text-sage-400 ${
                  errors[field.name] ? 'border-red-400 bg-red-50/20' : ''
                }`}
                disabled={submitting}
              />
              {errors[field.name] && <p className="mt-1 text-[11px] font-semibold text-red-500">{errors[field.name]}</p>}
            </div>
          ))}

          <div>
            <label className="block text-xs font-bold text-sage-800 uppercase tracking-wider mb-1.5">
              Requirements / Message
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={3}
              placeholder="Add project details or initial conversation notes..."
              className="w-full p-3 rounded-xl input-cream text-xs font-medium text-sage-900 placeholder:text-sage-400"
              disabled={submitting}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 btn-forest py-3 rounded-xl text-xs font-bold tracking-wide shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Creating Lead...' : 'Save Lead'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/leads')}
              className="px-6 py-3 rounded-xl border border-sage-200 text-xs font-semibold text-sage-700 hover:bg-sage-100/60 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
