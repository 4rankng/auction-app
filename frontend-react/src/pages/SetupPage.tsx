import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Spinner, Form } from 'react-bootstrap';
import BidderForm from '../components/bidders/BidderForm';
import BidderImport from '../components/bidders/BidderImport';
import Modal from 'react-bootstrap/Modal';
import { useToast } from '../contexts/ToastContext';
import databaseService from '../services/databaseService';
import { Auction, Bidder } from '../models/types';
import { ROUTES, AUCTION_STATUS } from '../models/constants';
import './SetupPage.css';

const SetupPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddBidderModal, setShowAddBidderModal] = useState(false);
  const [startingPrice, setStartingPrice] = useState(0);
  const [bidStep, setBidStep] = useState(1000);
  const [auctionItem, setAuctionItem] = useState('');
  const [auctioneer, setAuctioneer] = useState('');
  const [newBidder, setNewBidder] = useState({
    id: '',
    name: '',
    idNumber: '',
    issuingAuthority: '',
    address: ''
  });

  const canStartAuction = startingPrice > 0 && bidStep >= 1000 && auctionItem && auctioneer && bidders.length > 0;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load bidders
        const allBidders = await databaseService.bidder.getAll();
        setBidders(allBidders);

        // If we have an auction ID, load that auction
        if (id) {
          const auctionData = await databaseService.auction.getById(id);
          if (auctionData) {
            setAuction(auctionData);
            setStartingPrice(auctionData.startingPrice);
            setBidStep(auctionData.bidStep);
            setAuctionItem(auctionData.auctionItem);
            setAuctioneer(auctionData.auctioneer);
          } else {
            showToast('Auction not found', 'error');
            navigate(ROUTES.SETUP);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        showToast('Failed to load data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, navigate, showToast]);

  const handleBidderAdded = async () => {
    try {
      const allBidders = await databaseService.bidder.getAll();
      setBidders(allBidders);
      setShowAddBidderModal(false);
    } catch (error) {
      console.error('Error reloading bidders:', error);
    }
  };

  const handleAddBidder = async () => {
    // Validate required fields
    if (!newBidder.id || !newBidder.name) {
      showToast('Participant ID and Name are required', 'error');
      return;
    }

    // Check for duplicate ID
    if (bidders.some(bidder => bidder.id === newBidder.id)) {
      showToast('Participant ID already exists', 'error');
      return;
    }

    try {
      const bidderData = {
        ...newBidder,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await databaseService.bidder.create(bidderData);
      const allBidders = await databaseService.bidder.getAll();
      setBidders(allBidders);

      // Reset form
      setNewBidder({
        id: '',
        name: '',
        idNumber: '',
        issuingAuthority: '',
        address: ''
      });

      showToast('Participant added successfully', 'success');
    } catch (error) {
      console.error('Error adding participant:', error);
      showToast('Failed to add participant', 'error');
    }
  };

  const handleDeleteBidder = async (id: string) => {
    try {
      await databaseService.bidder.delete(id);
      const allBidders = await databaseService.bidder.getAll();
      setBidders(allBidders);
      showToast('Participant deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting participant:', error);
      showToast('Failed to delete participant', 'error');
    }
  };

  const handleStartAuction = async () => {
    let auctionId: string;

    if (!auction) {
      // Create new auction if none exists
      try {
        const newAuction = await databaseService.auction.create({
          title: auctionItem,
          startingPrice,
          currentPrice: startingPrice,
          bidStep,
          auctionItem,
          auctioneer,
          status: AUCTION_STATUS.SETUP,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        setAuction(newAuction);
        auctionId = newAuction.id;
      } catch (error) {
        console.error('Error creating auction:', error);
        showToast('Failed to create auction', 'error');
        return;
      }
    } else {
      auctionId = auction.id;
    }

    setIsStarting(true);

    try {
      const updatedAuction = await databaseService.auction.start(auctionId);
      showToast('Auction started successfully', 'success');
      navigate(`${ROUTES.BID}/${updatedAuction.id}`);
    } catch (error) {
      console.error('Error starting auction:', error);
      showToast('Failed to start auction', 'error');
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <span className="ms-2">Loading setup page...</span>
      </div>
    );
  }

  return (
    <div className="setup-page">
      <div className="page-header">
        <h1>Auction Setup</h1>
        <div className="action-buttons">
          <Button
            variant="outline-primary"
            className="me-2"
            onClick={() => setShowImportModal(true)}
          >
            <i className="bi bi-file-earmark-excel me-2"></i>
            Import Excel
          </Button>
          <Button
            variant="success"
            onClick={handleStartAuction}
            disabled={!canStartAuction || isStarting}
          >
            <i className="bi bi-play-fill me-2"></i>
            Start Auction
          </Button>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <Card className="auction-details-card">
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Auction Details
              </h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Starting Price</Form.Label>
                      <div className="currency-input">
                        <Form.Control
                          type="number"
                          value={startingPrice}
                          onChange={(e) => setStartingPrice(Number(e.target.value))}
                          min="0"
                          step="1000"
                          placeholder="Enter starting price"
                        />
                      </div>
                      <Form.Text className="text-muted">
                        Starting price must be greater than 0
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Bid Step</Form.Label>
                      <div className="currency-input">
                        <Form.Control
                          type="number"
                          value={bidStep}
                          onChange={(e) => setBidStep(Number(e.target.value))}
                          min="1000"
                          step="1000"
                          placeholder="Enter bid step"
                        />
                      </div>
                      <Form.Text className="text-muted">
                        Bid step must be greater than or equal to 1,000 VND
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Auction Item</Form.Label>
                      <Form.Control
                        type="text"
                        value={auctionItem}
                        onChange={(e) => setAuctionItem(e.target.value)}
                        placeholder="Enter item name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Auctioneer</Form.Label>
                      <Form.Select
                        value={auctioneer}
                        onChange={(e) => setAuctioneer(e.target.value)}
                      >
                        <option value="">Select auctioneer</option>
                        <option value="John Smith">John Smith</option>
                        <option value="Jane Doe">Jane Doe</option>
                        <option value="Mike Johnson">Mike Johnson</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <Card className="bidders-card">
            <Card.Header>
              <h5 className="mb-0">
                <i className="bi bi-people me-2"></i>
                Participant List
              </h5>
            </Card.Header>
            <Card.Body>
              <Form className="mb-4">
                <Row>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Control
                        type="text"
                        value={newBidder.id}
                        onChange={(e) => setNewBidder({ ...newBidder, id: e.target.value })}
                        placeholder="ID"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Control
                        type="text"
                        value={newBidder.name}
                        onChange={(e) => setNewBidder({ ...newBidder, name: e.target.value })}
                        placeholder="Name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Control
                        type="text"
                        value={newBidder.idNumber}
                        onChange={(e) => setNewBidder({ ...newBidder, idNumber: e.target.value })}
                        placeholder="ID Number"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Control
                        type="text"
                        value={newBidder.issuingAuthority}
                        onChange={(e) => setNewBidder({ ...newBidder, issuingAuthority: e.target.value })}
                        placeholder="Issuing Authority"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Control
                        type="text"
                        value={newBidder.address}
                        onChange={(e) => setNewBidder({ ...newBidder, address: e.target.value })}
                        placeholder="Address"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Button
                      variant="primary"
                      onClick={handleAddBidder}
                      className="w-100"
                    >
                      <i className="bi bi-plus-lg me-2"></i>
                      Add
                    </Button>
                  </Col>
                </Row>
              </Form>

              {bidders.length === 0 ? (
                <div className="empty-bidders text-center">
                  <i className="bi bi-people fa-3x mb-3"></i>
                  <p className="text-muted">No participants yet</p>
                </div>
              ) : (
                <div className="bidder-list">
                  {bidders.map((bidder) => (
                    <div key={bidder.id} className="bidder-item">
                      <div className="bidder-avatar">
                        <i className="bi bi-person"></i>
                      </div>
                      <div className="bidder-info">
                        <div className="bidder-name">{bidder.name}</div>
                        <div className="bidder-contact">
                          <div>ID: {bidder.id}</div>
                          <div>ID Number: {bidder.idNumber}</div>
                          <div>Issuing Authority: {bidder.issuingAuthority}</div>
                          <div>Address: {bidder.address}</div>
                        </div>
                      </div>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteBidder(bidder.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Import Bidders Modal */}
      <Modal
        show={showImportModal}
        onHide={() => setShowImportModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Import Bidders</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <BidderImport onImportSuccess={() => {
            handleBidderAdded();
            setShowImportModal(false);
          }} />
        </Modal.Body>
      </Modal>

      {/* Add Bidder Modal */}
      <Modal
        show={showAddBidderModal}
        onHide={() => setShowAddBidderModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Bidder</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <BidderForm onBidderAdded={handleBidderAdded} />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default SetupPage;
