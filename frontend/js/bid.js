// Import configuration
import config from './config.js';

// Constants from configuration
const API_BASE_URL = config.apiBaseUrl;
const WS_BASE_URL = API_BASE_URL.replace('http', 'ws');
const TIMER_INTERVAL = 1000; // Update to 1 second for more accurate timers
const DEFAULT_AUCTION_DURATION = config.defaultAuctionDuration;

// DOM Elements
const statusBadge = document.getElementById('statusBadge');
const roundInfo = document.getElementById('roundInfo');
const currentPrice = document.getElementById('currentPrice');
const priceIncrement = document.getElementById('priceIncrement');
const biddersCount = document.getElementById('biddersCount');
const timer = document.getElementById('timer');
const bidderGrid = document.getElementById('bidderGrid');  // New bidder grid element
const selectedBidderId = document.getElementById('selectedBidderId');  // Hidden input for selected bidder
const bidAmount = document.getElementById('bidAmount');
const placeBidBtn = document.getElementById('placeBidBtn');
const cancelBidBtn = document.getElementById('cancelBidBtn');
const endAuctionBtn = document.getElementById('endAuctionBtn');
const bidHistoryList = document.getElementById('bidHistoryList');
const noBidHistory = document.getElementById('noBidHistory');
const backToSetupBtn = document.getElementById('backToSetupBtn');
const currentYearSpan = document.getElementById('currentYear');
const toastContainer = document.querySelector('.toast-container');
const languageSelect = document.getElementById('language');
const refreshBtn = document.getElementById('refreshBtn') || (() => {
    const btn = document.createElement('button');
    btn.id = 'refreshBtn';
    btn.className = 'btn btn-outline-primary';
    btn.innerHTML = '<i class="fas fa-sync-alt"></i> Làm mới';
    document.querySelector('.auction-controls').prepend(btn);
    return btn;
})();

// Floating card elements
const floatingInitialPrice = document.getElementById('floatingInitialPrice');
const floatingPriceIncrement = document.getElementById('floatingPriceIncrement');
const floatingAuctionDuration = document.getElementById('floatingAuctionDuration');
const floatingTimer = document.getElementById('floatingTimer');

// State
let auctionId = '';
let auctionData = null;
let bidHistory = [];
let bidders = [];
let ws = null;
let apiConnectionFailed = false;
let lastConnectionAttempt = 0;
const MIN_RETRY_INTERVAL = config.retryInterval || 5000;

// Add event listeners
placeBidBtn.addEventListener('click', placeBid);
cancelBidBtn.addEventListener('click', cancelLastBid);
endAuctionBtn.addEventListener('click', endAuction);
backToSetupBtn.addEventListener('click', goToSetup);
refreshBtn.addEventListener('click', () => {
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Đang làm mới...';
    loadAuctionData().finally(() => {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Làm mới';
    });
});

// Set current year
if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
}

// Initialize the page
document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
    try {
        // Get auction ID from localStorage
        auctionId = localStorage.getItem('currentAuctionId');
        if (!auctionId) {
            console.log('No auction ID found, redirecting to setup page');
            window.location.href = config.pages.setup;
            return;
        }

        // Load initial auction data
        await loadAuctionData();

        // Check auction status to determine if we should be on this page
        if (!auctionData) {
            console.log('No auction data found, redirecting to setup page');
            window.location.href = config.pages.setup;
            return;
        }

        const status = auctionData.status;
        console.log('Current auction status:', status);

        if (status === 'notStarted') {
            console.log('Auction not started, redirecting to setup page');
            window.location.href = config.pages.setup;
            return;
        } else if (status === 'completed') {
            console.log('Auction already completed, redirecting to result page');
            window.location.href = config.pages.result;
            return;
        }

        // Initialize WebSocket connection
        initializeWebSocket();
    } catch (error) {
        console.error('Failed to initialize auction page:', error);
        showToast('Không thể tải dữ liệu. Vui lòng thử lại sau.', 'error');
    }
}

