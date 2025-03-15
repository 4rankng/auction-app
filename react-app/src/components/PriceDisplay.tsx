import React from 'react';
import './PriceDisplay.css';

interface PriceDisplayProps {
  label: string;
  value: string;
  type?: 'current' | 'starting' | 'increment';
  icon?: string;
  secondaryText?: string;
  className?: string;
}

/**
 * A reusable component for displaying price information with consistent styling
 */
const PriceDisplay: React.FC<PriceDisplayProps> = ({
  label,
  value,
  type = 'current',
  icon,
  secondaryText,
  className = '',
}) => {
  return (
    <div className={`price-display-container ${className}`}>
      <div className="price-display-label">{label}</div>
      <div className={`price-display-value ${type}`}>
        {icon && <i className={`bi bi-${icon}`}></i>}
        {value}
      </div>
      {secondaryText && (
        <div className="price-display-secondary">{secondaryText}</div>
      )}
    </div>
  );
};

/**
 * Grid container for multiple price displays
 */
export const PriceDisplayGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`price-displays-grid ${className}`}>
      {children}
    </div>
  );
};

export default PriceDisplay;
