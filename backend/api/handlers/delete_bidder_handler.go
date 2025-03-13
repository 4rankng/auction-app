package handlers

import (
	"net/http"

	"auction/common"
	"auction/internal/models"

	"github.com/gin-gonic/gin"
)

// DeleteBidder removes a bidder from an auction
func (h *Handlers) DeleteBidder(c *gin.Context) {
	// Get auction ID from path parameter
	auctionID := c.Param("id")
	if auctionID == "" {
		h.logger.Printf("Error: Auction ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction ID is required"})
		return
	}

	// Get bidder ID from path parameter
	bidderID := c.Param("bidderId")
	if bidderID == "" {
		h.logger.Printf("Error: Bidder ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bidder ID is required"})
		return
	}

	h.logger.Printf("Deleting bidder %s from auction %s", bidderID, auctionID)

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

	// Check if auction is in a valid state to remove bidders
	if auction.Status != common.NotStarted {
		h.logger.Printf("Error: Cannot remove bidders from auction with status: %s", auction.Status)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Cannot remove bidders from an auction that has already started or completed",
		})
		return
	}

	// Find bidder in auction
	bidderIndex := -1
	var bidderName string
	for i, bidder := range auction.Bidders {
		if bidder.ID == bidderID {
			bidderIndex = i
			bidderName = bidder.Name
			break
		}
	}

	// Check if bidder exists
	if bidderIndex == -1 {
		h.logger.Printf("Error: Bidder not found: %s", bidderID)
		c.JSON(http.StatusNotFound, gin.H{"error": "Bidder not found"})
		return
	}

	// Remove bidder from auction
	auction.Bidders = append(auction.Bidders[:bidderIndex], auction.Bidders[bidderIndex+1:]...)

	// Update auction in database
	if err := h.db.UpdateAuction(auctionID, auction); err != nil {
		h.logger.Printf("Error updating auction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update auction"})
		return
	}

	// Try to persist data to storage
	if err := h.db.SaveData(); err != nil {
		h.logger.Printf("Warning: Failed to persist data: %v", err)
		// Continue execution despite the error
	}

	h.logger.Printf("Successfully removed bidder '%s' (ID: %s) from auction %s", bidderName, bidderID, auctionID)

	// Return success response
	c.JSON(http.StatusOK, gin.H{
		"message": "Bidder removed successfully",
		"bidderID": bidderID,
		"bidderName": bidderName,
	})
}
