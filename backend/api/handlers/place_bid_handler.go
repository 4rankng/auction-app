package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"auction/common"
	"auction/internal/models"
)

// PlaceBidRequest represents the request to place a bid
type PlaceBidRequest struct {
	BidderID string `json:"bidderId" binding:"required"`
	Amount   int    `json:"amount" binding:"required"`
}

// PlaceBid adds a new bid to an auction
// This function is designed for an in-person auction environment where:
// 1. A single admin places bids on behalf of bidders
// 2. Protection against accidental double-click submissions is required
// 3. Each bid must be validated against auction rules
func (h *Handlers) PlaceBid(c *gin.Context) {
	// Step 1: Extract and validate the auction ID
	auctionID := c.Param("id")
	if auctionID == "" {
		h.logger.Printf("Error: Auction ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction ID is required"})
		return
	}

	// Step 2: Parse and validate the bid request
	var bidRequest PlaceBidRequest
	if err := c.ShouldBindJSON(&bidRequest); err != nil {
		h.logger.Printf("Error parsing bid request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid bid format"})
		return
	}

	// Step 3: Validate bid amount is positive
	if bidRequest.Amount <= 0 {
		h.logger.Printf("Invalid bid amount: %d", bidRequest.Amount)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bid amount must be positive"})
		return
	}

	h.logger.Printf("Processing bid for auction %s: bidder=%s, amount=%d",
		auctionID, bidRequest.BidderID, bidRequest.Amount)

	// Step 4: Retrieve the auction
	auction, err := h.db.GetAuction(auctionID)
	if err != nil {
		h.logger.Printf("Error retrieving auction: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Auction not found"})
		return
	}

	// Step 5: Validate auction status
	if auction.Status != common.InProgress {
		h.logger.Printf("Cannot accept bid: auction status is %s", auction.Status)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bids can only be placed on auctions in progress"})
		return
	}

	// Step 6: Verify bidder is registered for this auction
	var bidderName string
	bidderExists := false

	for _, bidder := range auction.Bidders {
		if bidder.ID == bidRequest.BidderID {
			bidderExists = true
			bidderName = bidder.Name
			break
		}
	}

	if !bidderExists {
		h.logger.Printf("Error: Bidder %s not registered for auction %s", bidRequest.BidderID, auctionID)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bidder not registered for this auction"})
		return
	}

	// Step 7: Prevent duplicate bids (same amount from same bidder)
	// This specifically addresses the accidental double-click scenario
	for _, bid := range auction.BidHistory {
		if bid.BidderID == bidRequest.BidderID && bid.Amount == bidRequest.Amount {
			h.logger.Printf("Duplicate bid detected: bidder=%s, amount=%d", bidRequest.BidderID, bidRequest.Amount)
			c.JSON(http.StatusBadRequest, gin.H{"error": "This exact bid has already been submitted"})
			return
		}
	}

	// Step 8: Apply time-based throttling to prevent rapid successive bids from same bidder
	// This adds another layer of protection against double submissions
	for i := len(auction.BidHistory) - 1; i >= 0; i-- {
		bid := auction.BidHistory[i]
		if bid.BidderID == bidRequest.BidderID {
			timeSinceLastBid := time.Since(bid.Timestamp)
			if timeSinceLastBid < 2*time.Second {
				h.logger.Printf("Rapid successive bid rejected: bidder=%s, time_since_last=%v",
					bidRequest.BidderID, timeSinceLastBid)
				c.JSON(http.StatusTooManyRequests, gin.H{
					"error":      "Please wait a moment before placing another bid",
					"timeToWait": (2*time.Second - timeSinceLastBid).Milliseconds(),
				})
				return
			}
			break // Only check most recent bid from this bidder
		}
	}

	// Step 9: Validate bid meets minimum amount requirement
	// Determine minimum required bid (starting price or current highest + increment)
	minRequiredBid := auction.HighestBid
	if minRequiredBid == 0 {
		minRequiredBid = auction.StartingPrice
	} else {
		minRequiredBid += auction.PriceStep
	}

	if bidRequest.Amount < minRequiredBid {
		h.logger.Printf("Bid too low: received=%d, minimum_required=%d", bidRequest.Amount, minRequiredBid)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":      fmt.Sprintf("Bid must be at least %d", minRequiredBid),
			"minimumBid": minRequiredBid,
		})
		return
	}

	// Step 10: Create and record the new bid
	newBid := models.Bid{
		Round:      auction.CurrentRound,
		BidderID:   bidRequest.BidderID,
		BidderName: bidderName,
		Amount:     bidRequest.Amount,
		Timestamp:  time.Now(),
	}

	// Update auction state
	auction.BidHistory = append(auction.BidHistory, newBid)
	auction.HighestBid = bidRequest.Amount
	auction.HighestBidder = bidRequest.BidderID

	// Step 11: Save the updated auction
	err = h.db.UpdateAuction(auctionID, auction)
	if err != nil {
		h.logger.Printf("Failed to save bid: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record bid"})
		return
	}

	// Step 12: Increment round counter if needed
	if auction.CurrentRound > 0 {
		auction.CurrentRound++
		if err := h.db.UpdateAuction(auctionID, auction); err != nil {
			h.logger.Printf("Warning: Failed to update round counter: %v", err)
			// Not critical, continue anyway
		}
	}

	// Step 13: Ensure data is persisted
	if err := h.db.SaveData(); err != nil {
		h.logger.Printf("Warning: Failed to persist data after bid: %v", err)
		// Not critical if in-memory state is updated
	}

	// Step 14: Return success response with updated information
	h.logger.Printf("Bid recorded successfully: auction=%s, bidder=%s, amount=%d",
		auctionID, bidRequest.BidderID, bidRequest.Amount)

	c.JSON(http.StatusOK, gin.H{
		"message": "Bid recorded successfully",
		"data": gin.H{
			"bid": newBid,
			"auction": gin.H{
				"id":            auction.ID,
				"title":         auction.Title,
				"currentRound":  auction.CurrentRound,
				"highestBid":    auction.HighestBid,
				"highestBidder": auction.HighestBidder,
			},
		},
	})
}
