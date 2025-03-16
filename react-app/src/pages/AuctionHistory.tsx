import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { databaseService } from '@services/databaseService';
import { exportExcelService } from '@services/exportExcelService';
import { Auction } from '@types';
import { Button, Table, Container, Spinner, Alert, Pagination, Card, Toast } from 'react-bootstrap';
import './AuctionHistory.css';

const AuctionHistory: React.FC = () => {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchAuctions();
  }, []);

  // Function to show toast messages
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({
      show: true,
      message,
      type
    });

    // Auto-hide the toast after 3 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const auctionList = await databaseService.getAuctions();

      // Filter to only show completed auctions
      const completedAuctions = auctionList.filter(auction => auction.status === 'ENDED');

      // Sort auctions by start time (newest first)
      const sortedAuctions = completedAuctions.sort((a, b) => {
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
    navigate(`/bid?id=${auctionId}&from=history`);
  };

  const handleExportAuction = async (auction: Auction) => {
    try {
      // Fetch all bidders and bids for this auction
      const bidders = await databaseService.getBidders(auction.id);
      const bids = await databaseService.getBids(auction.id);

      // Use the exportExcelService to handle the export
      const success = await exportExcelService.exportAuctionToExcel(auction, bidders, bids);

      if (success) {
        showToast('Dữ liệu đấu giá đã được xuất thành công', 'success');
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Error exporting data to Excel:', error);
      showToast('Không thể xuất dữ liệu Excel. Vui lòng thử lại.', 'error');
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

  const formatDuration = (auction: Auction) => {
    // For ended auctions, calculate duration from result
    if (auction.status === 'ENDED' && auction.result) {
      const startTime = auction.result.startTime || auction.startTime;
      const endTime = auction.result.endTime || auction.endTime;

      if (!startTime || !endTime) return '---';

      // Calculate duration in milliseconds
      const durationMs = endTime - startTime;

      // Convert to minutes and seconds
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);

      if (minutes > 0) {
        return `${minutes} phút ${seconds} giây`;
      } else {
        return `${seconds} giây`;
      }
    }

    return '---';
  };

  const handleBackClick = () => {
    navigate('/setup');
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
      {/* Toast container */}
      <div className="toast-container position-fixed top-0 end-0 p-3">
        <Toast
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
          show={toast.show}
          delay={3000}
          autohide
          bg={toast.type === 'success' ? 'success' : 'danger'}
          className="text-white"
        >
          <Toast.Body>{toast.message}</Toast.Body>
        </Toast>
      </div>

      {loading ? (
        <div className="loading-container">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </Spinner>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : auctions.length === 0 ? (
        <Alert variant="info">Không có phiên đấu giá đã kết thúc</Alert>
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
                      <th className="text-center" style={{ width: '15%' }}>Thời gian bắt đầu</th>
                      <th className="text-center" style={{ width: '10%' }}>Lượt đấu giá</th>
                      <th className="text-center" style={{ width: '15%' }}>Thời gian diễn ra</th>
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
                        <td className="text-center align-middle">{formatDuration(auction)}</td>
                        <td className="text-center align-middle">
                          <div className="d-flex justify-content-center gap-2">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleViewAuction(auction.id)}
                              className="px-3"
                            >
                              <i className="bi bi-eye me-1"></i> Xem
                            </Button>
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleExportAuction(auction)}
                              className="px-3"
                            >
                              <i className="bi bi-file-earmark-excel me-1"></i> Xuất
                            </Button>
                          </div>
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
                Quay Lại Thiết Lập
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default AuctionHistory;
