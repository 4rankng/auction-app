import config from './config.js';

// DOM Elements
const createAuctionBtn = document.getElementById('createAuctionBtn');
const auctionsContainer = document.getElementById('auctionsContainer');
const noAuctionsMessage = document.getElementById('noAuctionsMessage');
const loadingOverlay = document.querySelector('.loading-overlay');

// Show loading overlay
function showLoading() {
    document.body.classList.add('loading');
}

// Hide loading overlay
function hideLoading() {
    document.body.classList.remove('loading');
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    const toastId = `toast-${Date.now()}`;
    const toastHtml = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${type === 'error' ? 'bg-danger text-white' : type === 'success' ? 'bg-success text-white' : ''}">
                <strong class="me-auto">${type === 'error' ? 'Error' : 'Notification'}</strong>
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

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
}

// Create auction card
function createAuctionCard(auction) {
    const status = auction.status || auction.auctionStatus || 'notStarted';
    const statusClass = status === 'notStarted' ? 'bg-secondary' :
                         status === 'inProgress' ? 'bg-success' : 'bg-danger';
    const statusText = status === 'notStarted' ? 'Not Started' :
                      status === 'inProgress' ? 'In Progress' : 'Completed';

    // Make sure bidders is an array
    const bidders = auction.bidders || [];

    const card = document.createElement('div');
    card.className = 'col-md-4 mb-4';
    card.innerHTML = `
        <div class="card auction-card">
            <div class="card-header d-flex justify-content-between">
                <h5 class="card-title mb-0">${auction.title || 'Auction'}</h5>
                <span class="badge ${statusClass}">${statusText}</span>
            </div>
            <div class="card-body">
                <p><strong>Starting Price:</strong> ${formatCurrency(auction.startingPrice)}</p>
                <p><strong>Price Step:</strong> ${formatCurrency(auction.priceStep)}</p>
                <p><strong>Bidders:</strong> ${bidders.length}</p>
                ${status !== 'notStarted' && auction.highestBid ?
                    `<p><strong>Current Highest Bid:</strong> ${formatCurrency(auction.highestBid)}</p>` : ''}
            </div>
            <div class="card-footer">
                <button class="btn btn-primary btn-sm view-auction" data-auction-id="${auction.id}">
                    View Auction
                </button>
            </div>
        </div>
    `;

    // Add event listener to view button
    const viewBtn = card.querySelector('.view-auction');
    viewBtn.addEventListener('click', () => viewAuction(auction.id));

    return card;
}

// Load auctions from the server
async function loadAuctions() {
    showLoading();

    try {
        const response = await fetch(`${config.apiBaseUrl}${config.endpoints.auctions}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Extract the auctions from the response
        const auctions = result.data || [];

        console.log('Loaded auctions:', auctions);

        if (auctions && auctions.length > 0) {
            noAuctionsMessage.style.display = 'none';
            auctionsContainer.innerHTML = '';

            auctions.forEach(auction => {
                const card = createAuctionCard(auction);
                auctionsContainer.appendChild(card);
            });
        } else {
            noAuctionsMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Failed to load auctions:', error);
        showToast('Failed to load auctions. Please try again later.', 'error');
    } finally {
        hideLoading();
    }
}

// View an auction
function viewAuction(auctionId) {
    // Store the auction ID in localStorage
    localStorage.setItem('currentAuctionId', auctionId);

    // Redirect to the appropriate page based on auction status
    showLoading();

    fetch(`${config.apiBaseUrl}${config.endpoints.auctionById(auctionId)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            const auction = result.data;
            const status = auction.status || auction.auctionStatus;

            if (status === 'notStarted') {
                window.location.href = config.pages.setup;
            } else if (status === 'inProgress') {
                window.location.href = config.pages.bid;
            } else if (status === 'completed') {
                window.location.href = config.pages.result;
            }
        })
        .catch(error => {
            console.error('Failed to get auction status:', error);
            hideLoading();
            showToast('Failed to open auction. Please try again.', 'error');
        });
}

// Create a new auction
function createNewAuction() {
    showLoading();

    // Default auction data
    const auctionData = {
        title: "New Auction",
        startingPrice: config.defaultSettings.startingPrice,
        priceStep: config.defaultSettings.priceStep
    };

    fetch(`${config.apiBaseUrl}${config.endpoints.auctions}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(auctionData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            const newAuction = result.data;
            localStorage.setItem('currentAuctionId', newAuction.id);
            window.location.href = config.pages.setup;
        })
        .catch(error => {
            console.error('Failed to create auction:', error);
            hideLoading();
            showToast('Failed to create auction. Please try again.', 'error');
        });
}

// Event Listeners
createAuctionBtn.addEventListener('click', createNewAuction);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAuctions();
});
