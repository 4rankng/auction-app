import React from 'react';
import { Bidder } from '../types';
import './BidderManagement.css';

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
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const BidderManagement: React.FC<BidderManagementProps> = React.memo(({ bidders, newBidder, bidderId, importing, onIdChange, onNewBidderChange, onAddBidder, onImportClick, fileInputRef, onFileChange }) => {
  return (
    <div className="card mb-4 bidder-management-card">
      <div className="card-header d-flex justify-content-between align-items-center">
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
                  onChange={onFileChange}
                />
                <button
                  type="button"
                  className="btn excel-import-btn flex-grow-1"
                  onClick={onImportClick}
                  disabled={importing}
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
              {bidders.length > 0 ? (
                bidders.map((bidder) => (
                  <tr key={bidder.id}>
                    <td>{bidder.id}</td>
                    <td>{bidder.name}</td>
                    <td>{bidder.nric}</td>
                    <td>{bidder.issuingAuthority}</td>
                    <td>{bidder.address}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-3">
                    No bidders added yet. Add bidders using the form above or import from Excel.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export default BidderManagement;
