import config from './config.js';
import * as apiService from './api-service.js';

// Debug info for demo mode
console.log('Config loaded:', config);
console.log('Demo mode status:', config.demoMode ? 'ENABLED' : 'DISABLED');

// Add demo mode indicator if in demo mode
if (config.demoMode) {
    console.log('Demo mode is enabled, setting up indicator');
    document.addEventListener('DOMContentLoaded', () => {
        const demoIndicator = document.createElement('div');
        demoIndicator.className = 'alert alert-warning';
        demoIndicator.style.marginBottom = '20px';
        demoIndicator.innerHTML = '<strong>Demo Mode</strong> - Running with mock data';

        // Insert the indicator at the top of the container
        const container = document.querySelector('.container');
        if (container) {
            // Insert at the beginning of the container, before any other content
            container.insertBefore(demoIndicator, container.firstChild);
            console.log('Demo indicator added to page');
        } else {
            console.error('Could not find container element for demo indicator');
        }

        // Add quick setup button for demo
        const setupBtn = document.createElement('button');
        setupBtn.className = 'btn btn-primary ms-2';
        setupBtn.innerHTML = 'Quick Setup';
        setupBtn.addEventListener('click', () => {
            // For demo mode, we'll just use a fixed ID
            localStorage.setItem('currentAuctionId', 'demo-auction-1');
            console.log('Quick Setup: Navigating directly to setup.html');
            window.location.href = 'setup.html';
        });
        demoIndicator.appendChild(setupBtn);
    });
}

// DOM Elements
const createAuctionBtn = document.getElementById('createAuctionBtn');
const auctionsTableBody = document.getElementById('auctionsTableBody');
const noAuctionsMessage = document.getElementById('noAuctionsMessage');
const loadingOverlay = document.querySelector('.loading-overlay');
const pageSizeSelect = document.getElementById('pageSizeSelect');
const paginationElement = document.getElementById('pagination');
const refreshBtn = document.getElementById('refreshBtn') || (() => {
    const btn = document.createElement('button');
    btn.id = 'refreshBtn';
    btn.className = 'btn btn-outline-primary me-2';
    btn.innerHTML = '<i class="fas fa-sync-alt"></i> Làm mới';
    document.querySelector('.auction-controls').prepend(btn);
    return btn;
})();

// Current pagination state
let currentPage = 1;
let currentPageSize = 10;
let totalPages = 1;

// Format date in Vietnamese locale
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Show loading overlay
function showLoading() {
    document.body.classList.add('loading');
}

// Hide loading overlay
function hideLoading() {
    document.body.classList.remove('loading');
}

// Format currency in VND
function formatCurrency(amount) {
    return amount.toLocaleString('vi-VN') + ' VND';
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} show`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">${type === 'error' ? 'Lỗi' : 'Thông báo'}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Đóng"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;

    toastContainer.appendChild(toast);

    // Auto hide after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
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

        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        showToast('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.', 'error');
        throw error;
    }
}

// Create auction row
function createAuctionRow(auction) {
    console.log('Creating row for auction:', auction);

    // Ensure status is properly normalized
    const status = auction.status || auction.auctionStatus || 'setup';
    console.log(`Auction ${auction.id} status: ${status}`);

    const statusClass = status === 'setup' ? 'bg-secondary' :
                         status === 'active' ? 'bg-success' : 'bg-danger';
    const statusText = status === 'setup' ? 'Chưa Bắt Đầu' :
                      status === 'active' ? 'Đang Diễn Ra' : 'Đã Kết Thúc';

    // Make sure bidders is an array
    const bidders = auction.bidders || [];

    // Ensure we have values for all properties
    const displayTitle = auction.title || 'Phiên Đấu Giá';
    const created = auction.created || new Date().toISOString();
    const startingPrice = auction.startingPrice || 0;
    const highestBid = auction.highestBid || 0;

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${displayTitle}</td>
        <td>${formatDate(created)}</td>
        <td><span class="badge ${statusClass}">${statusText}</span></td>
        <td class="starting-price">${formatCurrency(startingPrice)}</td>
        <td class="current-price">${status !== 'setup' && highestBid ? formatCurrency(highestBid) : '0 VND'}</td>
        <td>${bidders.length}</td>
        <td>
            <button class="btn btn-primary btn-sm view-auction" data-auction-id="${auction.id}">
                Xem Chi Tiết
            </button>
        </td>
    `;

    // Add event listener to view button
    const viewBtn = row.querySelector('.view-auction');
    viewBtn.addEventListener('click', () => viewAuction(auction.id));

    return row;
}

