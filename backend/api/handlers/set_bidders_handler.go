package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"auction/internal/models"
)

// SetBiddersRequest represents the request body for setting bidders
type SetBiddersRequest struct {
	Bidders []models.Bidder `json:"bidders" binding:"required"`
	AuctionId string `json:"auctionId"` // Optional in request body
}

// SetBidders updates all bidders for an auction
// Route: PUT /api/v1/auctions/:id/bidders or PUT /api/v1/bidders (with auctionId in body)
func (h *Handlers) SetBidders(c *gin.Context) {
	// Try to get auction ID from path parameter first
	auctionID := c.Param("id")

	// Parse request body
	var req SetBiddersRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Printf("Error parsing set bidders request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// If auction ID is not in path, try to get it from request body
	if auctionID == "" {
		auctionID = req.AuctionId
	}

	// Validate auction ID
	if auctionID == "" {
		h.logger.Printf("Error: Auction ID is required (either in URL or request body)")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction ID is required (either in URL or request body)"})
		return
	}

	// Validate bidders
	if len(req.Bidders) == 0 {
		h.logger.Printf("Error: No bidders provided")
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least one bidder is required"})
		return
	}

	h.logger.Printf("Setting %d bidders for auction %s", len(req.Bidders), auctionID)

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

	// Update bidders in auction
	auction.Bidders = req.Bidders

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

	h.logger.Printf("Successfully set %d bidders for auction %s", len(req.Bidders), auctionID)

	// Return success response
	c.JSON(http.StatusOK, gin.H{
		"message": "Bidders updated successfully",
		"count":   len(req.Bidders),
	})
}
