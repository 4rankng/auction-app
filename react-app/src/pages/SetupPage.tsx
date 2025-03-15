import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bidder,
  Auction
} from '../types';
import './SetupPage.css';

import { parseBiddersFromExcel } from '../utils/excelParser';
import { Modal, Button, ListGroup } from 'react-bootstrap';
import { databaseService } from '../services/databaseService';
import { errorService, ErrorType } from '../services/errorService';
import { toastService } from '../services/toastService';
import ToastContainer from '../components/ToastContainer';
import { AUCTION_STATUS, DEFAULT_BID_DURATION, DEFAULT_BID_STEP, DEFAULT_STARTING_PRICE, DEFAULT_AUCTION_TITLE, DEFAULT_AUCTION_DESCRIPTION } from '../utils/constants';
import AuctioneerSelector from '../components/AuctioneerSelector';

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
    auctioneer: "",
    auctioneerId: "",
    bidRound: "1" // Default bid round
  }
  // State variables
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [importing, setImporting] = useState<boolean>(false);
  const [isStartingAuction, setIsStartingAuction] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [setupAuctionId, setSetupAuctionId] = useState<string | null>(null);
  const [auctionDetails, setAuctionDetails] = useState(DEFAULT_AUCTION_DETAILS);

  // Store default values in a ref to avoid dependency issues
  const defaultSettingsRef = useRef({
    startingPrice: DEFAULT_STARTING_PRICE,
    bidStep: DEFAULT_BID_STEP,
    bidDuration: DEFAULT_BID_DURATION,
    auctioneer: "",
    bidRound: "1"
  });

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

          // Update auctionDetails with the existing settings
          setAuctionDetails(prevDetails => ({
            ...prevDetails,
            title: setupAuction.title || DEFAULT_AUCTION_TITLE,
            description: setupAuction.description || DEFAULT_AUCTION_DESCRIPTION,
            startingPrice: setupAuction.settings.startingPrice || DEFAULT_STARTING_PRICE,
            bidStep: setupAuction.settings.bidStep || DEFAULT_BID_STEP,
            bidDuration: setupAuction.settings.bidDuration || DEFAULT_BID_DURATION,
            auctioneer: setupAuction.settings.auctioneer || "",
            auctioneerId: setupAuction.settings.auctioneerId || "",
            bidRound: setupAuction.settings.bidRound || "1"
          }));
        } else {
          // Create a temporary auction for setup using default values from ref
          const defaults = defaultSettingsRef.current;
          const newAuction = await databaseService.createAuction(
            DEFAULT_AUCTION_TITLE,
            DEFAULT_AUCTION_DESCRIPTION,
            {
              startingPrice: defaults.startingPrice,
              bidStep: defaults.bidStep,
              bidDuration: defaults.bidDuration,
              auctioneer: defaults.auctioneer,
              bidRound: defaults.bidRound
            }
          );
          setSetupAuctionId(newAuction.id);
          setBidders([]);
        }
      } catch (error) {
        // Show toast message directly
        toastService.error('Không thể tải danh sách người tham gia');

        // Still log via error service but don't rely on it for UI
        errorService.handleError(
          'Không thể tải danh sách người tham gia',
          ErrorType.DATABASE,
          error
        );
      }
    };

    loadBidders();
  }, []);

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
      // Show toast message directly
      toastService.error(errorService.formatErrorMessage(error) || 'Không thể nhập người tham gia');

      // Still log via error service but don't rely on it for UI
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

    // Validate auctioneer
    if (!auctionDetails.auctioneer) {
      return { isValid: false, errorMessage: 'Vui lòng chọn đấu giá viên' };
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
      // Show validation error as toast message
      toastService.warning(validation.errorMessage || 'Thiết lập đấu giá không hợp lệ');

      // Still log the error through the error service
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
      // Show toast message directly for this error
      toastService.error('Không tìm thấy phiên đấu giá để bắt đầu');

      errorService.handleError('Không tìm thấy phiên đấu giá để bắt đầu', ErrorType.DATABASE);
      setShowConfirmation(false);
      return;
    }

    try {
      setIsStartingAuction(true);

      const validation = validateAuctionSetup();
      if (!validation.isValid) {
        // Show toast message directly for validation errors
        toastService.warning(validation.errorMessage || 'Thiết lập đấu giá không hợp lệ');

        errorService.handleError(
          validation.errorMessage || 'Thiết lập đấu giá không hợp lệ',
          ErrorType.VALIDATION
        );
        setIsStartingAuction(false);
        setShowConfirmation(false);
        return;
      }

      // Get the setup auction and update it
      const setupAuction = await databaseService.getAuctionById(setupAuctionId);
      if (!setupAuction) {
        toastService.error('Không tìm thấy phiên đấu giá để bắt đầu');
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
          auctioneer: auctionDetails.auctioneer,
          auctioneerId: auctionDetails.auctioneerId,
          bidRound: auctionDetails.bidRound // Add bidRound to settings
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

      // Show explicit toast error message
      const errorMessage = errorService.formatErrorMessage(error) || 'Không thể bắt đầu đấu giá. Vui lòng thử lại.';
      toastService.error(errorMessage);

      // Still log via error service
      errorService.handleError(
        errorMessage,
        ErrorType.DATABASE,
        error
      );
      setShowConfirmation(false);
    } finally {
      setIsStartingAuction(false);
    }
  };

  // Event handlers for form inputs
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuctionDetails(prev => ({
      ...prev,
      title: e.target.value
    }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAuctionDetails(prev => ({
      ...prev,
      description: e.target.value
    }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'startingPrice' | 'bidStep') => {
    const valueStr = e.target.value.replace(/\D/g, '');
    const value = valueStr ? parseInt(valueStr) : 0;

    setAuctionDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuctionDetails(prev => ({
      ...prev,
      bidDuration: e.target.valueAsNumber || DEFAULT_BID_DURATION
    }));
  };

  const handleAuctioneerChange = (id: string, name: string) => {
    setAuctionDetails(prev => ({
      ...prev,
      auctioneer: name,
      auctioneerId: id
    }));
  };

  // Add a handler for bidRound changes
  const handleBidRoundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuctionDetails(prev => ({
      ...prev,
      bidRound: e.target.value
    }));
  };

  return (
    <div className="setup-page-container">
      <h1 className="mt-4 mb-4 text-center">Thiết Lập Đấu Giá</h1>

      <div className="container">
        <div className="row">
          {/* Left column - Thông Tin */}
          <div className="col-md-6 mb-4">
            <div className="card outline-card h-100">
              <div className="card-header">
                <h5 className="card-title mb-0">Thông Tin</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Tiêu Đề Đấu Giá</label>
                  <input
                    type="text"
                    className="form-control"
                    value={auctionDetails.title}
                    onChange={handleTitleChange}
                    placeholder="Nhập tiêu đề đấu giá"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Mô Tả Đấu Giá</label>
                  <textarea
                    className="form-control"
                    rows={5}
                    value={auctionDetails.description}
                    onChange={handleDescriptionChange}
                    placeholder="Nhập mô tả chi tiết về đấu giá"
                  />
                </div>
          </div>
        </div>
      </div>

          {/* Right column - Cài Đặt */}
          <div className="col-md-6 mb-4">
            <div className="card outline-card h-100">
              <div className="card-header">
                <h5 className="card-title mb-0">Cài Đặt</h5>
              </div>
              <div className="card-body">
                {/* First row: Giá Khởi Điểm and Bước Giá */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Giá Khởi Điểm</label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={auctionDetails.startingPrice.toLocaleString('vi-VN')}
                        onChange={(e) => handlePriceChange(e, 'startingPrice')}
                      />
                      <span className="input-group-text">VND</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Bước Giá</label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={auctionDetails.bidStep.toLocaleString('vi-VN')}
                        onChange={(e) => handlePriceChange(e, 'bidStep')}
                      />
                      <span className="input-group-text">VND</span>
                    </div>
                  </div>
                </div>

                {/* Second row: Thời Gian and Vòng Đấu Giá */}
                <div className="row mb-3">
          <div className="col-md-6">
                    <label className="form-label">Thời Gian (giây)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={auctionDetails.bidDuration}
                      onChange={handleDurationChange}
                      min="60"
            />
          </div>
          <div className="col-md-6">
                    <label className="form-label">Vòng Đấu Giá</label>
                    <input
                      type="text"
                      className="form-control"
                      value={auctionDetails.bidRound}
                      onChange={handleBidRoundChange}
                      placeholder="Nhập số vòng đấu giá"
                    />
                  </div>
                </div>

                {/* Third row: Đấu Giá Viên */}
                <div className="row mb-3">
                  <div className="col-md-12">
                    <label className="form-label">Đấu Giá Viên</label>
                    <AuctioneerSelector
                      value={auctionDetails.auctioneerId}
                      onChange={handleAuctioneerChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section - Người Tham Gia */}
        <div className="row">
          <div className="col-12">
            <div className="card outline-card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Người Tham Gia</h5>
              </div>
              <div className="card-body">
                <div className="mb-4">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const bidderData = {
                      id: formData.get('id') as string || '',
                      name: formData.get('name') as string || '',
                      nric: formData.get('nric') as string || '',
                      issuingAuthority: formData.get('issuingAuthority') as string || '',
                      address: formData.get('address') as string || '',
                    };

                    if (bidderData.name && bidderData.nric) {
                      handleAddBidder(bidderData);
                      e.currentTarget.reset();
                    }
                  }}>
                    <div className="row g-3 align-items-end">
                      <div className="col-md-2">
                        <label className="form-label">Mã Số</label>
                        <input
                          type="text"
                          name="id"
                          className="form-control"
                          placeholder="Tự động nếu để trống"
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Tên</label>
                        <input
                          type="text"
                          name="name"
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">CMND/CCCD</label>
                        <input
                          type="text"
                          name="nric"
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Nơi Cấp</label>
                        <input
                          type="text"
                          name="issuingAuthority"
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Địa Chỉ</label>
                        <input
                          type="text"
                          name="address"
                          className="form-control"
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
                          onChange={handleFileChange}
                        />
                        <button
                          type="button"
                          className="btn excel-import-btn flex-grow-1"
                          onClick={handleImportClick}
                          disabled={importing}
                        >
                          <i className="bi bi-file-earmark-excel me-2"></i>
                          Excel
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Mã Số</th>
                        <th>Tên</th>
                        <th>CMND/CCCD</th>
                        <th>Nơi Cấp</th>
                        <th>Địa Chỉ</th>
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
                            Chưa có người tham gia. Thêm người tham gia bằng biểu mẫu ở trên hoặc nhập từ Excel.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Start Auction Button */}
      <div className="start-auction-container">
        <div className="container">
          <button
            className="btn btn-success btn-lg w-100"
            onClick={handleConfirmAuction}
            disabled={isStartingAuction}
          >
            {isStartingAuction ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Đang Bắt Đầu...
              </>
            ) : (
              'Bắt Đầu Đấu Giá'
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal show={showConfirmation} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác Nhận Bắt Đầu Đấu Giá</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn bắt đầu phiên đấu giá với thông tin sau?</p>

          <ListGroup className="mb-3">
            <ListGroup.Item><strong>Tiêu đề:</strong> {auctionDetails.title}</ListGroup.Item>
            <ListGroup.Item><strong>Giá khởi điểm:</strong> {auctionDetails.startingPrice.toLocaleString('vi-VN')} VND</ListGroup.Item>
            <ListGroup.Item><strong>Bước giá:</strong> {auctionDetails.bidStep.toLocaleString('vi-VN')} VND</ListGroup.Item>
            <ListGroup.Item><strong>Thời gian:</strong> {auctionDetails.bidDuration} giây</ListGroup.Item>
            <ListGroup.Item><strong>Vòng Đấu Giá:</strong> {auctionDetails.bidRound}</ListGroup.Item>
            <ListGroup.Item><strong>Đấu Giá Viên:</strong> {auctionDetails.auctioneer || 'Chưa chọn'}</ListGroup.Item>
            <ListGroup.Item><strong>Người tham gia:</strong> {bidders.length}</ListGroup.Item>
          </ListGroup>

          <p className="mb-0 text-danger">Lưu ý: Sau khi bắt đầu, bạn không thể chỉnh sửa thông tin đấu giá!</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
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
                Đang Bắt Đầu...
              </>
            ) : (
              'Bắt Đầu Đấu Giá'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}
