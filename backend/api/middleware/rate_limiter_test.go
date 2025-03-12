package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestRateLimiterMiddleware(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Create a new Gin engine
	r := gin.New()

	// Add the rate limiter middleware with a limit of 2 requests per second
	r.Use(RateLimiterMiddleware(2, time.Second))

	// Add a test route
	r.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "OK")
	})

	// Create a test request
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Forwarded-For", "127.0.0.1") // Set IP for rate limiting

	// First request should succeed
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req)
	assert.Equal(t, http.StatusOK, w1.Code)
	assert.Equal(t, "OK", w1.Body.String())

	// Second request should succeed
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req)
	assert.Equal(t, http.StatusOK, w2.Code)
	assert.Equal(t, "OK", w2.Body.String())

	// Third request should be rate limited
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req)
	assert.Equal(t, http.StatusTooManyRequests, w3.Code)
	assert.Contains(t, w3.Body.String(), "Rate limit exceeded")
}

func TestRateLimiterMiddlewareWithDifferentIPs(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Create a new Gin engine
	r := gin.New()

	// Add the rate limiter middleware with a limit of 1 request per second
	r.Use(RateLimiterMiddleware(1, time.Second))

	// Add a test route
	r.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "OK")
	})

	// Create a test request for IP1
	req1 := httptest.NewRequest("GET", "/test", nil)
	req1.Header.Set("X-Forwarded-For", "192.168.1.1")

	// Create a test request for IP2
	req2 := httptest.NewRequest("GET", "/test", nil)
	req2.Header.Set("X-Forwarded-For", "192.168.1.2")

	// First request from IP1 should succeed
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)
	assert.Equal(t, http.StatusOK, w1.Code)

	// Second request from IP1 should be rate limited
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req1)
	assert.Equal(t, http.StatusTooManyRequests, w2.Code)

	// First request from IP2 should succeed (different IP)
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req2)
	assert.Equal(t, http.StatusOK, w3.Code)
}
