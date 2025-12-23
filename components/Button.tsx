
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-brand-800 text-white hover:bg-brand-900 focus:ring-brand-500 shadow-sm",
    secondary: "bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 shadow-sm",
    accent: "bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-400 shadow-sm text-brand-900 font-semibold",
    outline: "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-brand-500",
    ghost: "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100",
  };

  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-5 text-sm",
    lg: "h-12 px-8 text-base",
  };

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};
