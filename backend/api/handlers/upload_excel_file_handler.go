package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// UploadExcelFile handles the upload of an Excel file containing bidder data
func (h *Handlers) UploadExcelFile(c *gin.Context) {
	h.logger.Printf("Processing Excel file upload")

	// Get the file from the request
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		h.logger.Printf("Error getting file from request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded or invalid form"})
		return
	}
	defer file.Close()

	// Check file size (limit to 10MB)
	if header.Size > 10*1024*1024 {
		h.logger.Printf("File too large: %d bytes", header.Size)
		c.JSON(http.StatusBadRequest, gin.H{"error": "File too large (max 10MB)"})
		return
	}

	// Check file extension
	if !isExcelFile(header.Filename) {
		h.logger.Printf("Invalid file type: %s", header.Filename)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only Excel files (.xlsx, .xls) are allowed"})
		return
	}

	h.logger.Printf("Processing Excel file: %s (%d bytes)", header.Filename, header.Size)

	// Parse Excel file to extract bidders
	bidders, err := h.excelService.GetBiddersFromExcelFile(file)
	if err != nil {
		h.logger.Printf("Error parsing Excel file: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse Excel file: " + err.Error()})
		return
	}

	if len(bidders) == 0 {
		h.logger.Printf("No bidders found in Excel file")
		c.JSON(http.StatusBadRequest, gin.H{"error": "No bidders found in Excel file"})
		return
	}

	// Update bidders in database
	if err := h.db.SetBidders(bidders); err != nil {
		h.logger.Printf("Error setting bidders: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set bidders"})
		return
	}

	// Try to persist data to storage
	if err := h.db.SaveData(); err != nil {
		h.logger.Printf("Warning: Failed to persist data: %v", err)
		// Continue execution despite the error
	}

	h.logger.Printf("Successfully imported %d bidders from Excel file", len(bidders))

	// Return success response
	c.JSON(http.StatusOK, gin.H{
		"message":     "Bidders imported successfully",
		"bidderCount": len(bidders),
	})
}

// isExcelFile checks if the filename has an Excel extension
func isExcelFile(filename string) bool {
	// Check if the file has an Excel extension (.xlsx or .xls)
	if len(filename) < 4 {
		return false
	}

	if len(filename) >= 5 && filename[len(filename)-5:] == ".xlsx" {
		return true
	}

	if len(filename) >= 4 && filename[len(filename)-4:] == ".xls" {
		return true
	}

	return false
}
