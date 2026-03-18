const TextInput = ({
  label,
  name,
  type = 'text',
  placeholder = '',
  register,
  error,
  required = false,
  disabled = false,
  hint = '',
}) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        {...(register ? register(name) : {})}
        className={`input-field ${
          error ? 'border-red-400 focus:ring-red-400' : ''
        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
      />
      {hint && !error && (
        <p className="text-xs text-gray-400">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error.message}</p>
      )}
    </div>
  )
}

export default TextInput