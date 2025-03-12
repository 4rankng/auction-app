package handlers

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"auction/common"
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
	ID            string               `json:"id"`
	Title         string               `json:"title"`
	Status        common.AuctionStatus `json:"status"`
	CurrentRound  int                  `json:"currentRound"`
	StartingPrice int                  `json:"startingPrice"`
	PriceStep     int                  `json:"priceStep"`
	HighestBid    int                  `json:"highestBid"`
	HighestBidder string               `json:"highestBidder"`
	CreatedAt     time.Time            `json:"createdAt"`
	Bidders       []models.Bidder      `json:"bidders"`
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
		AuctionStatus: common.NotStarted,
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

// StartAuction starts an auction by changing its status to inProgress
func (h *AuctionHandlers) StartAuction(c *gin.Context) {
	auctionID := c.Param("id")
	if auctionID == "" {
		h.logger.Printf("Auction ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction ID is required"})
		return
	}

	h.logger.Printf("Starting auction with ID: %s", auctionID)

	// Get the auction
	auction, err := h.db.GetAuction(auctionID)
	if err != nil {
		h.logger.Printf("Error getting auction: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Auction not found"})
		return
	}

	// Check if the auction is already started
	if auction.AuctionStatus != common.NotStarted {
		h.logger.Printf("Cannot start auction: already in progress or completed")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction is already in progress or completed"})
		return
	}

	// Update auction status to inProgress
	auction.AuctionStatus = common.InProgress
	auction.CurrentRound = 1

	// Save the updated auction
	if err := h.db.UpdateAuction(auctionID, auction); err != nil {
		h.logger.Printf("Error updating auction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start auction"})
		return
	}

	h.logger.Printf("Auction started successfully: %s", auctionID)
	c.JSON(http.StatusOK, gin.H{"message": "Auction started successfully"})
}

// EndAuction ends an auction by changing its status to completed
func (h *AuctionHandlers) EndAuction(c *gin.Context) {
	auctionID := c.Param("id")
	if auctionID == "" {
		h.logger.Printf("Auction ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction ID is required"})
		return
	}

	h.logger.Printf("Ending auction with ID: %s", auctionID)

	// Get the auction
	auction, err := h.db.GetAuction(auctionID)
	if err != nil {
		h.logger.Printf("Error getting auction: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Auction not found"})
		return
	}

	// Check if the auction is in progress
	if auction.AuctionStatus != common.InProgress {
		h.logger.Printf("Cannot end auction: not in progress")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction is not in progress"})
		return
	}

	// Update auction status to completed
	auction.AuctionStatus = common.Completed

	// Save the updated auction
	if err := h.db.UpdateAuction(auctionID, auction); err != nil {
		h.logger.Printf("Error updating auction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to end auction"})
		return
	}

	h.logger.Printf("Auction ended successfully: %s", auctionID)
	c.JSON(http.StatusOK, gin.H{"message": "Auction ended successfully"})
}

// PlaceBidRequest represents a request to place a bid
type PlaceBidRequest struct {
	BidderID string `json:"bidderId" binding:"required"`
	Amount   int    `json:"amount" binding:"required"`
}

