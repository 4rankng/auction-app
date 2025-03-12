package handlers

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"

	"auction/internal/models"
)

// ExportAuctionDataTestSuite is a test suite for the ExportAuctionData handler
type ExportAuctionDataTestSuite struct {
	HandlerTestSuite
}

// SetupTest sets up the test suite
func (suite *ExportAuctionDataTestSuite) SetupTest() {
	suite.HandlerTestSuite.SetupTest()
	suite.router.GET("/auctions/:id/export", suite.handlers.ExportAuctionData)
}

// TestExportAuctionDataMissingID tests exporting with a missing auction ID
func (suite *ExportAuctionDataTestSuite) TestExportAuctionDataMissingID() {
	// Make the request with an empty auction ID
	w := suite.MakeRequest(http.MethodGet, "/auctions//export", nil)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusBadRequest, "Auction ID is required")
}

// TestExportAuctionDataNotFound tests exporting a non-existent auction
func (suite *ExportAuctionDataTestSuite) TestExportAuctionDataNotFound() {
	// Make the request with a non-existent auction ID
	w := suite.MakeRequest(http.MethodGet, "/auctions/non-existent/export", nil)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusNotFound, "Auction not found")
}

// MockExcelServiceWithError is a mock implementation that returns an error
type MockExcelServiceWithError struct {
	*MockExcelService
}

// GenerateAuctionReport returns an error
func (m *MockExcelServiceWithError) GenerateAuctionReport(data *models.ExportData) ([]byte, error) {
	return nil, fmt.Errorf("mock error generating report")
}

// TestExportAuctionDataServiceError tests a service error during export
func (suite *ExportAuctionDataTestSuite) TestExportAuctionDataServiceError() {
	// Create an auction
	auction := suite.CreateTestAuction("test-auction")
	suite.mockDB.UpdateAuction(auction.ID, auction)

	// Save the original service
	originalService := suite.handlers.excelService

	// Replace with mock service that returns an error
	mockService := &MockExcelServiceWithError{MockExcelService: &MockExcelService{}}
	suite.handlers.excelService = mockService

	// Make the request
	w := suite.MakeRequest(http.MethodGet, "/auctions/test-auction/export", nil)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusInternalServerError, "Failed to generate Excel report")

	// Restore the original service
	suite.handlers.excelService = originalService
}

// TestExportAuctionDataSuccess tests a successful export
func (suite *ExportAuctionDataTestSuite) TestExportAuctionDataSuccess() {
	// Create an auction
	auction := suite.CreateTestAuction("test-auction")
	suite.mockDB.UpdateAuction(auction.ID, auction)

	// Save the original service
	originalService := suite.handlers.excelService

	// Replace with mock service
	mockService := &MockExcelService{
		bidders: []models.Bidder{},
	}
	suite.handlers.excelService = mockService

	// Make the request
	w := suite.MakeRequest(http.MethodGet, "/auctions/test-auction/export", nil)

	// Check the response
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	assert.Equal(suite.T(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", w.Header().Get("Content-Type"))
	assert.Equal(suite.T(), "attachment; filename=auction_test-auction_report.xlsx", w.Header().Get("Content-Disposition"))
	assert.Equal(suite.T(), "mock report", w.Body.String())

	// Restore the original service
	suite.handlers.excelService = originalService
}

// TestExportAuctionDataSuite runs the test suite
func TestExportAuctionDataSuite(t *testing.T) {
	suite.Run(t, new(ExportAuctionDataTestSuite))
}
