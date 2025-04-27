
import React from 'react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          {label}
        </label>
        <input
          ref={ref}
          className="w-full bg-white/30 backdrop-blur-sm border border-white/50 rounded-lg px-4 py-2 text-gray-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';

export default AuthInput;
