package handlers

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"

	"auction/common"
	"auction/internal/models"
)

// StartAuctionTestSuite is a test suite for the StartAuction handler
type StartAuctionTestSuite struct {
	HandlerTestSuite
}

// SetupTest sets up the test suite
func (suite *StartAuctionTestSuite) SetupTest() {
	suite.HandlerTestSuite.SetupTest()
	suite.router.POST("/auctions/:id/start", suite.handlers.StartAuction)
}

// TestStartAuctionMissingID tests starting an auction with a missing ID
func (suite *StartAuctionTestSuite) TestStartAuctionMissingID() {
	// Make the request with an empty auction ID
	w := suite.MakeRequest(http.MethodPost, "/auctions//start", nil)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusBadRequest, "Auction ID is required")
}

// TestStartAuctionNotFound tests starting a non-existent auction
func (suite *StartAuctionTestSuite) TestStartAuctionNotFound() {
	// Make the request with a non-existent auction ID
	w := suite.MakeRequest(http.MethodPost, "/auctions/non-existent/start", nil)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusNotFound, "Auction not found")
}

// TestStartAuctionAlreadyStarted tests starting an auction that is already started
func (suite *StartAuctionTestSuite) TestStartAuctionAlreadyStarted() {
	// Create an auction that is already in progress
	auction := suite.CreateTestAuction("test-auction")
	auction.AuctionStatus = common.InProgress
	suite.mockDB.UpdateAuction(auction.ID, auction)

	// Make the request
	w := suite.MakeRequest(http.MethodPost, "/auctions/test-auction/start", nil)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusBadRequest, "Auction is already started or completed")
}

// TestStartAuctionInsufficientBidders tests starting an auction with insufficient bidders
func (suite *StartAuctionTestSuite) TestStartAuctionInsufficientBidders() {
	// Create an auction with only one bidder
	auction := suite.CreateTestAuction("test-auction")
	auction.AuctionStatus = common.NotStarted
	auction.Bidders = []models.Bidder{
		{ID: "bidder1", Name: "Bidder One"},
	}
	suite.mockDB.UpdateAuction(auction.ID, auction)

	// Make the request
	w := suite.MakeRequest(http.MethodPost, "/auctions/test-auction/start", nil)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusBadRequest, "At least two bidders are required to start an auction")
}

// TestStartAuctionSuccess tests successfully starting an auction
func (suite *StartAuctionTestSuite) TestStartAuctionSuccess() {
	// Create an auction that is not started
	auction := suite.CreateTestAuction("test-auction")
	auction.AuctionStatus = common.NotStarted
	auction.Bidders = []models.Bidder{
		{ID: "bidder1", Name: "Bidder One"},
		{ID: "bidder2", Name: "Bidder Two"},
		{ID: "bidder3", Name: "Bidder Three"},
	}
	suite.mockDB.UpdateAuction(auction.ID, auction)

	// Make the request
	w := suite.MakeRequest(http.MethodPost, "/auctions/test-auction/start", nil)

	// Check the response
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	suite.ParseResponse(w, &response)

	// Verify the response data
	assert.Equal(suite.T(), "Auction started successfully", response["message"])

	data, ok := response["data"].(map[string]interface{})
	assert.True(suite.T(), ok)
	assert.Equal(suite.T(), "test-auction", data["id"])
	assert.Equal(suite.T(), float64(1), data["currentRound"])
	assert.Equal(suite.T(), float64(3), data["bidderCount"])
	assert.Equal(suite.T(), string(common.InProgress), data["status"])

	// Verify the auction was updated in the database
	updatedAuction, err := suite.mockDB.GetAuction("test-auction")
	suite.NoError(err)
	assert.Equal(suite.T(), common.InProgress, updatedAuction.AuctionStatus)
	assert.Equal(suite.T(), 1, updatedAuction.CurrentRound)
}

// TestStartAuctionSuite runs the test suite
func TestStartAuctionSuite(t *testing.T) {
	suite.Run(t, new(StartAuctionTestSuite))
}
