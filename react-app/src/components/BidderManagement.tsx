import React from 'react';
import { Bidder } from '../types';
import './BidderManagement.css';
import { useForm, SubmitHandler } from 'react-hook-form';

/* OPTIMIZATION OPPORTUNITY:
 * This component could benefit from using React Hook Form for form handling:
 *
 * 1. Benefits:
 *    - Reduced re-renders with uncontrolled components
 *    - Built-in validation with less code
 *    - Better performance for form inputs
 *    - Simplified form state management
 *
 * 2. Implementation example:
 * ```
 * import { useForm } from 'react-hook-form';
 *
 * // Inside component
 * const { register, handleSubmit, reset, formState: { errors } } = useForm({
 *   defaultValues: {
 *     id: '',
 *     name: '',
 *     nric: '',
 *     issuingAuthority: '',
 *     address: ''
 *   }
 * });
 *
 * const onSubmit = (data) => {
 *   // Handle form submission with validated data
 *   onAddBidder(data);
 *   reset(); // Clear form after submission
 * };
 *
 * // In JSX
 * <form onSubmit={handleSubmit(onSubmit)}>
 *   <input {...register('name', { required: 'Name is required' })} />
 *   {errors.name && <span className="text-danger">{errors.name.message}</span>}
 *   // Other fields...
 * </form>
 * ```
 */

// Define the form input types
type BidderFormInputs = {
  id: string;
  name: string;
  nric: string;
  issuingAuthority: string;
  address: string;
};

interface BidderManagementProps {
  bidders: Bidder[];
  importing: boolean;
  onAddBidder: (bidderData: BidderFormInputs) => void;
  onImportClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const BidderManagement: React.FC<BidderManagementProps> = React.memo(({
  bidders,
  importing,
  onAddBidder,
  onImportClick,
  fileInputRef,
  onFileChange
}) => {
  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<BidderFormInputs>({
    defaultValues: {
      id: '',
      name: '',
      nric: '',
      issuingAuthority: '',
      address: ''
    }
  });

  // Form submission handler
  const onSubmit: SubmitHandler<BidderFormInputs> = (data) => {
    onAddBidder(data);
    reset(); // Clear form after submission
  };

  return (
    <div className="card mb-4 bidder-management-card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">Quản Lý Người Tham Gia</h5>
      </div>
      <div className="card-body">
        <div className="mb-4">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="row g-3 align-items-end">
              <div className="col-md-2">
                <label className="form-label">Mã Số</label>
                <input
                  type="text"
                  className={`form-control ${errors.id ? 'is-invalid' : ''}`}
                  placeholder="Tự động nếu để trống"
                  {...register('id')}
                />
                {errors.id && <div className="invalid-feedback">{errors.id.message}</div>}
              </div>
              <div className="col-md-2">
                <label className="form-label">Tên</label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  {...register('name', { required: 'Tên là bắt buộc' })}
                />
                {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
              </div>
              <div className="col-md-2">
                <label className="form-label">CMND/CCCD</label>
                <input
                  type="text"
                  className={`form-control ${errors.nric ? 'is-invalid' : ''}`}
                  {...register('nric', { required: 'CMND/CCCD là bắt buộc' })}
                />
                {errors.nric && <div className="invalid-feedback">{errors.nric.message}</div>}
              </div>
              <div className="col-md-2">
                <label className="form-label">Nơi Cấp</label>
                <input
                  type="text"
                  className={`form-control ${errors.issuingAuthority ? 'is-invalid' : ''}`}
                  {...register('issuingAuthority', { required: 'Nơi cấp là bắt buộc' })}
                />
                {errors.issuingAuthority && <div className="invalid-feedback">{errors.issuingAuthority.message}</div>}
              </div>
              <div className="col-md-2">
                <label className="form-label">Địa Chỉ</label>
                <input
                  type="text"
                  className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                  {...register('address', { required: 'Địa chỉ là bắt buộc' })}
                />
                {errors.address && <div className="invalid-feedback">{errors.address.message}</div>}
              </div>
              <div className="col-md-2 d-flex gap-2">
                <button type="submit" className="btn btn-primary px-3" style={{ aspectRatio: '1' }}>
                  <i className="bi bi-plus-lg"></i>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="d-none"
                  accept=".xlsx,.xls"
                  onChange={onFileChange}
                />
                <button
                  type="button"
                  className="btn excel-import-btn flex-grow-1"
                  onClick={onImportClick}
                  disabled={importing}
                >
                  <i className="bi bi-file-earmark-excel me-2"></i>
                  Excel
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Mã Số</th>
                <th>Tên</th>
                <th>CMND/CCCD</th>
                <th>Nơi Cấp</th>
                <th>Địa Chỉ</th>
              </tr>
            </thead>
            <tbody>
              {bidders.length > 0 ? (
                bidders.map((bidder) => (
                  <tr key={bidder.id}>
                    <td>{bidder.id}</td>
                    <td>{bidder.name}</td>
                    <td>{bidder.nric}</td>
                    <td>{bidder.issuingAuthority}</td>
                    <td>{bidder.address}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-3">
                    Chưa có người tham gia. Thêm người tham gia bằng biểu mẫu ở trên hoặc nhập từ Excel.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export default BidderManagement;
