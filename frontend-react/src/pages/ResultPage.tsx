import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuction } from '../hooks/useAuction';
import './ResultPage.css';

export const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { auction, bids, loading, error } = useAuction();

  useEffect(() => {
    if (auction?.status !== 'ENDED') {
      navigate('/bid');
    }
  }, [auction, navigate]);

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  if (error || !auction) {
    return <div className="error">{error || 'Không tìm thấy phiên đấu giá'}</div>;
  }

  return (
    <div className="result-page">
      <div className="result-card">
        <h1>Kết Quả Đấu Giá</h1>

        <div className="auction-summary">
          <h2>{auction.title}</h2>
          <p className="description">{auction.description}</p>

          <div className="result-details">
            <div className="detail-item">
              <span className="label">Giá Khởi Điểm</span>
              <span className="value">{auction.startingPrice.toLocaleString('vi-VN')} VND</span>
            </div>
            <div className="detail-item">
              <span className="label">Giá Cuối Cùng</span>
              <span className="value">{auction.finalPrice?.toLocaleString('vi-VN')} VND</span>
            </div>
            <div className="detail-item">
              <span className="label">Tổng Số Lượt Trả Giá</span>
              <span className="value">{bids.length}</span>
            </div>
            <div className="detail-item">
              <span className="label">Thời Gian</span>
              <span className="value">
                {Math.floor((auction.endTime! - auction.startTime!) / 1000)} giây
              </span>
            </div>
          </div>

          {auction.winner && (
            <div className="winner-section">
              <h3>Người Trúng Đấu Giá</h3>
              <div className="winner-info">
                <p className="winner-name">{auction.winner.name}</p>
                <p className="winner-bid">Giá Trúng: {auction.winner.finalBid.toLocaleString('vi-VN')} VND</p>
              </div>
            </div>
          )}
        </div>

        <div className="bid-history">
          <h2>Lịch Sử Đấu Giá</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Vòng</th>
                  <th>Người Tham Gia</th>
                  <th>Số Tiền</th>
                  <th>Thời Gian</th>
                </tr>
              </thead>
              <tbody>
                {bids.map(bid => (
                  <tr key={bid.id}>
                    <td>{bid.round}</td>
                    <td>{bid.bidderName}</td>
                    <td>{bid.amount.toLocaleString('vi-VN')} VND</td>
                    <td>{new Date(bid.timestamp).toLocaleTimeString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="action-buttons">
          <button
            onClick={() => navigate('/setup')}
            className="btn btn-primary"
          >
            Bắt Đầu Phiên Đấu Giá Mới
          </button>
          <button
            onClick={() => navigate('/bid')}
            className="btn btn-secondary"
          >
            Xem Trang Đấu Giá
          </button>
        </div>
      </div>
    </div>
  );
};
