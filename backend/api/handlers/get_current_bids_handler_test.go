package handlers

import (
	"auction/common"
	"auction/internal/models"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/suite"
)

// GetCurrentBidsTestSuite is a test suite for the GetCurrentBids handler
type GetCurrentBidsTestSuite struct {
	HandlerTestSuite
}

// SetupTest sets up the test suite
func (suite *GetCurrentBidsTestSuite) SetupTest() {
	suite.HandlerTestSuite.SetupTest()
	suite.router.GET("/auctions/:id/bids", suite.handlers.GetCurrentBids)
}

// TestGetCurrentBidsWithNoBids tests getting current bids when there are no bids
func (suite *GetCurrentBidsTestSuite) TestGetCurrentBidsWithNoBids() {
	// Create an auction with no bids
	auction := suite.CreateTestAuction("test-auction")
	auction.Status = common.InProgress
	suite.mockDB.UpdateAuction(auction.ID, auction)

	// Make the request
	w := suite.MakeRequest(http.MethodGet, "/auctions/test-auction/bids", nil)

	// Check the response
	suite.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	suite.ParseResponse(w, &response)

	// Verify the response data
	suite.Empty(response["data"])
	suite.Equal(float64(0), response["highestBid"])
	suite.Equal("", response["highestBidder"])
}

// TestGetCurrentBidsWithBids tests getting current bids when there are bids
func (suite *GetCurrentBidsTestSuite) TestGetCurrentBidsWithBids() {
	// Create an auction with bids
	auction := suite.CreateTestAuction("test-auction")
	auction.Status = common.InProgress
	auction.CurrentRound = 3

	// Add some bids
	auction.BidHistory = []models.Bid{
		{
			Round:      1,
			BidderID:   "bidder1",
			BidderName: "Bidder One",
			Amount:     110,
			Timestamp:  time.Now().Add(-2 * time.Hour),
		},
		{
			Round:      2,
			BidderID:   "bidder2",
			BidderName: "Bidder Two",
			Amount:     120,
			Timestamp:  time.Now().Add(-1 * time.Hour),
		},
		{
			Round:      3,
			BidderID:   "bidder1",
			BidderName: "Bidder One",
			Amount:     130,
			Timestamp:  time.Now(),
		},
	}

	auction.HighestBid = 130
	auction.HighestBidder = "bidder1"

	suite.mockDB.UpdateAuction(auction.ID, auction)

	// Make the request
	w := suite.MakeRequest(http.MethodGet, "/auctions/test-auction/bids", nil)

	// Check the response
	suite.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	suite.ParseResponse(w, &response)

	// Verify the response data
	bids, ok := response["data"].([]interface{})
	suite.True(ok)
	suite.Len(bids, 2) // Should have latest bid from each bidder

	// Check highest bid and bidder
	suite.Equal(float64(130), response["highestBid"])
	suite.Equal("bidder1", response["highestBidder"])
	suite.Equal(float64(3), response["currentRound"])
}

// TestGetCurrentBidsMissingAuctionID tests getting current bids with a missing auction ID
func (suite *GetCurrentBidsTestSuite) TestGetCurrentBidsMissingAuctionID() {
	// Make the request with an empty auction ID
	w := suite.MakeRequest(http.MethodGet, "/auctions//bids", nil)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusBadRequest, "Auction ID is required")
}

// TestGetCurrentBidsAuctionNotFound tests getting current bids for a non-existent auction
func (suite *GetCurrentBidsTestSuite) TestGetCurrentBidsAuctionNotFound() {
	// Make the request with a non-existent auction ID
	w := suite.MakeRequest(http.MethodGet, "/auctions/non-existent/bids", nil)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusNotFound, "Auction not found")
}

// TestGetCurrentBidsSuite runs the test suite
func TestGetCurrentBidsSuite(t *testing.T) {
	suite.Run(t, new(GetCurrentBidsTestSuite))
}
