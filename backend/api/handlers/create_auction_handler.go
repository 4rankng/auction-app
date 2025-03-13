package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"auction/common"
	"auction/internal/models"
)

// CreateAuctionRequest represents the request to create a new auction
type CreateAuctionRequest struct {
	Title         string `json:"title" binding:"required"`
	StartingPrice int    `json:"startingPrice" binding:"required"`
	PriceStep     int    `json:"priceStep" binding:"required"`
}

// CreateAuction handles the creation of a new auction
func (h *Handlers) CreateAuction(c *gin.Context) {
	// Parse request body
	var req CreateAuctionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Printf("Error parsing create auction request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Validate request data
	if req.Title == "" {
		h.logger.Printf("Error: Auction title is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction title is required"})
		return
	}

	if len(req.Title) < 3 || len(req.Title) > 100 {
		h.logger.Printf("Error: Auction title must be between 3 and 100 characters")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction title must be between 3 and 100 characters"})
		return
	}

	if req.StartingPrice <= 0 {
		h.logger.Printf("Error: Starting price must be positive")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Starting price must be positive"})
		return
	}

	if req.PriceStep <= 0 {
		h.logger.Printf("Error: Price step must be positive")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Price step must be positive"})
		return
	}

	if req.PriceStep >= req.StartingPrice {
		h.logger.Printf("Error: Price step cannot exceed starting price")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Price step cannot exceed starting price"})
		return
	}

	h.logger.Printf("Creating new auction: %s", req.Title)

	// Create new auction
	auction := &models.Auction{
		ID:            uuid.New().String(),
		Title:         req.Title,
		CreatedAt:     time.Now(),
		StartingPrice: req.StartingPrice,
		PriceStep:     req.PriceStep,
		Bidders:       []models.Bidder{},
		BidHistory:    []models.Bid{},
		CurrentRound:  0,
		HighestBid:    0,
		HighestBidder: "",
		Status:        common.NotStarted,
	}

	// Save to database
	if err := h.db.CreateAuction(auction); err != nil {
		h.logger.Printf("Error creating auction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create auction"})
		return
	}

	// Persist to storage
	if err := h.db.SaveData(); err != nil {
		h.logger.Printf("Warning: Failed to persist data: %v", err)
		// Continue even if saving fails
	}

	h.logger.Printf("Auction created successfully: %s (ID: %s)", auction.Title, auction.ID)

	// Return success response
	c.JSON(http.StatusCreated, gin.H{
		"message": "Auction created successfully",
		"data": gin.H{
			"id":      auction.ID,
			"title":   auction.Title,
			"created": auction.CreatedAt,
			"status":  auction.Status,
		},
	})
}
