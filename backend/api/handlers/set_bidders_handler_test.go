package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"

	"auction/api/handlers/mocks"
	"auction/internal/models"
)

// ErrorMockDB is a custom mock database that returns errors for specific methods
type ErrorMockDB struct {
	*mocks.MockDB
}

// SetBidders overrides the MockDB's SetBidders method to return an error
func (m *ErrorMockDB) SetBidders(bidders []models.Bidder) error {
	return fmt.Errorf("database error")
}

type SetBiddersTestSuite struct {
	HandlerTestSuite
}

func (suite *SetBiddersTestSuite) SetupTest() {
	suite.HandlerTestSuite.SetupTest()
	suite.router.POST("/bidders", suite.handlers.SetBidders)
}

func (suite *SetBiddersTestSuite) TestSetBiddersSuccess() {
	// Setup bidders
	bidders := []models.Bidder{
		{ID: "1", Name: "John Doe", Address: "123 Main St"},
		{ID: "2", Name: "Jane Smith", Address: "456 Oak Ave"},
	}

	// Create request body
	reqBody, _ := json.Marshal(SetBiddersRequest{Bidders: bidders})

	// Make the request
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/bidders", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	// Assert response
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response gin.H
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)

	assert.Equal(suite.T(), "Bidders updated successfully", response["message"])
	assert.Equal(suite.T(), float64(2), response["count"])
}

func (suite *SetBiddersTestSuite) TestSetBiddersEmptyList() {
	// Create request with empty bidders list
	reqBody, _ := json.Marshal(SetBiddersRequest{Bidders: []models.Bidder{}})

	// Make the request
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/bidders", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	// Assert response
	suite.AssertErrorResponse(w, http.StatusBadRequest, "At least one bidder is required")
}

func (suite *SetBiddersTestSuite) TestSetBiddersInvalidFormat() {
	// Create invalid request body
	invalidJSON := []byte(`{"bidders": "not an array"}`)

	// Make the request
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/bidders", bytes.NewBuffer(invalidJSON))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	// Assert response
	suite.AssertErrorResponse(w, http.StatusBadRequest, "Invalid request format")
}

func (suite *SetBiddersTestSuite) TestSetBiddersDBError() {
	// Create a custom mock DB that returns an error for SetBidders
	originalDB := suite.handlers.db

	// Create and set the error mock DB
	errorDB := &ErrorMockDB{MockDB: suite.mockDB}
	suite.handlers.db = errorDB

	// Setup bidders
	bidders := []models.Bidder{
		{ID: "1", Name: "John Doe", Address: "123 Main St"},
	}

	// Create request body
	reqBody, _ := json.Marshal(SetBiddersRequest{Bidders: bidders})

	// Make the request
	w := httptest.NewRecorder()
	req, _ := http.NewRequest(http.MethodPost, "/bidders", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	// Assert response
	suite.AssertErrorResponse(w, http.StatusInternalServerError, "Failed to set bidders")

	// Restore the original DB
	suite.handlers.db = originalDB
}

func TestSetBiddersHandler(t *testing.T) {
	suite.Run(t, new(SetBiddersTestSuite))
}
