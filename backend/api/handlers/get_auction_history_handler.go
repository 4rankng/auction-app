package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"auction/internal/models"
)

// GetAuctionHistory returns the complete bid history for an auction
func (h *Handlers) GetAuctionHistory(c *gin.Context) {
	// Get auction ID from path parameter
	auctionID := c.Param("id")
	if auctionID == "" {
		h.logger.Printf("Error: Auction ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction ID is required"})
		return
	}

	h.logger.Printf("Getting bid history for auction: %s", auctionID)

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

	h.logger.Printf("Retrieved %d bids for auction %s", len(auction.BidHistory), auctionID)

	// Return the bid history
	c.JSON(http.StatusOK, gin.H{
		"data": auction.BidHistory,
	})
}
