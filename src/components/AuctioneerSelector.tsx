import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logger from '../services/loggerService';
import { Auctioneer } from '@types';
import { auctioneerService } from '@services/auctioneerService';

interface AuctioneerSelectorProps {
  value: string;
  onChange: (id: string, name: string) => void;
}

const AuctioneerSelector: React.FC<AuctioneerSelectorProps> = ({ value, onChange }) => {
  const navigate = useNavigate();
  const [auctioneers, setAuctioneers] = useState<Auctioneer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedId, setSelectedId] = useState<string>(value || "");
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    const loadAuctioneers = async () => {
      try {
        setLoading(true);
        const data = await auctioneerService.getAuctioneers();
        setAuctioneers(data || []);
      } catch (err) {
        logger.error('Error loading auctioneers:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAuctioneers();

    // Track window size for responsive design
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleManageAuctioneers = () => {
    navigate('/auctioneers');
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setSelectedId(selectedId);

    if (!selectedId) {
      // Handle empty selection
      onChange("", "");
      return;
    }

    // Find the selected auctioneer to get their name
    const selectedAuctioneer = auctioneers.find(a => a.id === selectedId);
    if (selectedAuctioneer) {
      onChange(selectedId, selectedAuctioneer.name);
    } else {
      logger.error(`Auctioneer with ID ${selectedId} not found`);
      onChange(selectedId, "Unknown");
    }
  };

  const isMobile = windowWidth < 768;

  return (
    <div className="mb-3">
      <div className="mb-2">Đấu Giá Viên</div>
      <div className="d-flex align-items-center">
        <div className="flex-grow-1">
          <select
            className="form-select border border-secondary-subtle rounded"
            value={selectedId}
            onChange={handleSelectChange}
            disabled={loading}
          >
            <option value="">-- Chọn đấu giá viên --</option>
            {auctioneers.map((auctioneer) => (
              <option key={auctioneer.id} value={auctioneer.id}>
                {auctioneer.name}
              </option>
            ))}
          </select>
        </div>
        <button
          className="btn btn-outline-secondary ms-2 border-secondary-subtle"
          type="button"
          onClick={handleManageAuctioneers}
          title="Quản lý Đấu Giá Viên"
          aria-label="Quản lý Đấu Giá Viên"
        >
          <i className="bi bi-gear text-secondary"></i>
          {!isMobile && <span className="ms-1">Quản lý</span>}
        </button>
      </div>

      {loading ? (
        <div className="mt-2 text-muted small">
          <div className="d-flex align-items-center">
            <div className="spinner-border spinner-border-sm me-2 text-secondary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span>Đang tải danh sách đấu giá viên...</span>
          </div>
        </div>
      ) : auctioneers.length === 0 ? (
        <div className="mt-2 text-muted small">
          <div className="d-flex align-items-center">
            <i className="bi bi-exclamation-triangle me-2 text-secondary"></i>
            <span>Chưa có đấu giá viên nào. Hãy thêm đấu giá viên mới.</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AuctioneerSelector;
