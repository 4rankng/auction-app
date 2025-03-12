package handlers

import (
	"auction/common"
	"encoding/json"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/suite"
)

// GetAllAuctionsTestSuite is a test suite for the GetAllAuctions handler
type GetAllAuctionsTestSuite struct {
	HandlerTestSuite
}

// SetupTest sets up the test suite
func (suite *GetAllAuctionsTestSuite) SetupTest() {
	suite.HandlerTestSuite.SetupTest()
	suite.router.GET("/auctions", suite.handlers.GetAllAuctions)
}

// TestGetAllAuctionsEmpty tests getting all auctions when there are none
func (suite *GetAllAuctionsTestSuite) TestGetAllAuctionsEmpty() {
	// Make the request
	w := suite.MakeRequest(http.MethodGet, "/auctions", nil)

	// Check the response
	suite.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	suite.NoError(err, "Failed to parse response")

	// Check if data exists in the response
	data, exists := response["data"]
	suite.True(exists, "Response should contain 'data' field")

	// The data could be null or an empty array - both are acceptable for empty results
	if data != nil {
		// If not null, it should be an empty array
		dataArray, ok := data.([]interface{})
		suite.True(ok, "Data should be an array")
		suite.Empty(dataArray, "Data array should be empty")
	}
}

// TestGetAllAuctionsWithData tests getting all auctions when there are some
func (suite *GetAllAuctionsTestSuite) TestGetAllAuctionsWithData() {
	// Create a few auctions with different creation times
	auction1 := suite.CreateTestAuction("auction-1")
	auction1.AuctionStatus = common.InProgress
	auction1.CreatedAt = time.Now().Add(-24 * time.Hour) // 1 day ago
	suite.mockDB.UpdateAuction(auction1.ID, auction1)

	auction2 := suite.CreateTestAuction("auction-2")
	auction2.AuctionStatus = common.Completed
	auction2.CreatedAt = time.Now() // Now (newest)
	suite.mockDB.UpdateAuction(auction2.ID, auction2)

	auction3 := suite.CreateTestAuction("auction-3")
	auction3.AuctionStatus = common.InProgress
	auction3.CreatedAt = time.Now().Add(-12 * time.Hour) // 12 hours ago
	suite.mockDB.UpdateAuction(auction3.ID, auction3)

	// Make the request
	w := suite.MakeRequest(http.MethodGet, "/auctions", nil)

	// Check the response
	suite.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	suite.ParseResponse(w, &response)

	// Verify the response data
	data, ok := response["data"].([]interface{})
	suite.True(ok)
	suite.Len(data, 3)

	// Check that the auctions are sorted by creation date (newest first)
	firstAuction := data[0].(map[string]interface{})
	suite.Equal("auction-2", firstAuction["id"])

	secondAuction := data[1].(map[string]interface{})
	suite.Equal("auction-3", secondAuction["id"])

	thirdAuction := data[2].(map[string]interface{})
	suite.Equal("auction-1", thirdAuction["id"])
}

// TestGetAllAuctionsSuite runs the test suite
func TestGetAllAuctionsSuite(t *testing.T) {
	suite.Run(t, new(GetAllAuctionsTestSuite))
}
