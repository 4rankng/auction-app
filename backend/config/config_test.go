package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLoadConfigDefault(t *testing.T) {
	// Test default configuration
	config := LoadConfig()

	// Check default values
	assert.Equal(t, "8080", config.Server.Port, "Default port should be 8080")
	assert.Equal(t, "data", config.Database.DataDir, "Default data directory should be 'data'")
	assert.Equal(t, "auction_data.json", config.Database.DataFile, "Default data file should be 'auction_data.json'")

	// Check CORS defaults
	assert.Contains(t, config.CORS.AllowOrigins, "http://localhost:3000", "Default CORS origin should include localhost:3000")
	assert.Contains(t, config.CORS.AllowMethods, "GET", "CORS methods should include GET")
	assert.Contains(t, config.CORS.AllowHeaders, "Content-Type", "CORS headers should include Content-Type")

	// Check rate limit defaults
	assert.Equal(t, 100, config.RateLimit.MaxRequests, "Default max requests should be 100")
}

func TestLoadConfigWithEnv(t *testing.T) {
	// Set environment variables
	oldPort := os.Getenv("PORT")
	oldDataDir := os.Getenv("DATA_DIR")
	oldDataFile := os.Getenv("DATA_FILE")
	oldCorsOrigin := os.Getenv("CORS_ORIGIN")

	// Restore original environment variables after the test
	defer func() {
		os.Setenv("PORT", oldPort)
		os.Setenv("DATA_DIR", oldDataDir)
		os.Setenv("DATA_FILE", oldDataFile)
		os.Setenv("CORS_ORIGIN", oldCorsOrigin)
	}()

	// Set test environment variables
	os.Setenv("PORT", "9000")
	os.Setenv("DATA_DIR", "test_data")
	os.Setenv("DATA_FILE", "test_auction_data.json")
	os.Setenv("CORS_ORIGIN", "https://test.example.com")

	// Get config with environment variables
	config := LoadConfig()

	// Check values from environment
	assert.Equal(t, "9000", config.Server.Port, "Port should be from environment variable")
	assert.Equal(t, "test_data", config.Database.DataDir, "Data directory should be from environment variable")
	assert.Equal(t, "test_auction_data.json", config.Database.DataFile, "Data file should be from environment variable")
	assert.Contains(t, config.CORS.AllowOrigins, "https://test.example.com", "CORS origin should be from environment variable")
}

func TestGetEnv(t *testing.T) {
	// Test with environment variable set
	os.Setenv("TEST_VAR", "test_value")
	assert.Equal(t, "test_value", getEnv("TEST_VAR", "default_value"), "Should return environment variable value")

	// Test with environment variable not set
	os.Unsetenv("TEST_VAR")
	assert.Equal(t, "default_value", getEnv("TEST_VAR", "default_value"), "Should return default value")

	// Test with empty environment variable
	os.Setenv("TEST_VAR", "")
	assert.Equal(t, "default_value", getEnv("TEST_VAR", "default_value"), "Should return default value for empty env var")
}
