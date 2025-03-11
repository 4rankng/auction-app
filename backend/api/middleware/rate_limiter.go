package middleware

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ulule/limiter/v3"
	"github.com/ulule/limiter/v3/drivers/store/memory"
)

// RateLimiterMiddleware creates a middleware for rate limiting
func RateLimiterMiddleware(maxRequests int, period time.Duration) gin.HandlerFunc {
	rate := limiter.Rate{
		Period: period,
		Limit:  int64(maxRequests),
	}

	store := memory.NewStore()
	instance := limiter.New(store, rate)

	return func(c *gin.Context) {
		ip := c.ClientIP()
		limiterCtx, err := instance.Get(c, ip)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Error checking rate limit",
			})
			c.Abort()
			return
		}

		if limiterCtx.Reached {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Rate limit exceeded",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
