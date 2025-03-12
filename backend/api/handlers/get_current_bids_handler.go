package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"auction/internal/models"
)

// GetCurrentBids returns the current bids for an auction
func (h *Handlers) GetCurrentBids(c *gin.Context) {
	// Get auction ID from path parameter
	auctionID := c.Param("id")
	if auctionID == "" {
		h.logger.Printf("Error: Auction ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction ID is required"})
		return
	}

	h.logger.Printf("Getting current bids for auction: %s", auctionID)

	// Get the auction
	auction, err := h.db.GetAuction(auctionID)
	if err != nil {
		if _, ok := err.(*models.ErrorNotFound); ok {
			h.logger.Printf("Error: Auction not found: %s", auctionID)
			c.JSON(http.StatusNotFound, gin.H{"error": "Auction not found"})
			return
		}
		h.logger.Printf("Error retrieving auction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve auction"})
		return
	}

	// Get the latest bid from each bidder
	latestBids := make(map[string]models.Bid)
	for _, bid := range auction.BidHistory {
		existingBid, exists := latestBids[bid.BidderID]
		if !exists || bid.Timestamp.After(existingBid.Timestamp) {
			latestBids[bid.BidderID] = bid
		}
	}

	// Convert map to slice
	var currentBids []models.Bid
	for _, bid := range latestBids {
		currentBids = append(currentBids, bid)
	}

	h.logger.Printf("Retrieved %d current bids for auction %s", len(currentBids), auctionID)

	// Return response with current bids and auction state
	c.JSON(http.StatusOK, gin.H{
		"data":          currentBids,
		"highestBid":    auction.HighestBid,
		"highestBidder": auction.HighestBidder,
		"currentRound":  auction.CurrentRound,
	})
}
