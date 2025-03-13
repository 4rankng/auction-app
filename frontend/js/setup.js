// Import configuration
import config from './config.js';

// Constants from configuration
const API_BASE_URL = config.apiBaseUrl;
const MIN_BIDDERS = config.minBidders || 2;

// DOM Elements
const initialPriceInput = document.getElementById('initialPrice');
const priceIncrementInput = document.getElementById('priceIncrement');
const bidderIdInput = document.getElementById('bidderId');
const bidderNameInput = document.getElementById('bidderName');
const bidderAddressInput = document.getElementById('bidderAddress');
const addBidderBtn = document.getElementById('addBidder');
const importExcelBtn = document.getElementById('importExcel');
const fileInput = document.getElementById('fileInput');
const biddersList = document.getElementById('biddersList');
const noBiddersMessage = document.getElementById('noBidders');
const startAuctionBtn = document.getElementById('startAuction');
const currentYearSpan = document.getElementById('currentYear');
const toastContainer = document.querySelector('.toast-container');
const languageSelect = document.getElementById('language');
const refreshBtn = document.getElementById('refreshBtn') || (() => {
    const btn = document.createElement('button');
    btn.id = 'refreshBtn';
    btn.className = 'btn btn-outline-primary me-2';
    btn.innerHTML = '<i class="fas fa-sync-alt"></i> Làm mới';
    document.querySelector('.auction-controls').prepend(btn);
    return btn;
})();

// State
let bidders = [];
let auctionSettings = {
    initialPrice: 0,
    priceIncrement: 0
};
let apiConnectionFailed = false;
let lastConnectionAttempt = 0;
const MIN_RETRY_INTERVAL = config.minRetryInterval || 5000; // Minimum time between connection retry attempts

// Add console logs for debugging
console.log('Initializing page...');

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Log API URL if in debug mode
    if (config.debug) {
        console.log('API URL:', API_BASE_URL);
    }

    // Set current year
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Add event listeners
    addBidderBtn.addEventListener('click', handleAddBidder);
    importExcelBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);
    refreshBtn.addEventListener('click', () => {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Đang làm mới...';
        loadData().finally(() => {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Làm mới';
        });
    });

    // Debug event for start auction button
    console.log('Adding click handler to start auction button');
    startAuctionBtn.addEventListener('click', (e) => {
        console.log('START AUCTION BUTTON CLICKED');
        e.preventDefault();
        handleStartAuction();
    });

    // Setting up error tracking for button
    startAuctionBtn.addEventListener('error', (e) => {
        console.error('Button error:', e);
    });

    if (languageSelect) {
        languageSelect.addEventListener('change', changeLanguage);
    }

    // Show initial empty state
    noBiddersMessage.style.display = 'block';
});

