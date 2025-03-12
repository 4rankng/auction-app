// Import configuration
import config from './config.js';

// Constants from configuration
const API_BASE_URL = config.apiBaseUrl;
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

// Floating card elements
const floatingInitialPrice = document.getElementById('floatingInitialPrice');
const floatingPriceIncrement = document.getElementById('floatingPriceIncrement');
const floatingAuctionDuration = document.getElementById('floatingAuctionDuration');
const floatingTimer = document.getElementById('floatingTimer');

// State
let auctionStatus = {
    status: 'notStarted',
    round: 0,
    highestBid: 0,
    timeRemaining: 0,
    startTime: null // Add start time tracking
};
let auctionSettings = {
    initialPrice: 0,
    priceIncrement: 0,
    auctionDuration: DEFAULT_AUCTION_DURATION // Default duration
};
let bidHistory = [];
let bidders = [];
let timerInterval;
let apiConnectionFailed = false;
let lastConnectionAttempt = 0;
const MIN_RETRY_INTERVAL = config.retryInterval || 5000; // Minimum time between connection retry attempts

// Add event listeners
placeBidBtn.addEventListener('click', placeBid);
cancelBidBtn.addEventListener('click', cancelLastBid);
endAuctionBtn.addEventListener('click', endAuction);
backToSetupBtn.addEventListener('click', goToSetup);

// Set current year
if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
}

// Initialize the page
document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
    // Log API URL if in debug mode
    if (config.debug) {
        console.log('API URL:', API_BASE_URL);
    }

    try {
        // Load auction data
        await loadAuctionData();

        // Check auction status to determine if we should be on this page
        const status = auctionStatus.status;
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

        // Start timer update
        startTimers();

    } catch (error) {
        console.error('Failed to initialize auction page:', error);
        showToast('Không thể tải dữ liệu. Vui lòng thử lại sau.', 'error');
    }
}

function startTimers() {
    // Clear any existing intervals
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    // Start timer that updates every second
    timerInterval = setInterval(() => {
        // Update auction status
        loadAuctionStatus().catch(error => {
            console.error('Error updating auction status:', error);
        });

        // Update bid history
        loadBidHistory().catch(error => {
            console.error('Error updating bid history:', error);
        });
    }, TIMER_INTERVAL);
}

