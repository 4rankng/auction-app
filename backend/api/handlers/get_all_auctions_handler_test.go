package handlers

import (
	"auction/common"
	"auction/internal/models"
	"encoding/json"
	"fmt"
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

	var response PaginatedResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	suite.NoError(err, "Failed to parse response")

	// Check pagination information
	suite.Equal(0, response.Total)
	suite.Equal(1, response.Page)
	suite.Equal(10, response.PageSize)
	suite.Equal(1, response.TotalPages)
	suite.Empty(response.Data, "Data array should be empty")
}

// TestGetAllAuctionsWithData tests getting all auctions when there are some
func (suite *GetAllAuctionsTestSuite) TestGetAllAuctionsWithData() {
	// Create a few auctions with different creation times
	auction1 := suite.CreateTestAuction("auction-1")
	auction1.Status = common.InProgress
	auction1.CreatedAt = time.Now().Add(-24 * time.Hour) // 1 day ago
	suite.mockDB.UpdateAuction(auction1.ID, auction1)

	auction2 := suite.CreateTestAuction("auction-2")
	auction2.Status = common.Completed
	auction2.CreatedAt = time.Now() // Now (newest)
	// Add some bid history for completed auction
	auction2.BidHistory = []models.Bid{
		{Round: 1, BidderID: "bidder1", BidderName: "Bidder One", Amount: 150, Timestamp: time.Now().Add(-30 * time.Minute)},
		{Round: 2, BidderID: "bidder2", BidderName: "Bidder Two", Amount: 200, Timestamp: time.Now().Add(-15 * time.Minute)},
	}
	auction2.HighestBid = 200
	auction2.HighestBidder = "bidder2"
	suite.mockDB.UpdateAuction(auction2.ID, auction2)

	auction3 := suite.CreateTestAuction("auction-3")
	auction3.Status = common.InProgress
	auction3.CreatedAt = time.Now().Add(-12 * time.Hour) // 12 hours ago
	suite.mockDB.UpdateAuction(auction3.ID, auction3)

	// Make the request
	w := suite.MakeRequest(http.MethodGet, "/auctions", nil)

	// Check the response
	suite.Equal(http.StatusOK, w.Code)

	var response PaginatedResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	suite.NoError(err, "Failed to parse response")

	// Verify pagination information
	suite.Equal(3, response.Total)
	suite.Equal(1, response.Page)
	suite.Equal(10, response.PageSize)
	suite.Equal(1, response.TotalPages)
	suite.Len(response.Data, 3)

	// Check that the auctions are sorted by creation date (newest first)
	suite.Equal("auction-2", response.Data[0].ID)
	suite.Equal("auction-3", response.Data[1].ID)
	suite.Equal("auction-1", response.Data[2].ID)

	// Verify that bidder details are included for all auctions
	for i, auction := range response.Data {
		suite.NotEmpty(auction.Bidders, fmt.Sprintf("Auction %d should have bidder details", i))
		suite.Len(auction.Bidders, 2, fmt.Sprintf("Auction %d should have 2 bidders", i))
	}

	// Verify that bid history is included only for completed auctions
	completedAuction := response.Data[0] // auction-2 is completed
	suite.Equal(common.Completed, completedAuction.Status)
	suite.NotEmpty(completedAuction.BidHistory, "Completed auction should have bid history")
	suite.Len(completedAuction.BidHistory, 2, "Completed auction should have 2 bids")
	suite.Equal(200, completedAuction.HighestBid)
	suite.Equal("bidder2", completedAuction.HighestBidder)

	// Verify that bid history is not included for in-progress auctions
	inProgressAuction1 := response.Data[1] // auction-3 is in progress
	suite.Equal(common.InProgress, inProgressAuction1.Status)
	suite.Empty(inProgressAuction1.BidHistory, "In-progress auction should not have bid history")

	inProgressAuction2 := response.Data[2] // auction-1 is in progress
	suite.Equal(common.InProgress, inProgressAuction2.Status)
	suite.Empty(inProgressAuction2.BidHistory, "In-progress auction should not have bid history")
}

