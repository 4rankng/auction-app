package handlers

import (
	"net/http"
	"sort"
	"time"

	"github.com/gin-gonic/gin"

	"auction/internal/models"
)

// GetAllAuctions returns all auctions, sorted by creation date (newest first)
func (h *Handlers) GetAllAuctions(c *gin.Context) {
	h.logger.Printf("Getting all auctions")

	// Get all auctions from database
	auctionsMap, err := h.db.GetAllAuctions()
	if err != nil {
		h.logger.Printf("Error retrieving auctions: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve auctions"})
		return
	}

	// Convert map to slice for sorting
	var auctions []*models.Auction
	for _, auction := range auctionsMap {
		auctions = append(auctions, auction)
	}

	// Sort auctions by creation date (newest first)
	sort.Slice(auctions, func(i, j int) bool {
		return auctions[i].CreatedAt.After(auctions[j].CreatedAt)
	})

	// Create a summarized version for the response
	var auctionSummaries []gin.H
	for _, auction := range auctions {
		auctionSummaries = append(auctionSummaries, gin.H{
			"id":             auction.ID,
			"title":          auction.Title,
			"created":        auction.CreatedAt.Format(time.RFC3339),
			"startingPrice":  auction.StartingPrice,
			"priceStep":      auction.PriceStep,
			"bidderCount":    len(auction.Bidders),
			"bidCount":       len(auction.BidHistory),
			"currentRound":   auction.CurrentRound,
			"highestBid":     auction.HighestBid,
			"highestBidder":  auction.HighestBidder,
			"auctionStatus":  auction.AuctionStatus,
		})
	}

	h.logger.Printf("Retrieved %d auctions", len(auctionSummaries))

	// Return response
	c.JSON(http.StatusOK, gin.H{
		"data": auctionSummaries,
	})
}
