// Import configuration and API service
import config from './config.js';
import * as apiService from './api-service.js';

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

// Add demo mode indicator if in demo mode
if (config.demoMode) {
    const demoIndicator = document.createElement('div');
    demoIndicator.className = 'alert alert-warning';
    demoIndicator.innerHTML = '<strong>Demo Mode</strong> - Running with mock data';
    document.querySelector('.container').prepend(demoIndicator);

    // Add reset button if in demo mode
    const resetBtn = document.createElement('button');
    resetBtn.id = 'resetDemoBtn';
    resetBtn.className = 'btn btn-danger me-2';
    resetBtn.innerHTML = '<i class="fas fa-redo"></i> Reset Demo';
    resetBtn.addEventListener('click', async () => {
        try {
            await apiService.resetDemo();
            showToast('Demo data reset successfully', 'success');
            loadData();
        } catch (error) {
            showToast(`Error resetting demo: ${error.message}`, 'danger');
        }
    });
    document.querySelector('.auction-controls').prepend(resetBtn);
}

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
        console.log('Demo Mode:', config.demoMode ? 'Enabled' : 'Disabled');
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

    // Load initial data
    loadData();
});

// Load data (auction settings and bidders)
async function loadData() {
    console.log('Loading data...');

    try {
        showLoadingIndicator(true);

        let loadedSettings = false;
        let loadedBidders = false;

        try {
            // Load auction settings
            await loadAuctionSettings();
            loadedSettings = true;
        } catch (error) {
            console.error('Error loading auction settings:', error);
            showToast(`Error loading auction settings: ${error.message}`, 'danger');
        }

        try {
            // Load bidders
            await loadBidders();
            loadedBidders = true;
        } catch (error) {
            console.error('Error loading bidders:', error);
            showToast(`Error loading bidders: ${error.message}`, 'danger');
        }

        if (!loadedSettings && !loadedBidders) {
            // Both requests failed
            apiConnectionFailed = true;
            lastConnectionAttempt = Date.now();
            showToast('Failed to connect to the server. Running in offline mode.', 'danger');
        } else {
            // At least one request succeeded
            apiConnectionFailed = false;
        }

        // Update UI based on data
        renderBiddersList();
        updateStartButtonState();
    } finally {
        showLoadingIndicator(false);
    }
}

// Show or hide loading indicator
function showLoadingIndicator(show) {
    document.body.classList.toggle('loading', show);
}

// Load auction settings
async function loadAuctionSettings() {
    try {
        auctionSettings = await apiService.getAuctionSettings();

        // Update form values with settings
        initialPriceInput.value = auctionSettings.initialPrice || config.defaultSettings.startingPrice;
        priceIncrementInput.value = auctionSettings.priceIncrement || config.defaultSettings.priceStep;

        return auctionSettings;
    } catch (error) {
        console.error('Error loading auction settings:', error);
        throw error;
    }
}

// Update auction settings
async function updateAuctionSettings(settings) {
    try {
        showLoadingIndicator(true);

        // Get values from form
        const initialPrice = parseInt(initialPriceInput.value.replace(/[,.]/g, '')) || config.defaultSettings.startingPrice;
        const priceIncrement = parseInt(priceIncrementInput.value.replace(/[,.]/g, '')) || config.defaultSettings.priceStep;

        // Update settings object
        const updatedSettings = {
            initialPrice,
            priceIncrement,
            ...settings
        };

        // Update settings via API
        const result = await apiService.updateAuctionSettings(updatedSettings);

        // Update local settings
        auctionSettings = result;

        // Update form values
        initialPriceInput.value = formatCurrency(auctionSettings.initialPrice);
        priceIncrementInput.value = formatCurrency(auctionSettings.priceIncrement);

        if (config.debug) {
            console.log('Updated auction settings:', auctionSettings);
        }

        return result;
    } catch (error) {
        console.error('Error updating auction settings:', error);
        showToast(`Error saving settings: ${error.message}`, 'danger');
        throw error;
    } finally {
        showLoadingIndicator(false);
    }
}

// Load bidders
async function loadBidders() {
    try {
        const result = await apiService.getBidders();
        bidders = result || [];
        renderBiddersList();
        return bidders;
    } catch (error) {
        console.error('Error loading bidders:', error);
        throw error;
    }
}

// Render bidders list
function renderBiddersList() {
    // Clear list
    biddersList.innerHTML = '';

    // Show "no bidders" message if empty
    if (bidders.length === 0) {
        noBiddersMessage.style.display = 'block';
        return;
    }

    // Hide "no bidders" message if there are bidders
    noBiddersMessage.style.display = 'none';

    // Sort bidders by ID
    const sortedBidders = [...bidders].sort((a, b) => {
        // Sort numerically if both IDs are numbers
        const aNum = parseInt(a.id);
        const bNum = parseInt(b.id);
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
        }
        // Otherwise sort alphabetically
        return a.id.localeCompare(b.id);
    });

    // Add each bidder to list
    sortedBidders.forEach(bidder => {
        const row = document.createElement('tr');

        // ID column
        const idCell = document.createElement('td');
        idCell.textContent = bidder.id;
        row.appendChild(idCell);

        // Name column
        const nameCell = document.createElement('td');
        nameCell.textContent = bidder.name;
        row.appendChild(nameCell);

        // Address column
        const addressCell = document.createElement('td');
        addressCell.textContent = bidder.address || '-';
        row.appendChild(addressCell);

        // Actions column
        const actionsCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-sm';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', () => handleDeleteBidder(bidder.id));
        actionsCell.appendChild(deleteBtn);
        row.appendChild(actionsCell);

        biddersList.appendChild(row);
    });

    // Update start button state
    updateStartButtonState();
}