// TestGetAllAuctionsPagination tests pagination of the auctions
func (suite *GetAllAuctionsTestSuite) TestGetAllAuctionsPagination() {
	// Create 25 auctions to test pagination
	for i := 1; i <= 25; i++ {
		auction := suite.CreateTestAuction(fmt.Sprintf("auction-%d", i))
		auction.CreatedAt = time.Now().Add(time.Duration(-i) * time.Hour)
		suite.mockDB.UpdateAuction(auction.ID, auction)
	}

	// Test first page (default page size = 10)
	w1 := suite.MakeRequest(http.MethodGet, "/auctions", nil)
	suite.Equal(http.StatusOK, w1.Code)

	var response1 PaginatedResponse
	err := json.Unmarshal(w1.Body.Bytes(), &response1)
	suite.NoError(err)

	suite.Equal(25, response1.Total)
	suite.Equal(1, response1.Page)
	suite.Equal(10, response1.PageSize)
	suite.Equal(3, response1.TotalPages)
	suite.Len(response1.Data, 10)
	suite.Equal("auction-1", response1.Data[0].ID) // Newest first

	// Test second page
	w2 := suite.MakeRequest(http.MethodGet, "/auctions?page=2", nil)
	suite.Equal(http.StatusOK, w2.Code)

	var response2 PaginatedResponse
	err = json.Unmarshal(w2.Body.Bytes(), &response2)
	suite.NoError(err)

	suite.Equal(25, response2.Total)
	suite.Equal(2, response2.Page)
	suite.Equal(10, response2.PageSize)
	suite.Equal(3, response2.TotalPages)
	suite.Len(response2.Data, 10)
	suite.Equal("auction-11", response2.Data[0].ID)

	// Test third page
	w3 := suite.MakeRequest(http.MethodGet, "/auctions?page=3", nil)
	suite.Equal(http.StatusOK, w3.Code)

	var response3 PaginatedResponse
	err = json.Unmarshal(w3.Body.Bytes(), &response3)
	suite.NoError(err)

	suite.Equal(25, response3.Total)
	suite.Equal(3, response3.Page)
	suite.Equal(10, response3.PageSize)
	suite.Equal(3, response3.TotalPages)
	suite.Len(response3.Data, 5) // Only 5 items on the last page
	suite.Equal("auction-21", response3.Data[0].ID)

	// Test custom page size
	w4 := suite.MakeRequest(http.MethodGet, "/auctions?pageSize=5", nil)
	suite.Equal(http.StatusOK, w4.Code)

	var response4 PaginatedResponse
	err = json.Unmarshal(w4.Body.Bytes(), &response4)
	suite.NoError(err)

	suite.Equal(25, response4.Total)
	suite.Equal(1, response4.Page)
	suite.Equal(5, response4.PageSize)
	suite.Equal(5, response4.TotalPages)
	suite.Len(response4.Data, 5)

	// Test invalid page (too high)
	w5 := suite.MakeRequest(http.MethodGet, "/auctions?page=10", nil)
	suite.Equal(http.StatusOK, w5.Code)

	var response5 PaginatedResponse
	err = json.Unmarshal(w5.Body.Bytes(), &response5)
	suite.NoError(err)

	suite.Equal(25, response5.Total)
	suite.Equal(3, response5.Page) // Should default to the last page
	suite.Equal(10, response5.PageSize)
	suite.Equal(3, response5.TotalPages)
	suite.Len(response5.Data, 5)
}

// TestGetAllAuctionsWithStatusFilter tests filtering auctions by status
func (suite *GetAllAuctionsTestSuite) TestGetAllAuctionsWithStatusFilter() {
	// Create auctions with different statuses
	auction1 := suite.CreateTestAuction("auction-1")
	auction1.Status = common.NotStarted
	suite.mockDB.UpdateAuction(auction1.ID, auction1)

	auction2 := suite.CreateTestAuction("auction-2")
	auction2.Status = common.InProgress
	suite.mockDB.UpdateAuction(auction2.ID, auction2)

	auction3 := suite.CreateTestAuction("auction-3")
	auction3.Status = common.Completed
	suite.mockDB.UpdateAuction(auction3.ID, auction3)

	auction4 := suite.CreateTestAuction("auction-4")
	auction4.Status = common.InProgress
	suite.mockDB.UpdateAuction(auction4.ID, auction4)

	// Test filtering by NotStarted status
	w1 := suite.MakeRequest(http.MethodGet, "/auctions?status=notStarted", nil)
	suite.Equal(http.StatusOK, w1.Code)

	var response1 PaginatedResponse
	err := json.Unmarshal(w1.Body.Bytes(), &response1)
	suite.NoError(err)

	suite.Equal(1, response1.Total)
	suite.Len(response1.Data, 1)
	suite.Equal("auction-1", response1.Data[0].ID)
	suite.Equal(common.NotStarted, response1.Data[0].Status)

	// Test filtering by InProgress status
	w2 := suite.MakeRequest(http.MethodGet, "/auctions?status=inProgress", nil)
	suite.Equal(http.StatusOK, w2.Code)

	var response2 PaginatedResponse
	err = json.Unmarshal(w2.Body.Bytes(), &response2)
	suite.NoError(err)

	suite.Equal(2, response2.Total)
	suite.Len(response2.Data, 2)
	for _, auction := range response2.Data {
		suite.Equal(common.InProgress, auction.Status)
	}

	// Test filtering by Completed status
	w3 := suite.MakeRequest(http.MethodGet, "/auctions?status=completed", nil)
	suite.Equal(http.StatusOK, w3.Code)

	var response3 PaginatedResponse
	err = json.Unmarshal(w3.Body.Bytes(), &response3)
	suite.NoError(err)

	suite.Equal(1, response3.Total)
	suite.Len(response3.Data, 1)
	suite.Equal("auction-3", response3.Data[0].ID)
	suite.Equal(common.Completed, response3.Data[0].Status)

	// Test with invalid status value
	w4 := suite.MakeRequest(http.MethodGet, "/auctions?status=invalid", nil)
	suite.Equal(http.StatusBadRequest, w4.Code)

	// Test with combined pagination and status filter
	w5 := suite.MakeRequest(http.MethodGet, "/auctions?status=inProgress&pageSize=1", nil)
	suite.Equal(http.StatusOK, w5.Code)

	var response5 PaginatedResponse
	err = json.Unmarshal(w5.Body.Bytes(), &response5)
	suite.NoError(err)

	suite.Equal(2, response5.Total) // Total should be 2 (all inProgress auctions)
	suite.Equal(1, response5.PageSize)
	suite.Equal(2, response5.TotalPages)
	suite.Len(response5.Data, 1) // Only 1 per page
	suite.Equal(common.InProgress, response5.Data[0].Status)
}

// TestGetAllAuctionsSuite runs the test suite
func TestGetAllAuctionsSuite(t *testing.T) {
	suite.Run(t, new(GetAllAuctionsTestSuite))
}
