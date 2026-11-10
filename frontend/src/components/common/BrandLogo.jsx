import React from 'react';
import { Link } from 'react-router-dom';

export const BrandLogo = ({
  size = 'md',
  showTagline = true,
  theme = 'light',
  linkTo = '/',
  className = ''
}) => {
  const isDark = theme === 'dark';

  const iconSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9 sm:w-10 sm:h-10',
    lg: 'w-11 h-11'
  }[size] || 'w-10 h-10';

  const textClasses = {
    sm: 'text-[17px]',
    md: 'text-[18px] sm:text-[19px]',
    lg: 'text-[22px]'
  }[size] || 'text-[19px]';

  const content = (
    <div className={`flex items-center space-x-2.5 group focus:outline-none ${className}`}>
      {/* Modern Government-Grade Vector Emblem */}
      <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-200">
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${iconSizeClasses} drop-shadow-xs`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="brandShieldGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0B1730" />
              <stop offset="100%" stopColor="#122440" />
            </linearGradient>
            <linearGradient id="brandTealGrad" x1="10" y1="6" x2="30" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2DD4BF" />
              <stop offset="100%" stopColor="#0F9488" />
            </linearGradient>
            <linearGradient id="brandGlow" x1="20" y1="8" x2="20" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0F9488" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Protective Shield Base */}
          <path
            d="M20 2.5C28 5.5 35.5 5 35.5 12C35.5 24 27 34.5 20 38.5C13 34.5 4.5 24 4.5 12C4.5 5 12 5.5 20 2.5Z"
            fill="url(#brandShieldGrad)"
            stroke={isDark ? '#2DD4BF' : '#1E3A5F'}
            strokeWidth={isDark ? '1.8' : '1.5'}
            strokeOpacity={isDark ? '0.7' : '1'}
            strokeLinejoin="round"
          />

          {/* Inner Subtle Contour */}
          <path
            d="M20 5C26.5 7.5 32.5 7 32.5 13C32.5 22.5 25.5 31 20 35C14.5 31 7.5 22.5 7.5 13C7.5 7 13.5 7.5 20 5Z"
            fill="url(#brandGlow)"
            stroke="url(#brandTealGrad)"
            strokeWidth="0.8"
            strokeOpacity="0.4"
          />

          {/* Citizen Care Supportive Arch */}
          <path
            d="M13.5 25C13.5 19 16.5 15.5 20 15.5C23.5 15.5 26.5 19 26.5 25"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Central Civic Pillar */}
          <path
            d="M20 17.5V28"
            stroke="url(#brandTealGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Neural AI Innovation Star */}
          <path
            d="M20 8.5L21.3 11.7L24.5 13L21.3 14.3L20 17.5L18.7 14.3L15.5 13L18.7 11.7L20 8.5Z"
            fill="url(#brandTealGrad)"
          />

          {/* Interconnected Civic Data Nodes */}
          <circle cx="13.5" cy="25" r="1.8" fill="#2DD4BF" />
          <circle cx="26.5" cy="25" r="1.8" fill="#2DD4BF" />
          <circle cx="20" cy="28" r="1.8" fill="white" />
        </svg>
      </div>

      {/* Typography & Brand Hierarchy */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`${textClasses} font-black tracking-tight transition-colors ${
              isDark ? 'text-white group-hover:text-[#2DD4BF]' : 'text-[#0B1730] group-hover:text-[#0F9488]'
            }`}
          >
            JanSahayak
          </span>
          <span className="inline-flex items-center justify-center bg-gradient-to-r from-[#0F9488] to-[#14B8A6] text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs tracking-wider uppercase">
            AI
          </span>
        </div>
        {showTagline && (
          <div
            className={`text-[10px] font-semibold tracking-wider uppercase mt-1 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Smart Grievance Redressal Platform
          </div>
        )}
      </div>
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} aria-label="JanSahayak AI Home" className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
};
