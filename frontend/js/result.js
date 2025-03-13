// Import configuration
import config from './config.js';

// Constants
const API_BASE_URL = config.apiBaseUrl;

// DOM Elements
const auctionTitle = document.getElementById('auctionTitle');
const winnerName = document.getElementById('winnerName');
const winnerAddress = document.getElementById('winnerAddress');
const finalPrice = document.getElementById('finalPrice');
const bidHistoryTable = document.getElementById('bidHistoryTable');
const bidHistoryBody = document.getElementById('bidHistoryBody');
const noBidsMessage = document.getElementById('noBidsMessage');
const auctionStatusBadge = document.getElementById('auctionStatusBadge');
const exportBtn = document.getElementById('exportBtn');
const backToHomeBtn = document.getElementById('backToHomeBtn');
const currentYearSpan = document.getElementById('currentYear');

// State
let auctionId = '';
let auctionData = null;
let bidHistory = [];

// Set current year in the footer
if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
}

// Initialize the page
document.addEventListener('DOMContentLoaded', initialize);

// Initialize the page
async function initialize() {
    try {
        // Get auction ID from localStorage
        auctionId = localStorage.getItem('currentAuctionId');
        if (!auctionId) {
            showToast('Không tìm thấy phiên đấu giá nào để hiển thị kết quả', 'warning');
            return;
        }

        // Load auction data
        await loadAuctionData();

        // Set up event listeners
        if (exportBtn) {
            exportBtn.addEventListener('click', exportAuctionData);
        }
        if (backToHomeBtn) {
            backToHomeBtn.addEventListener('click', goToHome);
        }
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Không thể tải dữ liệu. Vui lòng thử lại sau.', 'error');
    }
}

// Load all auction data
async function loadAuctionData() {
    try {
        showLoadingIndicator(true);

        // Get auction details
        const url = `${API_BASE_URL}${config.endpoints.auctionById(auctionId)}`;
        const response = await apiRequest(url);

        auctionData = response.data;
        console.log('Auction data:', auctionData);

        // Load bid history
        const historyUrl = `${API_BASE_URL}${config.endpoints.bidHistory(auctionId)}`;
        const historyResponse = await apiRequest(historyUrl);

        bidHistory = historyResponse.data || [];
        console.log('Bid history:', bidHistory);

        // Update UI
        updateUI();
    } catch (error) {
        console.error('Error loading auction data:', error);
        showToast('Không thể tải dữ liệu cuộc đấu giá', 'error');
    } finally {
        showLoadingIndicator(false);
    }
}

// Update UI with auction results
function updateUI() {
    if (!auctionData) return;

    // Set auction title
    if (auctionTitle) {
        auctionTitle.textContent = auctionData.title || 'Kết Quả Đấu Giá';
    }

    // Set winner info if auction is completed
    if (auctionData.status === 'completed') {
        // Find the winning bidder
        const winningBidder = auctionData.bidders.find(bidder => bidder.id === auctionData.highestBidder);

        if (winningBidder) {
            if (winnerName) winnerName.textContent = winningBidder.name;
            if (winnerAddress) winnerAddress.textContent = winningBidder.address;
        } else {
            if (winnerName) winnerName.textContent = 'Không có người chiến thắng';
            if (winnerAddress) winnerAddress.textContent = '';
        }

        if (finalPrice) {
            finalPrice.textContent = formatCurrency(auctionData.highestBid);
        }
    } else {
        if (winnerName) winnerName.textContent = 'Phiên đấu giá chưa kết thúc';
        if (winnerAddress) winnerAddress.textContent = '';
        if (finalPrice) finalPrice.textContent = formatCurrency(0);
    }

    // Set auction status badge
    if (auctionStatusBadge) {
        const status = auctionData.status;
        auctionStatusBadge.textContent = status === 'notStarted' ? 'Chưa bắt đầu' :
                                        status === 'inProgress' ? 'Đang diễn ra' : 'Đã kết thúc';

        auctionStatusBadge.className = 'badge ' +
                                      (status === 'notStarted' ? 'bg-secondary' :
                                       status === 'inProgress' ? 'bg-success' : 'bg-danger');
    }

    // Update bid history table
    renderBidHistory();
}

