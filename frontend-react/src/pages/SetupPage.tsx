import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuction } from '../hooks/useAuction';
import { Bidder, Auction } from '../types';
import * as XLSX from 'xlsx';

export const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { createAuction } = useAuction();
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [settings, setSettings] = useState({
    title: '',
    description: '',
    startingPrice: 1000,
    bidStep: 100,
    duration: 300, // 5 minutes in seconds
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const newBidders: Bidder[] = jsonData.map((row: any) => ({
          id: getNextBidderId(),
          name: row.name,
          nric: row.nric,
          issuingAuthority: row.issuingAuthority,
          address: row.address,
        }));

        setBidders(prev => [...prev, ...newBidders]);
      } catch (error) {
        console.error('Error reading Excel file:', error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const getNextBidderId = () => {
    if (bidders.length === 0) return '1';
    const maxId = Math.max(...bidders.map(bidder => parseInt(bidder.id) || 0));
    return (maxId + 1).toString();
  };

  const handleAddBidder = () => {
    const newBidder: Bidder = {
      id: getNextBidderId(),
      name: '',
      nric: '',
      issuingAuthority: '',
      address: '',
    };
    setBidders(prev => [...prev, newBidder]);
  };

  const handleBidderChange = (index: number, field: keyof Bidder, value: string) => {
    setBidders(prev => prev.map((bidder, i) =>
      i === index ? { ...bidder, [field]: value } : bidder
    ));
  };

  const handleStartAuction = async () => {
    try {
      const auctionData: Omit<Auction, 'id'> = {
        title: settings.title,
        description: settings.description,
        status: 'SETUP',
        startingPrice: settings.startingPrice,
        currentPrice: settings.startingPrice,
        bidStep: settings.bidStep,
        timeLeft: settings.duration,
        auctionItem: 'Default Item',
        auctioneer: 'Default Auctioneer',
        startTime: Date.now(),
      };

      await createAuction(auctionData);
      navigate('/bid');
    } catch (error) {
      console.error('Error starting auction:', error);
    }
  };

  return (
    <div className="container py-4">
      <h1 className="text-center mb-4">Auction Setup</h1>

      <div className="row mb-4">
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h2 className="h4 mb-0">Auction Details</h2>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="title" className="form-label">Auction Title</label>
                <input
                  type="text"
                  className="form-control"
                  id="title"
                  value={settings.title}
                  onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter auction title"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  className="form-control"
                  id="description"
                  value={settings.description}
                  onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter auction description"
                  rows={4}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h2 className="h4 mb-0">Auction Settings</h2>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="startingPrice" className="form-label">Starting Price ($)</label>
                <input
                  type="number"
                  className="form-control"
                  id="startingPrice"
                  value={settings.startingPrice}
                  onChange={(e) => setSettings(prev => ({ ...prev, startingPrice: Number(e.target.value) }))}
                  min="0"
                  step="100"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="bidStep" className="form-label">Minimum Bid Increment ($)</label>
                <input
                  type="number"
                  className="form-control"
                  id="bidStep"
                  value={settings.bidStep}
                  onChange={(e) => setSettings(prev => ({ ...prev, bidStep: Number(e.target.value) }))}
                  min="10"
                  step="10"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="duration" className="form-label">Auction Duration (minutes)</label>
                <input
                  type="number"
                  className="form-control"
                  id="duration"
                  value={settings.duration / 60}
                  onChange={(e) => setSettings(prev => ({ ...prev, duration: Number(e.target.value) * 60 }))}
                  min="1"
                  max="60"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h2 className="h4 mb-0">Bidder Management</h2>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-8">
              <input
                type="file"
                className="form-control"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
              />
            </div>
            <div className="col-md-4">
              <button onClick={handleAddBidder} className="btn btn-primary w-100">
                Add Bidder
              </button>
            </div>
          </div>

          <div className="row">
            {bidders.map((bidder, index) => (
              <div key={bidder.id} className="col-md-6 mb-3">
                <div className="card">
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label">ID</label>
                      <input
                        type="text"
                        className="form-control"
                        value={bidder.id}
                        disabled
                        readOnly
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={bidder.name}
                        onChange={(e) => handleBidderChange(index, 'name', e.target.value)}
                        placeholder="Enter bidder name"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">NRIC</label>
                      <input
                        type="text"
                        className="form-control"
                        value={bidder.nric}
                        onChange={(e) => handleBidderChange(index, 'nric', e.target.value)}
                        placeholder="Enter NRIC"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Issuing Authority</label>
                      <input
                        type="text"
                        className="form-control"
                        value={bidder.issuingAuthority}
                        onChange={(e) => handleBidderChange(index, 'issuingAuthority', e.target.value)}
                        placeholder="Enter issuing authority"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Address</label>
                      <input
                        type="text"
                        className="form-control"
                        value={bidder.address}
                        onChange={(e) => handleBidderChange(index, 'address', e.target.value)}
                        placeholder="Enter address"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={handleStartAuction}
          className="btn btn-success btn-lg px-5"
          disabled={!settings.title || !settings.description || bidders.length === 0}
        >
          Start Auction
        </button>
      </div>
    </div>
  );
};
