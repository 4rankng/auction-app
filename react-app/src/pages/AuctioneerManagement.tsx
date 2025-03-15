import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuctioneers } from '../hooks/useAuctioneers';
import { Auctioneer } from '../types';
import './AuctioneerManagement.css';

const AuctioneerManagement: React.FC = () => {
  const navigate = useNavigate();
  const { auctioneers, loading, error, createAuctioneer, updateAuctioneer, deleteAuctioneer } = useAuctioneers();

  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAuctioneer, setCurrentAuctioneer] = useState<Auctioneer | null>(null);
  const [newName, setNewName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

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

  // Handle deleting an auctioneer
  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đấu giá viên này?')) {
      try {
        await deleteAuctioneer(id);
      } catch (err) {
        console.error('Error deleting auctioneer:', err);
        alert('Không thể xóa đấu giá viên. Vui lòng thử lại sau.');
      }
    }
  };

  // Handle going back to the previous page
  const handleBackClick = () => {
    navigate(-1);
  };

  // Render loading state
  if (loading && auctioneers.length === 0) {
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Quản lý Đấu Giá Viên</h4>
          <div>
            <button
              className="btn btn-primary me-2"
              onClick={handleAddClick}
              disabled={isAdding || isEditing}
            >
              <i className="bi bi-plus-circle me-1"></i> Thêm Đấu Giá Viên
            </button>
            <button className="btn btn-secondary" onClick={handleBackClick}>
              <i className="bi bi-arrow-left me-1"></i> Quay Lại
            </button>
          </div>
        </div>

        <div className="card-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {(isAdding || isEditing) && (
            <div className="card mb-3">
              <div className="card-header">
                <h5 className="mb-0">{isAdding ? 'Thêm Đấu Giá Viên Mới' : 'Chỉnh Sửa Đấu Giá Viên'}</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  {formError && (
                    <div className="alert alert-danger" role="alert">
                      {formError}
                    </div>
                  )}
                  <div className="mb-3">
                    <label htmlFor="auctioneerName" className="form-label">Tên Đấu Giá Viên</label>
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
                  <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-secondary me-2" onClick={handleCancel}>
                      Hủy
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {isAdding ? 'Thêm' : 'Lưu Thay Đổi'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {auctioneers.length === 0 ? (
            <div className="alert alert-info" role="alert">
              Chưa có đấu giá viên nào. Hãy thêm đấu giá viên mới.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên Đấu Giá Viên</th>
                    <th>Ngày Tạo</th>
                    <th className="text-center">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {auctioneers.map((auctioneer) => (
                    <tr key={auctioneer.id}>
                      <td>{auctioneer.id}</td>
                      <td>{auctioneer.name}</td>
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
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteClick(auctioneer.id)}
                          disabled={isAdding || isEditing}
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
    </div>
  );
};

export default AuctioneerManagement;