// Create pagination controls
function createPagination(currentPage, totalPages) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage - 1}">← Trang trước</a>`;
    pagination.appendChild(prevLi);

    // Current page indicator
    const currentLi = document.createElement('li');
    currentLi.className = 'page-item active';
    currentLi.innerHTML = `<span class="page-link">Trang ${currentPage}/${totalPages}</span>`;
    pagination.appendChild(currentLi);

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage + 1}">Trang sau →</a>`;
    pagination.appendChild(nextLi);

    // Add event listeners to pagination links
    pagination.querySelectorAll('.page-link').forEach(link => {
        if (!link.hasAttribute('data-page')) return; // Skip the current page indicator
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(e.target.dataset.page);
            if (page && page !== currentPage && page >= 1 && page <= totalPages) {
                loadAuctions(page, currentPageSize);
            }
        });
    });
}

// Load auctions from the server
async function loadAuctions(page = 1, pageSize = 10) {
    showLoading();
    try {
        let auctions = [];

        // In demo mode, we'll just have a single auction
        if (config.demoMode) {
            console.log('Loading demo auction data');

            // Create a demo auction directly without relying on API calls that might fail
            auctions = [{
                id: "demo-auction-1",
                title: "Demo Auction",
                created: new Date().toISOString(),
                status: "setup", // Start with setup status
                startingPrice: 1000000,
                highestBid: 0,
                bidders: [
                    { id: "B001", name: "Nguyễn Văn A", address: "123 Đường Lê Lợi, Hà Nội" },
                    { id: "B002", name: "Trần Thị B", address: "456 Đường Nguyễn Huệ, TP.HCM" },
                    { id: "B003", name: "Lê Văn C", address: "789 Đường Trần Phú, Đà Nẵng" }
                ]
            }];

            // Update pagination for demo
            currentPage = 1;
            totalPages = 1;

            // In demo mode, also set the localStorage for current auction
            localStorage.setItem('currentAuctionId', 'demo-auction-1');
        } else {
            // Real API call for production
            const result = await apiRequest(`${config.apiBaseUrl}${config.endpoints.auctions}?page=${page}&pageSize=${pageSize}`);
            auctions = result.data || [];
            currentPage = result.page;
            totalPages = result.totalPages;
            currentPageSize = result.pageSize;
        }

        console.log('Loaded auctions:', auctions);

        if (auctions && auctions.length > 0) {
            noAuctionsMessage.style.display = 'none';
            auctionsTableBody.innerHTML = '';

            auctions.forEach(auction => {
                const row = createAuctionRow(auction);
                auctionsTableBody.appendChild(row);
            });

            // Update pagination
            createPagination(currentPage, totalPages);
        } else {
            noAuctionsMessage.style.display = 'block';
            paginationElement.innerHTML = '';
        }
    } catch (error) {
        console.error('Failed to load auctions:', error);

        // If we're in demo mode and something went wrong, still show a demo auction
        if (config.demoMode) {
            console.log('Error occurred, but creating fallback demo auction');
            const fallbackAuction = {
                id: "demo-auction-1",
                title: "Demo Auction (Fallback)",
                created: new Date().toISOString(),
                status: "setup",
                startingPrice: 1000000,
                highestBid: 0,
                bidders: [
                    { id: "B001", name: "Nguyễn Văn A", address: "123 Đường Lê Lợi, Hà Nội" },
                    { id: "B002", name: "Trần Thị B", address: "456 Đường Nguyễn Huệ, TP.HCM" }
                ]
            };

            noAuctionsMessage.style.display = 'none';
            auctionsTableBody.innerHTML = '';
            const row = createAuctionRow(fallbackAuction);
            auctionsTableBody.appendChild(row);

            // Set localStorage for the demo auction
            localStorage.setItem('currentAuctionId', 'demo-auction-1');

            // No need to show an error toast in demo mode fallback
            return;
        }

        noAuctionsMessage.style.display = 'block';
        showToast('Không thể tải danh sách phiên đấu giá. Vui lòng thử lại.', 'error');
    } finally {
        hideLoading();
    }
}

