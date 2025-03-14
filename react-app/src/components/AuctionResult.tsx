import React, { useEffect, useState } from 'react';
import './AuctionResult.css';

interface AuctionResultProps {
  title: string;
  winnerName?: string;
  winningPrice?: number;
  startTime: string | number | Date;
  endTime: string | number | Date;

  totalBids: number;
  onExportData?: () => void;
}

const AuctionResult: React.FC<AuctionResultProps> = ({
  title,
  winnerName,
  winningPrice,
  startTime,
  endTime,

  totalBids,
}) => {
  // Animation states
  const [isVisible, setIsVisible] = useState(false);

  // Trigger animations after component mounts
  useEffect(() => {
    // Add animation effect when component mounts
    setIsVisible(true);
  }, []);

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Format date safely
  const formatDate = (dateInput: string | number | Date) => {
    if (!dateInput) return 'N/A';

    try {
      // If it's a timestamp (number)
      if (typeof dateInput === 'number') {
        return new Date(dateInput).toLocaleString('vi-VN');
      }

      // If it's already a Date object
      if (dateInput instanceof Date) {
        return dateInput.toLocaleString('vi-VN');
      }

      // If it's a string that's already formatted
      if (typeof dateInput === 'string' && dateInput.includes('/')) {
        return dateInput;
      }

      // Otherwise try to parse it as a date
      return new Date(dateInput).toLocaleString('vi-VN');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours} giờ ${minutes} phút ${remainingSeconds} giây`;
  };

  return (
    <div className={`auction-result-container ${isVisible ? 'visible' : ''}`}>
      <div className="auction-result-card">
        {winnerName && winningPrice ? (
          <div className="winner-section">
            <div className="winner-card">
              <div className="winner-info">
                <div className="trophy-container">
                  <i className="bi bi-trophy trophy-icon"></i>
                </div>
                <div className="winner-name">{winnerName}</div>
              </div>
              <div className="winning-price-container">
                <div className="winning-price">
                  <span>{formatCurrency(winningPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-winner-section">
            <div className="info-alert">
              <i className="bi bi-info-circle"></i>
              Không có người thắng cuộc. Phiên đấu giá đã kết thúc mà không có người đặt giá.
            </div>
          </div>
        )}

        <div className="details-section">
          <h3 className="section-title">Thông tin đấu giá</h3>
          <div className="details-grid">
            <div className="detail-item">
              <div className="detail-icon">
                <i className="bi bi-calendar3"></i>
              </div>
              <div className="detail-content">
                <div className="detail-label">Bắt đầu lúc</div>
                <div className="detail-value">{formatDate(startTime)}</div>
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-icon">
                <i className="bi bi-clock-history"></i>
              </div>
              <div className="detail-content">
                <div className="detail-label">Kết thúc lúc</div>
                <div className="detail-value">{formatDate(endTime)}</div>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <i className="bi bi-clock"></i>
              </div>
              <div className="detail-content">
                <div className="detail-label">Thời gian diễn ra</div>
                <div className="detail-value">
                  {formatDuration(Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000))}
                </div>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <i className="bi bi-hammer"></i>
              </div>
              <div className="detail-content">
                <div className="detail-label">Tổng số lượt đặt giá</div>
                <div className="detail-value">{totalBids}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionResult;
