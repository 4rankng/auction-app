package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestCORSMiddleware(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Create a new Gin engine
	r := gin.New()

	// Configure CORS
	config := cors.Config{
		AllowOrigins:     []string{"http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:8080"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	r.Use(cors.New(config))

	// Add a test route
	r.GET("/test", func(c *gin.Context) {
		c.String(http.StatusOK, "OK")
	})

	tests := []struct {
		name           string
		method         string
		origin         string
		expectedStatus int
		expectedHeader map[string]string
	}{
		{
			name:           "OPTIONS request from allowed origin",
			method:         "OPTIONS",
			origin:         "http://localhost:5500",
			expectedStatus: http.StatusNoContent,
			expectedHeader: map[string]string{
				"Access-Control-Allow-Origin":      "http://localhost:5500",
				"Access-Control-Allow-Methods":     "GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS",
				"Access-Control-Allow-Credentials": "true",
			},
		},
		{
			name:           "GET request from allowed origin",
			method:         "GET",
			origin:         "http://127.0.0.1:5500",
			expectedStatus: http.StatusOK,
			expectedHeader: map[string]string{
				"Access-Control-Allow-Origin":      "http://127.0.0.1:5500",
				"Access-Control-Allow-Credentials": "true",
			},
		},
		{
			name:           "Request from disallowed origin",
			method:         "GET",
			origin:         "http://example.com",
			expectedStatus: http.StatusOK, // Request still succeeds but CORS headers won't allow access
			expectedHeader: map[string]string{
				"Access-Control-Allow-Origin": "",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create request
			req := httptest.NewRequest(tt.method, "/test", nil)
			if tt.origin != "" {
				req.Header.Set("Origin", tt.origin)
			}

			// Create response recorder
			w := httptest.NewRecorder()

			// Serve the request
			r.ServeHTTP(w, req)

			// Check status code
			assert.Equal(t, tt.expectedStatus, w.Code)

			// Check headers
			for key, expectedValue := range tt.expectedHeader {
				assert.Equal(t, expectedValue, w.Header().Get(key))
			}
		})
	}
}
