package handlers

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"auction/internal/database"
	"auction/internal/models"
)

type AuctionHandlers struct {
	db     database.Database
	logger *log.Logger
}

func NewAuctionHandlers(db database.Database, logger *log.Logger) *AuctionHandlers {
	return &AuctionHandlers{
		db:     db,
		logger: logger,
	}
}

// Response types for better type safety and reusability
type AuctionSettingsResponse struct {
	StartingPrice int `json:"startingPrice"`
	PriceStep     int `json:"priceStep"`
}

type AuctionStatusResponse struct {
	Status        string `json:"status"`
	CurrentRound  int    `json:"currentRound"`
	HighestBid    int    `json:"highestBid"`
	HighestBidder string `json:"highestBidder"`
	StartingPrice int    `json:"startingPrice"`
	PriceStep     int    `json:"priceStep"`
	BiddersCount  int    `json:"biddersCount"`
}

type StartAuctionRequest struct {
	Settings struct {
		StartingPrice int `json:"startingPrice"`
		PriceStep     int `json:"priceStep"`
	} `json:"settings"`
	Bidders []models.Bidder `json:"bidders"`
}

// GetAuctionSettings returns the current auction settings
func (h *AuctionHandlers) GetAuctionSettings(c *gin.Context) {
	data, err := h.db.GetAuctionData()
	if err != nil {
		h.logger.Printf("Error getting auction settings: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get auction settings"})
		return
	}

	h.logger.Printf("Current settings: StartingPrice=%d, PriceStep=%d",
		data.StartingPrice, data.PriceStep)

	response := AuctionSettingsResponse{
		StartingPrice: data.StartingPrice,
		PriceStep:     data.PriceStep,
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}

// UpdateAuctionSettings updates the auction settings
func (h *AuctionHandlers) UpdateAuctionSettings(c *gin.Context) {
	var settings AuctionSettingsResponse
	if err := c.ShouldBindJSON(&settings); err != nil {
		h.logger.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	data, err := h.db.GetAuctionData()
	if err != nil {
		h.logger.Printf("Error getting auction data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get auction data"})
		return
	}

	data.StartingPrice = settings.StartingPrice
	data.PriceStep = settings.PriceStep

	if err := h.db.UpdateAuctionData(data); err != nil {
		h.logger.Printf("Error updating auction settings: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update settings"})
		return
	}

	if err := h.db.SaveData(); err != nil {
		h.logger.Printf("Error saving auction settings: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save settings"})
		return
	}

	h.logger.Printf("Settings updated successfully")
	c.JSON(http.StatusOK, gin.H{
		"data":    settings,
		"message": "Auction settings updated successfully",
	})
}

// GetAuctionStatus returns the current auction status
func (h *AuctionHandlers) GetAuctionStatus(c *gin.Context) {
	data, err := h.db.GetAuctionData()
	if err != nil {
		h.logger.Printf("Error getting auction data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get auction data"})
		return
	}

	// If auction status is empty, set it to "notStarted" for better client handling
	if data.AuctionStatus == "" {
		data.AuctionStatus = "notStarted"
	}

	h.logger.Printf("Current status: Status=%s, Round=%d, HighestBid=%d, Bidders=%d",
		data.AuctionStatus, data.CurrentRound,
		data.HighestBid, len(data.Bidders))

	response := AuctionStatusResponse{
		Status:       data.AuctionStatus,
		CurrentRound: data.CurrentRound,
		HighestBid:   data.HighestBid,
		HighestBidder: data.HighestBidder,
		StartingPrice: data.StartingPrice,
		PriceStep:     data.PriceStep,
		BiddersCount:  len(data.Bidders),
	}

	c.JSON(http.StatusOK, response)
}

