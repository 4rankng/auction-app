package handlers

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"

	"auction/common"
	"auction/internal/models"
)

// EndAuctionTestSuite is a test suite for the EndAuction handler
type EndAuctionTestSuite struct {
	HandlerTestSuite
}

// SetupTest sets up the test suite
func (suite *EndAuctionTestSuite) SetupTest() {
	suite.HandlerTestSuite.SetupTest()
	suite.router.POST("/auctions/:id/end", suite.handlers.EndAuction)
}

// TestEndAuctionMissingID tests ending an auction with a missing ID
func (suite *EndAuctionTestSuite) TestEndAuctionMissingID() {
	// Make the request with an empty auction ID
	w := suite.MakeRequest(http.MethodPost, "/auctions//end", nil)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusBadRequest, "Auction ID is required")
}

// TestEndAuctionNotFound tests ending a non-existent auction
func (suite *EndAuctionTestSuite) TestEndAuctionNotFound() {
	// Make the request with a non-existent auction ID
	w := suite.MakeRequest(http.MethodPost, "/auctions/non-existent/end", nil)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusNotFound, "Auction not found")
}

// TestEndAuctionNotInProgress tests ending an auction that is not in progress
func (suite *EndAuctionTestSuite) TestEndAuctionNotInProgress() {
	// Create an auction that is not in progress
	auction := suite.CreateTestAuction("test-auction")
	auction.AuctionStatus = common.NotStarted
	suite.mockDB.UpdateAuction(auction.ID, auction)

	// Make the request
	w := suite.MakeRequest(http.MethodPost, "/auctions/test-auction/end", nil)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusBadRequest, "Auction is not in progress")
}

// TestEndAuctionSuccess tests successfully ending an auction
func (suite *EndAuctionTestSuite) TestEndAuctionSuccess() {
	// Create an auction in progress
	auction := suite.CreateTestAuction("test-auction")
	auction.AuctionStatus = common.InProgress
	auction.HighestBid = 150
	auction.HighestBidder = "bidder1"
	auction.BidHistory = []models.Bid{
		{
			Round:      1,
			BidderID:   "bidder1",
			BidderName: "Bidder One",
			Amount:     150,
		},
	}
	suite.mockDB.UpdateAuction(auction.ID, auction)

	// Make the request
	w := suite.MakeRequest(http.MethodPost, "/auctions/test-auction/end", nil)

	// Check the response
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	suite.ParseResponse(w, &response)

	// Verify the response data
	assert.Equal(suite.T(), "Auction ended successfully", response["message"])

	data, ok := response["data"].(map[string]interface{})
	assert.True(suite.T(), ok)
	assert.Equal(suite.T(), "test-auction", data["id"])
	assert.Equal(suite.T(), float64(150), data["highestBid"])
	assert.Equal(suite.T(), "bidder1", data["highestBidder"])
	assert.Equal(suite.T(), float64(1), data["bidCount"])
	assert.Equal(suite.T(), string(common.Completed), data["status"])

	// Verify the auction was updated in the database
	updatedAuction, err := suite.mockDB.GetAuction("test-auction")
	suite.NoError(err)
	assert.Equal(suite.T(), common.Completed, updatedAuction.AuctionStatus)
}

// TestEndAuctionSuite runs the test suite
func TestEndAuctionSuite(t *testing.T) {
	suite.Run(t, new(EndAuctionTestSuite))
}
