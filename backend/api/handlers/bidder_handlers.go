package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"auction/internal/database"
	"auction/internal/models"
	"auction/internal/services"
)

type BidderHandlers struct {
	db           database.Database
	logger       *log.Logger
	excelService services.ExcelService
}

func NewBidderHandlers(db database.Database, logger *log.Logger, excelService services.ExcelService) *BidderHandlers {
	return &BidderHandlers{
		db:           db,
		logger:       logger,
		excelService: excelService,
	}
}

// GetBidders returns all bidders
func (h *BidderHandlers) GetBidders(c *gin.Context) {
	// Log request
	h.logger.Printf("Received request to get bidders")

	bidders, err := h.db.GetBidders()
	if err != nil {
		h.logger.Printf("Error getting bidders: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get bidders"})
		return
	}

	// Only log the count, not the full details
	if len(bidders) == 0 {
		h.logger.Printf("No bidders found")
	} else {
		h.logger.Printf("Found %d bidders", len(bidders))
	}

	c.JSON(http.StatusOK, gin.H{
		"data": bidders,
		"count": len(bidders),
	})
}

// AddBidder adds a new bidder
func (h *BidderHandlers) AddBidder(c *gin.Context) {
	var request struct {
		Name    string `json:"name" binding:"required"`
		ID      string `json:"id" binding:"required"`
		Address string `json:"address"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		h.logger.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	bidders, err := h.db.GetBidders()
	if err != nil {
		h.logger.Printf("Error getting bidders: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get bidders"})
		return
	}

	// Validate required fields
	if request.Name == "" || request.Address == "" {
		h.logger.Printf("Missing required fields: name or address")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name and Address are required fields"})
		return
	}

	// Auto-generate ID if not provided or empty
	if request.ID == "" {
		nextID := 1
		for _, p := range bidders {
			if id, err := strconv.Atoi(p.ID); err == nil {
				if id >= nextID {
					nextID = id + 1
				}
			}
		}
		request.ID = strconv.Itoa(nextID)
	}

	bidders = append(bidders, models.Bidder{
		ID:      request.ID,
		Name:    request.Name,
		Address: request.Address,
	})

	if err := h.db.SetBidders(bidders); err != nil {
		h.logger.Printf("Error saving bidder: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save bidder"})
		return
	}

	if err := h.db.SaveData(); err != nil {
		h.logger.Printf("Error saving data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save data"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data":    request,
		"message": "Bidder added successfully",
	})
}

// DeleteBidder deletes a bidder by ID
func (h *BidderHandlers) DeleteBidder(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		h.logger.Printf("Error: No bidder ID provided")
		c.JSON(http.StatusBadRequest, gin.H{"error": "No bidder ID provided"})
		return
	}

	bidders, err := h.db.GetBidders()
	if err != nil {
		h.logger.Printf("Error getting bidders: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get bidders"})
		return
	}

	var newBidders []models.Bidder
	found := false

	for _, p := range bidders {
		if p.ID != id {
			newBidders = append(newBidders, p)
		} else {
			found = true
		}
	}

	if !found {
		h.logger.Printf("Bidder not found: %s", id)
		c.JSON(http.StatusNotFound, gin.H{"error": "Bidder not found"})
		return
	}

	if err := h.db.SetBidders(newBidders); err != nil {
		h.logger.Printf("Error setting bidders: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update bidders"})
		return
	}

	if err := h.db.SaveData(); err != nil {
		h.logger.Printf("Error saving data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Bidder deleted successfully"})
}

// UploadExcelFile processes an uploaded Excel file and extracts bidder information
func (h *BidderHandlers) UploadExcelFile(c *gin.Context) {
	// Log headers for debugging
	h.logger.Printf("Content-Type: %s", c.GetHeader("Content-Type"))
	h.logger.Printf("Processing file upload request")

	// Check content type
	contentType := c.GetHeader("Content-Type")
	if !strings.Contains(contentType, "multipart/form-data") {
		h.logger.Printf("Invalid Content-Type: %s, expected multipart/form-data", contentType)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request Content-Type must be multipart/form-data"})
		return
	}

	// Get file from request
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		h.logger.Printf("No file uploaded or error getting file: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded or invalid file"})
		return
	}
	defer file.Close()

	h.logger.Printf("File uploaded: %s, size: %d bytes", header.Filename, header.Size)

	// Step 1: Process Excel file to get list of bidders
	bidders, err := h.excelService.ProcessExcelFile(file)
	if err != nil {
		h.logger.Printf("Error processing Excel file: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Failed to process Excel file: %v", err)})
		return
	}

	if len(bidders) == 0 {
		h.logger.Printf("No bidders found in Excel file")
		c.JSON(http.StatusBadRequest, gin.H{"error": "No bidders found in Excel file"})
		return
	}

	h.logger.Printf("Parsed %d bidders from Excel file", len(bidders))

	// Step 2: Initiate goroutine to save the list of bidders in db
	go func() {
		// Use a context with timeout for database operations
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		// Set bidders with timeout check
		select {
		case <-ctx.Done():
			h.logger.Printf("Database set operation timed out")
			return
		default:
			if err := h.db.SetBidders(bidders); err != nil {
				h.logger.Printf("Error setting bidders: %v", err)
				return
			}
		}

		// Save data with timeout check
		select {
		case <-ctx.Done():
			h.logger.Printf("Database save operation timed out")
			return
		default:
			if err := h.db.SaveData(); err != nil {
				h.logger.Printf("Error saving data: %v", err)
				return
			}
		}

		h.logger.Printf("Successfully saved %d bidders to database", len(bidders))
	}()

	// Step 3: Include bidders into JSON response and return to client immediately
	h.logger.Printf("Returning response with %d entries", len(bidders))
	c.JSON(http.StatusOK, gin.H{
		"message": "File processed successfully",
		"data": bidders,
		"count": len(bidders),
	})
}

// SetBidders replaces all bidders with a new list
func (h *BidderHandlers) SetBidders(c *gin.Context) {
	var request struct {
		Bidders []models.Bidder `json:"bidders" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		h.logger.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// No need to get existing bidders since we're replacing them all
	if err := h.db.SetBidders(request.Bidders); err != nil {
		h.logger.Printf("Error setting bidders: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update bidders"})
		return
	}

	if err := h.db.SaveData(); err != nil {
		h.logger.Printf("Error saving data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Bidders set successfully",
		"data": request.Bidders,
	})
}