// PlaceBid handles placing a new bid in the auction
func (h *AuctionHandlers) PlaceBid(c *gin.Context) {
	data, err := h.db.GetAuctionData()
	if err != nil {
		h.logger.Printf("Error getting auction data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get auction data"})
		return
	}

	if data.AuctionStatus != "inProgress" {
		h.logger.Printf("Cannot place bid, auction is not in progress")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction is not in progress"})
		return
	}

	// Get bid from request
	var bid struct {
		BidderID string `json:"bidderId"`
		Amount   int    `json:"amount"`
		Steps    int    `json:"steps"`
	}

	if err := c.ShouldBindJSON(&bid); err != nil {
		h.logger.Printf("Error binding bid JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.logger.Printf("Received bid: BidderID=%s, Amount=%d, Steps=%d",
		bid.BidderID, bid.Amount, bid.Steps)

	// Find bidder by ID
	var bidder models.Bidder
	bidderFound := false
	for _, p := range data.Bidders {
		if p.ID == bid.BidderID {
			bidder = p
			bidderFound = true
			h.logger.Printf("Found bidder: %s (%s)", p.Name, p.ID)
			break
		}
	}

	if !bidderFound {
		h.logger.Printf("Bidder not found: %s", bid.BidderID)
		c.JSON(http.StatusBadRequest, gin.H{"error": "bidder not found"})
		return
	}

	// Calculate actual bid amount if steps were provided
	bidAmount := bid.Amount
	if bid.Steps > 0 {
		// Calculate bid from steps
		bidAmount = data.HighestBid + (bid.Steps * data.PriceStep)
	}

	// Validate bid amount
	if bidAmount <= data.HighestBid {
		h.logger.Printf("Bid too low: %d (highest: %d)", bidAmount, data.HighestBid)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":      "Bid too low",
			"highestBid": data.HighestBid,
		})
		return
	}

	// Record the bid
	newBid := models.Bid{
		Round:      data.CurrentRound,
		BidderID:   bidder.ID,
		BidderName: bidder.Name,
		Amount:     bidAmount,
		Timestamp:  time.Now(),
	}

	data.BidHistory = append(data.BidHistory, newBid)
	data.HighestBid = bidAmount
	data.HighestBidder = bidder.Name

	// Save updated auction data
	if err := h.db.UpdateAuctionData(data); err != nil {
		h.logger.Printf("Error saving auction data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save bid"})
		return
	}

	h.logger.Printf("Bid recorded successfully: %+v", newBid)

	c.JSON(http.StatusOK, gin.H{
		"message":    "Bid placed successfully",
		"amount":     bidAmount,
		"bidderName": bidder.Name,
	})
}

// CancelLastBid cancels the last bid
func (h *AuctionHandlers) CancelLastBid(c *gin.Context) {
	data, err := h.db.GetAuctionData()
	if err != nil {
		h.logger.Printf("Error getting auction data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get auction data"})
		return
	}

	if len(data.BidHistory) == 0 {
		h.logger.Printf("No bids to cancel")
		c.JSON(http.StatusBadRequest, gin.H{"error": "no bids to cancel"})
		return
	}

	// Remove the last bid
	cancelledBid := data.BidHistory[len(data.BidHistory)-1]
	data.BidHistory = data.BidHistory[:len(data.BidHistory)-1]

	// Update highest bid and bidder
	if len(data.BidHistory) > 0 {
		lastBid := data.BidHistory[len(data.BidHistory)-1]
		data.HighestBid = lastBid.Amount
		data.HighestBidder = lastBid.BidderName
	} else {
		data.HighestBid = 0
		data.HighestBidder = ""
	}

	if err := h.db.UpdateAuctionData(data); err != nil {
		h.logger.Printf("Error updating auction data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update auction data"})
		return
	}

	if err := h.db.SaveData(); err != nil {
		h.logger.Printf("Error saving data after cancelling bid: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save data"})
		return
	}

	h.logger.Printf("Last bid cancelled successfully")
	c.JSON(http.StatusOK, gin.H{
		"message": "Last bid cancelled successfully",
		"data": gin.H{
			"cancelledBid":  cancelledBid,
			"currentRound":  data.CurrentRound,
			"highestBid":    data.HighestBid,
			"highestBidder": data.HighestBidder,
		},
	})
}

// GetBidHistory returns the bid history
func (h *AuctionHandlers) GetBidHistory(c *gin.Context) {
	data, err := h.db.GetAuctionData()
	if err != nil {
		h.logger.Printf("Error getting auction data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get bid history"})
		return
	}

	h.logger.Printf("Returning %d bid history entries", len(data.BidHistory))

	c.JSON(http.StatusOK, gin.H{
		"data": data.BidHistory,
	})
}

// GetCompleteAuctionHistory returns both current and completed auction histories
func (h *AuctionHandlers) GetCompleteAuctionHistory(c *gin.Context) {
	data, err := h.db.GetAuctionData()
	if err != nil {
		h.logger.Printf("Error getting auction data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get auction data"})
		return
	}

	response := gin.H{
		"data": gin.H{
			"currentAuction": gin.H{
				"status":       data.AuctionStatus,
				"bidHistory":   data.BidHistory,
				"currentRound": data.CurrentRound,
				"highestBid":   data.HighestBid,
				"highestBidder": data.HighestBidder,
			},
			"completedAuctions": data.AuctionHistory,
			"totalCompletedAuctions": len(data.AuctionHistory),
		},
	}

	c.JSON(http.StatusOK, response)
	h.logger.Printf("Returned %d completed auctions", len(data.AuctionHistory))
}

