import { useCallback, useEffect, useState } from 'react';

import AdminLayout from '../../layouts/AdminLayout.jsx';
import PageHeader from '../../components/shared/PageHeader.jsx';
import SearchBar from '../../components/shared/SearchBar.jsx';
import SegmentedFilter from '../../components/shared/SegmentedFilter.jsx';
import IconButton from '../../components/shared/IconButton.jsx';
import Avatar from '../../components/shared/Avatar.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import ErrorState from '../../components/shared/ErrorState.jsx';
import { SkeletonTable } from '../../components/shared/Skeletons.jsx';
import ConfirmDialog from '../../components/shared/ConfirmDialog.jsx';
import PatientFormModal from './PatientFormModal.jsx';
import AdminPatientDetailsModal from './AdminPatientDetailsModal.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import * as adminPatientService from '../../api/adminPatientService.js';

const PAGE_SIZE = 10;
const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Patients', icon: 'bi-people' },
  { value: 'ACTIVE', label: 'Active', icon: 'bi-check-circle' },
  { value: 'INACTIVE', label: 'Inactive', icon: 'bi-slash-circle' },
];

function AdminPatients() {
  const toast = useToast();

  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [statusCounts, setStatusCounts] = useState({ ALL: null, ACTIVE: null, INACTIVE: null });
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

  // Real per-status counts for the segmented filter, independent of the
  // current search/status filter - mirrors the pattern already used by the
  // Doctor Management `stats` field, just computed client-side since the
  // patient list endpoint doesn't return it itself.
  const loadStatusCounts = useCallback(async () => {
    try {
      const [all, active, inactive] = await Promise.all([
        adminPatientService.listPatients({ status: 'ALL', limit: 1 }),
        adminPatientService.listPatients({ status: 'ACTIVE', limit: 1 }),
        adminPatientService.listPatients({ status: 'INACTIVE', limit: 1 }),
      ]);
      setStatusCounts({ ALL: all.pagination.total, ACTIVE: active.pagination.total, INACTIVE: inactive.pagination.total });
    } catch {
      // Non-critical - the segmented control simply omits counts if this fails.
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(loadPatients, 300);
    return () => clearTimeout(timeout);
  }, [loadPatients]);

  useEffect(() => {
    loadStatusCounts();
  }, [loadStatusCounts]);

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
      await Promise.all([loadPatients(), loadStatusCounts()]);
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
      await Promise.all([loadPatients(), loadStatusCounts()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update patient status.');
    } finally {
      setIsTogglingStatus(false);
    }
  }

  const filterOptions = STATUS_OPTIONS.map((opt) => ({ ...opt, count: statusCounts[opt.value] }));

  return (
    <AdminLayout title="Patient Management" subtitle="View and manage patient records.">
      <PageHeader
        eyebrow="Administration"
        title="Patient Management"
        subtitle="Manage and monitor registered patients."
        actions={
          <button className="btn btn-primary d-inline-flex align-items-center gap-2" type="button" onClick={openAddModal}>
            <i className="bi bi-plus-lg" />
            Add Patient
          </button>
        }
      />

      <div className="dhms-toolbar mb-4 p-3 p-md-4 dhms-stagger-in">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-lg-6">
            <span className="dhms-toolbar-label">Search</span>
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name, phone or email" ariaLabel="Search patients" />
          </div>
          <div className="col-12 col-lg-6">
            <span className="dhms-toolbar-label">Status</span>
            <SegmentedFilter options={filterOptions} value={statusFilter} onChange={setStatusFilter} ariaLabel="Filter patients by status" />
          </div>
        </div>
      </div>

      <div className="dhms-card dhms-stagger-in">
        <div className="p-0">
          {isLoading ? (
            <SkeletonTable rows={6} columns={4} />
          ) : loadError ? (
            <ErrorState message={loadError} onRetry={loadPatients} />
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
                        <div className="dhms-icon-btn-group justify-content-end">
                          <IconButton
                            icon="bi-eye"
                            title="View patient"
                            ariaLabel={`View ${patient.name}`}
                            variant="view"
                            onClick={() => setViewPatientId(patient.id)}
                          />
                          <IconButton
                            icon="bi-pencil"
                            title="Edit patient"
                            ariaLabel={`Edit ${patient.name}`}
                            variant="edit"
                            onClick={() => openEditModal(patient)}
                          />
                          <IconButton
                            icon={patient.isActive ? 'bi-slash-circle' : 'bi-check-circle'}
                            title={patient.isActive ? 'Deactivate patient' : 'Activate patient'}
                            ariaLabel={`${patient.isActive ? 'Deactivate' : 'Activate'} ${patient.name}`}
                            variant={patient.isActive ? 'danger' : 'success'}
                            onClick={() => setStatusTarget(patient)}
                          />
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
