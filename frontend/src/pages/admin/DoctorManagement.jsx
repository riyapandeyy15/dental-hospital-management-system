import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import AdminLayout from '../../layouts/AdminLayout.jsx';
import * as doctorService from '../../api/doctorService.js';
import DoctorFormModal from './DoctorFormModal.jsx';
import DoctorDetailsModal from './DoctorDetailsModal.jsx';
import ConfirmDialog from '../../components/shared/ConfirmDialog.jsx';
import PageHeader from '../../components/shared/PageHeader.jsx';
import SearchBar from '../../components/shared/SearchBar.jsx';
import Avatar from '../../components/shared/Avatar.jsx';
import StatusBadge from '../../components/shared/StatusBadge.jsx';
import LoadingState from '../../components/shared/LoadingState.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';

const PAGE_SIZE = 10;
const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

function DoctorManagement() {
  const [searchParams, setSearchParams] = useSearchParams();

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

  // Support "Add Doctor" being launched from the dashboard's Quick Actions
  // (/admin/doctors?new=1) - open the modal once, then clean the URL.
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openAddModal();
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setActionMessage(`Dr. ${statusTarget.name} was ${!statusTarget.isActive ? 'activated' : 'deactivated'} successfully.`);
      setStatusTarget(null);
      await loadDoctors();
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Failed to update doctor status.');
    } finally {
      setIsTogglingStatus(false);
    }
  }

  return (
    <AdminLayout title="Doctor Management" subtitle="Manage doctors, profiles and account status.">
      <PageHeader
        title="Doctor Management"
        subtitle={`${stats.total} total · ${stats.active} active · ${stats.inactive} inactive`}
        actions={
          <button className="btn btn-primary d-inline-flex align-items-center gap-2" type="button" onClick={openAddModal}>
            <i className="bi bi-plus-lg" />
            Add Doctor
          </button>
        }
      />

      {actionMessage && (
        <div className="alert alert-success alert-dismissible d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-check-circle-fill" />
          <div className="flex-grow-1">{actionMessage}</div>
          <button type="button" className="btn-close" onClick={() => setActionMessage('')} aria-label="Dismiss" />
        </div>
      )}

      <div className="dhms-card mb-4 p-3 p-md-4">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-7">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by name, email or specialization"
              ariaLabel="Search doctors"
            />
          </div>
          <div className="col-12 col-md-5">
            <div className="btn-group w-100" role="group" aria-label="Filter doctors by status">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`btn btn-sm ${statusFilter === option.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setStatusFilter(option.value)}
                  aria-pressed={statusFilter === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dhms-card">
        <div className="p-0">
          {isLoading ? (
            <LoadingState message="Loading doctors..." />
          ) : loadError ? (
            <div className="p-4">
              <div className="alert alert-danger d-flex align-items-start gap-2 mb-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill mt-1" />
                <div>{loadError}</div>
              </div>
              <button className="btn btn-outline-secondary btn-sm" type="button" onClick={loadDoctors}>
                <i className="bi bi-arrow-clockwise me-1" />
                Retry
              </button>
            </div>
          ) : doctors.length === 0 ? (
            <EmptyState
              icon="bi-person-badge"
              title="No doctors found"
              message={
                search || statusFilter !== 'ALL'
                  ? 'Try adjusting your search or status filter.'
                  : 'Add your first doctor to get started.'
              }
            />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 dhms-table">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Registration No.</th>
                    <th>Specialization</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor) => (
                    <tr key={doctor.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Avatar name={doctor.name} />
                          <div>
                            <div className="fw-medium">{doctor.name}</div>
                            {doctor.qualifications?.length > 0 && (
                              <div className="text-muted small">{doctor.qualifications.join(', ')}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{doctor.registrationNumber || <span className="text-muted">&mdash;</span>}</td>
                      <td>{doctor.specialization}</td>
                      <td>{doctor.email}</td>
                      <td>{doctor.phone || <span className="text-muted">&mdash;</span>}</td>
                      <td>
                        <StatusBadge active={doctor.isActive} />
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            title="View details"
                            aria-label={`View details for ${doctor.name}`}
                            onClick={() => setDetailsDoctor(doctor)}
                          >
                            <i className="bi bi-eye" />
                          </button>
                          <button
                            className="btn btn-outline-primary"
                            type="button"
                            title="Edit doctor"
                            aria-label={`Edit ${doctor.name}`}
                            onClick={() => openEditModal(doctor)}
                          >
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            className={`btn ${doctor.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                            type="button"
                            title={doctor.isActive ? 'Deactivate doctor' : 'Activate doctor'}
                            aria-label={`${doctor.isActive ? 'Deactivate' : 'Activate'} ${doctor.name}`}
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
          <div className="d-flex justify-content-between align-items-center border-top p-3">
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
                <i className="bi bi-chevron-left" />
                Previous
              </button>
              <button
                className="btn btn-outline-secondary"
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <i className="bi bi-chevron-right" />
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
        title={statusTarget?.isActive ? 'Deactivate doctor?' : 'Activate doctor?'}
        message={
          statusTarget
            ? `Are you sure you want to ${statusTarget.isActive ? 'deactivate' : 'activate'} Dr. ${statusTarget.name}? ${
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
