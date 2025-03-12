package handlers

import (
	"auction/common"
	"auction/internal/models"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/suite"
)

// GetAuctionHistoryTestSuite is a test suite for the GetAuctionHistory handler
type GetAuctionHistoryTestSuite struct {
	HandlerTestSuite
}

// SetupTest sets up the test suite
func (suite *GetAuctionHistoryTestSuite) SetupTest() {
	suite.HandlerTestSuite.SetupTest()
	suite.router.GET("/auctions/:id/history", suite.handlers.GetAuctionHistory)
}

// TestGetAuctionHistoryWithNoBids tests getting auction history when there are no bids
func (suite *GetAuctionHistoryTestSuite) TestGetAuctionHistoryWithNoBids() {
	// Create an auction with no bids
	auction := suite.CreateTestAuction("test-auction")
	auction.AuctionStatus = common.InProgress
	suite.mockDB.UpdateAuction(auction.ID, auction)

	// Make the request
	w := suite.MakeRequest(http.MethodGet, "/auctions/test-auction/history", nil)

	// Check the response
	suite.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	suite.ParseResponse(w, &response)

	// Verify the response data
	bids, ok := response["data"].([]interface{})
	suite.True(ok)
	suite.Empty(bids)
}

// TestGetAuctionHistoryWithBids tests getting auction history when there are bids
func (suite *GetAuctionHistoryTestSuite) TestGetAuctionHistoryWithBids() {
	// Create an auction with bids
	auction := suite.CreateTestAuction("test-auction")
	auction.AuctionStatus = common.InProgress

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

	suite.mockDB.UpdateAuction(auction.ID, auction)

	// Make the request
	w := suite.MakeRequest(http.MethodGet, "/auctions/test-auction/history", nil)

	// Check the response
	suite.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	suite.ParseResponse(w, &response)

	// Verify the response data
	bids, ok := response["data"].([]interface{})
	suite.True(ok)
	suite.Len(bids, 3) // Should have all bids
}

// TestGetAuctionHistoryMissingAuctionID tests getting auction history with a missing auction ID
func (suite *GetAuctionHistoryTestSuite) TestGetAuctionHistoryMissingAuctionID() {
	// Make the request with an empty auction ID
	w := suite.MakeRequest(http.MethodGet, "/auctions//history", nil)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusBadRequest, "Auction ID is required")
}

// TestGetAuctionHistoryAuctionNotFound tests getting auction history for a non-existent auction
func (suite *GetAuctionHistoryTestSuite) TestGetAuctionHistoryAuctionNotFound() {
	// Make the request with a non-existent auction ID
	w := suite.MakeRequest(http.MethodGet, "/auctions/non-existent/history", nil)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusNotFound, "Auction not found")
}

// TestGetAuctionHistorySuite runs the test suite
func TestGetAuctionHistorySuite(t *testing.T) {
	suite.Run(t, new(GetAuctionHistoryTestSuite))
}
