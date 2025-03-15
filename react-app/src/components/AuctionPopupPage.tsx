import React, { useEffect, useState } from 'react';
import * as timerService from '../services/timerService';
import './AuctionPopupPage.css';

interface AuctionPopupPageProps {
  companyName: string;
  auctioneer: string;
  startingPrice: string;
  bidStep: string;
  bidNumber: number;
  bidRound: string;
  highestBidder: string;
  auctionTitle: string;
  highestBidAmount: string;
  isAuctionEnded: boolean;
  onClose?: () => void;
}

const AuctionPopupPage: React.FC<AuctionPopupPageProps> = ({
  companyName,
  auctioneer,
  startingPrice,
  bidStep,
  bidNumber,
  bidRound,
  highestBidder,
  auctionTitle,
  highestBidAmount,
  isAuctionEnded
}) => {
  const [remainingTime, setRemainingTime] = useState<number>(0);

  useEffect(() => {
    // Set the window title
    document.title = 'Thông Tin Đấu Giá';

    // Subscribe to timer updates
    const subscription = timerService.getTimerObservable().subscribe((timeLeft: number) => {
      setRemainingTime(timeLeft);
    });

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const formatTime = (timeInMs: number): string => {
    const seconds = Math.floor(timeInMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="auction-popup-container">
      {isAuctionEnded ? (
        <div className="auction-result-container">
          <div className="result-header">
            <div className="company-name">{companyName}</div>
            <h2>KẾT QUẢ ĐẤU GIÁ</h2>
          </div>
          <div className="result-info">
            <div className="result-row">
              <span className="result-label">Tài Sản:</span>
              <span className="result-value">{auctionTitle}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Đấu Giá Viên:</span>
              <span className="result-value">{auctioneer}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Người Trúng Đấu Giá:</span>
              <span className="result-value">{highestBidder}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Giá Trúng:</span>
              <span className="result-value highlight">{highestBidAmount}</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="company-name">{companyName}</div>

          <div className="auction-info">
            <div className="info-row">
              <span className="info-label">Đấu Giá Viên:</span>
              <span className="info-value">{auctioneer}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Giá Khởi Điểm:</span>
              <span className="info-value">{startingPrice}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Bước Giá:</span>
              <span className="info-value">{bidStep}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Lần Trả Giá:</span>
              <span className="info-value">{bidNumber}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Vòng Đấu Giá:</span>
              <span className="info-value">{bidRound}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Người Trả Giá Cao Nhất:</span>
              <span className="info-value">{highestBidder}</span>
            </div>
          </div>

          <div className="auction-session">
            <div className="timer-container">
              <div className="timer-label">Thời Gian Trả Còn Lại</div>
              <div className="timer-display">{formatTime(remainingTime * 1000)}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AuctionPopupPage;
