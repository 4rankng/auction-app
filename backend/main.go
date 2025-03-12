package main

import (
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"auction/api/handlers"
	"auction/internal/database"
	"auction/internal/services"
)

type App struct {
	router *gin.Engine
	db     database.Database
	logger *log.Logger
}

func NewApp() (*App, error) {
	// Set up logger
	logger := log.New(os.Stdout, "[AUCTION] ", log.LstdFlags)

	// Create data directory if it doesn't exist
	dataDir := "data"
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, err
	}

	// Initialize TinyDB (JSON file-based database)
	db, err := database.NewTinyDB(dataDir, logger)
	if err != nil {
		return nil, err
	}

	// Initialize database with default data if needed
	if err := db.Initialize(); err != nil {
		return nil, err
	}

	// Create router
	router := gin.Default()

	// Configure CORS - Allow specific origins with credentials
	config := cors.Config{
		AllowOrigins:     []string{"http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:8080"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	router.Use(cors.New(config))

	return &App{
		router: router,
		db:     db,
		logger: logger,
	}, nil
}

func (a *App) Initialize() error {
	// Initialize services
	excelService := services.NewExcelService(a.logger)

	// Create API handlers
	auctionHandlers := handlers.NewAuctionHandlers(a.db, a.logger)
	bidderHandlers := handlers.NewBidderHandlers(a.db, a.logger, excelService)

	// Group API routes
	api := a.router.Group("/api/v1")
	{
		// Multi-auction routes
		api.POST("/auctions", auctionHandlers.CreateAuction)
		api.GET("/auctions", auctionHandlers.GetAllAuctions)
		api.GET("/auctions/:id", auctionHandlers.GetAuction)
		api.GET("/auction/export/:id", auctionHandlers.ExportAuctionData)
		api.PUT("/auctions/:id/start", auctionHandlers.StartAuction)
		api.PUT("/auctions/:id/end", auctionHandlers.EndAuction)

		// Bidder routes
		api.GET("/bidders", bidderHandlers.GetBidders)
		api.POST("/bidders", bidderHandlers.AddBidder)
		api.PUT("/bidders", bidderHandlers.SetBidders)
		api.DELETE("/bidders/:id", bidderHandlers.DeleteBidder)
		api.POST("/bidders/import", bidderHandlers.UploadExcelFile)
	}

	return nil
}

func (a *App) Run() error {
	return a.router.Run(":8080")
}

func (a *App) Close() error {
	return a.db.Close()
}

func main() {
	app, err := NewApp()
	if err != nil {
		log.Fatal(err)
	}
	defer app.Close()

	if err := app.Initialize(); err != nil {
		log.Fatal(err)
	}

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
