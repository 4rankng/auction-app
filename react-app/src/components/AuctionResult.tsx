import React from 'react';
import './AuctionResult.css';
import { AuctionResult as AuctionResultType } from '../types';

interface AuctionResultProps {
  result: AuctionResultType;
  totalBids: number;
}

const AuctionResult: React.FC<AuctionResultProps> = ({
  result,
  totalBids
}) => {
  // Format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('vi-VN').format(amount);
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
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours} giờ ${minutes} phút ${remainingSeconds} giây`;
  };

  // Check if we have a winner - add null check for result
  const hasWinner = result && result.winnerId && result.winnerName && result.finalPrice;

  // If result is undefined, show fallback UI
  if (!result) {
    return (
      <div className="auction-result-container">
        <div className="info-grid">
          <div className="info-item">
            <div className="info-content">
              <div className="info-label">Thông tin đấu giá</div>
              <div className="info-value">Đang tải...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auction-result-container">
      {/* Winner display - positioned first to match photo */}
      {hasWinner ? (
        <div className="winner-section">
          <div className="trophy-icon">
            <i className="bi bi-trophy"></i>
          </div>
          <div className="winner-info">
            <div className="winner-name">{result.winnerName}</div>
            <div className="winning-price">{formatCurrency(result.finalPrice)} đ</div>
          </div>
        </div>
      ) : (
        <div className="no-winner-section">
          <div className="no-winner-message">
            <i className="bi bi-info-circle"></i>
            Không có người thắng cuộc
          </div>
        </div>
      )}

      {/* Auction information */}
      <div className="auction-info-section">
        <h2 className="section-title">Thông tin đấu giá</h2>

        <div className="info-grid">
          <div className="info-item">
            <div className="info-icon">
              <i className="bi bi-calendar"></i>
            </div>
            <div className="info-content">
              <div className="info-label">Bắt đầu lúc</div>
              <div className="info-value">{formatDate(result.startTime)}</div>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon">
              <i className="bi bi-clock"></i>
            </div>
            <div className="info-content">
              <div className="info-label">Kết thúc lúc</div>
              <div className="info-value">{formatDate(result.endTime)}</div>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon">
              <i className="bi bi-hourglass-split"></i>
            </div>
            <div className="info-content">
              <div className="info-label">Thời gian diễn ra</div>
              <div className="info-value">{formatDuration(result.duration)}</div>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon">
              <i className="bi bi-list-ol"></i>
            </div>
            <div className="info-content">
              <div className="info-label">Số lượt đặt giá</div>
              <div className="info-value">{totalBids}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionResult;