function initializeWebSocket() {
    if (ws) {
        ws.close();
    }

    ws = new WebSocket(`${WS_BASE_URL}/ws/auction/${auctionId}`);

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed');
        setTimeout(initializeWebSocket, 5000); // Attempt to reconnect after 5 seconds
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        showToast('Kết nối thời gian thực bị gián đoạn. Sử dụng nút làm mới để cập nhật thông tin.', 'warning');
    };
}

function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'auction_update':
            auctionData = data.auction;
            updateStatusUI();
            updateButtonStates();
            break;
        case 'bid_update':
            bidHistory = data.bidHistory;
            renderBidHistory();
            break;
        case 'bidder_update':
            bidders = data.bidders;
            updateBidderGrid();
            break;
        case 'auction_end':
            window.location.href = config.pages.result;
            break;
    }
}

// Load all needed auction data
async function loadAuctionData() {
    if (!auctionId) return;

    const now = Date.now();
    if (apiConnectionFailed && now - lastConnectionAttempt < MIN_RETRY_INTERVAL) {
        console.log('Skipping API call due to recent failure');
        return;
    }
    lastConnectionAttempt = now;

    try {
        showLoadingIndicator(true);

        // Get auction data
        await loadAuction();

        // Load bidders
        await loadBidders();

        // Load bid history
        await loadBidHistory();

        // If we previously showed a connection error, show connection restored message
        if (apiConnectionFailed) {
            showToast('Kết nối đã được khôi phục.', 'success');
            apiConnectionFailed = false;
        }
    } catch (error) {
        console.error('Error loading auction data:', error);

        // Only show error toast once when API connection fails
        if (!apiConnectionFailed) {
            showToast('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.', 'error');
            apiConnectionFailed = true;
        }
    } finally {
        showLoadingIndicator(false);
    }
}

// Load auction details
async function loadAuction() {
    try {
        const url = `${API_BASE_URL}${config.endpoints.auctionById(auctionId)}`;
        const response = await apiRequest(url);

        auctionData = response.data;
        console.log('Auction data:', auctionData);

        // Update UI with auction data
        updateStatusUI();
        updateButtonStates();

        return auctionData;
    } catch (error) {
        console.error('Error loading auction:', error);
        throw error;
    }
}

// Load bidders for the auction
async function loadBidders() {
    try {
        if (!auctionData || !auctionData.bidders) {
            return [];
        }

        bidders = auctionData.bidders;
        updateBidderGrid();

        return bidders;
    } catch (error) {
        console.error('Error loading bidders:', error);
        throw error;
    }
}

