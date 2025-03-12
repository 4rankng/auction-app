.PHONY: all build run test test-coverage test-html test-race test-verbose clean help fmt lint deps

# Default target
all: help

# Binary name
BINARY_NAME=auction-server

# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GORUN=$(GOCMD) run
GOFMT=$(GOCMD) fmt

# Main package path
MAIN_PACKAGE=.

# Current version
VERSION?=$(shell git describe --tags --always --dirty 2>/dev/null || echo "unknown")
BUILD_TIME=$(shell date -u '+%Y-%m-%d_%H:%M:%S')

# Build flags
LDFLAGS=-ldflags "-X main.Version=$(VERSION) -X main.BuildTime=$(BUILD_TIME)"

# Build the application
build:
	$(GOBUILD) $(LDFLAGS) -o $(BINARY_NAME) -v

# Run the application
run:
	$(GORUN) main.go

# Build and run the application
dev: build
	./$(BINARY_NAME)

# Install dependencies
deps:
	$(GOGET) -v ./...

# Format code
fmt:
	$(GOFMT) ./...

# Lint code (requires golangci-lint to be installed)
lint:
	golangci-lint run ./...

# Run all tests with coverage percentage
test:
	$(GOTEST) -v ./... -cover

# Run tests with race detection
test-race:
	$(GOTEST) -v -race ./...

# Run all tests with verbose output
test-verbose:
	$(GOTEST) -v ./...

# Run all tests and generate coverage report
test-coverage:
	$(GOTEST) -v ./... -coverprofile=coverage.out
	$(GOCMD) tool cover -func=coverage.out

# Generate HTML coverage report
test-html: test-coverage
	$(GOCMD) tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

# All-in-one test with HTML report
test-all: test test-race test-html
	@echo "All tests completed with coverage report"

# Clean up
clean:
	$(GOCLEAN)
	rm -f $(BINARY_NAME)
	rm -f coverage.out
	rm -f coverage.html

# Help command
help:
	@echo "Auction App Backend - Makefile Help"
	@echo "=================================="
	@echo "Available targets:"
	@echo "  all           - Show help (default)"
	@echo "  build         - Build the application"
	@echo "  run           - Run the application"
	@echo "  dev           - Build and run the application"
	@echo "  deps          - Install dependencies"
	@echo "  fmt           - Format code"
	@echo "  lint          - Lint code (requires golangci-lint)"
	@echo "  test          - Run tests with coverage percentage"
	@echo "  test-race     - Run tests with race detection"
	@echo "  test-verbose  - Run tests with verbose output"
	@echo "  test-coverage - Run tests and generate coverage report"
	@echo "  test-html     - Generate HTML coverage report"
	@echo "  test-all      - Run all tests with race detection and generate HTML report"
	@echo "  clean         - Clean up build artifacts"
	@echo "  help          - Display this help"
