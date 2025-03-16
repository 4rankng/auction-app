import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { databaseService } from '@services/databaseService';
import { Auction } from '@types';
import { Button, Table, Container, Spinner, Alert, Pagination, Card } from 'react-bootstrap';
import './AuctionHistory.css';

const AuctionHistory: React.FC = () => {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const auctionList = await databaseService.getAuctions();

      // Sort auctions by start time (newest first)
      const sortedAuctions = auctionList.sort((a, b) => {
        const aStartTime = a.startTime || 0;
        const bStartTime = b.startTime || 0;
        return bStartTime - aStartTime;
      });

      setAuctions(sortedAuctions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auctions');
      console.error('Error loading auctions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAuction = (auctionId: string) => {
    navigate(`/bid?id=${auctionId}`);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'SETUP':
        return 'status-badge setup';
      case 'IN_PROGRESS':
        return 'status-badge in-progress';
      case 'ENDED':
        return 'status-badge ended';
      default:
        return 'status-badge';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  const formatDateTime = (timestamp?: number) => {
    if (!timestamp) return '---';

    return new Date(timestamp).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const getDisplayPrice = (auction: Auction) => {
    if (!auction) return formatCurrency(0);

    if (auction.status === 'ENDED' && auction.result) {
      return formatCurrency(auction.result.finalPrice);
    } else if (auction.status === 'IN_PROGRESS') {
      return formatCurrency(auction.currentPrice || 0);
    } else {
      return formatCurrency(auction.settings?.startingPrice || 0);
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'SETUP':
        return 'Chuẩn bị';
      case 'IN_PROGRESS':
        return 'Đang diễn ra';
      case 'ENDED':
        return 'Đã kết thúc';
      default:
        return 'Không xác định';
    }
  };

  // Get number of bids for an auction
  const getBidCount = (auction: Auction) => {
    if (!auction || !auction.bids) return 0;
    return Object.keys(auction.bids).length;
  };

  // Calculate pagination indexes
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAuctions = auctions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(auctions.length / itemsPerPage);

  // Change page
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];

    for (let i = 1; i <= totalPages; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    return items;
  };

  return (
    <Container className="auction-history-container">

      {loading ? (
        <div className="loading-container">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </Spinner>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : auctions.length === 0 ? (
        <Alert variant="info">Không có phiên đấu giá nào</Alert>
      ) : (
        <>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-light py-3">
              <h2 className="mb-0">Lịch sử đấu giá</h2>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table responsive striped bordered hover className="auction-table mb-0">
                  <thead>
                    <tr className="bg-light">
                      <th className="text-center" style={{ width: '5%' }}>#</th>
                      <th style={{ width: '25%' }}>Tài Sản</th>
                      <th className="text-end" style={{ width: '15%' }}>Giá thắng</th>
                      <th className="text-center" style={{ width: '20%' }}>Thời gian bắt đầu</th>
                      <th className="text-center" style={{ width: '10%' }}>Lượt đấu giá</th>
                      <th className="text-center" style={{ width: '10%' }}>Trạng thái</th>
                      <th className="text-center" style={{ width: '15%' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentAuctions.map((auction, index) => (
                      <tr key={auction.id}>
                        <td className="text-center align-middle">{indexOfFirstItem + index + 1}</td>
                        <td className="align-middle text-truncate" style={{ maxWidth: '200px' }}>{auction.title || 'Không có tiêu đề'}</td>
                        <td className="text-end align-middle fw-bold">{getDisplayPrice(auction)}</td>
                        <td className="text-center align-middle">{formatDateTime(auction.startTime)}</td>
                        <td className="text-center align-middle fw-semibold">{getBidCount(auction)}</td>
                        <td className="text-center align-middle">
                          <span className={getStatusBadgeClass(auction.status)}>
                            {getStatusText(auction.status)}
                          </span>
                        </td>
                        <td className="text-center align-middle">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleViewAuction(auction.id)}
                            className="px-3"
                          >
                            <i className="bi bi-eye me-1"></i> Xem
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
            {totalPages > 1 && (
              <Card.Footer className="bg-white d-flex justify-content-center py-3">
                <Pagination className="mb-0">
                  <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                  <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                  {renderPaginationItems()}
                  <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                  <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
                </Pagination>
              </Card.Footer>
            )}
          </Card>
        </>
      )}

      {/* Bottom sheet with back button */}
      <div className="bottom-action-container">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <Button
                variant="primary"
                size="lg"
                className="w-100"
                onClick={handleBackClick}
                style={{ height: "60px" }}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Quay lại
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default AuctionHistory;
