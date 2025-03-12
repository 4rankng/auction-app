package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"auction/internal/models"
)

// SetBiddersRequest represents the request body for setting bidders
type SetBiddersRequest struct {
	Bidders []models.Bidder `json:"bidders" binding:"required"`
}

// SetBidders updates all bidders at once
func (h *Handlers) SetBidders(c *gin.Context) {
	// Parse request body
	var req SetBiddersRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Printf("Error parsing set bidders request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Validate bidders
	if len(req.Bidders) == 0 {
		h.logger.Printf("Error: No bidders provided")
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least one bidder is required"})
		return
	}

	h.logger.Printf("Setting %d bidders", len(req.Bidders))

	// Update bidders in database
	if err := h.db.SetBidders(req.Bidders); err != nil {
		h.logger.Printf("Error setting bidders: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set bidders"})
		return
	}

	// Try to persist data to storage
	if err := h.db.SaveData(); err != nil {
		h.logger.Printf("Warning: Failed to persist data: %v", err)
		// Continue execution despite the error
	}

	h.logger.Printf("Successfully set %d bidders", len(req.Bidders))

	// Return success response
	c.JSON(http.StatusOK, gin.H{
		"message": "Bidders updated successfully",
		"count":   len(req.Bidders),
	})
}
