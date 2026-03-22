const statusConfig = {
  // Application statuses
  draft:        { label: 'Draft',        classes: 'bg-gray-100 text-gray-600' },
  submitted:    { label: 'Submitted',    classes: 'bg-blue-100 text-blue-600' },
  under_review: { label: 'Under Review', classes: 'bg-amber-100 text-amber-700' },
  recommended:  { label: 'Recommended',  classes: 'bg-purple-100 text-purple-700' },
  accepted:     { label: 'Accepted',     classes: 'bg-green-100 text-green-700' },
  rejected:     { label: 'Rejected',     classes: 'bg-red-100 text-red-600' },

  // AI screening decisions
  recommended_ai: { label: 'Recommended', classes: 'bg-purple-100 text-purple-700' },
  review:          { label: 'Review',      classes: 'bg-amber-100 text-amber-700' },

  // Legacy / fallback
  screened:     { label: 'Recommended',  classes: 'bg-purple-100 text-purple-700' },
  pending:      { label: 'Under Review', classes: 'bg-amber-100 text-amber-700' },
  accept:       { label: 'Accepted',     classes: 'bg-green-100 text-green-700' },
  reject:       { label: 'Rejected',     classes: 'bg-red-100 text-red-600' },
}

const StatusBadge = ({ status }) => {
  const config = statusConfig[status?.toLowerCase()] || {
    label: status || 'Unknown',
    classes: 'bg-gray-100 text-gray-600',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.classes}`}>
      {config.label}
    </span>
  )
}

export default StatusBadge