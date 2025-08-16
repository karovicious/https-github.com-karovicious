import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '', showText = true }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden shadow-lg ring-2 ring-primary/30 hover:ring-primary/60 transition-all duration-300`}>
        <img 
          src="/karologo_400x400.jpg" 
          alt="KaroVicious Logo" 
          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent`}>
            KaroVicious
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Toluca Club
          </p>
        </div>
      )}
    </div>
  );
};

export default Logo;
