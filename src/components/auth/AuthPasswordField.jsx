import { Eye, EyeOff } from 'lucide-react'
import AuthInput from './AuthInput'

export default function AuthPasswordField({
  id,
  label,
  name,
  autoComplete,
  required,
  placeholder,
  value,
  onChange,
  showPassword,
  onToggleVisibility,
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-gray-900">
        {label}
      </label>
      <div className="relative">
        <AuthInput
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="!pr-12"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 transition-colors hover:bg-gray-200/60 hover:text-gray-700"
          onClick={onToggleVisibility}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <Eye className="h-5 w-5" strokeWidth={1.75} /> : <EyeOff className="h-5 w-5" strokeWidth={1.75} />}
        </button>
      </div>
    </div>
  )
}
