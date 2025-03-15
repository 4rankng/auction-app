import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auctioneer } from '../types';
import { auctioneerService } from '../services/auctioneerService';

interface AuctioneerSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const AuctioneerSelector: React.FC<AuctioneerSelectorProps> = ({ value, onChange }) => {
  const navigate = useNavigate();
  const [auctioneers, setAuctioneers] = useState<Auctioneer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadAuctioneers = async () => {
      try {
        setLoading(true);
        const data = await auctioneerService.getAuctioneers();
        setAuctioneers(data || []);
      } catch (err) {
        console.error('Error loading auctioneers:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAuctioneers();
  }, []);

  const handleManageAuctioneers = () => {
    navigate('/auctioneers');
  };

  return (
    <div className="auctioneer-selector">
      <div className="input-group">
        <select
          className="form-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
        >
          <option value="">-- Chọn đấu giá viên --</option>
          {auctioneers.map((auctioneer) => (
            <option key={auctioneer.id} value={auctioneer.id}>
              {auctioneer.name}
            </option>
          ))}
        </select>
        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={handleManageAuctioneers}
          title="Quản lý Đấu Giá Viên"
        >
          <i className="bi bi-gear"></i>
        </button>
      </div>
      {loading ? (
        <div className="form-text">
          <small>
            <i className="bi bi-hourglass-split me-1"></i>
            Đang tải danh sách đấu giá viên...
          </small>
        </div>
      ) : auctioneers.length === 0 ? (
        <div className="form-text text-warning">
          <small>
            <i className="bi bi-exclamation-triangle me-1"></i>
            Chưa có đấu giá viên nào. Hãy thêm đấu giá viên mới.
          </small>
        </div>
      ) : null}
    </div>
  );
};

export default AuctioneerSelector;
