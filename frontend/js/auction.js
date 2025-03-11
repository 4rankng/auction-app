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
let elapsedTimeInterval; // New interval for tracking elapsed time
let apiConnectionFailed = false;
let lastConnectionAttempt = 0;
const MIN_RETRY_INTERVAL = 5000; // Minimum time between connection retry attempts (5 seconds)

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Log API URL if in debug mode
    if (config.debug) {
        console.log(`Using API URL: ${API_BASE_URL}`);
    }

    // Set current year in footer if exists
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Load auction data
    loadAuctionData();

    // Add event listeners
    placeBidBtn.addEventListener('click', placeBid);
    cancelBidBtn.addEventListener('click', cancelLastBid);
    endAuctionBtn.addEventListener('click', endAuction);
    backToSetupBtn.addEventListener('click', goToSetup);
    if (languageSelect) {
        languageSelect.addEventListener('change', changeLanguage);
    }

    // Start timers
    startTimers();

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // Page is visible, refresh data
            loadAuctionData();
        }
    });
});

// ========== Functions ==========

// Start both timer functions
function startTimers() {
    // Clear existing intervals if any
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    if (elapsedTimeInterval) {
        clearInterval(elapsedTimeInterval);
    }

    // Start countdown timer
    timerInterval = setInterval(() => {
        if (auctionStatus.status === 'inProgress' && typeof auctionStatus.timeRemaining === 'number' && auctionStatus.timeRemaining > 0) {
            auctionStatus.timeRemaining--;
            updateTimerDisplay(auctionStatus.timeRemaining);

            // If timer reaches zero, refresh data to check if auction ended
            if (auctionStatus.timeRemaining === 0) {
                loadAuctionData();
            }
        }
    }, TIMER_INTERVAL);

    // Start elapsed time timer
    elapsedTimeInterval = setInterval(() => {
        updateElapsedTimeDisplay();
    }, TIMER_INTERVAL);
}

// Load all necessary auction data
async function loadAuctionData() {
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

        // Load auction settings
        await loadAuctionSettings();

        // Load auction status
        await loadAuctionStatus();

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
        // Always hide loading indicator
        showLoadingIndicator(false);
    }
}

// Show/hide loading indicator
function showLoadingIndicator(show) {
    document.body.classList.toggle('loading', show);

    // Disable/enable interaction buttons during loading
    const buttons = [placeBidBtn, cancelBidBtn, endAuctionBtn, backToSetupBtn];
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

        // Add timeout to fetch requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        options.signal = controller.signal;

        const response = await fetch(url, options);
        clearTimeout(timeoutId);

        handleApiError(response);

        // For GET requests, try to parse JSON response
        if (options.method === undefined || options.method === 'GET') {
            try {
                return await response.json();
            } catch (parseError) {
                console.error('Error parsing JSON response:', parseError);
                return {}; // Return empty object instead of throwing
            }
        }

        return response;
    } catch (error) {
        console.error('API Request Error:', error);

        // Special handling for AbortController timeout
        if (error.name === 'AbortError') {
            showToast('Yêu cầu đã hết thời gian. Vui lòng thử lại.', 'error');
        } else {
            showToast('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.', 'error');
        }

        throw error;
    }
}

// Load auction settings from the API
async function loadAuctionSettings() {
    try {
        const response = await apiRequest(`${API_BASE_URL}/auction/settings`);

        // Map the backend field names to our frontend field names
        const data = response.data || {};
        auctionSettings = {
            initialPrice: data.startingPrice || 0,
            priceIncrement: data.priceStep || 0,
            auctionDuration: DEFAULT_AUCTION_DURATION // Default duration if not provided by API
        };

        // Update UI
        priceIncrement.textContent = formatCurrency(auctionSettings.priceIncrement);

        // Update floating card
        updateFloatingCard();

    } catch (error) {
        console.error('Error loading auction settings:', error);

        // Set default values if unable to load
        auctionSettings = {
            initialPrice: 0,
            priceIncrement: 0,
            auctionDuration: DEFAULT_AUCTION_DURATION
        };

        throw error;
    }
}

