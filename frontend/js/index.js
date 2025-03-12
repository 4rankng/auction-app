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

// Create auction card
function createAuctionCard(auction) {
    const statusClass = auction.auctionStatus === 'notStarted' ? 'bg-secondary' :
                        auction.auctionStatus === 'inProgress' ? 'bg-success' : 'bg-danger';
    const statusText = auction.auctionStatus === 'notStarted' ? 'Not Started' :
                      auction.auctionStatus === 'inProgress' ? 'In Progress' : 'Completed';

    const card = document.createElement('div');
    card.className = 'col-md-4';
    card.innerHTML = `
        <div class="card auction-card">
            <div class="card-header d-flex justify-content-between">
                <h5 class="card-title mb-0">Auction #${auction.id}</h5>
                <span class="badge ${statusClass}">${statusText}</span>
            </div>
            <div class="card-body">
                <p><strong>Starting Price:</strong> ${auction.startingPrice.toLocaleString()} VND</p>
                <p><strong>Price Step:</strong> ${auction.priceStep.toLocaleString()} VND</p>
                <p><strong>Bidders:</strong> ${auction.bidders.length}</p>
                ${auction.auctionStatus !== 'notStarted' ?
                    `<p><strong>Current Highest Bid:</strong> ${auction.highestBid.toLocaleString()} VND</p>` : ''}
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
        const response = await axios.get(`${config.apiBaseUrl}/auctions`);
        const auctions = response.data;

        if (auctions.length > 0) {
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
    localStorage.setItem('currentAuctionId', auctionId);

    // Redirect to the appropriate page based on auction status
    showLoading();

    axios.get(`${config.apiBaseUrl}/auction/${auctionId}/status`)
        .then(response => {
            const status = response.data.auctionStatus;

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

    axios.post(`${config.apiBaseUrl}/auctions`)
        .then(response => {
            const newAuctionId = response.data.id;
            localStorage.setItem('currentAuctionId', newAuctionId);
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
