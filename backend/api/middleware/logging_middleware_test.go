package middleware

import (
	"bytes"
	"log"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestLoggingMiddleware(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Create a buffer to capture log output
	var buf bytes.Buffer
	logger := log.New(&buf, "", log.LstdFlags)

	// Create a new Gin engine
	r := gin.New()

	// Add the middleware
	r.Use(LoggingMiddleware(logger))

	// Add a test route
	r.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "OK")
	})

	// Create a test request
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("User-Agent", "test-agent")

	// Create a response recorder
	w := httptest.NewRecorder()

	// Serve the request
	r.ServeHTTP(w, req)

	// Check the response
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "OK", w.Body.String())

	// Check the log output
	logOutput := buf.String()
	assert.Contains(t, logOutput, "Request: GET /test")
	assert.Contains(t, logOutput, "Response: GET /test - 200")
}

func TestLoggingMiddlewareWithQueryParams(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Create a buffer to capture log output
	var buf bytes.Buffer
	logger := log.New(&buf, "", log.LstdFlags)

	// Create a new Gin engine
	r := gin.New()

	// Add the middleware
	r.Use(LoggingMiddleware(logger))

	// Add a test route
	r.GET("/api/test", func(c *gin.Context) {
		id := c.Query("id")
		c.String(http.StatusOK, "ID: "+id)
	})

	// Create a test request
	req := httptest.NewRequest("GET", "/api/test?id=123", nil)

	// Create a response recorder
	w := httptest.NewRecorder()

	// Serve the request
	r.ServeHTTP(w, req)

	// Check the response
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "ID: 123", w.Body.String())

	// Check the log output
	logOutput := buf.String()
	assert.Contains(t, logOutput, "Request: GET /api/test?id=123")
	assert.Contains(t, logOutput, "Response: GET /api/test - 200")
}

func TestRecoveryMiddleware(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Create a buffer to capture log output
	var buf bytes.Buffer
	logger := log.New(&buf, "", log.LstdFlags)

	// Create a new Gin engine
	r := gin.New()

	// Add the middleware
	r.Use(RecoveryMiddleware(logger))

	// Add a test route that panics
	r.GET("/panic", func(c *gin.Context) {
		panic("test panic")
	})

	// Create a test request
	req := httptest.NewRequest("GET", "/panic", nil)

	// Create a response recorder
	w := httptest.NewRecorder()

	// Serve the request
	r.ServeHTTP(w, req)

	// Check the response
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	// Check the log output
	logOutput := buf.String()
	assert.Contains(t, logOutput, "Panic recovered: test panic")
	assert.Contains(t, logOutput, "Stack trace:")
}
