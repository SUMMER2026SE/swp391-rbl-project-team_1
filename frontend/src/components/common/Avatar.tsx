import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'blue' | 'emerald' | 'purple' | 'pink' | 'amber';
}

export function Avatar({ name, size = 'md', variant = 'blue' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-bold',
    xl: 'w-20 h-20 text-xl font-bold'
  };

  const variantClasses = {
    blue: 'from-blue-500 to-indigo-600',
    emerald: 'from-emerald-500 to-teal-600',
    purple: 'from-purple-500 to-indigo-600',
    pink: 'from-pink-500 to-rose-600',
    amber: 'from-amber-500 to-orange-600'
  };

  return (
    <div
      className={`rounded-full bg-gradient-to-tr flex items-center justify-center text-white font-semibold shadow-inner select-none ${sizeClasses[size]} ${variantClasses[variant]}`}
    >
      {initials}
    </div>
  );
}

export default Avatar;