async function loadAuctionData() {
    showLoadingIndicator(true);

    try {
        await Promise.all([
            loadAuctionSettings(),
            loadAuctionStatus(),
            loadBidders(),
            loadBidHistory()
        ]);

        // Update UI elements
        updateStatusUI();
        updateBidderGrid();
        updateBidAmount();
        renderBidHistory();
        updateButtonStates();
        updateFloatingCard();

    } catch (error) {
        console.error('Failed to load auction data:', error);
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

async function loadAuctionSettings() {
    try {
        const data = await apiRequest(`${API_BASE_URL}/auction/settings`);

        if (data) {
            auctionSettings = {
                initialPrice: data.startingPrice || 0,
                priceIncrement: data.priceStep || 0,
                auctionDuration: config.defaultAuctionDuration
            };

            // Update UI
            if (floatingInitialPrice) {
                floatingInitialPrice.textContent = formatCurrency(auctionSettings.initialPrice);
            }
            if (floatingPriceIncrement) {
                floatingPriceIncrement.textContent = formatCurrency(auctionSettings.priceIncrement);
            }
            if (floatingAuctionDuration && auctionSettings.auctionDuration) {
                const minutes = Math.floor(auctionSettings.auctionDuration / 60);
                floatingAuctionDuration.textContent = `${minutes} phút`;
            }

            return auctionSettings;
        }
    } catch (error) {
        console.error('Failed to load auction settings:', error);
        throw error;
    }
}

function updateFloatingCard() {
    if (floatingInitialPrice) {
        floatingInitialPrice.textContent = formatCurrency(auctionSettings.initialPrice);
    }
    if (floatingPriceIncrement) {
        floatingPriceIncrement.textContent = formatCurrency(auctionSettings.priceIncrement);
    }
}

async function loadAuctionStatus() {
    try {
        const data = await apiRequest(`${API_BASE_URL}/auction/status`);

        if (data) {
            const prevStatus = auctionStatus.status;

            // Update auction status
            auctionStatus = {
                status: data.auctionStatus || 'notStarted',
                round: data.currentRound || 0,
                highestBid: data.highestBid || 0,
                highestBidder: data.highestBidder || '',
                startTime: data.startTime ? new Date(data.startTime) : null, // Parse start time
                timeRemaining: data.timeRemaining || 0
            };

            // Handle status changes
            if (prevStatus !== auctionStatus.status) {
                console.log('Auction status changed from', prevStatus, 'to', auctionStatus.status);

                // If auction was completed, redirect to result page
                if (auctionStatus.status === 'completed') {
                    showToast('Phiên đấu giá đã kết thúc!', 'success');
                    window.location.href = config.pages.result;
                    return;
                }

                // If auction was reset, redirect to setup page
                if (prevStatus !== 'notStarted' && auctionStatus.status === 'notStarted') {
                    showToast('Phiên đấu giá đã được thiết lập lại!', 'info');
                    window.location.href = config.pages.setup;
                    return;
                }
            }

            // Update UI
            updateStatusUI();
            updateButtonStates();
            updateElapsedTimeDisplay();

            return auctionStatus;
        }
    } catch (error) {
        console.error('Failed to load auction status:', error);
        // Don't throw the error here to prevent breaking the UI update interval
    }
}

function updateStatusUI() {
    // Update status badge
    if (statusBadge) {
        statusBadge.textContent = auctionStatus.status === 'notStarted' ? 'Chưa bắt đầu' :
                                  auctionStatus.status === 'inProgress' ? 'Đang diễn ra' : 'Đã kết thúc';

        statusBadge.className = 'badge ' +
                               (auctionStatus.status === 'notStarted' ? 'bg-secondary' :
                                auctionStatus.status === 'inProgress' ? 'bg-success' : 'bg-danger');
    }

    // Update round info
    if (roundInfo) {
        roundInfo.textContent = auctionStatus.round;
    }

    // Update current price
    if (currentPrice) {
        if (auctionStatus.round === 0) {
            currentPrice.textContent = formatCurrency(auctionSettings.initialPrice);
        } else {
            currentPrice.textContent = formatCurrency(auctionStatus.highestBid);
        }
    }

    // Update price increment
    if (priceIncrement) {
        priceIncrement.textContent = formatCurrency(auctionSettings.priceIncrement);
    }

    // Update bidders count
    if (biddersCount) {
        biddersCount.textContent = bidders.length;
    }
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
    if (!auctionStatus.startTime || !timer) return;

    // Calculate elapsed time
    const now = new Date();
    const elapsedMilliseconds = now - new Date(auctionStatus.startTime);
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
    if (auctionStatus.status !== 'inProgress') {
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
        if (bidder.id === auctionStatus.highestBidder) {
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

async function loadBidders() {
    try {
        const data = await apiRequest(`${API_BASE_URL}/bidders`);

        if (data) {
            bidders = data || [];
            return bidders;
        }
    } catch (error) {
        console.error('Failed to load bidders:', error);
        throw error;
    }
}

function updateBidAmount() {
    if (!bidAmount) return;

    // Calculate next bid amount
    let nextBid;

    if (auctionStatus.round === 0) {
        // First bid is the starting price
        nextBid = auctionSettings.initialPrice;
    } else {
        // Subsequent bids are highest bid + increment
        nextBid = auctionStatus.highestBid + auctionSettings.priceIncrement;
    }

    bidAmount.value = nextBid;
}

async function loadBidHistory() {
    try {
        const data = await apiRequest(`${API_BASE_URL}/auction/history`);

        if (data) {
            bidHistory = data || [];
            renderBidHistory();
            return bidHistory;
        }
    } catch (error) {
        console.error('Failed to load bid history:', error);
        // Don't throw to prevent breaking UI updates
    }
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
    const bidderId = selectedBidderId.value;

    if (!bidderId) {
        showToast('Vui lòng chọn người tham gia đấu giá', 'warning');
        return;
    }

    try {
        // Disable button and show loading state
        placeBidBtn.disabled = true;
        placeBidBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...';

        // Calculate bid amount
        const amount = parseInt(bidAmount.value);

        await apiRequest(`${API_BASE_URL}/auction/bid`, {
            method: 'POST',
            body: JSON.stringify({
                bidderId: bidderId,
                amount: amount
            })
        });

        // Show success message
        showToast('Đấu giá thành công!', 'success');

        // Update data
        await Promise.all([
            loadAuctionStatus(),
            loadBidHistory()
        ]);

        // Update UI
        updateStatusUI();
        updateBidderGrid();
        updateBidAmount();
        updateButtonStates();

    } catch (error) {
        showToast(error.message || 'Không thể đấu giá. Vui lòng thử lại.', 'error');
        console.error('Error placing bid:', error);
    } finally {
        // Reset button state
        placeBidBtn.disabled = false;
        placeBidBtn.innerHTML = '<i class="bi bi-check-circle"></i> Đấu Giá';
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
            loadAuctionStatus(),
            loadBidHistory()
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
    // Confirm with user
    if (!confirm('Bạn có chắc chắn muốn kết thúc phiên đấu giá?')) {
        return;
    }

    try {
        // Show loading state
        endAuctionBtn.disabled = true;
        endAuctionBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...';

        await apiRequest(`${API_BASE_URL}/auction/end`, {
            method: 'POST'
        });

        // Redirect to completed page
        window.location.href = config.pages.result;

    } catch (error) {
        showToast(error.message || 'Không thể kết thúc đấu giá', 'error');
        console.error('Error ending auction:', error);

        // Reset button state
        endAuctionBtn.disabled = false;
        endAuctionBtn.innerHTML = '<i class="bi bi-stop-circle"></i> Kết Thúc Đấu Giá';
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
