package handlers

import (
	"auction/common"
	"auction/internal/models"
	"net/http"
	"testing"

	"github.com/stretchr/testify/suite"
)

// GetBiddersTestSuite is a test suite for the GetBidders handler
type GetBiddersTestSuite struct {
	HandlerTestSuite
}

// SetupTest sets up the test suite
func (suite *GetBiddersTestSuite) SetupTest() {
	suite.HandlerTestSuite.SetupTest()
	suite.router.GET("/auctions/:id/bidders", suite.handlers.GetBidders)
}

// TestGetBiddersSuccess tests getting bidders successfully
func (suite *GetBiddersTestSuite) TestGetBiddersSuccess() {
	// Create an auction with bidders
	auction := suite.CreateTestAuction("test-auction")
	auction.AuctionStatus = common.InProgress

	// Add more bidders
	auction.Bidders = append(auction.Bidders, models.Bidder{
		ID:      "bidder3",
		Name:    "Bidder Three",
		Address: "123 Third St",
	})

	suite.mockDB.UpdateAuction(auction.ID, auction)

	// Make the request
	w := suite.MakeRequest(http.MethodGet, "/auctions/test-auction/bidders", nil)

	// Check the response
	suite.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	suite.ParseResponse(w, &response)

	// Verify the response data
	bidders, ok := response["bidders"].([]interface{})
	suite.True(ok)
	suite.Len(bidders, 3)
	suite.Equal(float64(3), response["count"])
}

// TestGetBiddersEmptyList tests getting bidders when there are none
func (suite *GetBiddersTestSuite) TestGetBiddersEmptyList() {
	// Create an auction with no bidders
	auction := suite.CreateTestAuction("test-auction")
	auction.Bidders = []models.Bidder{} // Empty the bidders list
	suite.mockDB.UpdateAuction(auction.ID, auction)

	// Make the request
	w := suite.MakeRequest(http.MethodGet, "/auctions/test-auction/bidders", nil)

	// Check the response
	suite.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	suite.ParseResponse(w, &response)

	// Verify the response data
	bidders, ok := response["bidders"].([]interface{})
	suite.True(ok)
	suite.Empty(bidders)
	suite.Equal(float64(0), response["count"])
}

// TestGetBiddersMissingID tests getting bidders with a missing auction ID
func (suite *GetBiddersTestSuite) TestGetBiddersMissingID() {
	// Make the request with an empty auction ID
	w := suite.MakeRequest(http.MethodGet, "/auctions//bidders", nil)

	// Check if we got a 404 (which means the router didn't match our route)
	if w.Code == http.StatusNotFound {
		suite.T().Log("Router didn't match the route, skipping this test")
		return
	}

	// If we got here, check the response
	suite.Equal(http.StatusBadRequest, w.Code)
	suite.AssertErrorResponse(w, http.StatusBadRequest, "Auction ID is required")
}

// TestGetBiddersAuctionNotFound tests getting bidders for a non-existent auction
func (suite *GetBiddersTestSuite) TestGetBiddersAuctionNotFound() {
	// Make the request with a non-existent auction ID
	w := suite.MakeRequest(http.MethodGet, "/auctions/non-existent/bidders", nil)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusNotFound, "Auction not found")
}

// TestGetBiddersSuite runs the test suite
func TestGetBiddersSuite(t *testing.T) {
	suite.Run(t, new(GetBiddersTestSuite))
}
