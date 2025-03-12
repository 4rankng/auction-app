package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// HeartbeatResponse represents the response from the heartbeat endpoint
type HeartbeatResponse struct {
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
	Version   string    `json:"version"`
}

// Heartbeat handles health check requests
// It returns a 200 OK response with basic service information to indicate the API is up and running
func (h *Handlers) Heartbeat(c *gin.Context) {
	h.logger.Printf("Heartbeat check received")

	// Create the response
	response := HeartbeatResponse{
		Status:    "ok",
		Timestamp: time.Now(),
		Version:   "1.0.0", // You can update this with your actual version
	}

	c.JSON(http.StatusOK, response)
}
