const InfoRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500 sm:w-48 flex-shrink-0">{label}</span>
    <span className="text-sm font-medium text-gray-900 mt-0.5 sm:mt-0">{value || '—'}</span>
  </div>
)

export default InfoRow