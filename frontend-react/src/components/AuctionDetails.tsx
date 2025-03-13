import React from 'react';

interface AuctionDetailsProps {
  title: string;
  description: string;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const AuctionDetails: React.FC<AuctionDetailsProps> = React.memo(({ title, description, onTitleChange, onDescriptionChange }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">Auction Details</h5>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <label className="form-label">Title</label>
          <input
            type="text"
            className="form-control"
            value={title}
            onChange={onTitleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            rows={3}
            value={description}
            onChange={onDescriptionChange}
          ></textarea>
        </div>
      </div>
    </div>
  );
});

export default AuctionDetails;