// Load data (auction settings and bidders)
async function loadData() {
    console.log('Loading data...');

    try {
        showLoadingIndicator(true);

        let loadedSettings = false;
        let loadedBidders = false;

        // Load auction settings
        try {
            auctionSettings = await loadAuctionSettings();
            console.log('Loaded settings:', auctionSettings);
            loadedSettings = true;

            if (auctionSettings) {
                // Update form inputs with current settings
                initialPriceInput.value = auctionSettings.startingPrice || '';
                priceIncrementInput.value = auctionSettings.priceStep || '';
            }
        } catch (settingsError) {
            console.error('Error loading settings:', settingsError);
        }

        // Load bidders
        try {
            bidders = await loadBidders();
            console.log('Loaded bidders:', bidders);
            loadedBidders = true;
            renderBiddersList();
        } catch (biddersError) {
            console.error('Error loading bidders:', biddersError);
        }

        // Update UI elements
        updateStartButtonState();

        // Check if all data loaded
        if (!loadedSettings || !loadedBidders) {
            showToast('Có lỗi khi tải dữ liệu. Một số chức năng có thể không hoạt động đúng.', 'warning');
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Không thể tải dữ liệu. Vui lòng thử lại sau.', 'error');
    } finally {
        showLoadingIndicator(false);
    }
}

// Show/hide loading indicator
function showLoadingIndicator(show) {
    console.log(show ? 'Showing loading indicator' : 'Hiding loading indicator');
    document.body.classList.toggle('loading', show);

    // Disable buttons during loading
    const buttons = [addBidderBtn, importExcelBtn, startAuctionBtn];
    buttons.forEach(btn => {
        if (btn) btn.disabled = show;
    });

    // Set a timeout to automatically remove loading state after 15 seconds
    // This prevents the UI from getting stuck in loading state indefinitely
    if (show) {
        window.loadingTimeout = setTimeout(() => {
            if (document.body.classList.contains('loading')) {
                console.log('Loading timeout reached - forcing reset of loading state');
                document.body.classList.remove('loading');
                buttons.forEach(btn => {
                    if (btn) btn.disabled = false;
                });
                showToast('Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.', 'warning');
            }
        }, 15000); // 15 seconds timeout
    } else {
        if (window.loadingTimeout) {
            clearTimeout(window.loadingTimeout);
        }
    }
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
async function apiRequest(url, options = {}, suppressToast = false) {
    console.log('Making API request to:', url);
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
        if (!suppressToast) {
            showToast('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.', 'error');
        }
        throw error;
    }
}

// Load auction settings from the API
async function loadAuctionSettings() {
    try {
        const url = `${API_BASE_URL}${config.endpoints.auctionSettings}`;
        const data = await apiRequest(url);
        return data || config.defaultSettings;
    } catch (error) {
        console.error('Error loading auction settings:', error);
        return config.defaultSettings;
    }
}

// Update auction settings and create auction if needed
async function updateAuctionSettings(settings) {
    try {
        showLoadingIndicator(true);

        // Get all auctions first
        const auctionsUrl = `${API_BASE_URL}${config.endpoints.auctions}`;
        const auctionsResponse = await apiRequest(auctionsUrl);

        let auctionData;

        // If no auctions exist or all are completed, create a new one
        if (!auctionsResponse.data || auctionsResponse.data.length === 0 ||
            auctionsResponse.data.every(auction => auction.status === 'completed')) {
            // Create a new auction
            const createUrl = `${API_BASE_URL}${config.endpoints.auctions}`;
            const response = await apiRequest(createUrl, {
                method: 'POST',
                body: JSON.stringify({
                    title: 'New Auction',
                    startingPrice: settings.initialPrice,
                    priceStep: settings.priceIncrement
                })
            });

            auctionData = response.data;
            console.log('Created new auction:', auctionData);
        } else {
            // Use the first auction that isn't completed
            auctionData = auctionsResponse.data.find(auction => auction.status !== 'completed');
        }

        // Store the auction ID in localStorage for other pages
        localStorage.setItem('currentAuctionId', auctionData.id);

        return auctionData;
    } catch (error) {
        console.error('Error updating auction settings:', error);
        throw error;
    } finally {
        showLoadingIndicator(false);
    }
}

// Load bidders from API
async function loadBidders() {
    try {
        const url = `${API_BASE_URL}${config.endpoints.bidders}`;
        const response = await apiRequest(url);
        return response.data || [];
    } catch (error) {
        console.error('Error loading bidders:', error);
        showToast('Không thể tải danh sách người tham gia', 'error');
        return [];
    }
}

// Render bidders list
function renderBiddersList() {
    // Clear the list
    biddersList.innerHTML = '';

    // Show/hide no bidders message
    if (bidders.length === 0) {
        noBiddersMessage.style.display = 'block';
    } else {
        noBiddersMessage.style.display = 'none';

        // Add each bidder to the list
        bidders.forEach(bidder => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${bidder.id}</td>
                <td>${bidder.name}</td>
                <td>${bidder.address || ''}</td>
                <td>
                    <button
                        class="btn btn-sm btn-outline-danger delete-bidder"
                        data-id="${bidder.id}"
                    >
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;

            biddersList.appendChild(row);

            // Add event listener to delete button
            row.querySelector('.delete-bidder').addEventListener('click', () => {
                handleDeleteBidder(bidder.id);
            });
        });
    }

    // Update start button state
    updateStartButtonState();
}

// Add a new bidder
async function handleAddBidder() {
    // Get input values
    const id = bidderIdInput.value.trim();
    const name = bidderNameInput.value.trim();
    const address = bidderAddressInput.value.trim();

    // Validate inputs
    if (!id) {
        showToast('Vui lòng nhập mã người tham gia', 'warning');
        return;
    }

    if (!name) {
        showToast('Vui lòng nhập tên người tham gia', 'warning');
        return;
    }

    // Check if ID already exists
    if (bidders.some(bidder => bidder.id === id)) {
        showToast('Mã người tham gia đã tồn tại', 'warning');
        return;
    }

    try {
        showLoadingIndicator(true);

        const url = `${API_BASE_URL}${config.endpoints.bidders}`;
        const response = await apiRequest(url, {
            method: 'POST',
            body: JSON.stringify({
                name: name,
                address: address
            })
        });

        // Reload bidders after adding
        const updatedBidders = await loadBidders();
        bidders = updatedBidders;
        renderBiddersList();

        // Reset form
        bidderIdInput.value = '';
        bidderNameInput.value = '';
        bidderAddressInput.value = '';

        showToast('Thêm người tham gia thành công', 'success');
    } catch (error) {
        showToast(error.message || 'Không thể thêm người tham gia', 'error');
        console.error('Error adding bidder:', error);
    } finally {
        showLoadingIndicator(false);
    }
}

// Delete a bidder
async function handleDeleteBidder(id) {
    try {
        showLoadingIndicator(true);

        const url = `${API_BASE_URL}${config.endpoints.bidderById(id)}`;
        await apiRequest(url, {
            method: 'DELETE'
        });

        // Reload bidders
        const updatedBidders = await loadBidders();
        bidders = updatedBidders;
        renderBiddersList();

        showToast('Xóa người tham gia thành công', 'success');
    } catch (error) {
        showToast(error.message || 'Không thể xóa người tham gia', 'error');
        console.error('Error deleting bidder:', error);
    } finally {
        showLoadingIndicator(false);
    }
}