// PlaceBid adds a new bid to an auction
func (h *AuctionHandlers) PlaceBid(c *gin.Context) {
	auctionID := c.Param("id")
	if auctionID == "" {
		h.logger.Printf("Auction ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction ID is required"})
		return
	}

	// Parse request body
	var req PlaceBidRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	h.logger.Printf("Received bid for auction %s from bidder %s for amount %d",
		auctionID, req.BidderID, req.Amount)

	// Get the auction
	auction, err := h.db.GetAuction(auctionID)
	if err != nil {
		h.logger.Printf("Error getting auction: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Auction not found"})
		return
	}

	// Check if auction is in progress
	if auction.AuctionStatus != common.InProgress {
		h.logger.Printf("Cannot place bid: auction is not in progress")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction is not in progress"})
		return
	}

	// Check if bidder exists in the auction
	var bidderName string
	bidderExists := false
	for _, bidder := range auction.Bidders {
		if bidder.ID == req.BidderID {
			bidderExists = true
			bidderName = bidder.Name
			break
		}
	}

	if !bidderExists {
		h.logger.Printf("Bidder %s not found in auction", req.BidderID)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bidder not found in this auction"})
		return
	}

	// Validate bid amount (must be higher than current highest bid and follow price step)
	minBidAmount := auction.HighestBid
	if minBidAmount == 0 {
		minBidAmount = auction.StartingPrice
	} else {
		minBidAmount += auction.PriceStep
	}

	if req.Amount < minBidAmount {
		h.logger.Printf("Bid amount %d is too low. Minimum bid: %d", req.Amount, minBidAmount)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Bid amount must be at least %d", minBidAmount),
		})
		return
	}

	// Create new bid
	newBid := models.Bid{
		Round:      auction.CurrentRound,
		BidderID:   req.BidderID,
		BidderName: bidderName,
		Amount:     req.Amount,
		Timestamp:  time.Now(),
	}

	// Add bid to history
	auction.BidHistory = append(auction.BidHistory, newBid)

	// Update highest bid
	auction.HighestBid = req.Amount
	auction.HighestBidder = req.BidderID

	// Save updated auction
	if err := h.db.UpdateAuction(auctionID, auction); err != nil {
		h.logger.Printf("Error updating auction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to place bid"})
		return
	}

	h.logger.Printf("Bid placed successfully for auction %s: %+v", auctionID, newBid)
	c.JSON(http.StatusOK, gin.H{
		"message": "Bid placed successfully",
		"data": newBid,
	})
}

// GetCurrentBids returns the current bids for an auction
func (h *AuctionHandlers) GetCurrentBids(c *gin.Context) {
	auctionID := c.Param("id")
	if auctionID == "" {
		h.logger.Printf("Auction ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction ID is required"})
		return
	}

	h.logger.Printf("Getting current bids for auction: %s", auctionID)

	// Get the auction
	auction, err := h.db.GetAuction(auctionID)
	if err != nil {
		h.logger.Printf("Error getting auction: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Auction not found"})
		return
	}

	// Get the latest bid from each bidder
	latestBids := make(map[string]models.Bid)
	for _, bid := range auction.BidHistory {
		existingBid, exists := latestBids[bid.BidderID]
		if !exists || bid.Timestamp.After(existingBid.Timestamp) {
			latestBids[bid.BidderID] = bid
		}
	}

	// Convert map to slice
	var currentBids []models.Bid
	for _, bid := range latestBids {
		currentBids = append(currentBids, bid)
	}

	h.logger.Printf("Retrieved %d current bids for auction %s", len(currentBids), auctionID)
	c.JSON(http.StatusOK, gin.H{
		"data": currentBids,
		"highestBid": auction.HighestBid,
		"highestBidder": auction.HighestBidder,
		"currentRound": auction.CurrentRound,
	})
}

// GetAuctionHistory returns the complete bid history for an auction
func (h *AuctionHandlers) GetAuctionHistory(c *gin.Context) {
	auctionID := c.Param("id")
	if auctionID == "" {
		h.logger.Printf("Auction ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction ID is required"})
		return
	}

	h.logger.Printf("Getting bid history for auction: %s", auctionID)

	// Get the auction
	auction, err := h.db.GetAuction(auctionID)
	if err != nil {
		h.logger.Printf("Error getting auction: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Auction not found"})
		return
	}

	// Sort bids by timestamp (newest first)
	bidHistory := auction.BidHistory

	h.logger.Printf("Retrieved %d bids from history for auction %s", len(bidHistory), auctionID)
	c.JSON(http.StatusOK, gin.H{
		"data": bidHistory,
		"auctionStatus": auction.AuctionStatus,
		"currentRound": auction.CurrentRound,
	})
}