// Load bid history
async function loadBidHistory() {
    try {
        const url = `${API_BASE_URL}${config.endpoints.bidHistory(auctionId)}`;
        const response = await apiRequest(url);

        bidHistory = response.data || [];
        renderBidHistory();

        return bidHistory;
    } catch (error) {
        console.error('Error loading bid history:', error);
        throw error;
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
        if (contentType && contentType.includes('application/json') && response.status !== 204) {
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

function updateStatusUI() {
    if (!auctionData) return;

    // Update status badge
    const status = auctionData.status;
    statusBadge.textContent = status === 'inProgress' ? 'Đang diễn ra' : 'Đã hoàn thành';
    statusBadge.className = `badge ${status === 'inProgress' ? 'bg-success' : 'bg-danger'}`;

    // Update round information
    roundInfo.textContent = `Vòng ${auctionData.currentRound || 1}`;

    // Update price information
    currentPrice.textContent = formatCurrency(auctionData.highestBid || auctionData.startingPrice);
    priceIncrement.textContent = formatCurrency(auctionData.priceStep);

    // Update bidder count if available
    if (auctionData.bidders) {
        biddersCount.textContent = auctionData.bidders.length;
    }

    // Update floating card
    updateFloatingCard();
}

function updateTimerDisplay(seconds) {
    if (!timer) return;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    // Display timer in MM:SS format
    timer.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;

    // Update floating timer if present
    if (floatingTimer) {
        floatingTimer.textContent = timer.textContent;
    }

    // Visual indicator when time is running low
    if (seconds <= 60) { // Last minute
        timer.classList.add('text-danger');
        timer.classList.add('fw-bold');

        if (floatingTimer) {
            floatingTimer.classList.add('text-danger');
            floatingTimer.classList.add('fw-bold');
        }
    } else {
        timer.classList.remove('text-danger');
        timer.classList.remove('fw-bold');

        if (floatingTimer) {
            floatingTimer.classList.remove('text-danger');
            floatingTimer.classList.remove('fw-bold');
        }
    }
}

function updateElapsedTimeDisplay() {
    if (!auctionData || !auctionData.startTime || !timer) return;

    // Calculate elapsed time
    const now = new Date();
    const elapsedMilliseconds = now - new Date(auctionData.startTime);
    const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);

    // Format and display as MM:SS
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    // Update the timer display
    updateTimerDisplay(elapsedSeconds);
}

function updateButtonStates() {
    const buttons = [placeBidBtn, cancelBidBtn, endAuctionBtn, backToSetupBtn];

    // Disable all buttons if auction is not in progress
    if (auctionData.status !== 'inProgress') {
        buttons.forEach(btn => {
            if (btn) btn.disabled = true;
        });
        return;
    }

    // Enable/disable buttons based on bid history
    const hasBids = bidHistory && bidHistory.length > 0;

    if (placeBidBtn) placeBidBtn.disabled = !selectedBidderId.value;
    if (cancelBidBtn) cancelBidBtn.disabled = !hasBids;
    if (endAuctionBtn) endAuctionBtn.disabled = false;
    if (backToSetupBtn) backToSetupBtn.disabled = false;
}

function updateBidderGrid() {
    if (!bidderGrid) return;

    // Clear existing grid
    bidderGrid.innerHTML = '';

    if (!bidders || bidders.length === 0) {
        bidderGrid.innerHTML = '<div class="alert alert-info">Không có người tham gia.</div>';
        return;
    }

    // Create card for each bidder
    bidders.forEach(bidder => {
        const card = document.createElement('div');
        card.className = 'bidder-card';
        card.dataset.bidderId = bidder.id;

        // Add selected class if this is the highest bidder
        if (bidder.id === auctionData.highestBidder) {
            card.classList.add('highest-bidder');
        }

        // Add selected class if this bidder is selected
        if (bidder.id === selectedBidderId.value) {
            card.classList.add('selected');
        }

        card.innerHTML = `
            <div class="bidder-name">${bidder.name}</div>
            <div class="bidder-id">${bidder.id}</div>
        `;

        // Add click handler to select bidder
        card.addEventListener('click', () => {
            selectBidder(bidder.id);
        });

        bidderGrid.appendChild(card);
    });
}

function selectBidder(bidderId) {
    // Deselect all bidders
    const cards = bidderGrid.querySelectorAll('.bidder-card');
    cards.forEach(card => card.classList.remove('selected'));

    // Select the clicked bidder
    const selectedCard = bidderGrid.querySelector(`.bidder-card[data-bidder-id="${bidderId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }

    // Update hidden input and enable place bid button
    selectedBidderId.value = bidderId;
    if (placeBidBtn) {
        placeBidBtn.disabled = false;
    }

    // Update bid amount
    updateBidAmount();
}

function updateBidAmount() {
    if (!bidAmount) return;

    // Calculate next bid amount
    let nextBid;

    if (auctionData.round === 0) {
        // First bid is the starting price
        nextBid = auctionData.startingPrice;
    } else {
        // Subsequent bids are highest bid + increment
        nextBid = auctionData.highestBid + auctionData.priceStep;
    }

    bidAmount.value = nextBid;
}

function renderBidHistory() {
    if (!bidHistoryList || !noBidHistory) return;

    // Show/hide no history message
    if (!bidHistory || bidHistory.length === 0) {
        noBidHistory.style.display = 'block';
        bidHistoryList.innerHTML = '';
        return;
    }

    noBidHistory.style.display = 'none';

    // Clear existing list
    bidHistoryList.innerHTML = '';

    // Sort history by round (descending)
    const sortedHistory = [...bidHistory].sort((a, b) => b.round - a.round);

    // Add each bid to the list
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

async function placeBid() {
    const selectedId = selectedBidderId.value;
    const amount = parseInt(bidAmount.value.replace(/\D/g, ''), 10);

    if (!selectedId) {
        showToast('Vui lòng chọn người tham gia', 'warning');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        showToast('Vui lòng nhập số tiền hợp lệ', 'warning');
        return;
    }

    try {
        showLoadingIndicator(true);
        placeBidBtn.disabled = true;

        const url = `${API_BASE_URL}${config.endpoints.placeBid(auctionId)}`;
        const response = await apiRequest(url, {
            method: 'POST',
            body: JSON.stringify({
                bidderId: selectedId,
                amount: amount
            })
        });

        console.log('Bid placed successfully:', response);
        showToast('Đặt giá thành công', 'success');

        // Reload auction data
        await loadAuctionData();
    } catch (error) {
        console.error('Error placing bid:', error);
        showToast(error.message || 'Không thể đặt giá', 'error');
    } finally {
        showLoadingIndicator(false);
        placeBidBtn.disabled = false;
    }
}

async function cancelLastBid() {
    // Confirm with user
    if (!confirm('Bạn có chắc chắn muốn hủy giá đấu giá cuối cùng?')) {
        return;
    }

    try {
        // Disable button and show loading state
        cancelBidBtn.disabled = true;
        cancelBidBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...';

        await apiRequest(`${API_BASE_URL}/auction/bid/cancel`, {
            method: 'POST'
        });

        // Show success message
        showToast('Đã hủy đấu giá cuối cùng', 'success');

        // Update data
        await Promise.all([
            loadAuctionData()
        ]);

        // Update UI
        updateStatusUI();
        updateBidderGrid();
        updateBidAmount();
        updateButtonStates();

    } catch (error) {
        showToast(error.message || 'Không thể hủy đấu giá', 'error');
        console.error('Error canceling bid:', error);
    } finally {
        // Reset button state
        cancelBidBtn.disabled = false;
        cancelBidBtn.innerHTML = '<i class="bi bi-x-circle"></i> Hủy Đấu Giá Cuối';
    }
}

async function endAuction() {
    if (!confirm('Bạn có chắc chắn muốn kết thúc phiên đấu giá này?')) {
        return;
    }

    try {
        showLoadingIndicator(true);
        endAuctionBtn.disabled = true;

        const url = `${API_BASE_URL}${config.endpoints.endAuction(auctionId)}`;
        await apiRequest(url, {
            method: 'PUT'
        });

        showToast('Phiên đấu giá đã kết thúc', 'success');

        // Redirect to result page
        window.location.href = config.pages.result;
    } catch (error) {
        console.error('Error ending auction:', error);
        showToast(error.message || 'Không thể kết thúc phiên đấu giá', 'error');
        showLoadingIndicator(false);
        endAuctionBtn.disabled = false;
    }
}

// Go to setup page
function goToSetup() {
    window.location.href = config.pages.setup;
}

function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    const toastId = `toast-${Date.now()}`;
    const toastHtml = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${type === 'error' ? 'bg-danger text-white' :
                                    type === 'success' ? 'bg-success text-white' :
                                    type === 'warning' ? 'bg-warning' : ''}">
                <strong class="me-auto">${
                    type === 'error' ? 'Lỗi' :
                    type === 'success' ? 'Thành công' :
                    type === 'warning' ? 'Cảnh báo' : 'Thông báo'
                }</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        delay: type === 'error' ? config.toastDelayError : config.toastDelay
    });

    toast.show();

    // Remove toast from DOM after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function () {
        toastElement.remove();
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
}

function changeLanguage() {
    // This function is a placeholder for future language support
    console.log('Language change functionality will be implemented in a future update');
}
