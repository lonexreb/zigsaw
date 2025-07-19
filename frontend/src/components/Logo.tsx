import React from 'react';
import logoSvg from '../assets/logo.svg';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  isDark?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showIcon = true, isDark = true }) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const iconSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showIcon && (
        <div className="flex-shrink-0">
          <img 
            src={logoSvg} 
            alt="Zigsaw logo" 
            className={`${iconSizeClasses[size]} filter brightness-110`}
          />
        </div>
      )}
      <h1 
        className={`${sizeClasses[size]} font-bold truncate ${isDark ? 'text-white' : 'text-black'}`}
        style={{ 
          fontFamily: '"Montserrat", sans-serif',
          fontWeight: 700
        }}
      >
        Zigsaw
      </h1>
    </div>
  );
};

export default Logo; 