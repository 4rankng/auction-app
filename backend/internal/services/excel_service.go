package services

import (
	"fmt"
	"io"
	"log"
	"os"

	"auction/internal/models"

	"github.com/xuri/excelize/v2"
)

// ExcelService defines the interface for Excel file processing
type ExcelService interface {
	GetBiddersFromExcelFile(file io.Reader) ([]models.Bidder, error)
	GenerateAuctionReport(data *models.ExportData) ([]byte, error)
}

// excelService implements the ExcelService interface
type excelService struct {
	logger *log.Logger
}

// NewExcelService creates a new instance of ExcelService
func NewExcelService(logger *log.Logger) ExcelService {
	return &excelService{
		logger: logger,
	}
}

// GetBiddersFromExcelFile processes an Excel file and extracts bidder information
func (s *excelService) GetBiddersFromExcelFile(file io.Reader) ([]models.Bidder, error) {
	// Create a temporary file to store the uploaded Excel file
	tempFile, err := os.CreateTemp("", "upload-*.xlsx")
	if err != nil {
		s.logger.Printf("Error creating temp file: %v", err)
		return nil, fmt.Errorf("error creating temp file: %w", err)
	}

	// Copy the file data to the temp file
	_, err = io.Copy(tempFile, file)
	if err != nil {
		s.logger.Printf("Error copying file data: %v", err)
		os.Remove(tempFile.Name())
		return nil, fmt.Errorf("error copying file data: %w", err)
	}

	// Close the file to ensure all data is written
	tempFile.Close()

	s.logger.Printf("Temporary file created: %s", tempFile.Name())

	// Open the Excel file
	xlsx, err := excelize.OpenFile(tempFile.Name())
	if err != nil {
		s.logger.Printf("Error opening Excel file: %v", err)
		os.Remove(tempFile.Name())
		return nil, fmt.Errorf("error opening Excel file: %w", err)
	}
	defer xlsx.Close()

	s.logger.Printf("Excel file opened successfully")

	// Get all sheet names
	sheetNames := xlsx.GetSheetList()
	if len(sheetNames) == 0 {
		s.logger.Printf("No sheets found in Excel file")
		os.Remove(tempFile.Name())
		return nil, fmt.Errorf("no sheets found in Excel file")
	}

	s.logger.Printf("Found sheets: %v", sheetNames)

	// Try to find the "Đủ ĐK" sheet first
	sheetName := sheetNames[0] // Default to first sheet
	for _, name := range sheetNames {
		if name == "Đủ ĐK" {
			sheetName = name
			break
		}
	}

	// Get all the rows in the sheet
	rows, err := xlsx.GetRows(sheetName)
	if err != nil {
		s.logger.Printf("Error reading rows from sheet %s: %v", sheetName, err)
		os.Remove(tempFile.Name())
		return nil, fmt.Errorf("error reading rows from sheet %s: %w", sheetName, err)
	}

	s.logger.Printf("Reading from sheet: %s", sheetName)

	var bidders []models.Bidder
	startRow := 11 // Default for "Đủ ĐK" sheet
	if sheetName != "Đủ ĐK" {
		startRow = 1 // For other sheets, start from first row
	}

	// Process rows
	for i := startRow; i < len(rows); i++ {
		row := rows[i]
		if len(row) >= 3 && row[0] != "" && row[1] != "" && row[2] != "" {
			bidder := models.Bidder{
				ID:      row[0],
				Name:    row[1],
				Address: row[2],
			}
			bidders = append(bidders, bidder)
			s.logger.Printf("Added bidder: ID=%s, Name=%s", bidder.ID, bidder.Name)
		}
	}

	// Clean up the temp file
	os.Remove(tempFile.Name())
	s.logger.Printf("Cleaned up temporary file: %s", tempFile.Name())

	if len(bidders) == 0 {
		return nil, fmt.Errorf("no valid bidders found in Excel file")
	}

	s.logger.Printf("Successfully processed %d bidders from Excel file", len(bidders))
	return bidders, nil
}

// GenerateAuctionReport creates an Excel report from auction data
func (s *excelService) GenerateAuctionReport(data *models.ExportData) ([]byte, error) {
	s.logger.Printf("Generating Excel report for auction %s", data.AuctionID)

	// Create a new Excel file
	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {
			s.logger.Printf("Error closing Excel file: %v", err)
		}
	}()

	// Create auction info sheet
	sheetName := "Auction Info"
	f.NewSheet(sheetName)
	f.DeleteSheet("Sheet1") // Delete default sheet

	// Add auction details
	f.SetCellValue(sheetName, "A1", "Auction ID")
	f.SetCellValue(sheetName, "B1", data.AuctionID)
	f.SetCellValue(sheetName, "A2", "Title")
	f.SetCellValue(sheetName, "B2", data.Title)
	f.SetCellValue(sheetName, "A3", "Starting Price")
	f.SetCellValue(sheetName, "B3", data.StartingPrice)
	f.SetCellValue(sheetName, "A4", "Price Step")
	f.SetCellValue(sheetName, "B4", data.PriceStep)
	f.SetCellValue(sheetName, "A5", "Total Bids")
	f.SetCellValue(sheetName, "B5", data.TotalBids)
	f.SetCellValue(sheetName, "A6", "Winner ID")
	f.SetCellValue(sheetName, "B6", data.WinnerID)
	f.SetCellValue(sheetName, "A7", "Winner Name")
	f.SetCellValue(sheetName, "B7", data.WinnerName)
	f.SetCellValue(sheetName, "A8", "Winning Bid")
	f.SetCellValue(sheetName, "B8", data.WinningBid)
	f.SetCellValue(sheetName, "A9", "End Time")
	f.SetCellValue(sheetName, "B9", data.EndTime.Format("2006-01-02 15:04:05"))

	// Add bids sheet
	bidsSheet := "Bid History"
	f.NewSheet(bidsSheet)
	f.SetCellValue(bidsSheet, "A1", "Round")
	f.SetCellValue(bidsSheet, "B1", "Bidder ID")
	f.SetCellValue(bidsSheet, "C1", "Bidder Name")
	f.SetCellValue(bidsSheet, "D1", "Amount")
	f.SetCellValue(bidsSheet, "E1", "Timestamp")

	for i, bid := range data.BidHistory {
		row := i + 2 // Start from row 2
		f.SetCellValue(bidsSheet, fmt.Sprintf("A%d", row), bid.Round)
		f.SetCellValue(bidsSheet, fmt.Sprintf("B%d", row), bid.BidderID)
		f.SetCellValue(bidsSheet, fmt.Sprintf("C%d", row), bid.BidderName)
		f.SetCellValue(bidsSheet, fmt.Sprintf("D%d", row), bid.Amount)
		f.SetCellValue(bidsSheet, fmt.Sprintf("E%d", row), bid.Timestamp.Format("2006-01-02 15:04:05"))
	}

	// Save to buffer
	buffer, err := f.WriteToBuffer()
	if err != nil {
		s.logger.Printf("Error writing Excel to buffer: %v", err)
		return nil, fmt.Errorf("error writing Excel to buffer: %w", err)
	}

	s.logger.Printf("Successfully generated Excel report for auction %s", data.AuctionID)
	return buffer.Bytes(), nil
}
