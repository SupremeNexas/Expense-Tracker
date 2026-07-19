import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, className = '', label, helperText, error, ...props }, ref) => {
    return (
      <div className="flex flex-col w-full text-left">
        {label && (
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5 font-sans">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <select
            ref={ref}
            className={`w-full h-11 px-4 text-sm bg-black/[0.02] dark:bg-white/[0.02] border rounded-[14px] outline-none transition-all duration-200 cursor-pointer appearance-none font-sans
              bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23707070%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')]
              bg-[length:10px_10px] bg-[right_16px_center] bg-no-repeat
              ${error 
                ? 'border-red/40 focus:border-red focus:ring-4 focus:ring-red/10' 
                : 'border-border hover:border-black/[0.12] dark:hover:border-white/[0.12] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
              }
              ${className}
            `}
            {...props}
          >
            {children}
          </select>
        </div>
        {error && (
          <span className="text-[11px] text-red font-medium mt-1.5 font-sans">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 font-sans">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
