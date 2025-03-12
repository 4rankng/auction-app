package config

import (
	"os"
	"time"
)

// Config holds all configuration settings
type Config struct {
	Server    ServerConfig
	Database  DatabaseConfig
	CORS      CORSConfig
	RateLimit RateLimitConfig
}

// ServerConfig holds server-related settings
type ServerConfig struct {
	Port string
}

// DatabaseConfig holds database-related settings
type DatabaseConfig struct {
	DataDir  string
	DataFile string
}

// CORSConfig holds CORS-related settings
type CORSConfig struct {
	AllowOrigins []string
	AllowMethods []string
	AllowHeaders []string
}

// RateLimitConfig holds rate limiting settings
type RateLimitConfig struct {
	MaxRequests int
	Period      time.Duration
}

// LoadConfig loads configuration from environment variables
func LoadConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Port: getEnv("PORT", "8080"),
		},
		Database: DatabaseConfig{
			DataDir:  getEnv("DATA_DIR", "data"),
			DataFile: getEnv("DATA_FILE", "auction_data.json"),
		},
		CORS: CORSConfig{
			AllowOrigins: []string{getEnv("CORS_ORIGIN", "http://localhost:3000")},
			AllowMethods: []string{"GET", "POST", "DELETE", "OPTIONS", "PUT"},
			AllowHeaders: []string{"Origin", "Content-Type"},
		},
		RateLimit: RateLimitConfig{
			MaxRequests: 100,              // 100 requests
			Period:      60 * time.Second, // per minute
		},
	}
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
