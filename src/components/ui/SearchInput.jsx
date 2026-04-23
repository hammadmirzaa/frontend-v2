import { Search } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * @typedef {object} SearchInputProps
 * @property {string} [placeholder]
 * @property {string} [className] - wrapper
 * @property {string} [inputClassName]
 * @property {string} [value]
 * @param {(e: import('react').ChangeEvent<HTMLInputElement>) => void} [onChange]
 */

export function SearchInput({
  placeholder = 'Search here...',
  className,
  inputClassName,
  value,
  onChange,
  style,
  dashboardInput = false,
}) {
  return (
    <div className={cn('relative max-w-96', className)}>
      <img src="/svgs/playground/magnifier.svg" alt="Search" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={style}
        className={cn(
          'h-10 w-full rounded-lg  {dashboardInput ? "" :border border-gray-200} bg-[#F9FAFB] pl-10 pr-4 text-sm text-gray-900 placeholder:text-xs placeholder:text-gray-400 focus:border-brand-teal/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:ring-offset-0',
          
          inputClassName
        )}
      />
    </div>
  )
}
