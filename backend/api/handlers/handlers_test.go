package handlers

import (
	"auction/api/handlers/mocks"
	"auction/internal/models"
	"auction/internal/services"
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/suite"
)

// HandlerTestSuite provides a reusable test suite for handler tests
type HandlerTestSuite struct {
	suite.Suite
	handlers *Handlers
	mockDB   *mocks.MockDB
	router   *gin.Engine
	logger   *log.Logger
}

// SetupSuite is run once before all tests
func (suite *HandlerTestSuite) SetupSuite() {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Create a logger that writes to a buffer (could also use io.Discard)
	suite.logger = log.New(os.Stdout, "[TEST] ", log.LstdFlags)
}

// SetupTest is run before each test
func (suite *HandlerTestSuite) SetupTest() {
	// Create a new mock database
	suite.mockDB = mocks.NewMockDB()

	// Create a new excel service
	excelService := services.NewExcelService(suite.logger)

	// Create handlers with mock DB
	suite.handlers = NewHandlers(suite.mockDB, suite.logger, excelService)

	// Setup the router
	suite.router = gin.New()
}

// TearDownTest is run after each test
func (suite *HandlerTestSuite) TearDownTest() {
	// Clean up any resources
}

// CreateTestAuction helper to create an auction for testing
func (suite *HandlerTestSuite) CreateTestAuction(id string) *models.Auction {
	auction := &models.Auction{
		ID:            id,
		Title:         "Test Auction " + id,
		StartingPrice: 100,
		PriceStep:     10,
		Bidders: []models.Bidder{
			{ID: "bidder1", Name: "Bidder One"},
			{ID: "bidder2", Name: "Bidder Two"},
		},
		BidHistory:    []models.Bid{},
		HighestBid:    0,
		HighestBidder: "",
	}

	err := suite.mockDB.CreateAuction(auction)
	suite.NoError(err)

	return auction
}

// MakeRequest sends a test request and returns the response recorder
func (suite *HandlerTestSuite) MakeRequest(method, path string, body interface{}) *httptest.ResponseRecorder {
	var reqBody *bytes.Buffer

	if body != nil {
		jsonData, err := json.Marshal(body)
		suite.NoError(err)
		reqBody = bytes.NewBuffer(jsonData)
	} else {
		reqBody = bytes.NewBuffer(nil)
	}

	req, err := http.NewRequest(method, path, reqBody)
	suite.NoError(err)

	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)
	return w
}

// ParseResponse parses a JSON response into the given struct
func (suite *HandlerTestSuite) ParseResponse(w *httptest.ResponseRecorder, target interface{}) {
	err := json.Unmarshal(w.Body.Bytes(), target)
	suite.NoError(err)
}

// AssertErrorResponse checks if the response contains the expected error message
func (suite *HandlerTestSuite) AssertErrorResponse(w *httptest.ResponseRecorder, expectedCode int, expectedError string) {
	suite.Equal(expectedCode, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	suite.NoError(err)

	errorMsg, exists := response["error"]
	suite.True(exists)
	suite.Equal(expectedError, errorMsg)
}

// RunHandlerTestSuite runs the handler test suite
func RunHandlerTestSuite(t *testing.T, tests ...suite.TestingSuite) {
	for i, test := range tests {
		suite.Run(t, test)
		// Give each test suite a unique name in logs
		t.Logf("Completed test suite %d of %d", i+1, len(tests))
	}
}

// A simple example test that uses the suite
func TestExample(t *testing.T) {
	suite.Run(t, new(HandlerTestSuite))
}
