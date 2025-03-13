import React from 'react';
import { Bidder } from '../types';

interface BidderManagementProps {
  bidders: Bidder[];
  newBidder: Omit<Bidder, 'id'>;
  bidderId: string;
  importing: boolean;
  onIdChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNewBidderChange: (field: keyof Omit<Bidder, 'id'>, value: string) => void;
  onAddBidder: (e: React.FormEvent) => void;
  onImportClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const BidderManagement: React.FC<BidderManagementProps> = React.memo(({ bidders, newBidder, bidderId, importing, onIdChange, onNewBidderChange, onAddBidder, onImportClick, fileInputRef }) => {
  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="card-title mb-0">Bidder Management</h5>
      </div>
      <div className="card-body">
        <div className="mb-4">
          <form onSubmit={onAddBidder}>
            <div className="row g-3 align-items-end">
              <div className="col-md-2">
                <label className="form-label">ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={bidderId}
                  onChange={onIdChange}
                  placeholder="Auto-assigned if empty"
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={newBidder.name}
                  onChange={(e) => onNewBidderChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">NRIC</label>
                <input
                  type="text"
                  className="form-control"
                  value={newBidder.nric}
                  onChange={(e) => onNewBidderChange('nric', e.target.value)}
                  required
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Issuing Authority</label>
                <input
                  type="text"
                  className="form-control"
                  value={newBidder.issuingAuthority}
                  onChange={(e) => onNewBidderChange('issuingAuthority', e.target.value)}
                  required
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-control"
                  value={newBidder.address}
                  onChange={(e) => onNewBidderChange('address', e.target.value)}
                  required
                />
              </div>
              <div className="col-md-2 d-flex gap-2">
                <button type="submit" className="btn btn-primary px-3" style={{ aspectRatio: '1' }}>
                  <i className="bi bi-plus-lg"></i>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="d-none"
                  accept=".xlsx,.xls"
                  onChange={onImportClick}
                />
                <button
                  type="button"
                  className="btn flex-grow-1 excel-import-btn"
                  onClick={onImportClick}
                  disabled={importing}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #217346',
                    color: '#217346',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {importing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Importing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-file-earmark-excel me-2"></i>
                      Import
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>NRIC</th>
                <th>Issuing Authority</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {bidders.map((bidder) => (
                <tr key={bidder.id}>
                  <td>{bidder.id}</td>
                  <td>{bidder.name}</td>
                  <td>{bidder.nric}</td>
                  <td>{bidder.issuingAuthority}</td>
                  <td>{bidder.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export default BidderManagement;
