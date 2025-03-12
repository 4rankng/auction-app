package handlers

import (
	"net/http"

	"auction/internal/models"

	"github.com/gin-gonic/gin"
)

// GetBidders retrieves all bidders registered for a specific auction
func (h *Handlers) GetBidders(c *gin.Context) {
	// Get auction ID from path parameter
	auctionID := c.Param("id")
	if auctionID == "" {
		h.logger.Printf("Error: Auction ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction ID is required"})
		return
	}

	h.logger.Printf("Retrieving bidders for auction: %s", auctionID)

	// Get auction from database
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

	// Get bidders from auction
	bidders := auction.Bidders
	h.logger.Printf("Retrieved %d bidders for auction %s", len(bidders), auctionID)

	// Return bidders
	c.JSON(http.StatusOK, gin.H{
		"bidders": bidders,
		"count":   len(bidders),
	})
}
