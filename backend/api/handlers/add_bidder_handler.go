package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"auction/internal/models"
)

// AddBidderRequest represents the request body for adding a bidder
type AddBidderRequest struct {
	Name string `json:"name" binding:"required"`
}

// AddBidder adds a new bidder to an auction
func (h *Handlers) AddBidder(c *gin.Context) {
	// Get auction ID from path parameter
	auctionID := c.Param("id")
	if auctionID == "" {
		h.logger.Printf("Error: Auction ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction ID is required"})
		return
	}

	// Parse request body
	var req AddBidderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Printf("Error parsing request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Validate bidder name
	if req.Name == "" {
		h.logger.Printf("Error: Bidder name is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bidder name is required"})
		return
	}

	h.logger.Printf("Adding bidder '%s' to auction: %s", req.Name, auctionID)

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

	// Check if auction is in a valid state to add bidders
	if auction.AuctionStatus != "pending" {
		h.logger.Printf("Error: Cannot add bidders to auction with status: %s", auction.AuctionStatus)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Cannot add bidders to an auction that has already started or completed",
		})
		return
	}

	// Check if bidder with same name already exists
	for _, bidder := range auction.Bidders {
		if bidder.Name == req.Name {
			h.logger.Printf("Error: Bidder with name '%s' already exists", req.Name)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Bidder with this name already exists"})
			return
		}
	}

	// Generate a new bidder ID
	bidderID := uuid.New().String()

	// Create new bidder
	newBidder := models.Bidder{
		ID:   bidderID,
		Name: req.Name,
	}

	// Add bidder to auction
	auction.Bidders = append(auction.Bidders, newBidder)

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

	h.logger.Printf("Successfully added bidder '%s' (ID: %s) to auction %s", req.Name, bidderID, auctionID)

	// Return success response
	c.JSON(http.StatusOK, gin.H{
		"message": "Bidder added successfully",
		"bidder": newBidder,
	})
}
