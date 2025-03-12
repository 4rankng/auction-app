// Import configuration
import config from './config.js';

// Constants from configuration
const API_BASE_URL = config.apiBaseUrl;

// DOM Elements
const bidderName = document.getElementById('bidderName');
const bidderId = document.getElementById('bidderId');
const bidderAddress = document.getElementById('bidderAddress');
const winningBid = document.getElementById('winningBid');
const roundsCount = document.getElementById('roundsCount');
const auctionDate = document.getElementById('auctionDate');
const initialPrice = document.getElementById('initialPrice');
const finalPrice = document.getElementById('finalPrice');
const priceIncrement = document.getElementById('priceIncrement');
const biddersCount = document.getElementById('biddersCount');
const bidHistoryList = document.getElementById('bidHistoryList');
const noBidHistory = document.getElementById('noBidHistory');
const printBtn = document.getElementById('printBtn');
const newAuctionBtn = document.getElementById('newAuctionBtn');
const currentYearSpan = document.getElementById('currentYear');
const languageSelect = document.getElementById('language');

// State
let auctionData = {
    winner: null,
    bidHistory: [],
    bidders: [],
    auctionSettings: {
        startingPrice: 0,
        priceStep: 0
    }
};
let apiConnectionFailed = false;
let lastConnectionAttempt = 0;
const MIN_RETRY_INTERVAL = config.retryInterval || 5000; // Minimum time between connection retry attempts

// Add event listeners
if (printBtn) printBtn.addEventListener('click', printResults);
if (newAuctionBtn) newAuctionBtn.addEventListener('click', resetAuction);
if (languageSelect) languageSelect.addEventListener('change', changeLanguage);

// Set current year
if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
}

// Initialize page
document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
    // Log API URL if in debug mode
    if (config.debug) {
        console.log('API URL:', API_BASE_URL);
    }

    try {
        await loadData();
        updateUI();
    } catch (error) {
        console.error('Failed to initialize page:', error);
        showToast('Không thể tải dữ liệu. Vui lòng thử lại sau.', 'error');
    }
}

async function loadData() {
    showLoadingIndicator(true);

    try {
        // Check auction status to make sure we should be on this page
        const statusUrl = `${API_BASE_URL}${config.endpoints.auctionStatus}`;
        const statusData = await apiRequest(statusUrl);

        // Redirect if not completed
        if (statusData && statusData.auctionStatus !== 'completed') {
            if (statusData.auctionStatus === 'notStarted') {
                window.location.href = config.pages.setup;
                return;
            } else if (statusData.auctionStatus === 'inProgress') {
                window.location.href = config.pages.bid;
                return;
            }
        }

        // Load settings
        const settingsUrl = `${API_BASE_URL}${config.endpoints.auctionSettings}`;
        const settingsData = await apiRequest(settingsUrl);

        if (settingsData) {
            auctionData.auctionSettings = {
                startingPrice: settingsData.startingPrice || 0,
                priceStep: settingsData.priceStep || 0
            };
        }

        // Load bidders
        await loadBidders();

        // Load auction history
        await loadCompleteAuctionHistory();

    } catch (error) {
        console.error('Failed to load data:', error);
        throw error;
    } finally {
        showLoadingIndicator(false);
    }
}

function showLoadingIndicator(show) {
    if (show) {
        document.body.classList.add('loading');
    } else {
        document.body.classList.remove('loading');
    }
}

function handleApiError(response) {
    if (!response.ok) {
        const statusCode = response.status;
        const statusText = response.statusText;

        // Handle specific error codes
        if (statusCode === 404) {
            throw new Error('Phiên đấu giá không tồn tại');
        } else if (statusCode === 403) {
            throw new Error('Không có quyền truy cập');
        } else if (statusCode >= 500) {
            throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
        } else {
            throw new Error(`Lỗi ${statusCode}: ${statusText}`);
        }
    }
    return response;
}

async function apiRequest(url, options = {}) {
    try {
        // Reset connection failed flag on new attempt
        if (apiConnectionFailed) {
            const now = Date.now();
            // Only retry after the minimum interval
            if (now - lastConnectionAttempt < MIN_RETRY_INTERVAL) {
                throw new Error('Kết nối đến máy chủ thất bại. Đang thử lại...');
            }
        }

        lastConnectionAttempt = Date.now();

        // Set default headers if not provided
        if (!options.headers) {
            options.headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
        }

        const response = await fetch(url, options);

        // Check if response is ok
        handleApiError(response);

        // Reset connection failed flag on success
        apiConnectionFailed = false;

        // Parse JSON if response has content
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }

        return null;
    } catch (error) {
        console.error('API Request Error:', error, url);

        // Set connection failed flag
        apiConnectionFailed = true;

        // Re-throw the error for the caller to handle
        throw error;
    }
}

