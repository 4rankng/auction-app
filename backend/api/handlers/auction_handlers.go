package handlers

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"auction/internal/database"
	"auction/internal/models"
)

// AuctionHandlers handles auction-related API endpoints
type AuctionHandlers struct {
	db     database.Database
	logger *log.Logger
}

// NewAuctionHandlers creates a new instance of AuctionHandlers
func NewAuctionHandlers(db database.Database, logger *log.Logger) *AuctionHandlers {
	return &AuctionHandlers{
		db:     db,
		logger: logger,
	}
}

// Request and response types for the API
type CreateAuctionRequest struct {
	Title         string          `json:"title" binding:"required"`
	StartingPrice int             `json:"startingPrice" binding:"required"`
	PriceStep     int             `json:"priceStep" binding:"required"`
	Bidders       []models.Bidder `json:"bidders"`
}

type AuctionResponse struct {
	ID            string          `json:"id"`
	Title         string          `json:"title"`
	Status        string          `json:"status"`
	CurrentRound  int             `json:"currentRound"`
	StartingPrice int             `json:"startingPrice"`
	PriceStep     int             `json:"priceStep"`
	HighestBid    int             `json:"highestBid"`
	HighestBidder string          `json:"highestBidder"`
	CreatedAt     time.Time       `json:"createdAt"`
	Bidders       []models.Bidder `json:"bidders"`
}

// CreateAuction creates a new auction
func (h *AuctionHandlers) CreateAuction(c *gin.Context) {
	var req CreateAuctionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Printf("Error binding create auction JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.logger.Printf("Received create auction request: Title=%s, StartingPrice=%d, PriceStep=%d",
		req.Title, req.StartingPrice, req.PriceStep)

	// Generate a unique ID for the auction
	auctionID := uuid.New().String()

	// Create new auction
	auction := &models.Auction{
		ID:            auctionID,
		Title:         req.Title,
		CreatedAt:     time.Now(),
		StartingPrice: req.StartingPrice,
		PriceStep:     req.PriceStep,
		Bidders:       req.Bidders,
		BidHistory:    []models.Bid{},
		CurrentRound:  0,
		HighestBid:    0,
		HighestBidder: "",
		AuctionStatus: "notStarted",
	}

	// Save the auction in the database
	if err := h.db.CreateAuction(auction); err != nil {
		h.logger.Printf("Error creating auction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create auction"})
		return
	}

	h.logger.Printf("Auction created successfully with ID: %s", auctionID)

	// Return the created auction
	response := AuctionResponse{
		ID:            auction.ID,
		Title:         auction.Title,
		Status:        auction.AuctionStatus,
		CurrentRound:  auction.CurrentRound,
		StartingPrice: auction.StartingPrice,
		PriceStep:     auction.PriceStep,
		HighestBid:    auction.HighestBid,
		HighestBidder: auction.HighestBidder,
		CreatedAt:     auction.CreatedAt,
		Bidders:       auction.Bidders,
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    response,
		"message": "Auction created successfully",
	})
}

// GetAllAuctions returns all auctions
func (h *AuctionHandlers) GetAllAuctions(c *gin.Context) {
	auctions, err := h.db.GetAllAuctions()
	if err != nil {
		h.logger.Printf("Error getting all auctions: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get auctions"})
		return
	}

	// Convert to response format
	var response []AuctionResponse
	for _, auction := range auctions {
		response = append(response, AuctionResponse{
			ID:            auction.ID,
			Title:         auction.Title,
			Status:        auction.AuctionStatus,
			CurrentRound:  auction.CurrentRound,
			StartingPrice: auction.StartingPrice,
			PriceStep:     auction.PriceStep,
			HighestBid:    auction.HighestBid,
			HighestBidder: auction.HighestBidder,
			CreatedAt:     auction.CreatedAt,
			Bidders:       auction.Bidders,
		})
	}

	h.logger.Printf("Retrieved %d auctions", len(response))
	c.JSON(http.StatusOK, gin.H{"data": response})
}

// GetAuction returns a specific auction by ID
func (h *AuctionHandlers) GetAuction(c *gin.Context) {
	auctionID := c.Param("id")
	if auctionID == "" {
		h.logger.Printf("Auction ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction ID is required"})
		return
	}

	h.logger.Printf("Getting auction with ID: %s", auctionID)

	auction, err := h.db.GetAuction(auctionID)
	if err != nil {
		h.logger.Printf("Error getting auction: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Auction not found"})
		return
	}

	response := AuctionResponse{
		ID:            auction.ID,
		Title:         auction.Title,
		Status:        auction.AuctionStatus,
		CurrentRound:  auction.CurrentRound,
		StartingPrice: auction.StartingPrice,
		PriceStep:     auction.PriceStep,
		HighestBid:    auction.HighestBid,
		HighestBidder: auction.HighestBidder,
		CreatedAt:     auction.CreatedAt,
		Bidders:       auction.Bidders,
	}

	h.logger.Printf("Retrieved auction: %s - %s", auction.ID, auction.Title)
	c.JSON(http.StatusOK, gin.H{"data": response})
}

// ExportAuctionData exports auction data by ID
func (h *AuctionHandlers) ExportAuctionData(c *gin.Context) {
	auctionID := c.Param("id")
	if auctionID == "" {
		h.logger.Printf("Auction ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction ID is required"})
		return
	}

	h.logger.Printf("Exporting data for auction with ID: %s", auctionID)

	// Get export data
	exportData, err := h.db.ExportAuctionData(auctionID)
	if err != nil {
		h.logger.Printf("Error exporting auction data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	h.logger.Printf("Successfully exported data for auction: %s", auctionID)
	c.JSON(http.StatusOK, gin.H{"data": exportData})
}
