package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"auction/common"
	"auction/internal/models"
)

// EndAuction ends an auction, setting its status to "completed"
func (h *Handlers) EndAuction(c *gin.Context) {
	// Get auction ID from path parameter
	auctionID := c.Param("id")
	if auctionID == "" {
		h.logger.Printf("Error: Auction ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction ID is required"})
		return
	}

	h.logger.Printf("Ending auction with ID: %s", auctionID)

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

	// Check if the auction is in progress
	if auction.Status != common.InProgress {
		h.logger.Printf("Error: Cannot end auction, current status: %s", auction.Status)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction is not in progress"})
		return
	}

	// Update auction status to completed
	auction.Status = common.Completed

	// Save the updated auction
	if err := h.db.UpdateAuction(auctionID, auction); err != nil {
		h.logger.Printf("Error updating auction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to end auction"})
		return
	}

	// Persist data to storage
	if err := h.db.SaveData(); err != nil {
		h.logger.Printf("Warning: Failed to persist data: %v", err)
		// Continue even if saving fails
	}

	h.logger.Printf("Auction ended successfully: %s (ID: %s)", auction.Title, auction.ID)

	// Return success response
	c.JSON(http.StatusOK, gin.H{
		"message": "Auction ended successfully",
		"data": gin.H{
			"id":            auction.ID,
			"title":         auction.Title,
			"status":        auction.Status,
			"highestBid":    auction.HighestBid,
			"highestBidder": auction.HighestBidder,
			"bidCount":      len(auction.BidHistory),
		},
	})
}
