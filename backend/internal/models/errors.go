package models

// ErrorNotFound represents an error when a resource is not found
type ErrorNotFound struct {
	Message string
}

// Error returns the error message
func (e *ErrorNotFound) Error() string {
	return e.Message
}

// ErrorValidation represents an error during validation
type ErrorValidation struct {
	Message string
}

// Error returns the error message
func (e *ErrorValidation) Error() string {
	return e.Message
}
