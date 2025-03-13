import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from 'react-bootstrap';

interface ModalProps {
  show: boolean;
  onHide: () => void;
  title: string;
  body: string | React.ReactNode;
  confirmText?: string;
  confirmVariant?: string;
  onConfirm?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const Modal: React.FC<ModalProps> = ({
  show,
  onHide,
  title,
  body,
  confirmText = 'Confirm',
  confirmVariant = 'primary',
  onConfirm,
  size = 'md'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onHide();
      }
    };

    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [show, onHide]);

  // Close modal when pressing Escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onHide();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [show, onHide]);

  // Handle confirm action
  const handleConfirm = () => {
    console.log('Modal confirm button clicked');
    if (onConfirm) {
      onConfirm();
    }
  };

  if (!show) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050
      }}
    >
      <div
        ref={modalRef}
        className="ds-card"
        style={{
          width: '100%',
          maxWidth: size === 'sm' ? '400px' : size === 'lg' ? '800px' : '600px',
          maxHeight: '90vh',
          margin: '0 auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between p-4 border-bottom">
          <h4 className="mb-0">{title}</h4>
          <button
            type="button"
            className="btn-close"
            onClick={onHide}
            aria-label="Close"
          />
        </div>

        {/* Body */}
        <div className="p-4" style={{ overflowY: 'auto' }}>
          {body}
        </div>

        {/* Footer */}
        <div className="d-flex justify-content-end gap-2 p-4 border-top bg-light">
          <Button
            variant="outline-secondary"
            onClick={onHide}
          >
            Cancel
          </Button>
          {onConfirm && (
            <Button
              variant={confirmVariant}
              onClick={handleConfirm}
            >
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
