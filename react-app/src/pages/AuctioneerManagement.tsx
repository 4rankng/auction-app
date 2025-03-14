import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuctioneers } from '../hooks/useAuctioneers';
import { Auctioneer } from '../types';
import { Modal, Button } from 'react-bootstrap';
import './AuctioneerManagement.css';

const AuctioneerManagement: React.FC = () => {
  const navigate = useNavigate();
  const { auctioneers, loading, error, createAuctioneer, updateAuctioneer, deleteAuctioneer } = useAuctioneers();

  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAuctioneer, setCurrentAuctioneer] = useState<Auctioneer | null>(null);
  const [newName, setNewName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [auctioneerToDelete, setAuctioneerToDelete] = useState<string | null>(null);

  // Handle adding new auctioneer
  const handleAddClick = () => {
    setIsAdding(true);
    setIsEditing(false);
    setNewName('');
    setFormError(null);
  };

  // Handle editing an auctioneer
  const handleEditClick = (auctioneer: Auctioneer) => {
    setIsEditing(true);
    setIsAdding(false);
    setCurrentAuctioneer(auctioneer);
    setNewName(auctioneer.name);
    setFormError(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newName || newName.trim() === '') {
      setFormError('Tên đấu giá viên không được để trống');
      return;
    }

    try {
      if (isAdding) {
        await createAuctioneer(newName);
        setIsAdding(false);
      } else if (isEditing && currentAuctioneer) {
        await updateAuctioneer({
          ...currentAuctioneer,
          name: newName
        });
        setIsEditing(false);
        setCurrentAuctioneer(null);
      }

      setNewName('');
      setFormError(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    }
  };

  // Handle canceling the form
  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(false);
    setCurrentAuctioneer(null);
    setNewName('');
    setFormError(null);
  };

  // Show delete confirmation modal
  const handleShowDeleteModal = (id: string) => {
    setAuctioneerToDelete(id);
    setShowDeleteModal(true);
  };

  // Hide delete confirmation modal
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setAuctioneerToDelete(null);
  };

  // Handle deleting an auctioneer
  const handleConfirmDelete = async () => {
    if (!auctioneerToDelete) return;

    try {
      await deleteAuctioneer(auctioneerToDelete);
      setShowDeleteModal(false);
      setAuctioneerToDelete(null);
    } catch (err) {
      console.error('Error deleting auctioneer:', err);
      setFormError(err instanceof Error ? err.message : 'Không thể xóa đấu giá viên. Vui lòng thử lại sau.');
    }
  };

  // Handle going back to the previous page
  const handleBackClick = () => {
    navigate(-1);
  };

  // Render loading state
  if (loading && auctioneers.length === 0) {
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card shadow">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Quản lý Đấu Giá Viên</h4>
          <div className="action-buttons">
            <button
              className="btn btn-primary"
              onClick={handleAddClick}
              disabled={isAdding || isEditing}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Thêm Đấu Giá Viên
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleBackClick}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Quay Lại
            </button>
          </div>
        </div>

        <div className="card-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          )}

          {(isAdding || isEditing) && (
            <div className="form-section mb-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    {isAdding ? (
                      <><i className="bi bi-plus-circle me-2"></i>Thêm Đấu Giá Viên Mới</>
                    ) : (
                      <><i className="bi bi-pencil me-2"></i>Chỉnh Sửa Đấu Giá Viên</>
                    )}
                  </h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    {formError && (
                      <div className="alert alert-danger" role="alert">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        {formError}
                      </div>
                    )}
                    <div className="mb-3">
                      <label htmlFor="auctioneerName" className="form-label">
                        Tên Đấu Giá Viên
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="auctioneerName"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Nhập tên đấu giá viên"
                        autoFocus
                      />
                    </div>
                    <div className="form-buttons">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleCancel}
                      >
                        <i className="bi bi-x-circle me-2"></i>
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                      >
                        {isAdding ? (
                          <><i className="bi bi-plus-lg me-2"></i>Thêm</>
                        ) : (
                          <><i className="bi bi-check-lg me-2"></i>Lưu Thay Đổi</>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {auctioneers.length === 0 ? (
            <div className="alert alert-info" role="alert">
              <i className="bi bi-info-circle-fill me-2"></i>
              Chưa có đấu giá viên nào. Hãy thêm đấu giá viên mới.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th style={{ width: '70px' }}>ID</th>
                    <th>Tên Đấu Giá Viên</th>
                    <th style={{ width: '150px' }}>Ngày Tạo</th>
                    <th style={{ width: '120px' }} className="text-center">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {auctioneers.map((auctioneer) => (
                    <tr key={auctioneer.id}>
                      <td>{auctioneer.id}</td>
                      <td className="fw-medium">{auctioneer.name}</td>
                      <td>
                        {auctioneer.createdAt
                          ? new Date(auctioneer.createdAt).toLocaleDateString('vi-VN')
                          : 'N/A'}
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEditClick(auctioneer)}
                          disabled={isAdding || isEditing}
                          title="Chỉnh sửa"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleShowDeleteModal(auctioneer.id)}
                          disabled={isAdding || isEditing}
                          title="Xóa"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn xóa đấu giá viên này?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AuctioneerManagement;
