import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Badge } from 'react-bootstrap';
import BidHistory from '../components/bids/BidHistory';
import { useToast } from '../contexts/ToastContext';
import databaseService from '../services/databaseService';
import { AuctionResult, Auction, Bid, Bidder } from '../models/types';
import { ROUTES, AUCTION_STATUS } from '../models/constants';
import * as XLSX from 'xlsx';
import './ResultPage.css';

const ResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [result, setResult] = useState<AuctionResult | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [bidders, setBidders] = useState<Record<string, Bidder>>({});
  const [winnerBidder, setWinnerBidder] = useState<Bidder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        navigate(ROUTES.HOME);
        return;
      }

      setIsLoading(true);

      try {
        // First, try to get the auction
        const auctionData = await databaseService.auction.getById(id);

        if (!auctionData) {
          showToast('Auction not found', 'error');
          navigate(ROUTES.HOME);
          return;
        }

        setAuction(auctionData);

        // Get all bids for this auction
        const auctionBids = await databaseService.bid.getAllForAuction(id);
        setBids(auctionBids);

        // Get all bidders
        const allBidders = await databaseService.bidder.getAll();
        const biddersMap: Record<string, Bidder> = {};
        allBidders.forEach(bidder => {
          biddersMap[bidder.id] = bidder;
        });
        setBidders(biddersMap);

        // If the auction has ended, get the result
        if (auctionData.status === AUCTION_STATUS.ENDED) {
          const auctionResult = await databaseService.auction.getResult(id);
          if (auctionResult) {
            setResult(auctionResult);
            // If there's a winner, get their details
            if (auctionResult.winner) {
              const winnerData = await databaseService.bidder.getById(auctionResult.winner);
              if (winnerData) {
                setWinnerBidder(winnerData);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading auction data:', error);
        showToast('Failed to load auction data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, navigate, showToast]);

  const exportToExcel = () => {
    if (!auction || !result) return;

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();

    // Auction summary data
    const summaryData = [
      ['Auction Report', ''],
      ['', ''],
      ['Auction ID', auction.id || 'Unknown'],
      ['Title', auction.title || 'Unknown'],
      ['Description', auction.description || ''],
      ['Status', auction.status],
      ['', ''],
      ['Starting Price', databaseService.formatCurrency(auction.startingPrice)],
      ['Current Price', databaseService.formatCurrency(auction.currentPrice)],
      ['Bid Step', databaseService.formatCurrency(auction.bidStep)],
      ['Created At', new Date(auction.createdAt).toLocaleString()],
      ['Updated At', auction.updatedAt ? new Date(auction.updatedAt).toLocaleString() : ''],
      ['', ''],
    ];

    // Add result information if auction has ended
    if (result) {
      summaryData.push(
        ['Final Price', databaseService.formatCurrency(result.finalPrice)],
        ['Start Time', result.startTime ? new Date(result.startTime).toLocaleString() : 'N/A'],
        ['End Time', new Date(result.endTime).toLocaleString()],
        ['Total Bids', result.totalBids.toString()],
        ['Total Bidders', result.totalBidders?.toString() || 'N/A'],
        ['', ''],
        ['Winner Information', '']
      );

      // Add winner information if exists
      if (winnerBidder) {
        summaryData.push(
          ['Name', winnerBidder.name],
          ['Phone', winnerBidder.phone || ''],
          ['Email', winnerBidder.email || ''],
          ['Address', winnerBidder.address || ''],
          ['Winning Bid', databaseService.formatCurrency(result.finalPrice)]
        );
      } else {
        summaryData.push(['No winner (no bids were placed)', '']);
      }
    }

    // Add summary worksheet
    const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Auction Summary');

    // Bid history data
    const bidHistoryHeaders = ['Time', 'Bidder', 'Amount'];
    const bidHistoryData = [bidHistoryHeaders];

    if (bids && bids.length > 0) {
      bids.forEach(bid => {
        const bidder = bidders[bid.bidderId];
        bidHistoryData.push([
          new Date(bid.timestamp).toLocaleString(),
          bidder ? bidder.name : 'Unknown Bidder',
          databaseService.formatCurrency(bid.amount)
        ]);
      });
    }

    // Add bid history worksheet
    const bidHistoryWorksheet = XLSX.utils.aoa_to_sheet(bidHistoryData);
    XLSX.utils.book_append_sheet(workbook, bidHistoryWorksheet, 'Bid History');

    // Generate Excel file and trigger download
    const timestamp = new Date().getTime();
    XLSX.writeFile(workbook, `auction-report-${timestamp}.xlsx`);

    showToast('Report exported successfully', 'success');
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <span className="ms-2">Loading auction details...</span>
      </div>
    );
  }

  if (!auction) {
    return (
      <Container className="py-5 text-center">
        <h2 className="mb-3">Auction Not Found</h2>
        <p className="text-muted mb-4">The auction you're looking for doesn't exist</p>
        <Button variant="primary" onClick={() => navigate(ROUTES.HOME)}>
          Go to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center page-header">
        <div>
          <h1 className="mb-1">{auction.title}</h1>
          <Badge bg={
            auction.status === AUCTION_STATUS.SETUP ? 'primary' :
            auction.status === AUCTION_STATUS.IN_PROGRESS ? 'success' : 'secondary'
          }>
            {auction.status === AUCTION_STATUS.SETUP ? 'Setup' :
             auction.status === AUCTION_STATUS.IN_PROGRESS ? 'In Progress' : 'Ended'}
          </Badge>
        </div>
        <Link to={ROUTES.HOME}>
          <Button variant="primary">
            <i className="bi bi-house me-1"></i> Back to Home
          </Button>
        </Link>
      </div>

      <Row>
        <Col xs={12}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center py-3">
              <h5 className="mb-0 fw-bold">Auction Details</h5>
              <div className="action-icons">
                <Button
                  variant="outline-primary"
                  className="me-2"
                  onClick={() => window.print()}
                  title="Print Details"
                >
                  <i className="bi bi-printer-fill me-2"></i>
                  Print Report
                </Button>
                <Button
                  variant="success"
                  onClick={exportToExcel}
                  title="Export to Excel"
                >
                  <i className="bi bi-file-earmark-excel-fill me-2"></i>
                  Export to Excel
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {auction.description && (
                <div className="mb-4">
                  <h6>Description</h6>
                  <p>{auction.description}</p>
                </div>
              )}

              <Row className="mb-4">
                <Col sm={6} md={4} className="mb-3">
                  <small className="text-muted d-block">
                    <i className="bi bi-tag me-1"></i>Starting Price
                  </small>
                  <span>{databaseService.formatCurrency(auction.startingPrice)}</span>
                </Col>
                <Col sm={6} md={4} className="mb-3">
                  <small className="text-muted d-block">
                    <i className="bi bi-cash-stack me-1"></i>Current Price
                  </small>
                  <span className="text-success fw-bold">{databaseService.formatCurrency(auction.currentPrice)}</span>
                </Col>
                <Col sm={6} md={4} className="mb-3">
                  <small className="text-muted d-block">
                    <i className="bi bi-arrow-up-circle me-1"></i>Bid Step
                  </small>
                  <span>{databaseService.formatCurrency(auction.bidStep)}</span>
                </Col>
                <Col sm={6} md={4} className="mb-3">
                  <small className="text-muted d-block">
                    <i className="bi bi-calendar-event me-1"></i>Created
                  </small>
                  <span>{new Date(auction.createdAt).toLocaleDateString()}</span>
                </Col>
                {auction.updatedAt && (
                  <Col sm={6} md={4} className="mb-3">
                    <small className="text-muted d-block">
                      <i className="bi bi-clock-history me-1"></i>Last Updated
                    </small>
                    <span>{new Date(auction.updatedAt).toLocaleDateString()}</span>
                  </Col>
                )}
                {auction.timeLeft && auction.status === AUCTION_STATUS.IN_PROGRESS && (
                  <Col sm={6} md={4} className="mb-3">
                    <small className="text-muted d-block">
                      <i className="bi bi-hourglass-split me-1"></i>Time Left
                    </small>
                    <span>{Math.floor(auction.timeLeft / 60)} minutes</span>
                  </Col>
                )}
              </Row>

              {result && winnerBidder && (
                <div className="border-top pt-4 mt-2">
                  <h5 className="mb-3">Winner</h5>
                  <div className="d-flex bg-light p-3 rounded">
                    <div style={{ width: '64px', height: '64px' }}>
                      <img
                        className="rounded-circle w-100 h-100"
                        src={winnerBidder.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(winnerBidder.name)}&background=random&size=64`}
                        alt={winnerBidder.name}
                      />
                    </div>
                    <div className="ms-3">
                      <h5 className="mb-1">{winnerBidder.name}</h5>
                      {winnerBidder.phone && (
                        <p className="mb-1 small">
                          <i className="bi bi-telephone me-1"></i>
                          {winnerBidder.phone}
                        </p>
                      )}
                      {winnerBidder.email && (
                        <p className="mb-1 small">
                          <i className="bi bi-envelope me-1"></i>
                          {winnerBidder.email}
                        </p>
                      )}
                      {winnerBidder.address && (
                        <p className="mb-1 small">
                          <i className="bi bi-geo-alt me-1"></i>
                          {winnerBidder.address}
                        </p>
                      )}
                      <p className="mt-2 text-success fw-bold">
                        Winning Bid: {databaseService.formatCurrency(result.finalPrice)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Bid History</h5>
            </Card.Header>
            <Card.Body>
              {bids.length > 0 ? (
                <BidHistory bids={bids} />
              ) : (
                <p className="text-center text-muted my-4">No bids have been placed yet.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ResultPage;