// ResetAuction resets the auction state
func (h *AuctionHandlers) ResetAuction(c *gin.Context) {
	data, err := h.db.GetAuctionData()
	if err != nil {
		h.logger.Printf("Error getting auction data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get auction data"})
		return
	}

	// Archive current auction if there are bids
	if len(data.BidHistory) > 0 {
		data.AuctionHistory = append(data.AuctionHistory, data.BidHistory)
	}

	// Reset auction state
	data.BidHistory = []models.Bid{}
	data.CurrentRound = 0
	data.HighestBid = 0
	data.HighestBidder = ""
	data.AuctionStatus = "notStarted"

	if err := h.db.UpdateAuctionData(data); err != nil {
		h.logger.Printf("Error updating auction data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update auction data"})
		return
	}

	if err := h.db.SaveData(); err != nil {
		h.logger.Printf("Error saving data after reset: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save data"})
		return
	}

	h.logger.Printf("Auction reset successful")
	c.JSON(http.StatusOK, gin.H{
		"message": "Auction reset successful",
		"data": gin.H{
			"status":       data.AuctionStatus,
			"currentRound": data.CurrentRound,
			"highestBid":   data.HighestBid,
			"highestBidder": data.HighestBidder,
		},
	})
}

// StartAuction starts a new auction
func (h *AuctionHandlers) StartAuction(c *gin.Context) {
	// Get current auction data
	data, err := h.db.GetAuctionData()
	if err != nil {
		h.logger.Printf("Error getting auction data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get auction data"})
		return
	}

	// Check if an auction is already in progress
	if data.AuctionStatus == "inProgress" {
		h.logger.Printf("Auction already in progress")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction already in progress"})
		return
	}

	// Parse request body with auction parameters
	var request StartAuctionRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		h.logger.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate starting price and price step
	if request.Settings.StartingPrice < 0 {
		h.logger.Printf("Invalid starting price: %d", request.Settings.StartingPrice)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Starting price must be >= 0"})
		return
	}

	if request.Settings.PriceStep <= 0 {
		h.logger.Printf("Invalid price step: %d", request.Settings.PriceStep)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Price step must be > 0"})
		return
	}

	if len(request.Bidders) < 1 {
		h.logger.Printf("Cannot start auction: insufficient bidders")
		c.JSON(http.StatusBadRequest, gin.H{"error": "at least 1 bidder is required"})
		return
	}

	// Update settings and bidders
	data.StartingPrice = request.Settings.StartingPrice
	data.PriceStep = request.Settings.PriceStep
	data.Bidders = request.Bidders
	data.AuctionStatus = "inProgress"
	data.CurrentRound = 1
	data.HighestBid = 0
	data.HighestBidder = ""
	data.BidHistory = []models.Bid{}

	// Save updated auction data
	if err := h.db.UpdateAuctionData(data); err != nil {
		h.logger.Printf("Error updating auction data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start auction"})
		return
	}

	h.logger.Printf("Auction started successfully with %d bidders", len(request.Bidders))
	c.JSON(http.StatusOK, gin.H{
		"message": "Auction started successfully",
		"data": gin.H{
			"startingPrice": data.StartingPrice,
			"priceStep":     data.PriceStep,
			"biddersCount":  len(data.Bidders),
		},
	})
}

// EndAuction ends the current auction
func (h *AuctionHandlers) EndAuction(c *gin.Context) {
	// Get current auction data
	data, err := h.db.GetAuctionData()
	if err != nil {
		h.logger.Printf("Error getting auction data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get auction data"})
		return
	}

	// Check if there's an auction in progress
	if data.AuctionStatus != "inProgress" {
		h.logger.Printf("No auction in progress")
		c.JSON(http.StatusBadRequest, gin.H{"error": "No auction in progress"})
		return
	}

	// Store bid history for this auction
	if len(data.BidHistory) > 0 {
		data.AuctionHistory = append(data.AuctionHistory, data.BidHistory)
	}

	// Update auction status
	data.AuctionStatus = "completed"

	// Find the full bidder details of the winner
	var winnerDetails models.Bidder
	winnerInfo := make(map[string]interface{})

	if data.HighestBidder != "" {
		for _, b := range data.Bidders {
			if b.Name == data.HighestBidder {
				winnerDetails = b
				break
			}
		}

		winnerInfo = map[string]interface{}{
			"name":    data.HighestBidder,
			"id":      winnerDetails.ID,
			"address": winnerDetails.Address,
			"amount":  data.HighestBid,
		}
	} else {
		winnerInfo = map[string]interface{}{
			"name":   "No winner",
			"amount": 0,
		}
	}

	// Save updated auction data
	if err := h.db.UpdateAuctionData(data); err != nil {
		h.logger.Printf("Error updating auction data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to end auction"})
		return
	}

	h.logger.Printf("Auction ended successfully, winner: %s, winning bid: %d", data.HighestBidder, data.HighestBid)

	c.JSON(http.StatusOK, gin.H{
		"message": "Auction ended successfully",
		"data": gin.H{
			"winner":     winnerInfo,
			"winningBid": data.HighestBid,
			"bidCount":   len(data.BidHistory),
		},
	})
}
