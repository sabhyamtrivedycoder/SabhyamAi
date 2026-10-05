/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface LogoProps {
  showText?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  theme?: 'dark' | 'light';
}

export const SabhyamIcon: React.FC<{ sizeClass?: string; className?: string }> = ({
  sizeClass = 'w-6 h-6',
  className = '',
}) => (
  <svg
    viewBox="0 0 32 32"
    className={`${sizeClass} ${className} shrink-0`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Neurapex-inspired organic fluid black mark */}
    <path
      d="M7 21C7 14 11 9 17 9C23 9 26 13 26 19C26 24 23 26 19 26C14 26 12 23 12 19C12 12 18 7 25 6"
      stroke="#111827"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Logo: React.FC<LogoProps> = ({
  showText = true,
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    xs: { icon: 'w-4 h-4', text: 'text-sm' },
    sm: { icon: 'w-5 h-5', text: 'text-base' },
    md: { icon: 'w-6 h-6', text: 'text-lg' },
    lg: { icon: 'w-8 h-8', text: 'text-2xl' },
    xl: { icon: 'w-10 h-10', text: 'text-3xl' },
  };

  const { icon, text } = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <SabhyamIcon sizeClass={icon} />
      {showText && (
        <span className={`font-sans tracking-tight ${text} leading-none flex items-center`}>
          <span className="font-semibold text-[#111827]">sabhyam</span>
          <span className="font-normal text-[#4f46e5]">ai</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
