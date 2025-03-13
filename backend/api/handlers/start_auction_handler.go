package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"auction/common"
	"auction/internal/models"
)

// StartAuction starts an auction, setting its status to "inProgress"
func (h *Handlers) StartAuction(c *gin.Context) {
	// Get auction ID from path parameter
	auctionID := c.Param("id")
	if auctionID == "" {
		h.logger.Printf("Error: Auction ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction ID is required"})
		return
	}

	h.logger.Printf("Starting auction with ID: %s", auctionID)

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

	// Check if the auction can be started
	if auction.Status != common.NotStarted {
		h.logger.Printf("Error: Cannot start auction, current status: %s", auction.Status)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction is already started or completed"})
		return
	}

	// Check if there are at least two bidders
	if len(auction.Bidders) < 2 {
		h.logger.Printf("Error: Cannot start auction with fewer than 2 bidders, current count: %d", len(auction.Bidders))
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least two bidders are required to start an auction"})
		return
	}

	// Update auction status
	auction.Status = common.InProgress
	auction.CurrentRound = 1

	// Save the updated auction
	if err := h.db.UpdateAuction(auctionID, auction); err != nil {
		h.logger.Printf("Error updating auction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start auction"})
		return
	}

	// Persist data to storage
	if err := h.db.SaveData(); err != nil {
		h.logger.Printf("Warning: Failed to persist data: %v", err)
		// Continue even if saving fails
	}

	h.logger.Printf("Auction started successfully: %s (ID: %s)", auction.Title, auction.ID)

	// Return response
	c.JSON(http.StatusOK, gin.H{
		"message": "Auction started successfully",
		"data": gin.H{
			"id":           auction.ID,
			"title":        auction.Title,
			"status":       auction.Status,
			"currentRound": auction.CurrentRound,
			"bidderCount":  len(auction.Bidders),
		},
	})
}
