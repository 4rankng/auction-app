import React, { useEffect, useState } from 'react';
import { auctioneerService } from '../services/auctioneerService';
import './AuctionHeader.css';

interface AuctionHeaderProps {
  title: string;
  elapsedTime: string;
  onEndAuction: () => void;
  totalBids: number;
  isAuctionEnded?: boolean;
  auctioneer?: string;  // This will now be the auctioneer ID
  auctioneerName?: string; // New prop for directly passing auctioneer name
}

/**
 * A reusable component for displaying the auction header with title, elapsed time, and end button
 */
const AuctionHeader: React.FC<AuctionHeaderProps> = ({
  title,
  elapsedTime,
  onEndAuction,
  totalBids,
  isAuctionEnded = false,
  auctioneer = '',
  auctioneerName: propAuctioneerName // Rename to avoid conflict with state
}) => {
  const [auctioneerName, setAuctioneerName] = useState<string>(propAuctioneerName || 'Không có thông tin');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // If auctioneerName is provided in props, use it directly
    if (propAuctioneerName) {
      setAuctioneerName(propAuctioneerName);
      return;
    }

    const fetchAuctioneerDetails = async () => {
      if (!auctioneer) {
        setAuctioneerName('Không có thông tin');
        return;
      }

      setLoading(true);
      try {
        const auctioneerData = await auctioneerService.getAuctioneerById(auctioneer);
        if (auctioneerData) {
          setAuctioneerName(auctioneerData.name);
        } else {
          setAuctioneerName('Không tìm thấy đấu giá viên');
        }
      } catch (err) {
        console.error('Error fetching auctioneer details:', err);
        setAuctioneerName('Lỗi tải thông tin');
      } finally {
        setLoading(false);
      }
    };

    fetchAuctioneerDetails();
  }, [auctioneer, propAuctioneerName]);

  return (
    <div className="auction-header-container">
      <div className="auction-header-info">
        <h3 className="auction-title">{title}</h3>

        <div className="auction-metadata">
          <div className="auction-metadata-item">
            <i className="bi bi-person-badge me-2"></i>
            <span className="auction-metadata-label">Đấu Giá Viên:</span>
            <span className="auction-metadata-value">
              {loading ? (
                <small><i className="bi bi-hourglass-split me-1"></i>Đang tải...</small>
              ) : auctioneerName}
            </span>
          </div>
        </div>
      </div>

      <div className="auction-header-actions">
        <div className="auction-elapsed-time-container">
          <i className="bi bi-stopwatch auction-elapsed-time-icon"></i>
          <span className="auction-elapsed-time">{elapsedTime}</span>
        </div>

        {isAuctionEnded ? (
          <div className="auction-ended-badge">
            <i className="bi bi-stopwatch-fill"></i> Đã Kết Thúc
          </div>
        ) : (
          <button
            className="btn end-auction-btn"
            onClick={onEndAuction}
          >
            <i className="bi bi-stop-circle"></i> Kết Thúc Đấu Giá
          </button>
        )}
      </div>
    </div>
  );
};

export default AuctionHeader;