// Render bid history table
function renderBidHistory() {
    if (!bidHistory || bidHistory.length === 0) {
        if (bidHistoryTable) bidHistoryTable.style.display = 'none';
        if (noBidsMessage) noBidsMessage.style.display = 'block';
        return;
    }

    if (bidHistoryTable) bidHistoryTable.style.display = 'table';
    if (noBidsMessage) noBidsMessage.style.display = 'none';

    if (!bidHistoryBody) return;

    // Clear existing rows
    bidHistoryBody.innerHTML = '';

    // Sort bids by round in descending order (newest first)
    const sortedBids = [...bidHistory].sort((a, b) => b.round - a.round);

    // Create rows for each bid
    sortedBids.forEach((bid, index) => {
        const row = document.createElement('tr');

        // Add highlight for winning bid
        if (bid.bidderId === auctionData.highestBidder && auctionData.status === 'completed') {
            row.classList.add('table-success');
        }

        row.innerHTML = `
            <td>${bid.round}</td>
            <td>${bid.bidderName}</td>
            <td>${formatCurrency(bid.amount)}</td>
            <td>${new Date(bid.timestamp).toLocaleString()}</td>
        `;

        bidHistoryBody.appendChild(row);
    });
}

// Export auction data to Excel
async function exportAuctionData() {
    try {
        showLoadingIndicator(true);

        const url = `${API_BASE_URL}${config.endpoints.exportAuction(auctionId)}`;

        // Fetch as blob
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        // Get the blob
        const blob = await response.blob();

        // Create download link and trigger download
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `auction_results_${auctionId}.xlsx`;
        document.body.appendChild(a);
        a.click();

        // Clean up
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);

        showToast('Xuất dữ liệu thành công', 'success');
    } catch (error) {
        console.error('Error exporting auction data:', error);
        showToast('Không thể xuất dữ liệu', 'error');
    } finally {
        showLoadingIndicator(false);
    }
}

// Go to home page
function goToHome() {
    window.location.href = config.pages.index;
}

// API request helper with error handling
async function apiRequest(url, options = {}) {
    try {
        // Set default headers if not provided
        if (!options.headers) {
            options.headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
        }

        // Add timeout to fetch requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        options.signal = controller.signal;

        const response = await fetch(url, options);
        clearTimeout(timeoutId);

        if (!response.ok) {
            // Different error handling based on status code
            switch (response.status) {
                case 400:
                    throw new Error('Yêu cầu không hợp lệ. Vui lòng kiểm tra dữ liệu đầu vào.');
                case 401:
                case 403:
                    throw new Error('Không có quyền truy cập.');
                case 404:
                    throw new Error('Không tìm thấy tài nguyên hoặc dịch vụ.');
                case 500:
                case 502:
                case 503:
                case 504:
                    throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
                default:
                    throw new Error(`Lỗi không xác định (${response.status})`);
            }
        }

        // Try to parse JSON response
        try {
            return await response.json();
        } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            return {}; // Return empty object instead of throwing
        }
    } catch (error) {
        console.error('API Request Error:', error);

        // Special handling for AbortController timeout
        if (error.name === 'AbortError') {
            throw new Error('Yêu cầu đã hết thời gian. Vui lòng thử lại.');
        }

        throw error;
    }
}

// Show/hide loading indicator
function showLoadingIndicator(show) {
    document.body.classList.toggle('loading', show);
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast show bg-${type === 'error' ? 'danger' : type}`;
    toast.role = 'alert';
    toast.ariaLive = 'assertive';
    toast.ariaAtomic = 'true';

    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body text-white">
            ${message}
        </div>
    `;

    toastContainer.appendChild(toast);

    // Remove after delay
    const delay = type === 'error' ? 10000 : 5000;
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toastContainer.contains(toast)) {
                toastContainer.removeChild(toast);
            }
        }, 500);
    }, delay);

    // Add close button functionality
    const closeButton = toast.querySelector('.btn-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
            }, 500);
        });
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
