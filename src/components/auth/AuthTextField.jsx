import AuthInput from './AuthInput'

export default function AuthTextField({
  id,
  label,
  type = 'text',
  name,
  autoComplete,
  required,
  placeholder,
  value,
  onChange,
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-gray-900">
        {label}
      </label>
      <AuthInput
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}
