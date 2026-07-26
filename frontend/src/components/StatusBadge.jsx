import React from 'react';

const STATUS_CONFIG = {
  New: {
    label: 'New',
    badge: 'bg-[#E3EFE6] text-[#244233] border-[#B8D7C0]',
    dot: 'bg-[#3B6951]',
  },
  Contacted: {
    label: 'Contacted',
    badge: 'bg-[#F5F2E3] text-[#635520] border-[#E5DEC1]',
    dot: 'bg-[#948133]',
  },
  Qualified: {
    label: 'Qualified',
    badge: 'bg-[#E6EEF5] text-[#1E4363] border-[#C3D6E8]',
    dot: 'bg-[#2D6696]',
  },
  'Proposal Sent': {
    label: 'Proposal Sent',
    badge: 'bg-[#ECE8F5] text-[#3D2963] border-[#D5CBE8]',
    dot: 'bg-[#6747A3]',
  },
  Won: {
    label: 'Won',
    badge: 'bg-[#DFF0E5] text-[#1A4A2B] border-[#A8DBB8]',
    dot: 'bg-[#227A43]',
  },
  Lost: {
    label: 'Lost',
    badge: 'bg-[#F7E7E7] text-[#732424] border-[#E8C6C6]',
    dot: 'bg-[#A83B3B]',
  },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    badge: 'bg-sage-100 text-sage-800 border-sage-200',
    dot: 'bg-sage-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.badge} transition-all`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