// Import bidders from Excel file
async function importBiddersFromExcel(file) {
    const url = `${API_BASE_URL}${config.endpoints.biddersImport}`;
    const formData = new FormData();
    formData.append('file', file);

    console.log('Importing bidders from Excel:', file);
    console.log('API URL:', url);

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Import result:', result);
        return result;
    } catch (error) {
        console.error('Error importing bidders:', error);
        throw error;
    }
}

// Handle file upload
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(fileExtension)) {
        showToast('Vui lòng chọn file Excel (.xlsx, .xls)', 'warning');
        fileInput.value = '';
        return;
    }

    try {
        showLoadingIndicator(true);
        importExcelBtn.disabled = true;
        importExcelBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...';

        const url = `${API_BASE_URL}${config.endpoints.biddersImport}`;
        const formData = new FormData();
        formData.append('file', file);

        // Set up fetch with AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorMsg = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.text();
                console.error('Error response:', errorData);
                if (errorData) {
                    try {
                        const errorJson = JSON.parse(errorData);
                        if (errorJson.error) {
                            errorMsg = errorJson.error;
                        }
                    } catch (e) {
                        // If JSON parsing fails, just use the text
                        if (errorData.length < 100) { // Only use short error messages
                            errorMsg = errorData;
                        }
                    }
                }
            } catch (e) {
                console.error('Error parsing error response:', e);
            }
            throw new Error(errorMsg);
        }

        // Process successful response
        const result = await response.json();
        console.log('Import result:', result);

        // Reload bidders
        const updatedBidders = await loadBidders();
        bidders = updatedBidders;
        renderBiddersList();

        showToast(`Nhập dữ liệu thành công: ${result.count || 'nhiều'} người tham gia`, 'success');
    } catch (error) {
        console.error('Error uploading Excel file:', error);
        showToast(error.message || 'Không thể nhập file Excel', 'error');
    } finally {
        importExcelBtn.disabled = false;
        importExcelBtn.innerHTML = '<i class="bi bi-file-earmark-excel"></i> Nhập Excel';
        showLoadingIndicator(false);
    }
}

// Start auction
async function handleStartAuction() {
    console.log("Starting auction with validation and API calls");

    // Check minimum bidders
    if (bidders.length < MIN_BIDDERS) {
        console.log(`Not enough bidders. Need ${MIN_BIDDERS}, have ${bidders.length}`);
        showToast(`Cần ít nhất ${MIN_BIDDERS} người tham gia để bắt đầu đấu giá`, 'warning');
        return;
    }

    // Validate input fields
    const initialPrice = parseInt(initialPriceInput.value);
    const priceIncrement = parseInt(priceIncrementInput.value);

    console.log(`Initial price: ${initialPrice}, Price increment: ${priceIncrement}`);

    // Validate initial price
    if (isNaN(initialPrice) || initialPrice < 0) {
        console.log('Invalid initial price');
        showToast('Giá khởi điểm phải là số dương', 'warning');
        return;
    }

    // Validate price increment
    if (isNaN(priceIncrement) || priceIncrement <= 0) {
        console.log('Invalid price increment');
        showToast('Bước giá phải là số dương lớn hơn 0', 'warning');
        return;
    }

    // Show loading indicator
    showLoadingIndicator(true);
    startAuctionBtn.disabled = true;
    startAuctionBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...';

    try {
        // Get the current auction ID
        const auctionId = localStorage.getItem('currentAuctionId');
        if (!auctionId) {
            throw new Error('No auction ID found');
        }

        // First set the bidders for the auction
        const setBiddersUrl = `${API_BASE_URL}${config.endpoints.auctionBidders(auctionId)}`;
        await apiRequest(setBiddersUrl, {
            method: 'PUT',
            body: JSON.stringify({
                bidders: bidders
            })
        });

        // Then start the auction
        const startUrl = `${API_BASE_URL}${config.endpoints.startAuction(auctionId)}`;
        await apiRequest(startUrl, {
            method: 'PUT'
        });

        // Redirect to bid page
        window.location.href = config.pages.bid;
    } catch (error) {
        showToast(error.message || 'Không thể bắt đầu phiên đấu giá', 'error');
        console.error('Error starting auction:', error);
        showLoadingIndicator(false);
    }
}

// Update start button state - always enable the button
function updateStartButtonState() {
    // Always enable the button regardless of bidder count
    startAuctionBtn.disabled = false;

    // Make sure button is visible and clickable
    startAuctionBtn.style.display = 'inline-block';
    startAuctionBtn.style.pointerEvents = 'auto';

    console.log("Start button enabled for direct navigation");
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
    let delay = config.toastDelay;  // Default delay

    switch (type) {
        case 'success':
            bgClass = 'bg-success';
            iconClass = 'bi-check-circle-fill';
            break;
        case 'error':
            bgClass = 'bg-danger';
            iconClass = 'bi-exclamation-circle-fill';
            delay = config.toastDelayError || 10000; // Use longer delay for errors
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

    // Initialize Bootstrap toast with appropriate delay
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: delay
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
