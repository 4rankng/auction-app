import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuction } from '../hooks/useAuction';
import { Bidder, Auction } from '../types';
import * as XLSX from 'xlsx';
import './SetupPage.css';
import AuctionDetails from '../components/AuctionDetails';
import PricingAndDuration from '../components/PricingAndDuration';
import BidderManagement from '../components/BidderManagement';

interface ExcelRow {
  name?: string;
  nric?: string;
  issuingAuthority?: string;
  address?: string;
}

export default function SetupPage() {
  const navigate = useNavigate();
  const { createAuction, createBidder, bidders, refreshData, clearBidders } = useAuction();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newBidder, setNewBidder] = useState<Omit<Bidder, 'id'>>({
    name: '',
    nric: '',
    issuingAuthority: '',
    address: '',
  });
  const [bidderId, setBidderId] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [auctionDetails, setAuctionDetails] = useState({
    title: '',
    description: '',
    startingPrice: 1000,
    priceIncrement: 100,
    duration: 300,
  });
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev: { show: boolean; message: string; type: 'success' | 'error' }) => ({ ...prev, show: false })), 3000);
  };

  // Centralized error handling hook
  const useErrorHandling = () => {
    const [error, setError] = useState<string | null>(null);
    const handleError = (message: string) => {
      setError(message);
      showToast(message, 'error');
    };
    return { error, handleError };
  };

  const { handleError } = useErrorHandling();

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Helper to get cell value safely
  const getCellValue = (worksheet: any, row: number, col: number): string =>
    worksheet[XLSX.utils.encode_cell({ r: row, c: col })]?.v?.toString().trim() || '';

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);

      // Read file and parse workbook
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets['Đủ ĐK'];
      if (!worksheet) {
        handleError('Sheet "Đủ ĐK" not found in the Excel file');
        return;
      }

      // Manually iterate through cells to find "STT"
      let headerRow = -1;
      let headerCol = -1;
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cellValue = getCellValue(worksheet, R, 0);
        if (cellValue.match(/^STT\.?$/i)) {
          headerRow = R;
          headerCol = 0;
          break;
        }
      }

      if (headerRow === -1) {
        handleError('Could not find table header with "STT" in the Excel file');
        return;
      }

      // Validate column headers
      const expectedHeaders = ['STT', 'Họ tên', 'Địa chỉ', 'Giấy CMND/CCCD/ĐKDN', 'Số điện thoại'];
      for (let i = 0; i < expectedHeaders.length; i++) {
        const cellValue = getCellValue(worksheet, headerRow, headerCol + i);
        if (!cellValue.includes(expectedHeaders[i])) {
          handleError('Invalid column structure in Excel file');
          return;
        }
      }

      // Process rows
      const bidders: Bidder[] = [];
      for (let R = headerRow + 1; R <= range.e.r; ++R) {
        const id = getCellValue(worksheet, R, headerCol);
        const name = getCellValue(worksheet, R, headerCol + 1);
        const address = getCellValue(worksheet, R, headerCol + 2);
        const nric = getCellValue(worksheet, R, headerCol + 3);
        const phone = getCellValue(worksheet, R, headerCol + 4);

        if (!id || !name || !address || !nric || !phone) break;

        bidders.push({
          id,
          name,
          address,
          nric,
          phone,
          issuingAuthority: 'NA',
        });
      }

      if (bidders.length === 0) {
        handleError('No valid bidders found');
        return;
      }

      // Replace existing data
      await clearBidders();
      await Promise.all(bidders.map(createBidder));

      showToast(`Imported ${bidders.length} valid bidders`, 'success');
    } catch (error: any) {
      console.error('Import failed:', error);
      handleError(`Error: ${error.message}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBidderId(value);
  };

  const handleAddBidder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bidderData = {
        ...newBidder,
        id: bidderId || undefined, // If empty, let the service auto-assign
      };
      await createBidder(bidderData);
      setNewBidder({
        name: '',
        nric: '',
        issuingAuthority: '',
        address: '',
      });
      setBidderId('');
    } catch (error) {
      console.error('Error adding bidder:', error);
    }
  };

  const handleStartAuction = async () => {
    try {
      // Validate auction configuration
      if (!auctionDetails.title.trim()) {
        handleError('Please provide an auction title');
        return;
      }

      // Validate starting price is a positive number
      if (!auctionDetails.startingPrice || auctionDetails.startingPrice <= 0) {
        handleError('Starting price must be a positive number');
        return;
      }

      // Validate price increment is a positive number
      if (!auctionDetails.priceIncrement || auctionDetails.priceIncrement <= 0) {
        handleError('Minimum bid increment must be a positive number');
        return;
      }

      // Validate duration is a positive number
      if (!auctionDetails.duration || auctionDetails.duration <= 0) {
        handleError('Auction duration must be a positive number');
        return;
      }

      // Validate bidder list
      if (bidders.length < 2) {
        handleError('At least 2 bidders are required to start an auction');
        return;
      }

      const auctionData: Omit<Auction, 'id'> = {
        title: auctionDetails.title.trim(),
        description: auctionDetails.description.trim(),
        status: 'IN_PROGRESS',
        startingPrice: auctionDetails.startingPrice,
        currentPrice: auctionDetails.startingPrice,
        bidStep: auctionDetails.priceIncrement,
        timeLeft: auctionDetails.duration,
        startTime: Date.now(),
        endTime: Date.now() + (auctionDetails.duration * 1000),
        auctionItem: 'Default Item',
        auctioneer: 'Default Auctioneer',
      };

      const newAuction = await createAuction(auctionData);
      showToast('Auction started successfully!', 'success');
      navigate(`/bid?id=${newAuction.id}`);
    } catch (error) {
      console.error('Error starting auction:', error);
      handleError('Failed to start the auction. Please try again.');
    }
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('en-US');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'startingPrice' | 'priceIncrement') => {
    const value = parseInt(e.target.value.replace(/,/g, '')) || 0;
    setAuctionDetails(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container py-4">
      {/* Toast Container */}
      <div className="toast-container position-fixed top-0 end-0 p-3">
        <div className={`toast ${toast.show ? 'show' : ''} ${toast.type === 'success' ? 'bg-success' : 'bg-danger'} text-white`} role="alert">
          <div className="toast-body">
            {toast.message}
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <AuctionDetails
            title={auctionDetails.title}
            description={auctionDetails.description}
            onTitleChange={(e) => setAuctionDetails(prev => ({ ...prev, title: e.target.value }))}
            onDescriptionChange={(e) => setAuctionDetails(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>
        <div className="col-md-6">
          <PricingAndDuration
            startingPrice={auctionDetails.startingPrice}
            priceIncrement={auctionDetails.priceIncrement}
            duration={auctionDetails.duration}
            onPriceChange={handlePriceChange}
            onDurationChange={(e) => setAuctionDetails(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <BidderManagement
        bidders={bidders}
        newBidder={newBidder}
        bidderId={bidderId}
        importing={importing}
        onIdChange={handleIdChange}
        onNewBidderChange={(field, value) => setNewBidder(prev => ({ ...prev, [field]: value }))}
        onAddBidder={handleAddBidder}
        onImportClick={handleImportClick}
        fileInputRef={fileInputRef}
      />

      <div className="d-grid">
        <button
          className="btn btn-success btn-lg"
          onClick={handleStartAuction}
          disabled={bidders.length === 0}
        >
          Start Auction
        </button>
      </div>
    </div>
  );
}
