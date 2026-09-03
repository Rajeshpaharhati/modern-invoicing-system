import React from 'react';

const statusConfig = {
  draft: { label: 'Draft', class: 'badge-draft' },
  sent: { label: 'Sent', class: 'badge-sent' },
  paid: { label: 'Paid', class: 'badge-paid' },
  overdue: { label: 'Overdue', class: 'badge-overdue' }
};

const StatusBadge = ({ status }) => {
  const normalized = (status || 'draft').toLowerCase();
  const config = statusConfig[normalized] || statusConfig.draft;

  return (
    <span className={`badge ${config.class}`}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: 'currentColor'
        }}
      />
      {config.label}
    </span>
  );
};

export default StatusBadge;
