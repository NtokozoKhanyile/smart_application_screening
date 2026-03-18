const SelectInput = ({
  label,
  name,
  options = [],
  register,
  error,
  required = false,
  disabled = false,
  placeholder = 'Select an option',
}) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={name}
        disabled={disabled}
        {...(register ? register(name) : {})}
        className={`input-field ${
          error ? 'border-red-400 focus:ring-red-400' : ''
        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-500">{error.message}</p>
      )}
    </div>
  )
}

export default SelectInput