package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"auction/internal/models"
)

// MockDatabase implements the database.Database interface for testing
type MockDatabase struct {
	auctions    map[string]*models.Auction
	currentAuction string
}

func NewMockDatabase() *MockDatabase {
	return &MockDatabase{
		auctions:    make(map[string]*models.Auction),
		currentAuction: "",
	}
}

func (m *MockDatabase) Close() error {
	return nil
}

func (m *MockDatabase) SaveData() error {
	return nil
}

func (m *MockDatabase) Initialize() error {
	return nil
}

func (m *MockDatabase) GetBidders() ([]models.Bidder, error) {
	if m.currentAuction != "" {
		if auction, exists := m.auctions[m.currentAuction]; exists {
			return auction.Bidders, nil
		}
	}
	return []models.Bidder{}, nil
}

func (m *MockDatabase) SetBidders(bidders []models.Bidder) error {
	if m.currentAuction != "" {
		if auction, exists := m.auctions[m.currentAuction]; exists {
			auction.Bidders = bidders
			return nil
		}
		return fmt.Errorf("current auction not found")
	}
	return fmt.Errorf("no current auction set")
}

func (m *MockDatabase) GetAllAuctions() (map[string]*models.Auction, error) {
	return m.auctions, nil
}

func (m *MockDatabase) GetAuction(id string) (*models.Auction, error) {
	auction, exists := m.auctions[id]
	if !exists {
		return nil, fmt.Errorf("auction with ID %s not found", id)
	}
	return auction, nil
}

func (m *MockDatabase) CreateAuction(auction *models.Auction) error {
	if auction == nil {
		return fmt.Errorf("cannot create nil auction")
	}

	if _, exists := m.auctions[auction.ID]; exists {
		return fmt.Errorf("auction with ID %s already exists", auction.ID)
	}

	m.auctions[auction.ID] = auction
	return nil
}

func (m *MockDatabase) UpdateAuction(id string, auction *models.Auction) error {
	if auction == nil {
		return fmt.Errorf("cannot update with nil auction")
	}

	if _, exists := m.auctions[id]; !exists {
		return fmt.Errorf("auction with ID %s not found", id)
	}

	m.auctions[id] = auction
	return nil
}

func (m *MockDatabase) DeleteAuction(id string) error {
	if _, exists := m.auctions[id]; !exists {
		return fmt.Errorf("auction with ID %s not found", id)
	}

	delete(m.auctions, id)
	return nil
}

func (m *MockDatabase) ExportAuctionData(id string) (*models.ExportData, error) {
	auction, exists := m.auctions[id]
	if !exists {
		return nil, fmt.Errorf("auction with ID %s not found", id)
	}

	if auction.AuctionStatus != "completed" {
		return nil, fmt.Errorf("cannot export data for auction that is not completed")
	}

	// Find winner information
	var winnerName string
	for _, bidder := range auction.Bidders {
		if bidder.ID == auction.HighestBidder {
			winnerName = bidder.Name
			break
		}
	}

	return &models.ExportData{
		AuctionID:     auction.ID,
		Title:         auction.Title,
		StartingPrice: auction.StartingPrice,
		PriceStep:     auction.PriceStep,
		TotalBids:     len(auction.BidHistory),
		BidHistory:    auction.BidHistory,
		WinnerID:      auction.HighestBidder,
		WinnerName:    winnerName,
		WinningBid:    auction.HighestBid,
		EndTime:       time.Now(),
	}, nil
}

// Helper function to setup test router and handlers
func setupTestRouter() (*gin.Engine, *MockDatabase) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	mockDB := NewMockDatabase()
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)
	auctionHandlers := NewAuctionHandlers(mockDB, logger)

	api := r.Group("/api/v1")
	{
		api.POST("/auctions", auctionHandlers.CreateAuction)
		api.GET("/auctions", auctionHandlers.GetAllAuctions)
		api.GET("/auctions/:id", auctionHandlers.GetAuction)
		api.GET("/auction/export/:id", auctionHandlers.ExportAuctionData)
	}

	return r, mockDB
}

