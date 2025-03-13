import config from './config.js';

// DOM Elements
const createAuctionBtn = document.getElementById('createAuctionBtn');
const auctionsTableBody = document.getElementById('auctionsTableBody');
const noAuctionsMessage = document.getElementById('noAuctionsMessage');
const loadingOverlay = document.querySelector('.loading-overlay');
const pageSizeSelect = document.getElementById('pageSizeSelect');
const paginationElement = document.getElementById('pagination');

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
    const status = auction.status || auction.auctionStatus || 'notStarted';
    const statusClass = status === 'notStarted' ? 'bg-secondary' :
                         status === 'inProgress' ? 'bg-success' : 'bg-danger';
    const statusText = status === 'notStarted' ? 'Chưa Bắt Đầu' :
                      status === 'inProgress' ? 'Đang Diễn Ra' : 'Đã Kết Thúc';

    // Make sure bidders is an array
    const bidders = auction.bidders || [];

    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${auction.title || 'Phiên Đấu Giá'}</td>
        <td>${formatDate(auction.created)}</td>
        <td><span class="badge ${statusClass}">${statusText}</span></td>
        <td class="starting-price">${formatCurrency(auction.startingPrice)}</td>
        <td class="current-price">${status !== 'notStarted' && auction.highestBid ? formatCurrency(auction.highestBid) : '0 VND'}</td>
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
        const result = await apiRequest(`${config.apiBaseUrl}${config.endpoints.auctions}?page=${page}&pageSize=${pageSize}`);

        currentPage = result.page;
        totalPages = result.totalPages;
        currentPageSize = result.pageSize;
        const auctions = result.data || [];

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
        localStorage.setItem('currentAuctionId', auctionId);
        const result = await apiRequest(`${config.apiBaseUrl}${config.endpoints.auctionById(auctionId)}`);
        const auction = result.data;
        const status = auction.status || auction.auctionStatus;

        if (status === 'notStarted') {
            window.location.href = config.pages.setup;
        } else if (status === 'inProgress') {
            window.location.href = config.pages.bid;
        } else if (status === 'completed') {
            window.location.href = config.pages.result;
        }
    } catch (error) {
        console.error('Failed to get auction status:', error);
        showToast('Không thể mở phiên đấu giá. Vui lòng thử lại.', 'error');
    } finally {
        hideLoading();
    }
}

// Create a new auction
async function createNewAuction() {
    showLoading();
    try {
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
    } finally {
        hideLoading();
    }
}

// Event Listeners
createAuctionBtn.addEventListener('click', createNewAuction);
pageSizeSelect.addEventListener('change', (e) => {
    currentPageSize = parseInt(e.target.value);
    loadAuctions(1, currentPageSize);
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAuctions(1, currentPageSize);
});
