import React from 'react';

interface AuctionDetailsProps {
  title: string;
  description: string;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const AuctionDetails: React.FC<AuctionDetailsProps> = ({
  title,
  description,
  onTitleChange,
  onDescriptionChange
}) => {
  return (
    <div className="card h-100">
      <div className="card-header">
        <h5 className="card-title mb-0">Thông Tin Đấu Giá</h5>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <label className="form-label">Tiêu Đề Đấu Giá</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={onTitleChange}
            placeholder="Nhập tiêu đề đấu giá"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Mô Tả Đấu Giá</label>
          <textarea
            className="form-control"
            rows={4}
            value={description}
            onChange={onDescriptionChange}
            placeholder="Nhập mô tả chi tiết về đấu giá"
          />
        </div>
      </div>
    </div>
  );
};

export default AuctionDetails;
