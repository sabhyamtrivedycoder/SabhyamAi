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
  sizeClass = 'w-8 h-10',
  className = '',
}) => (
  <svg
    viewBox="0 0 100 130"
    className={`${sizeClass} ${className} shrink-0 drop-shadow-[0_0_12px_rgba(164,50,234,0.35)]`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="sabhyamBorder" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f42e88" />
        <stop offset="45%" stopColor="#a432ea" />
        <stop offset="100%" stopColor="#5522ee" />
      </linearGradient>
      <linearGradient id="sabhyamHead" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a83be8" />
        <stop offset="100%" stopColor="#5e22e5" />
      </linearGradient>
      <linearGradient id="sabhyamArmLeft" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7a2ee8" />
        <stop offset="100%" stopColor="#521fe2" />
      </linearGradient>
      <linearGradient id="sabhyamArmRight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c43fe8" />
        <stop offset="100%" stopColor="#8028e6" />
      </linearGradient>
    </defs>

    {/* Outer Rounded Neon Badge */}
    <rect
      x="5"
      y="5"
      width="90"
      height="120"
      rx="22"
      fill="#0c0915"
      stroke="url(#sabhyamBorder)"
      strokeWidth="6.5"
    />

    {/* Top Halo Pill */}
    <rect x="40" y="19" width="20" height="5" rx="2.5" fill="#ca4ce8" />

    {/* Avatar Head */}
    <circle cx="50" cy="38" r="11" fill="url(#sabhyamHead)" />

    {/* Left Shoulder / Arm */}
    <path
      d="M 23 60 L 43 47 L 43 68 L 30 88 L 23 75 Z"
      fill="url(#sabhyamArmLeft)"
    />

    {/* Right Shoulder / Arm */}
    <path
      d="M 77 60 L 57 47 L 57 68 L 70 88 L 77 75 Z"
      fill="url(#sabhyamArmRight)"
    />

    {/* Center Silhouette Facets */}
    <path d="M 50 49 L 36 62 L 36 84 L 50 108 Z" fill="#571ee2" />
    <path d="M 50 49 L 64 62 L 64 84 L 50 108 Z" fill="#962ee7" />
    <line x1="50" y1="49" x2="50" y2="108" stroke="#0e0a1a" strokeWidth="1.2" />
  </svg>
);

export const Logo: React.FC<LogoProps> = ({
  showText = true,
  size = 'md',
  className = '',
  theme = 'light',
}) => {
  const sizeMap = {
    xs: { icon: 'w-5 h-7', text: 'text-base' },
    sm: { icon: 'w-6 h-8', text: 'text-lg' },
    md: { icon: 'w-8 h-10', text: 'text-2xl' },
    lg: { icon: 'w-10 h-13', text: 'text-3xl' },
    xl: { icon: 'w-14 h-18', text: 'text-4xl' },
  };

  const { icon, text } = sizeMap[size];

  const textColor =
    theme === 'dark'
      ? 'text-white'
      : 'text-gray-900';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <SabhyamIcon sizeClass={icon} />
      {showText && (
        <span
          className={`font-sans font-bold tracking-tight ${text} ${textColor} leading-none`}
        >
          Sabhyamai
        </span>
      )}
    </div>
  );
};

export default Logo;
