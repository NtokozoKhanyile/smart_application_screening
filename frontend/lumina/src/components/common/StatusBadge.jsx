const statusConfig = {
  draft:    { label: 'Draft',    classes: 'bg-gray-100 text-gray-600' },
  pending:  { label: 'Pending',  classes: 'bg-blue-100 text-blue-600' },
  screened: { label: 'Screened', classes: 'bg-purple-100 text-purple-600' },
  accepted: { label: 'Accepted', classes: 'bg-green-100 text-green-600' },
  rejected: { label: 'Rejected', classes: 'bg-red-100 text-red-600' },
  review:   { label: 'Review',   classes: 'bg-amber-100 text-amber-600' },
  accept:   { label: 'Accepted', classes: 'bg-green-100 text-green-600' },
  reject:   { label: 'Rejected', classes: 'bg-red-100 text-red-600' },
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