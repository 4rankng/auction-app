package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"auction/internal/models"
)

// ExportAuctionData exports auction data to Excel format
func (h *Handlers) ExportAuctionData(c *gin.Context) {
	// Get auction ID from path parameter
	auctionID := c.Param("id")
	if auctionID == "" {
		h.logger.Printf("Error: Auction ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Auction ID is required"})
		return
	}

	h.logger.Printf("Exporting auction data for auction: %s", auctionID)

	// Get export data from database
	exportData, err := h.db.ExportAuctionData(auctionID)
	if err != nil {
		if _, ok := err.(*models.ErrorNotFound); ok {
			h.logger.Printf("Error: Auction not found: %s", auctionID)
			c.JSON(http.StatusNotFound, gin.H{"error": "Auction not found"})
			return
		}
		h.logger.Printf("Error retrieving export data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve export data"})
		return
	}

	// Generate Excel file using the service
	excelData, err := h.excelService.GenerateAuctionReport(exportData)
	if err != nil {
		h.logger.Printf("Error generating Excel report: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate Excel report"})
		return
	}

	// Set headers for file download
	fileName := "auction_" + auctionID + "_report.xlsx"
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", "attachment; filename="+fileName)
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Header("Cache-Control", "no-cache")

	// Write file to response
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", excelData)

	h.logger.Printf("Successfully exported auction data for auction %s", auctionID)
}
