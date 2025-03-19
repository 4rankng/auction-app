import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
        console.error('Error loading auctioneers:', err);
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
      console.error(`Auctioneer with ID ${selectedId} not found`);
      onChange(selectedId, "Unknown");
    }
  };

  const isMobile = windowWidth < 768;

  return (
    <div className="auctioneer-selector-wrapper">
      <div className="input-group auctioneer-input-group">
        <div className="form-select-container w-100">
          <select
            className="form-select mobile-select"
            value={selectedId}
            onChange={handleSelectChange}
            disabled={loading}
            style={{ paddingRight: '30px' }}
          >
            <option value="">-- Chọn đấu giá viên --</option>
            {auctioneers.map((auctioneer) => (
              <option key={auctioneer.id} value={auctioneer.id}>
                {auctioneer.name}
              </option>
            ))}
          </select>
          <i className="bi bi-chevron-down dropdown-indicator"></i>
        </div>
        <button
          className="btn btn-outline-secondary auctioneer-button"
          type="button"
          onClick={handleManageAuctioneers}
          title="Quản lý Đấu Giá Viên"
          aria-label="Quản lý Đấu Giá Viên"
        >
          <i className="bi bi-gear"></i>
          {!isMobile && <span className="ms-1">Quản lý</span>}
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
