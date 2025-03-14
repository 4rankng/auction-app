import React, { useEffect, useState } from 'react';
import './AuctionResult.css';

interface AuctionResultProps {
  title: string;
  winnerName?: string;
  winningPrice?: number;
  startTime: string;
  endTime: string;
  totalRounds: number;
  totalBids: number;
}

/**
 * A modern, visually appealing component to display auction results at the end of the last round
 * Designed to blend seamlessly with the parent component
 */
const AuctionResult: React.FC<AuctionResultProps> = ({
  title,
  winnerName,
  winningPrice,
  startTime,
  endTime,
  totalRounds,
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

  return (
    <div className={`auction-result-container ${isVisible ? 'visible' : ''}`}>
      <div className="auction-result-card">


        {winnerName && winningPrice ? (
          <div className="winner-section">
            <h3 className="section-title">
              Người thắng cuộc
            </h3>
            <div className="winner-card">
              <div className="winner-info">
                <div className="trophy-container">
                  <i className="bi bi-trophy trophy-icon"></i>
                </div>
                <div className="winner-name">{winnerName}</div>
              </div>
              <div className="winning-price-container">
                <div className="winning-price">{formatCurrency(winningPrice)}</div>
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
                <i className="bi bi-calendar-date"></i>
              </div>
              <div className="detail-content">
                <div className="detail-label">Thời gian bắt đầu</div>
                <div className="detail-value">{new Date(startTime).toLocaleString('vi-VN')}</div>
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-icon">
                <i className="bi bi-clock"></i>
              </div>
              <div className="detail-content">
                <div className="detail-label">Thời gian kết thúc</div>
                <div className="detail-value">{new Date(endTime).toLocaleString('vi-VN')}</div>
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-icon">
                <i className="bi bi-layers"></i>
              </div>
              <div className="detail-content">
                <div className="detail-label">Tổng số vòng</div>
                <div className="detail-value">{totalRounds}</div>
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
