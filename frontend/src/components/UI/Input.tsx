import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, helperText, error, icon, ...props }, ref) => {
    return (
      <div className="flex flex-col w-full text-left">
        {label && (
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5 font-sans">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {icon && (
            <span className="absolute left-4 text-gray-400 dark:text-gray-500 shrink-0 pointer-events-none select-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`w-full h-11 text-sm bg-black/[0.02] dark:bg-white/[0.02] border rounded-[14px] outline-none transition-all duration-200 font-sans
              ${icon ? 'pl-11 pr-4' : 'px-4'}
              ${error 
                ? 'border-red/40 focus:border-red focus:ring-4 focus:ring-red/10' 
                : 'border-border hover:border-black/[0.12] dark:hover:border-white/[0.12] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <span className="text-[11px] text-red font-medium mt-1.5 font-sans animate-fade-in">
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

Input.displayName = 'Input';
export default Input;
