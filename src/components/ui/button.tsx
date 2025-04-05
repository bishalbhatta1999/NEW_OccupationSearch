

// Button.tsx
import React, { HTMLAttributes } from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  asChild?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, onClick, className = '', asChild = false }) => {
  const baseStyles = 'bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-2xl transition duration-300';

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<HTMLAttributes<HTMLElement>>, {
      className: `${baseStyles} ${className} ${(children.props as HTMLAttributes<HTMLElement>).className || ''}`.trim(),
      onClick,
    });
  }

  return (
    <button onClick={onClick} className={`${baseStyles} ${className}`}>
      {children}
    </button>
  );
};