// Handle add bidder
async function handleAddBidder() {
    const bidderId = bidderIdInput.value.trim();
    const bidderName = bidderNameInput.value.trim();
    const bidderAddress = bidderAddressInput.value.trim();

    if (!bidderId || !bidderName) {
        showToast('ID và Tên là bắt buộc', 'warning');
        return;
    }

    // Check for duplicate ID
    if (bidders.some(b => b.id === bidderId)) {
        showToast('ID đã tồn tại', 'warning');
        return;
    }

    try {
        showLoadingIndicator(true);

        const newBidder = {
            id: bidderId,
            name: bidderName,
            address: bidderAddress
        };

        // Add bidder via API
        await apiService.addBidder(newBidder);

        // Reload bidders
        await loadBidders();

        // Clear form
        bidderIdInput.value = '';
        bidderNameInput.value = '';
        bidderAddressInput.value = '';
        bidderIdInput.focus();

        showToast('Người tham gia đã được thêm', 'success');
    } catch (error) {
        console.error('Error adding bidder:', error);
        showToast(`Error adding bidder: ${error.message}`, 'danger');
    } finally {
        showLoadingIndicator(false);
    }
}

// Handle delete bidder
async function handleDeleteBidder(id) {
    try {
        showLoadingIndicator(true);

        // Delete bidder via API
        await apiService.deleteBidder(id);

        // Reload bidders
        await loadBidders();

        showToast('Người tham gia đã được xóa', 'success');
    } catch (error) {
        console.error('Error deleting bidder:', error);
        showToast(`Error deleting bidder: ${error.message}`, 'danger');
    } finally {
        showLoadingIndicator(false);
    }
}

// Handle file upload
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        showLoadingIndicator(true);

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('File too large (max 5MB)', 'warning');
            return;
        }

        // Check file type
        const fileExt = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(fileExt)) {
            showToast('Invalid file type (must be Excel or CSV)', 'warning');
            return;
        }

        // Read file
        const importedBidders = await parseExcelFile(file);

        // Check if any bidders were found
        if (!importedBidders || importedBidders.length === 0) {
            showToast('No valid bidders found in file', 'warning');
            return;
        }

        // Import bidders via API
        const result = await apiService.importBidders(importedBidders);

        // Reload bidders
        await loadBidders();

        showToast(`Imported ${result.imported} of ${result.total} bidders`, 'success');
    } catch (error) {
        console.error('Error importing bidders:', error);
        showToast(`Error importing bidders: ${error.message}`, 'danger');
    } finally {
        // Reset file input
        event.target.value = null;
        showLoadingIndicator(false);
    }
}

// Parse Excel file
async function parseExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get first sheet
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                // Convert to JSON
                const rows = XLSX.utils.sheet_to_json(sheet);

                // Map rows to bidders
                const bidders = rows.map(row => {
                    const id = row['ID'] || row['Mã Số'] || row['Ma So'] || row['MaSo'] || '';
                    const name = row['Name'] || row['Tên'] || row['Ten'] || '';
                    const address = row['Address'] || row['Địa Chỉ'] || row['Dia Chi'] || '';

                    return { id: String(id), name, address };
                }).filter(b => b.id && b.name); // Filter out invalid entries

                resolve(bidders);
            } catch (error) {
                console.error('Error parsing Excel file:', error);
                reject(new Error('Could not parse Excel file'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Could not read file'));
        };

        reader.readAsArrayBuffer(file);
    });
}

// Handle start auction
async function handleStartAuction() {
    if (bidders.length < MIN_BIDDERS) {
        showToast(`Cần ít nhất ${MIN_BIDDERS} người tham gia để bắt đầu đấu giá`, 'warning');
        return;
    }

    try {
        showLoadingIndicator(true);

        // Save auction settings
        await updateAuctionSettings({
            initialPrice: parseInt(initialPriceInput.value.replace(/[,.]/g, '')) || config.defaultSettings.startingPrice,
            priceIncrement: parseInt(priceIncrementInput.value.replace(/[,.]/g, '')) || config.defaultSettings.priceStep
        });

        // Start auction via API
        await apiService.startAuction();

        console.log("Auction started, redirecting to bid page:", config.pages.bid);

        // In demo mode, make sure localStorage is set correctly
        if (config.demoMode) {
            localStorage.setItem('currentAuctionId', 'demo-auction-1');
        }

        // Redirect to auction page
        window.location.href = config.pages.bid;
    } catch (error) {
        console.error('Error starting auction:', error);
        showToast(`Error starting auction: ${error.message}`, 'danger');
        showLoadingIndicator(false);
    }
}

// Update start button state
function updateStartButtonState() {
    const hasEnoughBidders = bidders.length >= MIN_BIDDERS;
    startAuctionBtn.disabled = !hasEnoughBidders;

    if (!hasEnoughBidders) {
        startAuctionBtn.title = `Cần ít nhất ${MIN_BIDDERS} người tham gia để bắt đầu đấu giá`;
    } else {
        startAuctionBtn.title = 'Bắt đầu phiên đấu giá';
    }
}

// Show toast message
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast show bg-${type} text-white`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="toast-header bg-${type} text-white">
            <strong class="me-auto">Notification</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;

    toastContainer.appendChild(toast);

    // Auto close after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, type === 'danger' ? config.toastDelayError : config.toastDelay);

    // Allow manual close
    const closeBtn = toast.querySelector('.btn-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
}

// Format currency
function formatCurrency(amount) {
    if (!amount && amount !== 0) return '';
    return new Intl.NumberFormat('vi-VN').format(amount);
}

// Change language
function changeLanguage() {
    // Implement language change
    const selectedLanguage = languageSelect.value;
    console.log('Selected language:', selectedLanguage);
}
