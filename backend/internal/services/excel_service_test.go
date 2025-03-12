package services

import (
	"auction/internal/models"
	"bytes"
	"log"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/xuri/excelize/v2"
)

func TestNewExcelService(t *testing.T) {
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)
	service := NewExcelService(logger)

	// Check that the service was created
	assert.NotNil(t, service, "ExcelService should not be nil")
}

func TestGetBiddersFromExcelFileWithInvalidFile(t *testing.T) {
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)
	service := NewExcelService(logger)

	// Create a reader with invalid Excel data
	invalidData := bytes.NewReader([]byte("This is not a valid Excel file"))

	// Process the file
	bidders, err := service.GetBiddersFromExcelFile(invalidData)

	// Check that there was an error
	assert.Error(t, err, "Processing invalid Excel file should return an error")
	assert.Nil(t, bidders, "Bidders should be nil when there's an error")
}

// TestGetBiddersFromEmptyExcelFile tests the behavior when processing an empty Excel file
func TestGetBiddersFromEmptyExcelFile(t *testing.T) {
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)
	service := NewExcelService(logger)

	// Create a new empty Excel file
	f := excelize.NewFile()

	// Save to a buffer
	var buf bytes.Buffer
	err := f.Write(&buf)
	assert.NoError(t, err)

	// Process the file from buffer
	reader := bytes.NewReader(buf.Bytes())
	bidders, err := service.GetBiddersFromExcelFile(reader)

	// Expect an error because there are no bidders
	assert.Error(t, err, "Processing empty Excel file should return an error")
	assert.Nil(t, bidders, "Bidders should be nil for empty Excel file")
	assert.Contains(t, err.Error(), "no valid bidders", "Error should mention no valid bidders")
}

// TestGetBiddersFromActualExcelFile tests the GetBiddersFromExcelFile function with a real Excel file
func TestGetBiddersFromActualExcelFile(t *testing.T) {
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)
	service := NewExcelService(logger)

	// Open the actual Excel file
	file, err := os.Open("testdata/danhsach.xlsx")
	if os.IsNotExist(err) {
		t.Skip("Skipping test as test file is not available")
	}
	assert.NoError(t, err, "Should be able to open the test Excel file")
	defer file.Close()

	// Process the file
	bidders, err := service.GetBiddersFromExcelFile(file)

	// There should be no error
	assert.NoError(t, err, "Processing a valid Excel file should not return an error")

	// The file should contain bidders
	assert.NotNil(t, bidders, "Bidders should not be nil")
	assert.NotEmpty(t, bidders, "Bidders should not be empty")

	// Check that we got the expected number of bidders (according to the file)
	// This assumes the file contains 3 bidders, adjust as needed
	assert.Len(t, bidders, 3, "The excel file should contain 3 bidders")

	// Verify some details of the first bidder
	if len(bidders) > 0 {
		// These assertions are based on the expected content of the file
		// Adjust these assertions based on the actual content of the file
		assert.NotEmpty(t, bidders[0].ID, "Bidder ID should not be empty")
		assert.NotEmpty(t, bidders[0].Name, "Bidder name should not be empty")
		assert.NotEmpty(t, bidders[0].Address, "Bidder address should not be empty")
	}
}

// TestGenerateAuctionReport tests the GenerateAuctionReport function
func TestGenerateAuctionReport(t *testing.T) {
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)
	service := NewExcelService(logger)

	// Create a mock export data
	exportData := &models.ExportData{
		AuctionID:     "test-auction",
		Title:         "Test Auction",
		StartingPrice: 100,
		PriceStep:     10,
		TotalBids:     3,
		BidHistory:    []models.Bid{
			{
				Round:      1,
				BidderID:   "bidder1",
				BidderName: "Bidder One",
				Amount:     110,
				Timestamp:  time.Now().Add(-1 * time.Hour),
			},
			{
				Round:      2,
				BidderID:   "bidder2",
				BidderName: "Bidder Two",
				Amount:     120,
				Timestamp:  time.Now().Add(-30 * time.Minute),
			},
			{
				Round:      3,
				BidderID:   "bidder1",
				BidderName: "Bidder One",
				Amount:     130,
				Timestamp:  time.Now(),
			},
		},
		WinnerID:      "bidder1",
		WinnerName:    "Bidder One",
		WinningBid:    130,
		EndTime:       time.Now(),
	}

	// Generate report
	reportData, err := service.GenerateAuctionReport(exportData)

	// There should be no error
	assert.NoError(t, err, "Generating auction report should not return an error")

	// Report data should not be empty
	assert.NotNil(t, reportData, "Report data should not be nil")
	assert.NotEmpty(t, reportData, "Report data should not be empty")
}