async function loadBidders() {
    try {
        const url = `${API_BASE_URL}${config.endpoints.bidders}`;
        const data = await apiRequest(url);

        if (data) {
            auctionData.bidders = data || [];
            return auctionData.bidders;
        }
    } catch (error) {
        console.error('Failed to load bidders:', error);
        throw error;
    }
}

async function loadCompleteAuctionHistory() {
    try {
        const url = `${API_BASE_URL}${config.endpoints.auctionHistoryComplete}`;
        const data = await apiRequest(url);

        if (data && data.length > 0) {
            // Use the latest auction history
            const latestAuction = data[data.length - 1];
            auctionData.bidHistory = latestAuction || [];

            // Find winner (highest bidder in the last round)
            if (auctionData.bidHistory.length > 0) {
                // Sort by round and then by amount to find the highest bid in the highest round
                const sortedBids = [...auctionData.bidHistory].sort((a, b) =>
                    b.round === a.round ? b.amount - a.amount : b.round - a.round
                );

                // The winner is the highest bidder in the highest round
                const winningBid = sortedBids[0];

                // Find the complete bidder information
                const winningBidder = auctionData.bidders.find(b => b.id === winningBid.bidderId);

                // Set winner information
                auctionData.winner = {
                    ...winningBid,
                    bidder: winningBidder
                };
            }

            return auctionData.bidHistory;
        }
    } catch (error) {
        console.error('Failed to load auction history:', error);
        throw error;
    }
}

function updateUI() {
    updateWinnerInfo();
    updateSummaryInfo();
    updateBidHistory();
}

function updateWinnerInfo() {
    if (auctionData.winner) {
        // Update winner information
        if (bidderName) bidderName.textContent = auctionData.winner.bidderName || '';
        if (bidderId) bidderId.textContent = auctionData.winner.bidderId || '';

        // Add bidder address if available
        const winner = auctionData.bidders.find(b => b.id === auctionData.winner.bidderId);
        if (bidderAddress && winner) bidderAddress.textContent = winner.address || '';

        // Update winning bid amount
        if (winningBid) winningBid.textContent = formatCurrency(auctionData.winner.amount);

        // Update rounds count
        if (roundsCount) roundsCount.textContent = auctionData.winner.round || 0;

        // Update auction date
        if (auctionDate && auctionData.winner.timestamp) {
            const date = new Date(auctionData.winner.timestamp);
            auctionDate.textContent = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        }
    } else {
        // No winner found
        if (bidderName) bidderName.textContent = 'Không có người trúng đấu giá';
    }
}

function updateSummaryInfo() {
    // Update auction settings
    if (initialPrice) initialPrice.textContent = formatCurrency(auctionData.auctionSettings.startingPrice);
    if (finalPrice && auctionData.winner) finalPrice.textContent = formatCurrency(auctionData.winner.amount);
    if (priceIncrement) priceIncrement.textContent = formatCurrency(auctionData.auctionSettings.priceStep);
    if (biddersCount) biddersCount.textContent = auctionData.bidders.length;
}

function updateBidHistory() {
    if (!bidHistoryList || !noBidHistory) return;

    // Show/hide no history message
    if (!auctionData.bidHistory || auctionData.bidHistory.length === 0) {
        noBidHistory.style.display = 'block';
        bidHistoryList.innerHTML = '';
        return;
    }

    noBidHistory.style.display = 'none';
    bidHistoryList.innerHTML = '';

    // Sort by round (ascending) to show chronological order
    const sortedHistory = [...auctionData.bidHistory].sort((a, b) => a.round - b.round);

    sortedHistory.forEach(bid => {
        const row = document.createElement('tr');

        // Format date
        const bidDate = new Date(bid.timestamp);
        const formattedDate = `${bidDate.toLocaleDateString()} ${bidDate.toLocaleTimeString()}`;

        row.innerHTML = `
            <td>${bid.round}</td>
            <td>${bid.bidderName} (${bid.bidderId})</td>
            <td>${formatCurrency(bid.amount)}</td>
            <td>${formattedDate}</td>
        `;

        bidHistoryList.appendChild(row);
    });
}

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

        // Redirect to index page
        window.location.href = config.pages.index;
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
            <strong class="me-auto">${type === 'error' ? 'Lỗi' :
                                      type === 'success' ? 'Thành công' :
                                      type === 'warning' ? 'Cảnh báo' : 'Thông báo'}</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;

    // Add toast to container
    const toastContainer = document.querySelector('.toast-container');
    if (toastContainer) {
        toastContainer.appendChild(toastElement);

        // Initialize and show toast
        const toast = new bootstrap.Toast(toastElement, {
            delay: type === 'error' ? config.toastDelayError || 10000 : config.toastDelay || 5000,
            autohide: true
        });
        toast.show();

        // Remove from DOM after hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    } else {
        // Fallback to alert if no toast container
        alert(message);
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
}

function changeLanguage() {
    // This function is a placeholder for future language support
    console.log('Language change functionality will be implemented in a future update');
}
