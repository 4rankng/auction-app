import React from 'react';
import { COMPANY_NAME } from '@utils/constants';
import './CompanyBanner.css';

interface CompanyBannerProps {
  className?: string;
  companyName?: string;
}

const CompanyBanner: React.FC<CompanyBannerProps> = ({ className = '', companyName }) => {
  return (
    <div className={`company-banner ${className}`}>
      <div className="company-name">{companyName || COMPANY_NAME}</div>
    </div>
  );
};

export default CompanyBanner;
