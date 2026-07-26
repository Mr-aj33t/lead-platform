import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden glass-card rounded-3xl p-8 sm:p-14 border border-sage-200/80 shadow-glass">
        {/* Abstract Background Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sage-200/40 rounded-full blur-3xl -z-10 -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-forest/5 rounded-full blur-2xl -z-10 -ml-16 -mb-16 pointer-events-none" />

        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sage-100/90 border border-sage-200 text-xs font-semibold text-forest-dark uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-forest-light animate-pulse" />
            Lead Platform
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-black text-sage-900 tracking-tight leading-[1.1]">
            Manage Your Leads <br />
            Like a <span className="text-forest font-extrabold underline decoration-forest-light/40 underline-offset-8">Pro.</span>
          </h1>

          <p className="text-base sm:text-lg text-sage-700 font-normal leading-relaxed max-w-2xl">
            Lead Platform empowers sales teams to track, qualify, and close deals effortlessly.
            From first contact to final proposal, manage your complete sales pipeline in one place.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Link
              to="/login"
              className="btn-forest px-7 py-3.5 rounded-2xl text-sm font-semibold tracking-wide shadow-md flex items-center gap-2"
            >
              Get Started
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link
              to="/register-form"
              className="px-7 py-3.5 rounded-2xl text-sm font-semibold text-sage-800 bg-sage-100 hover:bg-sage-200/80 border border-sage-300/70 transition-all"
            >
              Submit a Lead
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-7 border border-sage-200/70 hover:border-forest-light/40 transition-all hover:-translate-y-1">
          <div className="w-12 h-12 rounded-xl bg-forest/10 text-forest flex items-center justify-center font-bold text-xl mb-5">
            📊
          </div>
          <h3 className="font-display text-xl font-bold text-sage-900 mb-2">Track Pipeline</h3>
          <p className="text-sm text-sage-600 leading-relaxed">
            Visualize every deal stage from New to Won. Know exactly where each lead stands in real-time.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-7 border border-sage-200/70 hover:border-forest-light/40 transition-all hover:-translate-y-1">
          <div className="w-12 h-12 rounded-xl bg-forest/10 text-forest flex items-center justify-center font-bold text-xl mb-5">
            🤝
          </div>
          <h3 className="font-display text-xl font-bold text-sage-900 mb-2">Team Collaboration</h3>
          <p className="text-sm text-sage-600 leading-relaxed">
            Assign leads to team members, leave notes, and keep everyone aligned with audit logs.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-7 border border-sage-200/70 hover:border-forest-light/40 transition-all hover:-translate-y-1">
          <div className="w-12 h-12 rounded-xl bg-forest/10 text-forest flex items-center justify-center font-bold text-xl mb-5">
            ⚡
          </div>
          <h3 className="font-display text-xl font-bold text-sage-900 mb-2">Data-Driven Insights</h3>
          <p className="text-sm text-sage-600 leading-relaxed">
            Get instant stats on total leads, conversion stages, and sales team activity metrics.
          </p>
        </div>
      </section>
    </div>
  );
}
