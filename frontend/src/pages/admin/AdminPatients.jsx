import { useCallback, useEffect, useState } from 'react';

import AdminLayout from '../../layouts/AdminLayout.jsx';
import PageHeader from '../../components/shared/PageHeader.jsx';
import SearchBar from '../../components/shared/SearchBar.jsx';
import Avatar from '../../components/shared/Avatar.jsx';
import LoadingState from '../../components/shared/LoadingState.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import ConfirmDialog from '../../components/shared/ConfirmDialog.jsx';
import PatientFormModal from './PatientFormModal.jsx';
import AdminPatientDetailsModal from './AdminPatientDetailsModal.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import * as adminPatientService from '../../api/adminPatientService.js';

const PAGE_SIZE = 10;
const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function AdminPatients() {
  const toast = useToast();

  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [formModal, setFormModal] = useState({ show: false, mode: 'add', patient: null });
  const [formApiError, setFormApiError] = useState('');
  const [statusTarget, setStatusTarget] = useState(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [viewPatientId, setViewPatientId] = useState(null);

  const loadPatients = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const result = await adminPatientService.listPatients({ search, status: statusFilter, page, limit: PAGE_SIZE });
      setPatients(result.patients);
      setPagination(result.pagination);
    } catch (err) {
      if (err.request && !err.response) {
        setLoadError('Could not reach the server. Please check your connection and try again.');
      } else {
        setLoadError(err.response?.data?.message || 'Failed to load patients.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    const timeout = setTimeout(loadPatients, 300);
    return () => clearTimeout(timeout);
  }, [loadPatients]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  function openAddModal() {
    setFormApiError('');
    setFormModal({ show: true, mode: 'add', patient: null });
  }

  function openEditModal(patient) {
    setFormApiError('');
    setFormModal({ show: true, mode: 'edit', patient });
  }

  async function handleFormSubmit(payload) {
    setFormApiError('');
    try {
      if (formModal.mode === 'add') {
        await adminPatientService.createPatient(payload);
        toast.success('Patient added successfully.');
      } else {
        await adminPatientService.updatePatient(formModal.patient.id, payload);
        toast.success('Patient updated successfully.');
      }
      setFormModal({ show: false, mode: 'add', patient: null });
      await loadPatients();
    } catch (err) {
      setFormApiError(err.response?.data?.message || 'Something went wrong. Please try again.');
      throw err;
    }
  }

  async function confirmStatusChange() {
    if (!statusTarget) return;
    setIsTogglingStatus(true);
    try {
      await adminPatientService.setPatientStatus(statusTarget.id, !statusTarget.isActive);
      toast.success(`${statusTarget.name} was ${!statusTarget.isActive ? 'activated' : 'deactivated'} successfully.`);
      setStatusTarget(null);
      await loadPatients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update patient status.');
    } finally {
      setIsTogglingStatus(false);
    }
  }

  return (
    <AdminLayout title="Patient Management" subtitle="View and manage patient records.">
      <PageHeader
        title="Patient Management"
        subtitle={`${pagination.total} patient${pagination.total === 1 ? '' : 's'}`}
        actions={
          <button className="btn btn-primary d-inline-flex align-items-center gap-2" type="button" onClick={openAddModal}>
            <i className="bi bi-plus-lg" />
            Add Patient
          </button>
        }
      />

      <div className="dhms-card mb-4 p-3 p-md-4">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-7">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name, phone or email" ariaLabel="Search patients" />
          </div>
          <div className="col-12 col-md-5">
            <div className="btn-group w-100" role="group" aria-label="Filter patients by status">
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
            <LoadingState message="Loading patients..." />
          ) : loadError ? (
            <div className="p-4">
              <div className="alert alert-danger d-flex align-items-start gap-2 mb-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill mt-1" />
                <div>{loadError}</div>
              </div>
              <button className="btn btn-outline-secondary btn-sm" type="button" onClick={loadPatients}>
                <i className="bi bi-arrow-clockwise me-1" />
                Retry
              </button>
            </div>
          ) : patients.length === 0 ? (
            <EmptyState icon="bi-people" title="No patients found" message="Add your first patient to get started." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 dhms-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Gender</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Avatar name={patient.name} />
                          <div className="fw-medium">{patient.name}</div>
                        </div>
                      </td>
                      <td>{patient.phone}</td>
                      <td>{patient.email || <span className="text-muted">&mdash;</span>}</td>
                      <td>{patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : <span className="text-muted">&mdash;</span>}</td>
                      <td>
                        <span className={`dhms-badge ${patient.isActive ? 'dhms-badge-success' : 'dhms-badge-danger'}`}>
                          <span className="dhms-badge-dot" />
                          {patient.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            title="View patient"
                            aria-label={`View ${patient.name}`}
                            onClick={() => setViewPatientId(patient.id)}
                          >
                            <i className="bi bi-eye" />
                          </button>
                          <button
                            className="btn btn-outline-primary"
                            type="button"
                            title="Edit patient"
                            aria-label={`Edit ${patient.name}`}
                            onClick={() => openEditModal(patient)}
                          >
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            className={`btn ${patient.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                            type="button"
                            title={patient.isActive ? 'Deactivate patient' : 'Activate patient'}
                            aria-label={`${patient.isActive ? 'Deactivate' : 'Activate'} ${patient.name}`}
                            onClick={() => setStatusTarget(patient)}
                          >
                            <i className={`bi ${patient.isActive ? 'bi-slash-circle' : 'bi-check-circle'}`} />
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
              <button className="btn btn-outline-secondary" type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
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

      <AdminPatientDetailsModal show={Boolean(viewPatientId)} patientId={viewPatientId} onClose={() => setViewPatientId(null)} />

      <PatientFormModal
        show={formModal.show}
        mode={formModal.mode}
        patient={formModal.patient}
        onClose={() => setFormModal({ show: false, mode: 'add', patient: null })}
        onSubmit={handleFormSubmit}
        apiError={formApiError}
      />

      <ConfirmDialog
        show={Boolean(statusTarget)}
        title={statusTarget?.isActive ? 'Deactivate patient?' : 'Activate patient?'}
        message={
          statusTarget
            ? `Are you sure you want to ${statusTarget.isActive ? 'deactivate' : 'activate'} ${statusTarget.name}?`
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

export default AdminPatients;