// Helper function to make HTTP request and read response
func performRequest(r http.Handler, method, path string, body []byte) *httptest.ResponseRecorder {
	var req *http.Request
	if body != nil {
		req, _ = http.NewRequest(method, path, bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
	} else {
		req, _ = http.NewRequest(method, path, nil)
	}

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestCreateAuction(t *testing.T) {
	// Test valid auction creation
	t.Run("Valid auction creation", func(t *testing.T) {
		router, mockDB := setupTestRouter()

		// Create auction payload
		createRequest := CreateAuctionRequest{
			Title:         "Test Auction",
			StartingPrice: 100000,
			PriceStep:     10000,
			Bidders: []models.Bidder{
				{ID: "1", Name: "Bidder 1"},
				{ID: "2", Name: "Bidder 2"},
			},
		}

		jsonPayload, _ := json.Marshal(createRequest)

		// Make request
		w := performRequest(router, "POST", "/api/v1/auctions", jsonPayload)

		// Check response
		assert.Equal(t, http.StatusCreated, w.Code)

		// Parse response
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		// Check data
		data, ok := response["data"].(map[string]interface{})
		require.True(t, ok)
		assert.Equal(t, "Test Auction", data["title"])
		assert.Equal(t, float64(100000), data["startingPrice"])
		assert.Equal(t, float64(10000), data["priceStep"])

		// Check auction was added to mock DB
		assert.Len(t, mockDB.auctions, 1)
	})

	// Test invalid request
	t.Run("Invalid request - missing required fields", func(t *testing.T) {
		router, mockDB := setupTestRouter()

		// Create auction with missing title
		createRequest := map[string]interface{}{
			"startingPrice": 100000,
			"priceStep":     10000,
		}

		jsonPayload, _ := json.Marshal(createRequest)

		// Make request
		w := performRequest(router, "POST", "/api/v1/auctions", jsonPayload)

		// Check response
		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Len(t, mockDB.auctions, 0)
	})
}

func TestGetAllAuctions(t *testing.T) {
	// Test with multiple auctions
	t.Run("Multiple auctions", func(t *testing.T) {
		router, mockDB := setupTestRouter()

		// Add some test auctions
		auction1 := &models.Auction{
			ID:            "auction1",
			Title:         "Auction 1",
			CreatedAt:     time.Now(),
			StartingPrice: 100000,
			PriceStep:     10000,
			BidHistory:    []models.Bid{},
			CurrentRound:  0,
			AuctionStatus: "notStarted",
		}

		auction2 := &models.Auction{
			ID:            "auction2",
			Title:         "Auction 2",
			CreatedAt:     time.Now(),
			StartingPrice: 200000,
			PriceStep:     20000,
			BidHistory:    []models.Bid{},
			CurrentRound:  0,
			AuctionStatus: "inProgress",
		}

		mockDB.auctions[auction1.ID] = auction1
		mockDB.auctions[auction2.ID] = auction2

		// Make request
		w := performRequest(router, "GET", "/api/v1/auctions", nil)

		// Check response
		assert.Equal(t, http.StatusOK, w.Code)

		// Parse response
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		// Check data
		data, ok := response["data"].([]interface{})
		require.True(t, ok)
		assert.Len(t, data, 2)
	})

	// Test with no auctions
	t.Run("No auctions", func(t *testing.T) {
		router, _ := setupTestRouter()

		// Make request
		w := performRequest(router, "GET", "/api/v1/auctions", nil)

		// Check response
		assert.Equal(t, http.StatusOK, w.Code)

		// Parse response
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		// Check data - empty data is represented as an empty array
		data, ok := response["data"].([]interface{})
		if !ok {
			// If it's nil, that's also acceptable
			_, exists := response["data"]
			assert.True(t, exists, "Response should have a data field")
		} else {
			assert.Len(t, data, 0, "Data should be an empty array")
		}
	})
}

func TestGetAuction(t *testing.T) {
	// Test with valid auction ID
	t.Run("Valid auction ID", func(t *testing.T) {
		router, mockDB := setupTestRouter()

		// Add test auction
		auction := &models.Auction{
			ID:            "auction1",
			Title:         "Test Auction",
			CreatedAt:     time.Now(),
			StartingPrice: 100000,
			PriceStep:     10000,
			BidHistory:    []models.Bid{},
			CurrentRound:  0,
			AuctionStatus: "notStarted",
		}

		mockDB.auctions[auction.ID] = auction

		// Make request
		w := performRequest(router, "GET", "/api/v1/auctions/auction1", nil)

		// Check response
		assert.Equal(t, http.StatusOK, w.Code)

		// Parse response
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		// Check data
		data, ok := response["data"].(map[string]interface{})
		require.True(t, ok)
		assert.Equal(t, "auction1", data["id"])
		assert.Equal(t, "Test Auction", data["title"])
	})

	// Test with non-existent auction ID
	t.Run("Non-existent auction ID", func(t *testing.T) {
		router, _ := setupTestRouter()

		// Make request for non-existent auction
		w := performRequest(router, "GET", "/api/v1/auctions/nonexistent", nil)

		// Check response
		assert.Equal(t, http.StatusNotFound, w.Code)

		// Parse response
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		// Check error message
		assert.Contains(t, response["error"], "not found")
	})

	// Test with missing ID parameter
	t.Run("Missing ID parameter", func(t *testing.T) {
		router, _ := setupTestRouter()

		// Make request with missing ID
		w := performRequest(router, "GET", "/api/v1/auctions/", nil)

		// Check response - should be 404 or 301 (redirect) as route doesn't match
		assert.True(t, w.Code == http.StatusNotFound || w.Code == http.StatusMovedPermanently,
			"Expected either 404 Not Found or 301 Moved Permanently")
	})
}

func TestExportAuctionData(t *testing.T) {
	// Test with valid completed auction
	t.Run("Valid completed auction", func(t *testing.T) {
		router, mockDB := setupTestRouter()

		// Add completed test auction with a bidder
		bidder := models.Bidder{ID: "bidder1", Name: "Winning Bidder"}

		auction := &models.Auction{
			ID:            "auction1",
			Title:         "Completed Auction",
			CreatedAt:     time.Now().Add(-1 * time.Hour),
			StartingPrice: 100000,
			PriceStep:     10000,
			BidHistory: []models.Bid{
				{
					Round:      1,
					BidderID:   bidder.ID,
					BidderName: bidder.Name,
					Amount:     150000,
					Timestamp:  time.Now().Add(-30 * time.Minute),
				},
			},
			Bidders:       []models.Bidder{bidder},
			CurrentRound:  1,
			HighestBid:    150000,
			HighestBidder: bidder.ID,
			AuctionStatus: "completed",
		}

		mockDB.auctions[auction.ID] = auction

		// Make request
		w := performRequest(router, "GET", "/api/v1/auction/export/auction1", nil)

		// Check response status code
		assert.Equal(t, http.StatusOK, w.Code)

		// Parse response
		var response struct {
			Data models.ExportData `json:"data"`
		}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		// Perform assertions on the response data
		assert.Equal(t, "auction1", response.Data.AuctionID)
		assert.Equal(t, "Completed Auction", response.Data.Title)
		assert.Equal(t, 100000, response.Data.StartingPrice)
		assert.Equal(t, 10000, response.Data.PriceStep)
		assert.Equal(t, 1, response.Data.TotalBids)
		assert.Equal(t, "bidder1", response.Data.WinnerID)
		assert.Equal(t, "Winning Bidder", response.Data.WinnerName)
		assert.Equal(t, 150000, response.Data.WinningBid)
		assert.NotZero(t, response.Data.EndTime)
	})

	// Test with non-existent auction ID
	t.Run("Non-existent auction ID", func(t *testing.T) {
		router, _ := setupTestRouter()

		// Make request for non-existent auction
		w := performRequest(router, "GET", "/api/v1/auction/export/nonexistent", nil)

		// Check response
		assert.Equal(t, http.StatusInternalServerError, w.Code)

		// Parse response
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		// Check error message
		assert.Contains(t, response["error"], "not found")
	})

	// Test with non-completed auction
	t.Run("Non-completed auction", func(t *testing.T) {
		router, mockDB := setupTestRouter()

		// Add non-completed test auction
		auction := &models.Auction{
			ID:            "auction1",
			Title:         "In-progress Auction",
			CreatedAt:     time.Now(),
			StartingPrice: 100000,
			PriceStep:     10000,
			BidHistory:    []models.Bid{},
			CurrentRound:  0,
			AuctionStatus: "inProgress",
		}

		mockDB.auctions[auction.ID] = auction

		// Make request
		w := performRequest(router, "GET", "/api/v1/auction/export/auction1", nil)

		// Check response
		assert.Equal(t, http.StatusInternalServerError, w.Code)

		// Parse response
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		// Check error message
		assert.Contains(t, response["error"], "not completed")
	})
}
