// Import configuration
import config from './config.js';

// Constants from configuration
const API_BASE_URL = config.apiBaseUrl;

// DOM Elements
const winnerId = document.getElementById('winnerId');
const winnerName = document.getElementById('winnerName');
const winnerAddress = document.getElementById('winnerAddress');
const winningBid = document.getElementById('winningBid');
const noWinner = document.getElementById('noWinner');
const winnerInfo = document.getElementById('winnerInfo');
const totalRounds = document.getElementById('totalRounds');
const totalBidders = document.getElementById('totalBidders');
const totalBids = document.getElementById('totalBids');
const initialPrice = document.getElementById('initialPrice');
const bidHistoryList = document.getElementById('bidHistoryList');
const noBidHistory = document.getElementById('noBidHistory');
const newAuctionBtn = document.getElementById('newAuctionBtn');
const printResultsBtn = document.getElementById('printResultsBtn');
const currentYearSpan = document.getElementById('currentYear');
const toastContainer = document.querySelector('.toast-container');
const languageSelect = document.getElementById('language');

// State
let bidders = [];
let auctionHistory = {
    status: 'completed',
    rounds: 0,
    bids: [],
    winner: null,
    initialPrice: 0
};
let apiConnectionFailed = false;
let lastConnectionAttempt = 0;
const MIN_RETRY_INTERVAL = 5000; // Minimum time between connection retry attempts (5 seconds)

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Log API URL if in debug mode
    if (config.debug) {
        console.log(`Using API URL: ${API_BASE_URL}`);
    }

    // Set current year in footer if exists
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Load data
    await loadData();

    // Add event listeners
    newAuctionBtn.addEventListener('click', resetAuction);
    printResultsBtn.addEventListener('click', printResults);
    if (languageSelect) {
        languageSelect.addEventListener('change', changeLanguage);
    }

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // Page is visible, refresh data
            loadData();
        }
    });
});

// ========== Functions ==========

// Load all data for the completed page
async function loadData() {
    // Don't retry connections too frequently
    const now = Date.now();
    if (apiConnectionFailed && now - lastConnectionAttempt < MIN_RETRY_INTERVAL) {
        return;
    }

    lastConnectionAttempt = now;

    try {
        // Show loading indicator
        showLoadingIndicator(true);

        // Reset API connection status
        apiConnectionFailed = false;

        // Load bidders and auction history concurrently
        await Promise.all([
            loadBidders(),
            loadCompleteAuctionHistory()
        ]);

        // Update UI after data is loaded
        updateUI();

        // If we previously showed a connection error, show connection restored message
        if (apiConnectionFailed) {
            showToast('Kết nối đã được khôi phục.', 'success');
            apiConnectionFailed = false;
        }
    } catch (error) {
        console.error('Error loading data:', error);

        // Only show error toast once when API connection fails
        if (!apiConnectionFailed) {
            showToast('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.', 'error');
            apiConnectionFailed = true;
        }
    } finally {
        // Always hide loading indicator
        showLoadingIndicator(false);
    }
}

// Show/hide loading indicator
function showLoadingIndicator(show) {
    document.body.classList.toggle('loading', show);

    // Disable buttons during loading
    const buttons = [newAuctionBtn, printResultsBtn];
    buttons.forEach(btn => {
        if (btn) btn.disabled = show;
    });
}

