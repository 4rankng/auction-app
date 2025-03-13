package handlers

import (
	"net/http"
	"sort"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"auction/common"
	"auction/internal/models"
)

// AuctionResponse represents the response structure for auction data
type AuctionResponse struct {
	ID            string              `json:"id"`
	Title         string              `json:"title"`
	CreatedAt     string              `json:"created"`
	StartingPrice int                 `json:"startingPrice"`
	PriceStep     int                 `json:"priceStep"`
	BidderCount   int                 `json:"bidderCount"`
	Bidders       []models.Bidder     `json:"bidders,omitempty"`
	BidCount      int                 `json:"bidCount"`
	BidHistory    []models.Bid        `json:"bidHistory,omitempty"`
	CurrentRound  int                 `json:"currentRound"`
	HighestBid    int                 `json:"highestBid"`
	HighestBidder string              `json:"highestBidder"`
	Status        common.AuctionStatus `json:"status"`
}

// PaginatedResponse represents a paginated response
type PaginatedResponse struct {
	Data       []AuctionResponse `json:"data"`
	Total      int               `json:"total"`
	Page       int               `json:"page"`
	PageSize   int               `json:"pageSize"`
	TotalPages int               `json:"totalPages"`
}

// GetAllAuctions returns all auctions, sorted by creation date (newest first)
// Supports pagination via query parameters:
// - page: page number (default: 1)
// - pageSize: number of items per page (default: 10)
// - status: filter auctions by status (optional, can be one of: notStarted, inProgress, completed)
func (h *Handlers) GetAllAuctions(c *gin.Context) {
	h.logger.Printf("Getting all auctions")

	// Parse pagination parameters
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	if err != nil || pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	// Get status filter parameter
	statusFilter := c.Query("status")
	var filterByStatus bool
	var statusValue common.AuctionStatus

	// Validate the status parameter if provided
	if statusFilter != "" {
		switch common.AuctionStatus(statusFilter) {
		case common.NotStarted, common.InProgress, common.Completed:
			filterByStatus = true
			statusValue = common.AuctionStatus(statusFilter)
			h.logger.Printf("Filtering auctions by status: %s", statusValue)
		default:
			h.logger.Printf("Invalid status filter value: %s", statusFilter)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status value. Must be one of: notStarted, inProgress, completed"})
			return
		}
	}

	// Get all auctions from database
	auctionsMap, err := h.db.GetAllAuctions()
	if err != nil {
		h.logger.Printf("Error retrieving auctions: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve auctions"})
		return
	}

	// Convert map to slice for sorting and filtering
	var auctions []*models.Auction
	for _, auction := range auctionsMap {
		// Apply status filter if requested
		if filterByStatus && auction.Status != statusValue {
			continue
		}
		auctions = append(auctions, auction)
	}

	// Sort auctions by creation date (newest first)
	sort.Slice(auctions, func(i, j int) bool {
		return auctions[i].CreatedAt.After(auctions[j].CreatedAt)
	})

	// Calculate pagination values
	total := len(auctions)
	totalPages := (total + pageSize - 1) / pageSize
	if totalPages == 0 {
		totalPages = 1
	}

	// Validate page number
	if page > totalPages && totalPages > 0 {
		page = totalPages
	}

	// Calculate slice bounds for pagination
	startIdx := (page - 1) * pageSize
	endIdx := startIdx + pageSize
	if endIdx > total {
		endIdx = total
	}

	// Apply pagination if there are auctions
	paginatedAuctions := auctions
	if total > 0 && startIdx < total {
		paginatedAuctions = auctions[startIdx:endIdx]
	} else if startIdx >= total {
		paginatedAuctions = []*models.Auction{}
	}

	// Create a summarized version for the response
	auctionResponses := make([]AuctionResponse, 0, len(paginatedAuctions))
	for _, auction := range paginatedAuctions {
		response := AuctionResponse{
			ID:            auction.ID,
			Title:         auction.Title,
			CreatedAt:     auction.CreatedAt.Format(time.RFC3339),
			StartingPrice: auction.StartingPrice,
			PriceStep:     auction.PriceStep,
			BidderCount:   len(auction.Bidders),
			BidCount:      len(auction.BidHistory),
			CurrentRound:  auction.CurrentRound,
			HighestBid:    auction.HighestBid,
			HighestBidder: auction.HighestBidder,
			Status:        auction.Status,
		}

		// Always include bidders (addresses issue #2)
		response.Bidders = auction.Bidders

		// Include bid history only for completed auctions (addresses issue #3)
		if auction.Status == common.Completed {
			response.BidHistory = auction.BidHistory
		}

		auctionResponses = append(auctionResponses, response)
	}

	if filterByStatus {
		h.logger.Printf("Retrieved %d auctions with status '%s' (page %d of %d)", len(auctionResponses), statusValue, page, totalPages)
	} else {
		h.logger.Printf("Retrieved %d auctions (page %d of %d)", len(auctionResponses), page, totalPages)
	}

	// Return paginated response
	c.JSON(http.StatusOK, PaginatedResponse{
		Data:       auctionResponses,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}