// Update floating card with auction information
function updateFloatingCard() {
    floatingInitialPrice.textContent = formatCurrency(auctionSettings.initialPrice);
    floatingPriceIncrement.textContent = formatCurrency(auctionSettings.priceIncrement);

    // Format duration as minutes:seconds
    const minutes = Math.floor(auctionSettings.auctionDuration / 60);
    const seconds = auctionSettings.auctionDuration % 60;
    floatingAuctionDuration.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Load auction status from the API
async function loadAuctionStatus() {
    try {
        const url = `${API_BASE_URL}${config.endpoints.auctionStatus}`;
        const data = await apiRequest(url);

        // Check if data is valid
        if (!data) {
            console.error('Invalid auction status data:', data);
            return;
        }

        const prevStatus = auctionStatus.status;

        // Store previous start time if it exists
        const prevStartTime = auctionStatus.startTime;

        // Ensure timeRemaining is a number
        let timeRemaining = 0;
        if (data.timeRemaining !== undefined && data.timeRemaining !== null) {
            timeRemaining = parseInt(data.timeRemaining);
            if (isNaN(timeRemaining)) {
                timeRemaining = 0;
            }
        }

        // Keep track of the previous time remaining for debugging
        const prevTimeRemaining = auctionStatus.timeRemaining;

        // Update auction status with new data
        auctionStatus = {
            ...data,
            timeRemaining: timeRemaining
        };

        // Debug log for timer
        console.log(`Timer updated: ${prevTimeRemaining} -> ${auctionStatus.timeRemaining}`);

        // If start time wasn't provided but status is inProgress, initialize it
        if (auctionStatus.status === 'inProgress') {
            // Keep previous start time if it exists, otherwise initialize it
            if (prevStartTime) {
                auctionStatus.startTime = prevStartTime;
            } else if (!auctionStatus.startTime) {
                // If first time entering inProgress state, set start time to now
                auctionStatus.startTime = Date.now();
            }
        } else {
            // If auction is not in progress, clear start time
            auctionStatus.startTime = null;
        }

        // Update UI
        updateStatusUI();

        // If status changed to 'completed', redirect to completed page
        if (prevStatus !== 'completed' && data.status === 'completed') {
            window.location.href = 'completed.html';
        }

        // Connection restored
        if (apiConnectionFailed) {
            showToast('Kết nối đến máy chủ đã được khôi phục.', 'success');
            apiConnectionFailed = false;
        }

    } catch (error) {
        console.error('Error loading auction status:', error);
        throw error;
    }
}

// Update the UI based on current auction status
function updateStatusUI() {
    // Update round info
    roundInfo.textContent = auctionStatus.round;

    // Update current price
    const displayPrice = auctionStatus.highestBid > 0
        ? auctionStatus.highestBid
        : auctionSettings.initialPrice;
    currentPrice.textContent = formatCurrency(displayPrice);

    // Update bid amount input
    updateBidAmount();

    // Update status badge
    let badgeClass = 'bg-secondary';
    let statusText = 'Chưa bắt đầu';

    switch (auctionStatus.status) {
        case 'inProgress':
            badgeClass = 'bg-primary';
            statusText = 'Đang diễn ra';
            break;
        case 'completed':
            badgeClass = 'bg-success';
            statusText = 'Đã kết thúc';
            break;
    }

    // Update all status badges (there might be multiple on the page)
    document.querySelectorAll('#statusBadge').forEach(badge => {
        badge.className = `badge ${badgeClass} rounded-pill`;
        badge.textContent = statusText;
    });

    // Update timer display
    updateTimerDisplay(auctionStatus.timeRemaining);

    // Update elapsed time display
    updateElapsedTimeDisplay();

    // Enable/disable buttons based on status
    updateButtonStates();
}

// Update the timer display
function updateTimerDisplay(seconds) {
    // Handle case when time remaining is unknown or invalid
    if (seconds === undefined || seconds === null || isNaN(seconds) || seconds < 0) {
        seconds = 0;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const timerText = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;

    // Update both timer displays
    if (timer) {
        timer.textContent = timerText;
        // Add urgency styling when time is running low
        if (seconds <= 10) {
            timer.classList.add('urgent', 'text-danger', 'fw-bold');
        } else {
            timer.classList.remove('urgent', 'text-danger', 'fw-bold');
        }
    }

    if (floatingTimer) {
        floatingTimer.textContent = timerText;
        // Add urgency styling when time is running low
        if (seconds <= 10) {
            floatingTimer.classList.add('urgent', 'text-danger', 'fw-bold');
        } else {
            floatingTimer.classList.remove('urgent', 'text-danger', 'fw-bold');
        }
    }
}

// Update elapsed time display
function updateElapsedTimeDisplay() {
    // Only show elapsed time if auction is in progress and we have a start time
    if (auctionStatus.status !== 'inProgress' || !auctionStatus.startTime) {
        floatingAuctionDuration.textContent = '00:00';
        return;
    }

    // Calculate elapsed time in seconds
    const elapsedMilliseconds = Date.now() - auctionStatus.startTime;
    const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);

    // Format elapsed time
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    const elapsedText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Update display
    floatingAuctionDuration.textContent = elapsedText;
}

// Update button states based on auction status
function updateButtonStates() {
    const isInProgress = auctionStatus.status === 'inProgress';
    const hasHistory = bidHistory.length > 0;

    placeBidBtn.disabled = !isInProgress;
    cancelBidBtn.disabled = !isInProgress || !hasHistory;
    endAuctionBtn.disabled = !isInProgress;
}

// Update the bidder selection UI with grid of boxes
function updateBidderGrid() {
    // Clear current grid
    if (bidderGrid) {
        bidderGrid.innerHTML = '';
    }

    // Get currently selected bidder
    const currentSelection = selectedBidderId ? selectedBidderId.value : '';

    // Add bidders to grid - with error handling
    if (Array.isArray(bidders)) {
        bidders.forEach(bidder => {
            if (bidder && bidder.id) {
                const box = document.createElement('div');
                box.className = 'bidder-box';
                if (currentSelection && currentSelection === bidder.id.toString()) {
                    box.classList.add('selected');
                }
                box.dataset.bidderId = bidder.id;
                box.textContent = bidder.id;

                // Add tooltip with bidder name
                box.title = bidder.name || `Bidder ${bidder.id}`;

                // Add click event
                box.addEventListener('click', function() {
                    selectBidder(bidder.id);
                });

                bidderGrid.appendChild(box);
            }
        });
    } else {
        console.error('Bidders is not an array:', bidders);
    }
}

// Select a bidder
function selectBidder(bidderId) {
    // Store the selection
    if (selectedBidderId) {
        selectedBidderId.value = bidderId;
    }

    // Update visual selection
    const bidderBoxes = document.querySelectorAll('.bidder-box');
    bidderBoxes.forEach(box => {
        if (box.dataset.bidderId == bidderId) {
            box.classList.add('selected');
        } else {
            box.classList.remove('selected');
        }
    });

    // Update bid amount
    updateBidAmount();
}

// Load bidders from the API
async function loadBidders() {
    try {
        const url = `${API_BASE_URL}${config.endpoints.bidders}`;
        const data = await apiRequest(url);

        // Ensure bidders is always an array
        if (Array.isArray(data)) {
            bidders = data;
        } else if (data && Array.isArray(data.data)) {
            // Handle case where API returns { data: [...bidders] }
            bidders = data.data;
        } else {
            // Fallback to empty array if data is not in expected format
            console.error('Unexpected bidders data format:', data);
            bidders = [];
        }

        // Update UI
        biddersCount.textContent = bidders.length;
        updateBidderGrid();  // Use the new function instead of updateBidderSelect

    } catch (error) {
        console.error('Error loading bidders:', error);
        bidders = [];
        biddersCount.textContent = '0';
        throw error;
    }
}

// Update the bid amount based on current price and increment
function updateBidAmount() {
    const highestBid = auctionStatus.highestBid;
    const initialPrice = auctionSettings.initialPrice;
    const increment = auctionSettings.priceIncrement;

    // Calculate next bid amount
    let nextBid = 0;

    if (highestBid > 0) {
        nextBid = highestBid + increment;
    } else {
        nextBid = initialPrice;
    }

    bidAmount.value = nextBid;
}

// Load bid history from the API
async function loadBidHistory() {
    try {
        const url = `${API_BASE_URL}${config.endpoints.auctionHistory}`;
        const data = await apiRequest(url);
        bidHistory = data || [];

        // Update UI
        renderBidHistory();

    } catch (error) {
        console.error('Error loading bid history:', error);
        bidHistory = [];
        renderBidHistory();
        throw error;
    }
}

// Render bid history
function renderBidHistory() {
    // Clear the list
    bidHistoryList.innerHTML = '';

    // Show/hide no history message
    if (bidHistory.length === 0) {
        noBidHistory.style.display = 'block';
    } else {
        noBidHistory.style.display = 'none';

        // Add each bid to the list
        bidHistory.forEach(bid => {
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

    // Update cancel button state
    cancelBidBtn.disabled = bidHistory.length === 0 || auctionStatus.status !== 'inProgress';
}

// Place bid
async function placeBid() {
    // Get selected bidder
    const bidderId = selectedBidderId ? selectedBidderId.value : '';

    if (!bidderId) {
        showToast('Vui lòng chọn người tham gia', 'warning');
        return;
    }

    // Get bid amount
    const amount = parseInt(bidAmount.value);
    if (isNaN(amount) || amount <= 0) {
        showToast('Số tiền không hợp lệ', 'warning');
        return;
    }

    try {
        // Show loading state
        placeBidBtn.disabled = true;
        placeBidBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...';

        const response = await apiRequest(`${API_BASE_URL}/auction/bid`, {
            method: 'POST',
            body: JSON.stringify({
                bidderId: bidderId,
                amount: amount
            })
        });

        // Reload auction data
        await loadAuctionData();

        showToast('Đấu giá thành công', 'success');

    } catch (error) {
        showToast(error.message || 'Không thể đấu giá', 'error');
        console.error('Error placing bid:', error);
    } finally {
        // Reset button state
        placeBidBtn.disabled = false;
        placeBidBtn.innerHTML = '<i class="bi bi-check-circle"></i> Đấu Giá';
    }
}

// Cancel last bid
async function cancelLastBid() {
    if (bidHistory.length === 0) {
        showToast('Không có lịch sử đấu giá để hủy', 'warning');
        return;
    }

    try {
        // Show loading state
        cancelBidBtn.disabled = true;
        cancelBidBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...';

        await apiRequest(`${API_BASE_URL}/auction/bid/cancel`, {
            method: 'POST'
        });

        // Reload auction data
        await loadAuctionData();

        showToast('Đã hủy đấu giá cuối cùng', 'success');

    } catch (error) {
        showToast(error.message || 'Không thể hủy đấu giá', 'error');
        console.error('Error canceling bid:', error);
    } finally {
        // Reset button state
        cancelBidBtn.disabled = false;
        cancelBidBtn.innerHTML = '<i class="bi bi-x-circle"></i> Hủy Đấu Giá Cuối';
    }
}

// End auction
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
        window.location.href = 'completed.html';

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
    window.location.href = 'index.html';
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
