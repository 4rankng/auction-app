package handlers

import (
	"fmt"
	"log"
	"net/http"
	"sort"
	"strconv"
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
	StartingPrice int             `json:"startingPrice" binding:"required,min=1"`
	PriceStep     int             `json:"priceStep" binding:"required,min=1"`
	Bidders       []models.Bidder `json:"bidders" binding:"required,dive"`
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

	// Additional validations
	if len(req.Title) < 3 {
		h.logger.Printf("Invalid title: too short")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title must be at least 3 characters long"})
		return
	}

	if req.StartingPrice <= 0 {
		h.logger.Printf("Invalid starting price: %d", req.StartingPrice)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Starting price must be greater than 0"})
		return
	}

	if req.PriceStep <= 0 {
		h.logger.Printf("Invalid price step: %d", req.PriceStep)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Price step must be greater than 0"})
		return
	}

	if req.PriceStep > req.StartingPrice {
		h.logger.Printf("Price step exceeds starting price")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Price step cannot be greater than starting price"})
		return
	}

	// Validate bidders
	if len(req.Bidders) < 2 {
		h.logger.Printf("Not enough bidders: %d", len(req.Bidders))
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least 2 bidders are required for an auction"})
		return
	}

	// Check for duplicate bidder IDs
	bidderIDs := make(map[string]bool)
	for i, bidder := range req.Bidders {
		if bidder.ID == "" {
			h.logger.Printf("Bidder has no ID at position %d", i)
			c.JSON(http.StatusBadRequest, gin.H{"error": "All bidders must have an ID"})
			return
		}

		if bidder.Name == "" {
			h.logger.Printf("Bidder has no name at position %d", i)
			c.JSON(http.StatusBadRequest, gin.H{"error": "All bidders must have a name"})
			return
		}

		if _, exists := bidderIDs[bidder.ID]; exists {
			h.logger.Printf("Duplicate bidder ID: %s", bidder.ID)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Duplicate bidder IDs are not allowed"})
			return
		}
		bidderIDs[bidder.ID] = true
	}

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

	// Also save data to persistent storage
	if err := h.db.SaveData(); err != nil {
		h.logger.Printf("Error saving data after creating auction: %v", err)
		// Even if saving fails, we continue since the auction is in memory
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

// GetAllAuctions returns all auctions with pagination
func (h *AuctionHandlers) GetAllAuctions(c *gin.Context) {
	// Parse pagination parameters
	page := 1 // Default page is 1
	limit := 10 // Default limit is 10 items per page

	// Get page parameter
	pageStr := c.DefaultQuery("page", "1")
	pageInt, err := strconv.Atoi(pageStr)
	if err == nil && pageInt > 0 {
		page = pageInt
	}

	// Get limit parameter
	limitStr := c.DefaultQuery("limit", "10")
	limitInt, err := strconv.Atoi(limitStr)
	if err == nil && limitInt > 0 && limitInt <= 100 {
		limit = limitInt
	}

	auctions, err := h.db.GetAllAuctions()
	if err != nil {
		h.logger.Printf("Error getting all auctions: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get auctions"})
		return
	}

	// Convert map of auctions to slice for pagination
	var auctionSlice []*models.Auction
	for _, auction := range auctions {
		auctionSlice = append(auctionSlice, auction)
	}

	// Sort auctions by creation date (newest first)
	sort.Slice(auctionSlice, func(i, j int) bool {
		return auctionSlice[i].CreatedAt.After(auctionSlice[j].CreatedAt)
	})

	// Calculate pagination values
	totalItems := len(auctionSlice)
	totalPages := (totalItems + limit - 1) / limit // Ceiling division

	if totalPages == 0 {
		totalPages = 1 // At least one page even if empty
	}

	// Make sure the requested page is valid
	if page > totalPages {
		page = totalPages
	}

	// Calculate starting and ending indices for this page
	startIndex := (page - 1) * limit
	endIndex := startIndex + limit
	if endIndex > totalItems {
		endIndex = totalItems
	}

	// Slice the items for the current page
	var pagedAuctions []*models.Auction
	if startIndex < totalItems {
		pagedAuctions = auctionSlice[startIndex:endIndex]
	}

	// Convert to response format
	var response []AuctionResponse
	for _, auction := range pagedAuctions {
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

	h.logger.Printf("Retrieved %d auctions (page %d of %d, showing %d per page)",
		totalItems, page, totalPages, limit)

	c.JSON(http.StatusOK, gin.H{
		"data": response,
		"pagination": gin.H{
			"totalItems": totalItems,
			"totalPages": totalPages,
			"currentPage": page,
			"itemsPerPage": limit,
			"startIndex": startIndex,
			"endIndex": endIndex - 1, // Convert to 0-indexed for clarity
		},
	})
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
