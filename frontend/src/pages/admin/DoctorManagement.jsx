import { useCallback, useEffect, useState } from 'react';

import AdminLayout from '../../layouts/AdminLayout.jsx';
import * as doctorService from '../../api/doctorService.js';
import DoctorFormModal from './DoctorFormModal.jsx';
import DoctorDetailsModal from './DoctorDetailsModal.jsx';
import ConfirmDialog from '../../components/shared/ConfirmDialog.jsx';

const PAGE_SIZE = 10;

function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [formModal, setFormModal] = useState({ show: false, mode: 'add', doctor: null });
  const [formApiError, setFormApiError] = useState('');
  const [detailsDoctor, setDetailsDoctor] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const loadDoctors = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const result = await doctorService.listDoctors({ search, status: statusFilter, page, limit: PAGE_SIZE });
      setDoctors(result.doctors);
      setPagination(result.pagination);
      setStats(result.stats);
    } catch (err) {
      if (err.request && !err.response) {
        setLoadError('Could not reach the server. Please check your connection and try again.');
      } else {
        setLoadError(err.response?.data?.message || 'Failed to load doctors.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page]);

  // Debounce so typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    const timeout = setTimeout(loadDoctors, 300);
    return () => clearTimeout(timeout);
  }, [loadDoctors]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  function openAddModal() {
    setFormApiError('');
    setFormModal({ show: true, mode: 'add', doctor: null });
  }

  function openEditModal(doctor) {
    setFormApiError('');
    setFormModal({ show: true, mode: 'edit', doctor });
  }

  function closeFormModal() {
    setFormModal({ show: false, mode: 'add', doctor: null });
  }

  async function handleFormSubmit(payload) {
    setFormApiError('');
    try {
      if (formModal.mode === 'add') {
        await doctorService.createDoctor(payload);
        setActionMessage('Doctor added successfully.');
      } else {
        await doctorService.updateDoctor(formModal.doctor.id, payload);
        setActionMessage('Doctor updated successfully.');
      }
      closeFormModal();
      await loadDoctors();
    } catch (err) {
      if (err.request && !err.response) {
        setFormApiError('Could not reach the server. Please check your connection and try again.');
      } else {
        setFormApiError(err.response?.data?.message || 'Something went wrong. Please try again.');
      }
      throw err;
    }
  }

  async function confirmStatusChange() {
    if (!statusTarget) return;
    setIsTogglingStatus(true);
    try {
      await doctorService.setDoctorStatus(statusTarget.id, !statusTarget.isActive);
      setActionMessage(`Doctor ${!statusTarget.isActive ? 'activated' : 'deactivated'} successfully.`);
      setStatusTarget(null);
      await loadDoctors();
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Failed to update doctor status.');
    } finally {
      setIsTogglingStatus(false);
    }
  }

  return (
    <AdminLayout title="Doctor Management">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h2 className="h4 mb-1">Doctor Management</h2>
          <p className="text-muted mb-0">
            {stats.total} total &middot; {stats.active} active &middot; {stats.inactive} inactive
          </p>
        </div>
        <button className="btn btn-primary" type="button" onClick={openAddModal}>
          <i className="bi bi-plus-lg me-2" />
          Add Doctor
        </button>
      </div>

      {actionMessage && (
        <div className="alert alert-success alert-dismissible" role="alert">
          {actionMessage}
          <button type="button" className="btn-close" onClick={() => setActionMessage('')} />
        </div>
      )}

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-7">
              <label className="form-label">Search</label>
              <input
                className="form-control"
                placeholder="Search by name, email or specialization"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-5">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading</span>
              </div>
            </div>
          ) : loadError ? (
            <div className="alert alert-danger m-3 mb-0">{loadError}</div>
          ) : doctors.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-person-badge fs-1 d-block mb-2" />
              No doctors found.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Specialization</th>
                    <th>Qualification</th>
                    <th>Experience</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor) => (
                    <tr key={doctor.id}>
                      <td>{doctor.name}</td>
                      <td>{doctor.email}</td>
                      <td>{doctor.specialization}</td>
                      <td>{(doctor.qualifications || []).join(', ') || '-'}</td>
                      <td>{doctor.experienceYears ?? '-'}</td>
                      <td>
                        <span className={`badge ${doctor.isActive ? 'bg-success' : 'bg-secondary'}`}>
                          {doctor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            title="View"
                            onClick={() => setDetailsDoctor(doctor)}
                          >
                            <i className="bi bi-eye" />
                          </button>
                          <button
                            className="btn btn-outline-primary"
                            type="button"
                            title="Edit"
                            onClick={() => openEditModal(doctor)}
                          >
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            className={`btn ${doctor.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                            type="button"
                            title={doctor.isActive ? 'Deactivate' : 'Activate'}
                            onClick={() => setStatusTarget(doctor)}
                          >
                            <i className={`bi ${doctor.isActive ? 'bi-slash-circle' : 'bi-check-circle'}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!isLoading && !loadError && pagination.totalPages > 1 && (
          <div className="card-footer d-flex justify-content-between align-items-center">
            <span className="text-muted small">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="btn-group btn-group-sm">
              <button
                className="btn btn-outline-secondary"
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </button>
              <button
                className="btn btn-outline-secondary"
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <DoctorFormModal
        show={formModal.show}
        mode={formModal.mode}
        doctor={formModal.doctor}
        onClose={closeFormModal}
        onSubmit={handleFormSubmit}
        apiError={formApiError}
      />

      <DoctorDetailsModal show={Boolean(detailsDoctor)} doctor={detailsDoctor} onClose={() => setDetailsDoctor(null)} />

      <ConfirmDialog
        show={Boolean(statusTarget)}
        title={statusTarget?.isActive ? 'Deactivate doctor' : 'Activate doctor'}
        message={
          statusTarget
            ? `Are you sure you want to ${statusTarget.isActive ? 'deactivate' : 'activate'} ${statusTarget.name}? ${
                statusTarget.isActive
                  ? 'They will no longer be able to log in.'
                  : 'They will be able to log in again.'
              }`
            : ''
        }
        confirmLabel={statusTarget?.isActive ? 'Deactivate' : 'Activate'}
        confirmVariant={statusTarget?.isActive ? 'danger' : 'success'}
        onConfirm={confirmStatusChange}
        onCancel={() => setStatusTarget(null)}
        isSubmitting={isTogglingStatus}
      />
    </AdminLayout>
  );
}

export default DoctorManagement;