// View an auction
async function viewAuction(auctionId) {
    showLoading();
    try {
        // Save auction ID to localStorage
        localStorage.setItem('currentAuctionId', auctionId);
        console.log(`Viewing auction: ${auctionId}`);

        if (config.demoMode) {
            console.log('Demo mode: navigating directly to setup page');
            // In demo mode, just go directly to the setup page without checking status
            console.log('Navigating to setup.html directly');
            window.location.href = 'setup.html';
            return;
        }

        // For non-demo mode, check the status and navigate accordingly
        const result = await apiRequest(`${config.apiBaseUrl}${config.endpoints.auctionById(auctionId)}`);
        const auction = result.data;
        const status = auction.status || auction.auctionStatus;

        console.log('Auction status:', status);

        // Navigate based on auction status
        if (status === 'setup') {
            window.location.href = config.pages.setup;
        } else if (status === 'active') {
            window.location.href = config.pages.bid;
        } else if (status === 'ended') {
            window.location.href = config.pages.result;
        } else {
            // Default to setup page
            window.location.href = config.pages.setup;
        }
    } catch (error) {
        console.error('Failed to get auction status:', error);
        showToast('Không thể mở phiên đấu giá. Vui lòng thử lại.', 'error');
        hideLoading();
    }
}

// Create a new auction
async function createNewAuction() {
    showLoading();
    try {
        console.log('Creating new auction');

        if (config.demoMode) {
            // In demo mode, just reset the demo data and go directly to setup
            console.log('Demo mode: going directly to setup page');
            localStorage.setItem('currentAuctionId', 'demo-auction-1');

            // Use direct navigation to setup.html instead of config.pages.setup
            console.log('Navigating to setup.html directly');
            window.location.href = 'setup.html';
            return;
        }

        // Real API call for production
        const auctionData = {
            title: "Phiên Đấu Giá Mới",
            startingPrice: config.defaultSettings.startingPrice,
            priceStep: config.defaultSettings.priceStep
        };

        const result = await apiRequest(`${config.apiBaseUrl}${config.endpoints.auctions}`, {
            method: 'POST',
            body: JSON.stringify(auctionData)
        });

        const newAuction = result.data;
        localStorage.setItem('currentAuctionId', newAuction.id);
        window.location.href = config.pages.setup;
    } catch (error) {
        console.error('Failed to create auction:', error);
        showToast('Không thể tạo phiên đấu giá mới. Vui lòng thử lại.', 'error');
        hideLoading();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');

    // Force-add a demo auction row if in demo mode
    if (config.demoMode) {
        console.log('Demo mode detected, forcing sample data display');
        // Hide the no auctions message immediately
        if (noAuctionsMessage) {
            noAuctionsMessage.style.display = 'none';
        }

        // Create a sample auction directly
        const sampleAuction = {
            id: "demo-auction-1",
            title: "Demo Auction",
            created: new Date().toISOString(),
            status: "setup",
            startingPrice: 1000000,
            highestBid: 0,
            bidders: [
                { id: "B001", name: "Nguyễn Văn A", address: "123 Đường Lê Lợi, Hà Nội" },
                { id: "B002", name: "Trần Thị B", address: "456 Đường Nguyễn Huệ, TP.HCM" },
                { id: "B003", name: "Lê Văn C", address: "789 Đường Trần Phú, Đà Nẵng" }
            ]
        };

        // Clear table and add the sample row directly to the DOM
        if (auctionsTableBody) {
            auctionsTableBody.innerHTML = '';
            const row = createAuctionRow(sampleAuction);
            auctionsTableBody.appendChild(row);
            console.log('Sample auction row added directly to DOM');
        } else {
            console.error('auctionsTableBody element not found');
        }
    }

    // Add click handler for create auction button
    if (createAuctionBtn) {
        createAuctionBtn.addEventListener('click', createNewAuction);
    }

    // Add click handler for refresh button
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Đang làm mới...';
            loadAuctions(currentPage, currentPageSize).finally(() => {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Làm mới';
            });
        });
    }

    // Show no auctions message initially only if not in demo mode
    if (noAuctionsMessage && !config.demoMode) {
        noAuctionsMessage.style.display = 'block';
    }

    // Add event listener for page size changes
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', (e) => {
            currentPageSize = parseInt(e.target.value);
            currentPage = 1; // Reset to first page when changing page size
            loadAuctions(currentPage, currentPageSize);
        });
    }

    // Load auctions on page load (but we've already added sample data in demo mode)
    if (!config.demoMode) {
        loadAuctions();
    }
});
