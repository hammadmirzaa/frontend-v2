import { forwardRef } from 'react'

export const authInputClassName =
  'w-full rounded-lg border-0 bg-[#F8F8F899] py-3 px-4 text-gray-900 placeholder:text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-teal/35'

const AuthInput = forwardRef(function AuthInput({ className = '', ...props }, ref) {
  return <input ref={ref} className={`${authInputClassName} ${className}`.trim()} {...props} />
})

export default AuthInput
