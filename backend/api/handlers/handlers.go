package handlers

import (
	"log"

	"auction/internal/database"
	"auction/internal/services"
)

// Handlers centralizes all API handlers with shared dependencies
type Handlers struct {
	db           database.Database
	logger       *log.Logger
	excelService services.ExcelService
}

// NewHandlers creates a new Handlers instance with all dependencies
func NewHandlers(db database.Database, logger *log.Logger, excelService services.ExcelService) *Handlers {
	return &Handlers{
		db:           db,
		logger:       logger,
		excelService: excelService,
	}
}