// Handle API response errors
function handleApiError(response) {
    if (!response.ok) {
        // Different error handling based on status code
        switch (response.status) {
            case 400:
                throw new Error('Yêu cầu không hợp lệ. Vui lòng kiểm tra dữ liệu đầu vào.');
            case 401:
            case 403:
                throw new Error('Không có quyền truy cập. Đang thử lại với token mới...');
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
    return response;
}

// Make an API request with standardized error handling
async function apiRequest(url, options = {}) {
    try {
        // Set default headers if not provided
        if (!options.headers) {
            options.headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
        }

        const response = await fetch(url, options);
        handleApiError(response);

        // For GET requests, try to parse JSON response
        if (options.method === undefined || options.method === 'GET') {
            return await response.json();
        }

        return response;
    } catch (error) {
        console.error('API Request Error:', error);
        showToast('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.', 'error');
        throw error;
    }
}

// Load bidders from the API
async function loadBidders() {
    try {
        const url = `${API_BASE_URL}${config.endpoints.bidders}`;
        const data = await apiRequest(url);
        bidders = data || [];

        // Connection restored
        if (apiConnectionFailed) {
            showToast('Kết nối đến máy chủ đã được khôi phục.', 'success');
            apiConnectionFailed = false;
        }
    } catch (error) {
        console.error('Error loading bidders:', error);
        bidders = [];
        throw error;
    }
}

// Load complete auction history from the API
async function loadCompleteAuctionHistory() {
    try {
        const url = `${API_BASE_URL}${config.endpoints.auctionHistoryComplete}`;
        const response = await apiRequest(url);

        // Map the backend field names to our frontend field names
        const data = response.data || {};
        auctionHistory = {
            status: 'completed',
            rounds: data.rounds || 0,
            bids: data.bids || [],
            winner: data.winner || null,
            initialPrice: data.startingPrice || 0
        };

        return auctionHistory;
    } catch (error) {
        console.error('Error loading auction history:', error);
        showToast('Không thể tải lịch sử đấu giá. ' + error.message, 'error');
        throw error;
    }
}

// Update the UI with auction history data
function updateUI() {
    // Update winner information
    updateWinnerInfo();

    // Update summary information
    updateSummaryInfo();

    // Update bid history
    updateBidHistory();
}

// Update winner information
function updateWinnerInfo() {
    if (auctionHistory.winner) {
        // Show winner info section
        noWinner.classList.add('d-none');
        winnerInfo.classList.remove('d-none');

        // Find winner bidder
        const winner = bidders.find(b => b.id === auctionHistory.winner.bidderId);

        // Update UI
        winnerId.textContent = winner ? winner.id : auctionHistory.winner.bidderId;
        winnerName.textContent = winner ? winner.name : 'Unknown';
        winnerAddress.textContent = winner && winner.address ? winner.address : 'N/A';
        winningBid.textContent = formatCurrency(auctionHistory.winner.amount);
    } else {
        // Show no winner message
        noWinner.classList.remove('d-none');
        winnerInfo.classList.add('d-none');
    }
}

// Update summary information
function updateSummaryInfo() {
    totalRounds.textContent = auctionHistory.rounds || 0;
    totalBidders.textContent = bidders.length;
    totalBids.textContent = auctionHistory.bids?.length || 0;
    initialPrice.textContent = formatCurrency(auctionHistory.initialPrice || 0);
}

// Update bid history
function updateBidHistory() {
    // Clear the list
    bidHistoryList.innerHTML = '';

    if (!auctionHistory.bids || auctionHistory.bids.length === 0) {
        // Show no history message
        noBidHistory.style.display = 'block';
        return;
    }

    // Hide no history message
    noBidHistory.style.display = 'none';

    // Add each bid to the list
    auctionHistory.bids.forEach(bid => {
        const row = document.createElement('tr');

        // Find bidder name
        const bidder = bidders.find(b => b.id === bid.bidderId) || { name: 'Unknown' };

        // Format timestamp
        const timestamp = new Date(bid.timestamp).toLocaleTimeString();

        row.innerHTML = `
            <td>${bid.round}</td>
            <td>${bidder.name}</td>
            <td>${formatCurrency(bid.amount)}</td>
            <td>${timestamp}</td>
        `;

        bidHistoryList.appendChild(row);
    });
}

// Reset auction
async function resetAuction() {
    // Confirm with user
    if (!confirm('Bạn có chắc chắn muốn bắt đầu phiên đấu giá mới? Dữ liệu phiên hiện tại sẽ được lưu trữ.')) {
        return;
    }

    try {
        // Show loading state
        showLoadingIndicator(true);
        newAuctionBtn.disabled = true;
        newAuctionBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...';

        // Send reset request
        const url = `${API_BASE_URL}${config.endpoints.auctionReset}`;
        await apiRequest(url, { method: 'POST' });

        // Redirect to setup page
        window.location.href = 'index.html';
    } catch (error) {
        showToast(error.message || 'Không thể bắt đầu phiên đấu giá mới', 'error');
        console.error('Error resetting auction:', error);

        // Reset button state
        newAuctionBtn.disabled = false;
        newAuctionBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Đấu Giá Mới';
        showLoadingIndicator(false);
    }
}

// Print results
function printResults() {
    window.print();
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastId = 'toast-' + Date.now();
    const toastElement = document.createElement('div');
    toastElement.className = 'toast';
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    toastElement.setAttribute('id', toastId);

    // Set toast color based on type
    let bgClass, iconClass;

    switch (type) {
        case 'success':
            bgClass = 'bg-success';
            iconClass = 'bi-check-circle-fill';
            break;
        case 'error':
            bgClass = 'bg-danger';
            iconClass = 'bi-exclamation-circle-fill';
            break;
        case 'warning':
            bgClass = 'bg-warning';
            iconClass = 'bi-exclamation-triangle-fill';
            break;
        default:
            bgClass = 'bg-info';
            iconClass = 'bi-info-circle-fill';
    }

    toastElement.innerHTML = `
        <div class="toast-header ${bgClass} text-white">
            <i class="bi ${iconClass} me-2"></i>
            <strong class="me-auto">Thông báo</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;

    toastContainer.appendChild(toastElement);

    // Initialize Bootstrap toast
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: config.toastDelay
    });

    // Show toast
    toast.show();

    // Remove toast from DOM after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastContainer.removeChild(toastElement);
    });
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(amount);
}

// Change language
function changeLanguage() {
    // This is a placeholder function for the language selector
    // In a real application, this would implement language switching functionality
    const selectedLanguage = languageSelect.value;
    showToast(`Ngôn ngữ đã được chuyển sang: ${selectedLanguage === 'vi' ? 'Tiếng Việt' : 'English'}`, 'info');
}
