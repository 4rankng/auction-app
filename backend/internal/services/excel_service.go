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
	ProcessExcelFile(file io.Reader) ([]models.Bidder, error)
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

// ProcessExcelFile processes an Excel file and extracts bidder information
func (s *excelService) ProcessExcelFile(file io.Reader) ([]models.Bidder, error) {
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
