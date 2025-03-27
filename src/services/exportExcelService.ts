import * as XLSX from 'xlsx';
import logger from './loggerService';
import { Auction, Bid, Bidder } from '@types';

/**
 * Service for exporting auction data to Excel
 */
class ExportExcelService {
  /**
   * Format a number to a currency string
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount || 0) + ' đ';
  }

  /**
   * Format duration in milliseconds to a human-readable string
   */
  private formatDurationMs(durationMs: number): string {
    // Convert to minutes and seconds
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes} phút ${seconds} giây`;
    } else {
      return `${seconds} giây`;
    }
  }

  /**
   * Calculate and format the auction duration
   */
  private getAuctionDuration(auction: Auction): string {
    if (auction.status === 'ENDED' && auction.result) {
      const startTime = auction.result.startTime || auction.startTime;
      const endTime = auction.result.endTime || auction.endTime;

      if (!startTime || !endTime) return '---';

      // Calculate duration in milliseconds
      const durationMs = endTime - startTime;
      return this.formatDurationMs(durationMs);
    }

    return '---';
  }

  /**
   * Create auction information worksheet
   */
  private createAuctionInfoSheet(auction: Auction, bids: Bid[], bidders: Bidder[]): XLSX.WorkSheet {
    const auctionInfoData = [
      ['Thông tin đấu giá', 'Giá trị'],
      ['ID phiên đấu giá', auction.id || ''],
      ['Tên tài sản đấu giá', auction.description || ''],
      ['Đấu giá viên', auction.settings?.auctioneer || 'N/A'],
      ['Trạng thái', auction.status === 'ENDED' ? 'Đã kết thúc' : (auction.status === 'IN_PROGRESS' ? 'Đang diễn ra' : 'Chuẩn bị')],
      ['Giá khởi điểm', this.formatCurrency(auction.settings?.startingPrice || 0)],
      ['Bước giá', this.formatCurrency(auction.settings?.bidStep || 0)],
      ['Thời gian trả giá (giây)', auction.settings?.bidDuration?.toString() || ''],
      ['Người thắng cuộc', auction.result?.winnerName || 'Không có người thắng'],
      ['Giá thắng cuộc', this.formatCurrency(auction.result?.finalPrice || 0)],
      ['Thời gian bắt đầu', auction.startTime ? new Date(auction.startTime).toLocaleString('vi-VN') : 'N/A'],
      ['Thời gian kết thúc', auction.endTime ? new Date(auction.endTime).toLocaleString('vi-VN') : 'N/A'],
      ['Thời gian diễn ra', this.getAuctionDuration(auction)],
      ['Tổng số lượt đặt giá', bids.length],
      ['Số người tham gia', bidders.length]
    ];

    // Create auction info worksheet
    const wsInfo = XLSX.utils.aoa_to_sheet(auctionInfoData);

    // Set column widths for info sheet
    wsInfo['!cols'] = [
      { wch: 25 }, // Column A width
      { wch: 50 }  // Column B width
    ];

    return wsInfo;
  }

  /**
   * Create bidders worksheet
   */
  private createBiddersSheet(bidders: Bidder[], bids: Bid[]): XLSX.WorkSheet {
    // Format bidders data
    const biddersHeaders = ['ID', 'Tên', 'CMND/CCCD', 'Lượt Đặt Giá', 'Tổng Số Tiền'];

    // Count bids and calculate total amount per bidder
    const bidStats: { [key: string]: { count: number; totalAmount: number } } = {};
    bids.forEach(bid => {
      if (!bidStats[bid.bidderId]) {
        bidStats[bid.bidderId] = { count: 0, totalAmount: 0 };
      }
      bidStats[bid.bidderId].count++;
      bidStats[bid.bidderId].totalAmount += bid.amount;
    });

    const biddersData = bidders
      .map(bidder => ({
        ...bidder,
        bidCount: bidStats[bidder.id]?.count || 0,
        totalAmount: bidStats[bidder.id]?.totalAmount || 0
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount) // Sort by total amount in descending order
      .map(bidder => [
        bidder.id,
        bidder.name,
        bidder.nric || '',
        bidder.bidCount,
        this.formatCurrency(bidder.totalAmount)
      ]);

    // Add headers to bidders data
    biddersData.unshift(biddersHeaders);

    // Create bidders worksheet
    const wsBidders = XLSX.utils.aoa_to_sheet(biddersData);

    // Set column widths for bidders sheet
    wsBidders['!cols'] = [
      { wch: 10 },  // ID
      { wch: 30 },  // Name
      { wch: 20 },  // NRIC
      { wch: 15 },  // Bid Count
      { wch: 20 }   // Total Amount
    ];

    return wsBidders;
  }

  /**
   * Create bid history worksheet
   */
  private createBidHistorySheet(bids: Bid[], bidders: Bidder[]): XLSX.WorkSheet {
    // Enhanced bid history data with more details
    const bidHistoryHeaders = ['STT', 'ID Người Đặt', 'Tên Người Đặt', 'Số Tiền', 'Thời Gian'];

    const bidHistoryData = bids
      .sort((a, b) => b.timestamp - a.timestamp) // Sort by timestamp (newest first)
      .map((bid, index) => {
        // Get bidder name from bidders array
        const bidder = bidders.find(b => b.id === bid.bidderId);
        return [
          bids.length - index, // Bid number (counts down)
          bid.bidderId,
          bidder ? bidder.name : 'N/A',
          this.formatCurrency(bid.amount),
          new Date(bid.timestamp).toLocaleString('vi-VN')
        ];
      });

    // Add headers to bid history data
    bidHistoryData.unshift(bidHistoryHeaders);

    // Create bid history worksheet
    const wsBids = XLSX.utils.aoa_to_sheet(bidHistoryData);

    // Set column widths for bid history sheet
    wsBids['!cols'] = [
      { wch: 6 },   // STT
      { wch: 15 },  // ID Người Đặt
      { wch: 30 },  // Tên Người Đặt
      { wch: 20 },  // Số Tiền
      { wch: 25 }   // Thời Gian
    ];

    return wsBids;
  }

  /**
   * Export auction data to Excel
   * @param auction - The auction to export
   * @param bidders - The bidders in the auction
   * @param bids - The bids in the auction
   * @returns A Promise that resolves when the export is complete
   */
  public async exportAuctionToExcel(
    auction: Auction,
    bidders: Bidder[],
    bids: Bid[]
  ): Promise<boolean> {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Create and add auction info worksheet
      const wsInfo = this.createAuctionInfoSheet(auction, bids, bidders);
      XLSX.utils.book_append_sheet(wb, wsInfo, "Thông tin trả giá");

      // Create and add bidders worksheet
      const wsBidders = this.createBiddersSheet(bidders, bids);
      XLSX.utils.book_append_sheet(wb, wsBidders, "Người tham gia");

      // Create and add bid history worksheet
      const wsBids = this.createBidHistorySheet(bids, bidders);
      XLSX.utils.book_append_sheet(wb, wsBids, "Lịch sử trả giá");

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      // Create a Blob from the buffer
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Create a formatted timestamp for the filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);

      // Create download link and trigger click
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auction-data-${auction.id}-${timestamp}.xlsx`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      logger.error('Error exporting auction data to Excel:', error);
      return false;
    }
  }
}

export const exportExcelService = new ExportExcelService();
