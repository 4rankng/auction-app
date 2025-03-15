import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bidder,
  Auction
} from '../types';
import './SetupPage.css';
import AuctionDetails from '../components/AuctionDetails';
import PricingAndDuration from '../components/PricingAndDuration';
import BidderManagement from '../components/BidderManagement';
import { parseBiddersFromExcel } from '../utils/excelParser';
import { Modal, Button, ListGroup } from 'react-bootstrap';
import { databaseService } from '../services/databaseService';
import { errorService, ErrorType } from '../services/errorService';
import { toastService } from '../services/toastService';
import ToastContainer from '../components/ToastContainer';
import { AUCTION_STATUS, DEFAULT_BID_DURATION, DEFAULT_BID_STEP, DEFAULT_STARTING_PRICE, DEFAULT_AUCTIONEER, DEFAULT_AUCTION_TITLE, DEFAULT_AUCTION_DESCRIPTION } from '../utils/constants';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const DEFAULT_AUCTION_DETAILS = {
    title: DEFAULT_AUCTION_TITLE,
    description: DEFAULT_AUCTION_DESCRIPTION,
    startingPrice: DEFAULT_STARTING_PRICE,
    bidStep: DEFAULT_BID_STEP,
    bidDuration: DEFAULT_BID_DURATION,
    auctioneer: DEFAULT_AUCTIONEER
  }
  // State variables
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [importing, setImporting] = useState<boolean>(false);
  const [isStartingAuction, setIsStartingAuction] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [setupAuctionId, setSetupAuctionId] = useState<string | null>(null);
  const [auctionDetails, setAuctionDetails] = useState(DEFAULT_AUCTION_DETAILS);

  // Load bidders on component mount
  useEffect(() => {
    const loadBidders = async () => {
      try {
        // Check if there's already an auction in setup phase
        const auctions = await databaseService.getAuctions();
        const setupAuction = auctions.find(auction => auction.status === 'SETUP');

        if (setupAuction) {
          // If there's an auction in setup, get its bidders
          setSetupAuctionId(setupAuction.id);
          const auctionBidders = await databaseService.getBidders(setupAuction.id);
          setBidders(auctionBidders);
        } else {
          // Create a temporary auction for setup
          const newAuction = await databaseService.createAuction(
            'Temporary Setup',
            'Temporary auction for setup phase',
            {
              startingPrice: auctionDetails.startingPrice,
              bidStep: auctionDetails.bidStep,
              bidDuration: auctionDetails.bidDuration,
              auctioneer: auctionDetails.auctioneer
            }
          );
          setSetupAuctionId(newAuction.id);
          setBidders([]);
        }
      } catch (error) {
        errorService.handleError(
          'Không thể tải danh sách người tham gia',
          ErrorType.DATABASE,
          error
        );
      }
    };

    loadBidders();
  }, [
    auctionDetails.startingPrice,
    auctionDetails.bidStep,
    auctionDetails.bidDuration,
    auctionDetails.auctioneer
  ]);

  const handleImportClick = () => {
    setImporting(true);
    fileInputRef.current?.click();

    // Add a window focus event to detect when the file dialog is closed without selection
    const handleFocus = () => {
      // Set a short timeout to allow the file change event to trigger first if a file was selected
      setTimeout(() => {
        // If no file was selected, reset the importing state
        setImporting(false);
      }, 300);

      // Remove the event listener after it's been triggered
      window.removeEventListener('focus', handleFocus);
    };

    // Add the focus event listener to the window
    window.addEventListener('focus', handleFocus);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !setupAuctionId) {
      setImporting(false);
      return;
    }

    try {
      // Parse the Excel file
      const bidderData = await parseBiddersFromExcel(file);

      // Clear existing bidders for this auction
      const existingBidders = await databaseService.getBidders(setupAuctionId);
      for (const bidder of existingBidders) {
        try {
          await databaseService.deleteBidder(setupAuctionId, bidder.id);
        } catch (err) {
          console.warn(`Could not delete bidder ${bidder.id}:`, err);
        }
      }

      // Add each bidder from the Excel file
      for (const bidderInfo of bidderData) {
        await databaseService.createBidder(setupAuctionId, bidderInfo);
      }

      // Refresh bidders list
      const updatedBidders = await databaseService.getBidders(setupAuctionId);
      setBidders(updatedBidders);

      toastService.success(`Đã nhập thành công ${bidderData.length} người tham gia`);
    } catch (error) {
      console.error('Error importing bidders:', error);
      errorService.handleError(
        errorService.formatErrorMessage(error) || 'Không thể nhập người tham gia',
        ErrorType.DATABASE,
        error
      );
    } finally {
      setImporting(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle adding a new bidder
  const handleAddBidder = async (bidderData: BidderFormInputs) => {
    if (!setupAuctionId) {
      errorService.handleError('Không thể thêm người tham gia khi chưa thiết lập phiên đấu giá', ErrorType.VALIDATION);
      return;
    }

    try {
      // Create bidder object
      const bidderToCreate = {
        id: bidderData.id || undefined,
        name: bidderData.name,
        nric: bidderData.nric, // Use nric property
        issuingAuthority: bidderData.issuingAuthority,
        address: bidderData.address
      };

      await databaseService.createBidder(setupAuctionId, bidderToCreate);

      // Refresh bidders list
      const updatedBidders = await databaseService.getBidders(setupAuctionId);
      setBidders(updatedBidders);

      toastService.success('Đã thêm người tham gia thành công');
    } catch (error) {
      console.error('Error adding bidder:', error);
      errorService.handleError(
        errorService.formatErrorMessage(error) || 'Không thể thêm người tham gia',
        ErrorType.DATABASE,
        error
      );
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

    // Validate price increment (bidStep)
    if (!auctionDetails.bidStep || auctionDetails.bidStep <= 0) {
      return { isValid: false, errorMessage: 'Bước giá tối thiểu phải là số dương' };
    }

    // Validate duration
    if (!auctionDetails.bidDuration || auctionDetails.bidDuration <= 0) {
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
      errorService.handleError(
        validation.errorMessage || 'Thiết lập đấu giá không hợp lệ',
        ErrorType.VALIDATION
      );
      return;
    }

    setShowConfirmation(true);
  };

  const handleCloseModal = () => {
    setShowConfirmation(false);
  };

  const handleStartAuction = async () => {
    if (!setupAuctionId) {
      errorService.handleError('Không tìm thấy phiên đấu giá để bắt đầu', ErrorType.DATABASE);
      setShowConfirmation(false);
      return;
    }

    try {
      setIsStartingAuction(true);

      const validation = validateAuctionSetup();
      if (!validation.isValid) {
        errorService.handleError(
          validation.errorMessage || 'Thiết lập đấu giá không hợp lệ',
          ErrorType.VALIDATION
        );
        setIsStartingAuction(false);
        return;
      }

      // Get the setup auction and update it
      const setupAuction = await databaseService.getAuctionById(setupAuctionId);
      if (!setupAuction) {
        throw new Error('Không tìm thấy phiên đấu giá để bắt đầu');
      }

      // Update the auction with final details
      const updatedAuction: Auction = {
        ...setupAuction,
        title: auctionDetails.title.trim(),
        description: auctionDetails.description.trim(),
        status: AUCTION_STATUS.IN_PROGRESS,
        currentPrice: auctionDetails.startingPrice,
        settings: {
          ...setupAuction.settings,
          startingPrice: auctionDetails.startingPrice,
          bidStep: auctionDetails.bidStep,
          bidDuration: auctionDetails.bidDuration,
          auctioneer: auctionDetails.auctioneer
        },
        startTime: Date.now()
      };

      await databaseService.updateAuction(updatedAuction);
      toastService.success('Đấu giá đã bắt đầu thành công!');
      setShowConfirmation(false);

      // Navigate to the bidding page with the auction ID
      navigate(`/bid?id=${setupAuctionId}`);
    } catch (error) {
      console.error('Error starting auction:', error);
      errorService.handleError(
        errorService.formatErrorMessage(error) || 'Không thể bắt đầu đấu giá. Vui lòng thử lại.',
        ErrorType.DATABASE,
        error
      );
      setShowConfirmation(false);
    } finally {
      setIsStartingAuction(false);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'startingPrice' | 'priceIncrement') => {
    const value = parseInt(e.target.value.replace(/,/g, '')) || 0;

    // Map priceIncrement to bidStep in our state
    const stateField = field === 'priceIncrement' ? 'bidStep' : field;
    setAuctionDetails(prev => ({ ...prev, [stateField]: value }));
  };

  return (
    <div className="setup-page-container">
      {/* Use the ToastContainer component */}
      <ToastContainer position="top-right" />

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
              priceIncrement={auctionDetails.bidStep}
              duration={auctionDetails.bidDuration}
              onPriceChange={handlePriceChange}
              onDurationChange={(e) => setAuctionDetails(prev => ({ ...prev, bidDuration: parseInt(e.target.value) || 300 }))}
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
              <strong>{auctionDetails.bidStep.toLocaleString('vi-VN')} VND</strong>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between">
              <span>Thời gian:</span>
              <strong>{auctionDetails.bidDuration} giây</strong>
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
