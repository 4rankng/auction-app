import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button, Spinner, Card } from 'react-bootstrap';
import databaseService from '../services/databaseService';
import { Auction } from '../models/types';
import { ROUTES, AUCTION_STATUS } from '../models/constants';
import './HomePage.css';

const HomePage: React.FC = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAuctions = async () => {
      setIsLoading(true);
      try {
        const allAuctions = await databaseService.auction.getAll();
        setAuctions(allAuctions);
      } catch (error) {
        console.error('Error loading auctions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuctions();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case AUCTION_STATUS.SETUP:
        return <span className="badge bg-primary">Setup</span>;
      case AUCTION_STATUS.IN_PROGRESS:
        return <span className="badge bg-success">In Progress</span>;
      case AUCTION_STATUS.ENDED:
        return <span className="badge bg-secondary">Ended</span>;
      default:
        return null;
    }
  };

  const getActionButton = (auction: Auction) => {
    switch (auction.status) {
      case AUCTION_STATUS.SETUP:
        return (
          <Link to={`${ROUTES.SETUP}/${auction.id}`}>
            <Button variant="primary" size="sm">
              <i className="bi bi-gear me-1"></i> Setup
            </Button>
          </Link>
        );
      case AUCTION_STATUS.IN_PROGRESS:
        return (
          <Link to={`${ROUTES.BID}/${auction.id}`}>
            <Button variant="success" size="sm">
              <i className="bi bi-play-fill me-1"></i> Bid Now
            </Button>
          </Link>
        );
      case AUCTION_STATUS.ENDED:
        return (
          <Link to={`${ROUTES.RESULT}/${auction.id}`}>
            <Button variant="secondary" size="sm">
              <i className="bi bi-eye me-1"></i> View Results
            </Button>
          </Link>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spinner animation="border" role="status" variant="primary" className="loading-spinner">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <span>Loading auctions...</span>
      </div>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center page-header">
        <h1 className="mb-0">Auction System</h1>
        <Link to={ROUTES.SETUP}>
          <Button variant="primary">
            <i className="bi bi-plus-lg me-1"></i> Create New Auction
          </Button>
        </Link>
      </div>

      {auctions.length === 0 ? (
        <div className="empty-state-card">
          <div className="mb-4">
            <i className="bi bi-box text-muted" style={{ fontSize: '3rem' }}></i>
          </div>
          <h2>No Auctions Yet</h2>
          <p>Get started by creating your first auction</p>
          <Link to={ROUTES.SETUP}>
            <Button variant="primary">
              <i className="bi bi-plus-lg me-1"></i> Create New Auction
            </Button>
          </Link>
        </div>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {auctions.map(auction => (
            <Col key={auction.id}>
              <Card className="h-100 auction-card shadow-sm">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <div>{getStatusBadge(auction.status)}</div>
                  <small className="text-muted">
                    {auction.updatedAt && (
                      <><i className="bi bi-clock me-1"></i>{new Date(auction.updatedAt).toLocaleDateString()}</>
                    )}
                  </small>
                </Card.Header>
                <Card.Body>
                  <Card.Title>{auction.title}</Card.Title>
                  <Card.Text className="text-muted mb-3">
                    {auction.description && auction.description.length > 100
                      ? `${auction.description.substring(0, 100)}...`
                      : auction.description || ''}
                  </Card.Text>

                  <Row className="mb-3">
                    <Col xs={6}>
                      <small className="text-muted d-block">
                        <i className="bi bi-tag me-1"></i>Starting Price
                      </small>
                      <span>{databaseService.formatCurrency(auction.startingPrice)}</span>
                    </Col>
                    <Col xs={6}>
                      <small className="text-muted d-block">
                        <i className="bi bi-cash-stack me-1"></i>Current Price
                      </small>
                      <span className="text-success fw-bold">{databaseService.formatCurrency(auction.currentPrice)}</span>
                    </Col>
                  </Row>

                  <Row>
                    <Col xs={6}>
                      <small className="text-muted d-block">
                        <i className="bi bi-arrow-up-circle me-1"></i>Price Step
                      </small>
                      <span>{databaseService.formatCurrency(auction.priceStep)}</span>
                    </Col>
                    <Col xs={6}>
                      <small className="text-muted d-block">
                        <i className="bi bi-calendar-event me-1"></i>Created
                      </small>
                      <span>{new Date(auction.createdAt).toLocaleDateString()}</span>
                    </Col>
                  </Row>
                </Card.Body>
                <Card.Footer className="bg-white d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    {auction.status === AUCTION_STATUS.IN_PROGRESS && auction.timeLeft && (
                      <><i className="bi bi-hourglass-split me-1"></i>{Math.floor(auction.timeLeft / 60)} minutes left</>
                    )}
                  </small>
                  {getActionButton(auction)}
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default HomePage;
