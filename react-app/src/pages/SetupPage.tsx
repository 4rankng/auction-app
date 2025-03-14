import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuction } from '../hooks/useAuction';
import {  Auction } from '../types';
import './SetupPage.css';
import AuctionDetails from '../components/AuctionDetails';
import PricingAndDuration from '../components/PricingAndDuration';
import BidderManagement from '../components/BidderManagement';
import { parseBiddersFromExcel } from '../utils/excelParser';
import { Modal, Button, ListGroup } from 'react-bootstrap';

// Define the form input types to match BidderManagement
type BidderFormInputs = {
  id: string;
  name: string;
  nric: string;
  issuingAuthority: string;
  address: string;
};

export default function SetupPage() {
  const navigate = useNavigate();
  const { createAuction, createBidder, bidders, refreshData, clearBidders } = useAuction();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState<boolean>(false);
  const [isStartingAuction, setIsStartingAuction] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
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

  const handleImportClick = () => {
    setImporting(true);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImporting(false);
      return;
    }

    try {
      // Parse the Excel file
      const bidderData = await parseBiddersFromExcel(file);

      // Clear existing bidders
      await clearBidders();

      // Add each bidder from the Excel file
      for (const bidder of bidderData) {
        await createBidder(bidder);
      }

      showToast(`Đã nhập thành công ${bidderData.length} người tham gia`, 'success');
    } catch (error) {
      console.error('Error importing bidders:', error);
      handleError(error instanceof Error ? error.message : 'Không thể nhập người tham gia');
    } finally {
      setImporting(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Updated to accept BidderFormInputs instead of a form event
  const handleAddBidder = async (bidderData: BidderFormInputs) => {
    try {
      // If id is empty, let the service auto-assign
      const bidderToCreate = {
        ...bidderData,
        id: bidderData.id || undefined
      };

      await createBidder(bidderToCreate);
      showToast('Đã thêm người tham gia thành công', 'success');
    } catch (error) {
      console.error('Error adding bidder:', error);
      handleError(error instanceof Error ? error.message : 'Không thể thêm người tham gia');
    }
  };

  const validateAuctionSetup = (): { isValid: boolean; errorMessage?: string } => {
    // Validate auction title
    if (!auctionDetails.title.trim()) {
      return { isValid: false, errorMessage: 'Vui lòng nhập tiêu đề đấu giá' };
    }

    // Validate starting price
    if (!auctionDetails.startingPrice || auctionDetails.startingPrice <= 0) {
      return { isValid: false, errorMessage: 'Giá khởi điểm phải là số dương' };
    }

    // Validate price increment
    if (!auctionDetails.priceIncrement || auctionDetails.priceIncrement <= 0) {
      return { isValid: false, errorMessage: 'Bước giá tối thiểu phải là số dương' };
    }

    // Validate duration
    if (!auctionDetails.duration || auctionDetails.duration <= 0) {
      return { isValid: false, errorMessage: 'Thời gian đấu giá phải là số dương' };
    }

    // Validate bidder list
    if (bidders.length < 2) {
      return { isValid: false, errorMessage: 'Cần ít nhất 2 người tham gia để bắt đầu đấu giá' };
    }

    return { isValid: true };
  };

  const handleConfirmAuction = () => {
    const validation = validateAuctionSetup();

    if (!validation.isValid) {
      handleError(validation.errorMessage || 'Thiết lập đấu giá không hợp lệ');
      return;
    }

    setShowConfirmation(true);
  };

  const handleCloseModal = () => {
    setShowConfirmation(false);
  };

  const handleStartAuction = async () => {
    try {
      setIsStartingAuction(true);

      const validation = validateAuctionSetup();
      if (!validation.isValid) {
        handleError(validation.errorMessage || 'Thiết lập đấu giá không hợp lệ');
        setIsStartingAuction(false);
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
        auctionItem: 'Mặt hàng mặc định',
        auctioneer: 'Người đấu giá mặc định',
      };

      const newAuction = await createAuction(auctionData);
      showToast('Đấu giá đã bắt đầu thành công!', 'success');
      setShowConfirmation(false);

      // Navigate to the bidding page with the auction ID
      navigate(`/bid?id=${newAuction.id}`);
    } catch (error) {
      console.error('Error starting auction:', error);
      handleError('Không thể bắt đầu đấu giá. Vui lòng thử lại.');
      setShowConfirmation(false);
    } finally {
      setIsStartingAuction(false);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'startingPrice' | 'priceIncrement') => {
    const value = parseInt(e.target.value.replace(/,/g, '')) || 0;
    setAuctionDetails(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="setup-page-container">
      {/* Toast Container */}
      <div className="toast-container position-fixed top-0 end-0 p-3">
        <div className={`toast ${toast.show ? 'show' : ''} ${toast.type === 'success' ? 'bg-success' : 'bg-danger'} text-white`} role="alert">
          <div className="toast-body">
            {toast.message}
          </div>
        </div>
      </div>

      <div className="container py-4 mb-5">
        {/* Top section: Auction Details (left) and Pricing & Duration (right) */}
        <div className="row g-4 mb-4 setup-page-row">
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
              onDurationChange={(e) => setAuctionDetails(prev => ({ ...prev, duration: parseInt(e.target.value) || 300 }))}
            />
          </div>
        </div>

        {/* Middle section: Bidder Management (full width) */}
        <div className="row mb-5">
          <div className="col-12">
            <BidderManagement
              bidders={bidders}
              importing={importing}
              onAddBidder={handleAddBidder}
              onImportClick={handleImportClick}
              fileInputRef={fileInputRef}
              onFileChange={handleFileChange}
            />
          </div>
        </div>
      </div>

      {/* Fixed bottom section: Start Auction button (full width) */}
      <div className="start-auction-container">
        <div className="container">
          <button
            className="btn btn-success btn-lg w-100"
            onClick={handleConfirmAuction}
            disabled={bidders.length === 0 || isStartingAuction}
          >
            {isStartingAuction ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Đang Bắt Đầu Đấu Giá...
              </>
            ) : (
              'Bắt Đầu Đấu Giá'
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Modal using React Bootstrap */}
      <Modal show={showConfirmation} onHide={handleCloseModal} centered backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Xác Nhận Bắt Đầu Đấu Giá</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn bắt đầu đấu giá với các thông tin sau?</p>
          <ListGroup className="mb-3">
            <ListGroup.Item className="d-flex justify-content-between">
              <span>Tiêu đề:</span>
              <strong>{auctionDetails.title}</strong>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between">
              <span>Giá khởi điểm:</span>
              <strong>{auctionDetails.startingPrice.toLocaleString('vi-VN')} VND</strong>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between">
              <span>Bước giá:</span>
              <strong>{auctionDetails.priceIncrement.toLocaleString('vi-VN')} VND</strong>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between">
              <span>Thời gian:</span>
              <strong>{auctionDetails.duration} giây</strong>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between">
              <span>Số người tham gia:</span>
              <strong>{bidders.length}</strong>
            </ListGroup.Item>
          </ListGroup>
          <p className="text-muted small">Sau khi bắt đầu, đấu giá không thể được chỉnh sửa.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal} disabled={isStartingAuction}>
            Hủy
          </Button>
          <Button
            variant="success"
            onClick={handleStartAuction}
            disabled={isStartingAuction}
          >
            {isStartingAuction ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Đang bắt đầu...
              </>
            ) : (
              'Bắt Đầu Đấu Giá'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
