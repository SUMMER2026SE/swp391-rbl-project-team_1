import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-slate-300 font-semibold text-xs uppercase tracking-wider">
            {label}
          </label>
        )}
        
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-4 text-slate-500 pointer-events-none">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            className={`w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300 outline-none placeholder:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed ${
              icon ? 'pl-11' : ''
            } ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''} ${className}`}
            {...props}
          />
        </div>

        {error && (
          <span className="text-rose-500 text-xs font-medium mt-0.5">{error}</span>
        )}
        {!error && helperText && (
          <span className="text-slate-500 text-xs mt-0.5">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
