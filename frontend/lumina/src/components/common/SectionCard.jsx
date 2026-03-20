const SectionCard = ({ title, children }) => (
  <div className="card p-6 mb-4">
    <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">
      {title}
    </h3>
    {children}
  </div>
)

export default SectionCard