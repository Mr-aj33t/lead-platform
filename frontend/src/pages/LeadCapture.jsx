import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { createLead } from '../services/leadService.js';

export default function LeadCapture() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    else if (!/^[\d\s\-+()]{6,20}$/.test(form.phone)) errs.phone = 'Invalid phone format';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await createLead({ ...form, source: 'Public Form' });
      setSubmitted(true);
      toast.success('Lead submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="glass-card rounded-3xl p-10 border border-sage-200/80 shadow-glass space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-forest/10 text-forest font-bold text-3xl flex items-center justify-center mx-auto">
            ✓
          </div>
          <h2 className="font-display text-2xl font-black text-sage-900">Thank You!</h2>
          <p className="text-xs font-semibold text-sage-600">
            Your inquiry has been received. Our sales team will get back to you shortly.
          </p>
          <div className="pt-4">
            <Link to="/" className="btn-forest px-6 py-2.5 rounded-xl text-xs font-bold inline-block">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8">
      <div className="glass-card rounded-3xl p-8 sm:p-10 border border-sage-200/80 shadow-glass space-y-6">
        <div>
          <h1 className="font-display text-2xl font-black text-sage-900 tracking-tight">Register Your Interest</h1>
          <p className="text-xs font-medium text-sage-600 mt-1">Fill in your details and our team will get in touch</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Full Name', name: 'name', type: 'text', placeholder: 'e.g. John Doe' },
            { label: 'Email Address', name: 'email', type: 'email', placeholder: 'john@example.com' },
            { label: 'Phone Number', name: 'phone', type: 'tel', placeholder: '+1 917 998 8141' },
            { label: 'Company Name', name: 'company', type: 'text', placeholder: 'Acme Corp', required: false },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-xs font-bold text-sage-800 uppercase tracking-wider mb-1.5">
                {field.label}{field.required !== false && <span className="text-red-500 ml-0.5">*</span>}
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
              Project Details / Message
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={3}
              placeholder="Tell us about your project or requirements..."
              className="w-full p-3 rounded-xl input-cream text-xs font-medium text-sage-900 placeholder:text-sage-400"
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-forest py-3.5 rounded-xl text-xs font-bold tracking-wide shadow-sm disabled:opacity-50 mt-2"
          >
            {submitting ? 'Submitting...' : 'Register Interest'}
          </button>
        </form>
      </div>
    </div>
  );
}
