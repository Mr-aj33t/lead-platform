import { useState } from 'react';

const STATUS_CONFIG = [
  { key: 'New', label: 'New', color: '#244233', bgLight: '#E3EFE6', barColor: 'from-[#244233] to-[#426B54]' },
  { key: 'Contacted', label: 'Contacted', color: '#635520', bgLight: '#F5F2E3', barColor: 'from-[#8C762B] to-[#B39B44]' },
  { key: 'Qualified', label: 'Qualified', color: '#1E4363', bgLight: '#E6EEF5', barColor: 'from-[#1E4363] to-[#3B6B94]' },
  { key: 'Proposal Sent', label: 'Proposal Sent', color: '#3D2963', bgLight: '#ECE8F5', barColor: 'from-[#3D2963] to-[#614594]' },
  { key: 'Won', label: 'Won', color: '#1A4A2B', bgLight: '#DFF0E5', barColor: 'from-[#1A4A2B] to-[#2E7A4A]' },
  { key: 'Lost', label: 'Lost', color: '#732424', bgLight: '#F7E7E7', barColor: 'from-[#732424] to-[#A84444]' },
];

export default function LeadCharts({ stats }) {
  const [activeHover, setActiveHover] = useState(null);

  if (!stats) return null;

  const total = stats.total || 0;

  // Extract count for each status safely
  const getCount = (key) => {
    if (stats[key] !== undefined) return stats[key];
    const keyWithoutSpaces = key.replace(/\s+/g, '');
    return stats[keyWithoutSpaces] || 0;
  };

  const statusData = STATUS_CONFIG.map((item) => {
    const count = getCount(item.key);
    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
    return { ...item, count, percentage: Number(percentage) };
  });

  const wonCount = getCount('Won');
  const lostCount = getCount('Lost');
  const activePipeline = total - wonCount - lostCount;
  const winRate = total > 0 ? ((wonCount / total) * 100).toFixed(1) : '0.0';
  const qualRate = total > 0 ? (((getCount('Qualified') + getCount('Proposal Sent') + wonCount) / total) * 100).toFixed(1) : '0.0';

  const maxCount = Math.max(...statusData.map((d) => d.count), 1);

  // Donut SVG Calculations
  const radius = 65;
  const circumference = 2 * Math.PI * radius; // ~408.4
  let cumulativePercent = 0;

  const donutSegments = statusData.map((d) => {
    const strokeDasharray = `${(d.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercent / 100) * circumference);
    cumulativePercent += d.percentage;
    return { ...d, strokeDasharray, strokeDashoffset };
  });

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-sage-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-sage-500">Win Rate</p>
            <h4 className="font-display text-2xl font-black text-sage-900 mt-1">{winRate}%</h4>
            <p className="text-[11px] text-sage-600 mt-0.5">{wonCount} won out of {total} leads</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl border border-emerald-200">
            🏆
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-sage-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-sage-500">Qualification Rate</p>
            <h4 className="font-display text-2xl font-black text-sage-900 mt-1">{qualRate}%</h4>
            <p className="text-[11px] text-sage-600 mt-0.5">High-intent leads progressing</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xl border border-blue-200">
            ⚡
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-sage-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-sage-500">Active Pipeline</p>
            <h4 className="font-display text-2xl font-black text-sage-900 mt-1">{activePipeline}</h4>
            <p className="text-[11px] text-sage-600 mt-0.5">Leads in active negotiation</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xl border border-amber-200">
            📈
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bar Chart: Lead Stage Pipeline */}
        <div className="lg:col-span-7 glass-card rounded-2xl border border-sage-200/80 p-6 shadow-glass flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-base font-bold text-sage-900">Lead Pipeline Volume</h3>
              <p className="text-xs text-sage-500">Lead count grouped by sales lifecycle stage</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-sage-100 text-forest-dark rounded-full border border-sage-200">
              Bar Graph
            </span>
          </div>

          {/* Bar Visualizer */}
          <div className="space-y-4 my-2">
            {statusData.map((item) => {
              const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              return (
                <div key={item.key} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold text-sage-800">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </span>
                    <span className="text-sage-600 font-bold">
                      {item.count} <span className="text-[10px] text-sage-400 font-normal">({item.percentage}%)</span>
                    </span>
                  </div>
                  <div className="h-3.5 w-full bg-sage-100/80 rounded-full overflow-hidden p-0.5 border border-sage-200/60">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${item.barColor} transition-all duration-700 ease-out`}
                      style={{ width: `${Math.max(barWidth, item.count > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Donut Chart: Circle Bar Distribution */}
        <div className="lg:col-span-5 glass-card rounded-2xl border border-sage-200/80 p-6 shadow-glass flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-base font-bold text-sage-900">Status Ratio</h3>
              <p className="text-xs text-sage-500">Proportional distribution ring</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-sage-100 text-forest-dark rounded-full border border-sage-200">
              Circle Bar
            </span>
          </div>

          {/* SVG Donut Chart */}
          <div className="relative flex items-center justify-center my-4">
            <svg className="w-48 h-48 -rotate-90 transform" viewBox="0 0 160 160">
              {/* Background Ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-sage-100"
                strokeWidth="16"
                fill="transparent"
              />
              {/* Donut Segments */}
              {total > 0 &&
                donutSegments.map((seg) => (
                  <circle
                    key={seg.key}
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke={seg.color}
                    strokeWidth="16"
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                    onMouseEnter={() => setActiveHover(seg)}
                    onMouseLeave={() => setActiveHover(null)}
                  />
                ))}
            </svg>

            {/* Donut Center Display */}
            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sage-500">
                {activeHover ? activeHover.label : 'Total Leads'}
              </span>
              <span className="font-display text-2xl font-black text-sage-900">
                {activeHover ? activeHover.count : total}
              </span>
              <span className="text-[11px] font-semibold text-forest">
                {activeHover ? `${activeHover.percentage}%` : `${winRate}% Won`}
              </span>
            </div>
          </div>

          {/* Compact Legend */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-sage-200/60">
            {statusData.map((item) => (
              <div
                key={item.key}
                onMouseEnter={() => setActiveHover(item)}
                onMouseLeave={() => setActiveHover(null)}
                className={`flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  activeHover?.key === item.key ? 'bg-sage-100' : 'hover:bg-sage-50'
                }`}
              >
                <span className="flex items-center gap-1.5 text-sage-700 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
                <span className="font-bold text-sage-900 shrink-0 ml-1">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
