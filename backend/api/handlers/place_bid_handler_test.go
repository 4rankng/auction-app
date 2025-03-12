package handlers

import (
	"auction/common"
	"auction/internal/models"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/suite"
)

// PlaceBidTestSuite is a test suite for the PlaceBid handler
type PlaceBidTestSuite struct {
	HandlerTestSuite
}

// SetupTest sets up the test suite
func (suite *PlaceBidTestSuite) SetupTest() {
	suite.HandlerTestSuite.SetupTest()
	suite.router.POST("/auctions/:id/bids", suite.handlers.PlaceBid)
}

// TestPlaceBidValidBid tests placing a valid bid
func (suite *PlaceBidTestSuite) TestPlaceBidValidBid() {
	// Create an auction
	auction := suite.CreateTestAuction("test-auction")
	auction.AuctionStatus = common.InProgress
	suite.mockDB.UpdateAuction(auction.ID, auction)

	// Make the request
	requestBody := map[string]interface{}{
		"bidderId": "bidder1",
		"amount":   150,
	}
	w := suite.MakeRequest(http.MethodPost, "/auctions/test-auction/bids", requestBody)

	// Check the response
	suite.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	suite.ParseResponse(w, &response)

	// Verify the response data
	suite.Equal("Bid recorded successfully", response["message"])

	// Check that the bid was recorded
	updatedAuction, err := suite.mockDB.GetAuction("test-auction")
	suite.NoError(err)
	suite.Len(updatedAuction.BidHistory, 1)
	suite.Equal(150, updatedAuction.HighestBid)
	suite.Equal("bidder1", updatedAuction.HighestBidder)
}

// TestPlaceBidMissingAuctionID tests placing a bid with a missing auction ID
func (suite *PlaceBidTestSuite) TestPlaceBidMissingAuctionID() {
	// Make the request with an empty auction ID
	requestBody := map[string]interface{}{
		"bidderId": "bidder1",
		"amount":   150,
	}
	w := suite.MakeRequest(http.MethodPost, "/auctions//bids", requestBody)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusBadRequest, "Auction ID is required")
}

// TestPlaceBidInvalidBidAmount tests placing a bid with an invalid amount
func (suite *PlaceBidTestSuite) TestPlaceBidInvalidBidAmount() {
	// Create an auction
	auction := suite.CreateTestAuction("test-auction")
	auction.AuctionStatus = common.InProgress
	suite.mockDB.UpdateAuction(auction.ID, auction)

	// Make the request with a negative amount
	requestBody := map[string]interface{}{
		"bidderId": "bidder1",
		"amount":   -50,
	}
	w := suite.MakeRequest(http.MethodPost, "/auctions/test-auction/bids", requestBody)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusBadRequest, "Bid amount must be positive")
}

// TestPlaceBidUnregisteredBidder tests placing a bid with an unregistered bidder
func (suite *PlaceBidTestSuite) TestPlaceBidUnregisteredBidder() {
	// Create an auction
	auction := suite.CreateTestAuction("test-auction")
	auction.AuctionStatus = common.InProgress
	suite.mockDB.UpdateAuction(auction.ID, auction)

	// Make the request with an unregistered bidder
	requestBody := map[string]interface{}{
		"bidderId": "bidder3",
		"amount":   150,
	}
	w := suite.MakeRequest(http.MethodPost, "/auctions/test-auction/bids", requestBody)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusBadRequest, "Bidder not registered for this auction")
}

// TestPlaceBidBelowMinimum tests placing a bid below the minimum amount
func (suite *PlaceBidTestSuite) TestPlaceBidBelowMinimum() {
	// Create an auction
	auction := suite.CreateTestAuction("test-auction")
	auction.AuctionStatus = common.InProgress
	suite.mockDB.UpdateAuction(auction.ID, auction)

	// Make the request with an amount below the minimum
	requestBody := map[string]interface{}{
		"bidderId": "bidder1",
		"amount":   50,
	}
	w := suite.MakeRequest(http.MethodPost, "/auctions/test-auction/bids", requestBody)

	// Check the response
	suite.Equal(http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	suite.ParseResponse(w, &response)
	suite.Contains(response["error"], "Bid must be at least")
}

// TestPlaceBidDuplicateBid tests placing a duplicate bid
func (suite *PlaceBidTestSuite) TestPlaceBidDuplicateBid() {
	// Create an auction with an existing bid
	auction := suite.CreateTestAuction("test-auction")
	auction.AuctionStatus = common.InProgress

	// Add an initial bid
	auction.BidHistory = []models.Bid{
		{
			Round:      1,
			BidderID:   "bidder1",
			BidderName: "Bidder One",
			Amount:     150,
			Timestamp:  time.Now().Add(-3 * time.Second),
		},
	}
	auction.HighestBid = 150
	auction.HighestBidder = "bidder1"

	suite.mockDB.UpdateAuction(auction.ID, auction)

	// Make the request with the same bid amount
	requestBody := map[string]interface{}{
		"bidderId": "bidder1",
		"amount":   150,
	}
	w := suite.MakeRequest(http.MethodPost, "/auctions/test-auction/bids", requestBody)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusBadRequest, "This exact bid has already been submitted")
}

// TestPlaceBidRapidSuccessiveBids tests placing bids in rapid succession
func (suite *PlaceBidTestSuite) TestPlaceBidRapidSuccessiveBids() {
	// Create an auction with a recent bid
	auction := suite.CreateTestAuction("test-auction")
	auction.AuctionStatus = common.InProgress

	// Add a very recent bid
	auction.BidHistory = []models.Bid{
		{
			Round:      1,
			BidderID:   "bidder1",
			BidderName: "Bidder One",
			Amount:     150,
			Timestamp:  time.Now(),
		},
	}
	auction.HighestBid = 150
	auction.HighestBidder = "bidder1"

	suite.mockDB.UpdateAuction(auction.ID, auction)

	// Make the request with a new bid amount but from the same bidder
	requestBody := map[string]interface{}{
		"bidderId": "bidder1",
		"amount":   160,
	}
	w := suite.MakeRequest(http.MethodPost, "/auctions/test-auction/bids", requestBody)

	// Check the response
	suite.Equal(http.StatusTooManyRequests, w.Code)

	var response map[string]interface{}
	suite.ParseResponse(w, &response)
	suite.Contains(response["error"], "Please wait a moment")
}

// TestPlaceBidAuctionNotInProgress tests placing a bid on an auction that is not in progress
func (suite *PlaceBidTestSuite) TestPlaceBidAuctionNotInProgress() {
	// Create an auction that is not in progress
	auction := suite.CreateTestAuction("test-auction")
	auction.AuctionStatus = common.Completed
	suite.mockDB.UpdateAuction(auction.ID, auction)

	// Make the request
	requestBody := map[string]interface{}{
		"bidderId": "bidder1",
		"amount":   150,
	}
	w := suite.MakeRequest(http.MethodPost, "/auctions/test-auction/bids", requestBody)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusBadRequest, "Bids can only be placed on auctions in progress")
}

// TestPlaceBidSuite runs the test suite
func TestPlaceBidSuite(t *testing.T) {
	suite.Run(t, new(PlaceBidTestSuite))
}
