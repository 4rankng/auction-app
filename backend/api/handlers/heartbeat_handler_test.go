package handlers

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

// HeartbeatTestSuite is a test suite for the Heartbeat handler
type HeartbeatTestSuite struct {
	HandlerTestSuite
}

// SetupTest sets up the test suite
func (suite *HeartbeatTestSuite) SetupTest() {
	suite.HandlerTestSuite.SetupTest()
	suite.router.GET("/health", suite.handlers.Heartbeat)
}

// TestHeartbeat tests the heartbeat endpoint
func (suite *HeartbeatTestSuite) TestHeartbeat() {
	// Make the request
	w := suite.MakeRequest(http.MethodGet, "/health", nil)

	// Check the response
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response HeartbeatResponse
	suite.ParseResponse(w, &response)

	// Verify the response data
	assert.Equal(suite.T(), "ok", response.Status)
	assert.NotEmpty(suite.T(), response.Timestamp)
	assert.Equal(suite.T(), "1.0.0", response.Version)
}

// TestHeartbeatSuite runs the test suite
func TestHeartbeatSuite(t *testing.T) {
	suite.Run(t, new(HeartbeatTestSuite))
}
