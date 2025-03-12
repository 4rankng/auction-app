package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"

	"auction/api/handlers/mocks"
	"auction/internal/models"
)

// UploadExcelFileTestSuite is a test suite for the UploadExcelFile handler
type UploadExcelFileTestSuite struct {
	HandlerTestSuite
}

// SetupTest sets up the test suite
func (suite *UploadExcelFileTestSuite) SetupTest() {
	suite.HandlerTestSuite.SetupTest()
	suite.router.POST("/upload", suite.handlers.UploadExcelFile)
}

// createMultipartRequest creates a multipart form request with a file
func createMultipartRequest(fieldName, fileName string, fileContent []byte) (*http.Request, error) {
	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile(fieldName, fileName)
	if err != nil {
		return nil, err
	}

	_, err = io.Copy(part, bytes.NewReader(fileContent))
	if err != nil {
		return nil, err
	}

	err = writer.Close()
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", "/upload", body)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())
	return req, nil
}

// TestUploadExcelFileNoFile tests uploading without a file
func (suite *UploadExcelFileTestSuite) TestUploadExcelFileNoFile() {
	// Make a request without a file
	req, _ := http.NewRequest("POST", "/upload", nil)
	req.Header.Set("Content-Type", "multipart/form-data")

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusBadRequest, "No file uploaded or invalid form")
}

// TestUploadExcelFileInvalidType tests uploading a non-Excel file
func (suite *UploadExcelFileTestSuite) TestUploadExcelFileInvalidType() {
	// Create a text file
	fileContent := []byte("This is not an Excel file")
	req, err := createMultipartRequest("file", "test.txt", fileContent)
	assert.NoError(suite.T(), err)

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusBadRequest, "Only Excel files (.xlsx, .xls) are allowed")
}

// MockExcelService is a mock implementation of the Excel service
type MockExcelService struct {
	bidders []models.Bidder
	err     error
}

// GetBiddersFromExcelFile returns the mock bidders
func (m *MockExcelService) GetBiddersFromExcelFile(file io.Reader) ([]models.Bidder, error) {
	return m.bidders, m.err
}

// GenerateAuctionReport is a mock implementation
func (m *MockExcelService) GenerateAuctionReport(data *models.ExportData) ([]byte, error) {
	return []byte("mock report"), nil
}

// TestUploadExcelFileEmptyFile tests uploading an Excel file with no bidders
func (suite *UploadExcelFileTestSuite) TestUploadExcelFileEmptyFile() {
	// Save the original service
	originalService := suite.handlers.excelService

	// Replace with mock service that returns empty bidders
	mockService := &MockExcelService{bidders: []models.Bidder{}}
	suite.handlers.excelService = mockService

	// Create an Excel file
	fileContent := []byte("dummy excel content")
	req, err := createMultipartRequest("file", "test.xlsx", fileContent)
	assert.NoError(suite.T(), err)

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusBadRequest, "No bidders found in Excel file")

	// Restore the original service
	suite.handlers.excelService = originalService
}

// TestUploadExcelFileSuccess tests a successful Excel file upload
func (suite *UploadExcelFileTestSuite) TestUploadExcelFileSuccess() {
	// Save the original service
	originalService := suite.handlers.excelService

	// Replace with mock service that returns bidders
	mockService := &MockExcelService{
		bidders: []models.Bidder{
			{ID: "1", Name: "John Doe", Address: "123 Main St"},
			{ID: "2", Name: "Jane Smith", Address: "456 Oak Ave"},
		},
	}
	suite.handlers.excelService = mockService

	// Create an Excel file
	fileContent := []byte("dummy excel content")
	req, err := createMultipartRequest("file", "test.xlsx", fileContent)
	assert.NoError(suite.T(), err)

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	// Check the response
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response gin.H
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)

	assert.Equal(suite.T(), "Bidders imported successfully", response["message"])
	assert.Equal(suite.T(), float64(2), response["bidderCount"])

	// Restore the original service
	suite.handlers.excelService = originalService
}

// TestUploadExcelFileDBError tests a database error during upload
type ErrorMockDBForUpload struct {
	*mocks.MockDB
}

func (m *ErrorMockDBForUpload) SetBidders(bidders []models.Bidder) error {
	return fmt.Errorf("database error")
}

func (suite *UploadExcelFileTestSuite) TestUploadExcelFileDBError() {
	// Save the original service and DB
	originalService := suite.handlers.excelService
	originalDB := suite.handlers.db

	// Replace with mock service that returns bidders
	mockService := &MockExcelService{
		bidders: []models.Bidder{
			{ID: "1", Name: "John Doe", Address: "123 Main St"},
			{ID: "2", Name: "Jane Smith", Address: "456 Oak Ave"},
		},
	}
	suite.handlers.excelService = mockService

	// Replace with mock DB that returns an error
	suite.handlers.db = &ErrorMockDBForUpload{MockDB: suite.mockDB}

	// Create an Excel file
	fileContent := []byte("dummy excel content")
	req, err := createMultipartRequest("file", "test.xlsx", fileContent)
	assert.NoError(suite.T(), err)

	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	// Check the response
	suite.AssertErrorResponse(w, http.StatusInternalServerError, "Failed to set bidders")

	// Restore the original service and DB
	suite.handlers.excelService = originalService
	suite.handlers.db = originalDB
}

// TestIsExcelFile tests the isExcelFile function
func (suite *UploadExcelFileTestSuite) TestIsExcelFile() {
	// Test valid Excel files
	assert.True(suite.T(), isExcelFile("test.xlsx"))
	assert.True(suite.T(), isExcelFile("test.xls"))
	assert.True(suite.T(), isExcelFile("a.xlsx"))
	assert.True(suite.T(), isExcelFile("a.xls"))

	// Test invalid files
	assert.False(suite.T(), isExcelFile("test.txt"))
	assert.False(suite.T(), isExcelFile("test.csv"))
	assert.False(suite.T(), isExcelFile("test"))
}

// TestUploadExcelFileSuite runs the test suite
func TestUploadExcelFileSuite(t *testing.T) {
	suite.Run(t, new(UploadExcelFileTestSuite))
}
