package middleware

import (
	"log"
	"runtime/debug"
	"time"

	"github.com/gin-gonic/gin"
)

// LoggingMiddleware logs HTTP requests and responses
func LoggingMiddleware(logger *log.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		rawQuery := c.Request.URL.RawQuery

		logger.Printf("Request: %s %s%s", c.Request.Method, path, func() string {
			if rawQuery != "" {
				return "?" + rawQuery
			}
			return ""
		}())

		// Process request
		c.Next()

		// After request
		latency := time.Since(start)
		logger.Printf("Response: %s %s - %d in %v",
			c.Request.Method, path, c.Writer.Status(), latency)
	}
}

// RecoveryMiddleware recovers from panics
func RecoveryMiddleware(logger *log.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				logger.Printf("Panic recovered: %v\nStack trace: %s", err, debug.Stack())
				c.AbortWithStatus(500)
			}
		}()
		c.Next()
	}
}
