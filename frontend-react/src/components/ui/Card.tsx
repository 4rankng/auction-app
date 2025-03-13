import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  footer?: React.ReactNode;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  footer,
  onClick
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
      )}
      <div className="px-6 py-4">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
