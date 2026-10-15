import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import AdminLayout from '../../layouts/AdminLayout.jsx';
import * as doctorService from '../../api/doctorService.js';
import DoctorFormModal from './DoctorFormModal.jsx';
import DoctorDetailsModal from './DoctorDetailsModal.jsx';
import ConfirmDialog from '../../components/shared/ConfirmDialog.jsx';
import PageHeader from '../../components/shared/PageHeader.jsx';
import SearchBar from '../../components/shared/SearchBar.jsx';
import SegmentedFilter from '../../components/shared/SegmentedFilter.jsx';
import IconButton from '../../components/shared/IconButton.jsx';
import Avatar from '../../components/shared/Avatar.jsx';
import StatusBadge from '../../components/shared/StatusBadge.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import ErrorState from '../../components/shared/ErrorState.jsx';
import { SkeletonTable } from '../../components/shared/Skeletons.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const PAGE_SIZE = 10;
const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Doctors', icon: 'bi-person-badge' },
  { value: 'ACTIVE', label: 'Active', icon: 'bi-check-circle' },
  { value: 'INACTIVE', label: 'Inactive', icon: 'bi-slash-circle' },
];

function DoctorManagement() {
  const toast = useToast();
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
        toast.success('Doctor added successfully.');
      } else {
        await doctorService.updateDoctor(formModal.doctor.id, payload);
        toast.success('Doctor updated successfully.');
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
      toast.success(`Dr. ${statusTarget.name} was ${!statusTarget.isActive ? 'activated' : 'deactivated'} successfully.`);
      setStatusTarget(null);
      await loadDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update doctor status.');
    } finally {
      setIsTogglingStatus(false);
    }
  }

  const filterOptions = [
    { ...STATUS_OPTIONS[0], count: stats.total },
    { ...STATUS_OPTIONS[1], count: stats.active },
    { ...STATUS_OPTIONS[2], count: stats.inactive },
  ];

  return (
    <AdminLayout title="Doctor Management" subtitle="Manage doctors, profiles and account status.">
      <PageHeader
        eyebrow="Administration"
        title="Doctor Management"
        subtitle="Manage doctor profiles and account status."
        actions={
          <button className="btn btn-primary d-inline-flex align-items-center gap-2" type="button" onClick={openAddModal}>
            <i className="bi bi-plus-lg" />
            Add Doctor
          </button>
        }
      />

      <div className="dhms-toolbar mb-4 p-3 p-md-4 dhms-stagger-in">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-lg-6">
            <span className="dhms-toolbar-label">Search</span>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by name, email or specialization"
              ariaLabel="Search doctors"
            />
          </div>
          <div className="col-12 col-lg-6">
            <span className="dhms-toolbar-label">Status</span>
            <SegmentedFilter options={filterOptions} value={statusFilter} onChange={setStatusFilter} ariaLabel="Filter doctors by status" />
          </div>
        </div>
      </div>

      <div className="dhms-card dhms-stagger-in">
        <div className="p-0">
          {isLoading ? (
            <SkeletonTable rows={6} columns={5} />
          ) : loadError ? (
            <ErrorState message={loadError} onRetry={loadDoctors} />
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
                      <td style={{ minWidth: 180 }}>
                        <div className="d-flex align-items-center gap-2">
                          <Avatar name={doctor.name} />
                          <div>
                            <div className="fw-medium text-wrap">{doctor.name}</div>
                            {doctor.qualifications?.length > 0 && (
                              <div className="text-muted small text-wrap">{doctor.qualifications.join(', ')}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{doctor.registrationNumber || <span className="text-muted">&mdash;</span>}</td>
                      <td className="text-wrap" style={{ minWidth: 140 }}>
                        {doctor.specialization}
                      </td>
                      <td className="text-wrap" style={{ minWidth: 160 }}>
                        {doctor.email}
                      </td>
                      <td>{doctor.phone || <span className="text-muted">&mdash;</span>}</td>
                      <td>
                        <StatusBadge active={doctor.isActive} />
                      </td>
                      <td className="text-end">
                        <div className="dhms-icon-btn-group justify-content-end">
                          <IconButton
                            icon="bi-eye"
                            title="View details"
                            ariaLabel={`View details for ${doctor.name}`}
                            variant="view"
                            onClick={() => setDetailsDoctor(doctor)}
                          />
                          <IconButton
                            icon="bi-pencil"
                            title="Edit doctor"
                            ariaLabel={`Edit ${doctor.name}`}
                            variant="edit"
                            onClick={() => openEditModal(doctor)}
                          />
                          <IconButton
                            icon={doctor.isActive ? 'bi-slash-circle' : 'bi-check-circle'}
                            title={doctor.isActive ? 'Deactivate doctor' : 'Activate doctor'}
                            ariaLabel={`${doctor.isActive ? 'Deactivate' : 'Activate'} ${doctor.name}`}
                            variant={doctor.isActive ? 'danger' : 'success'}
                            onClick={() => setStatusTarget(doctor)}
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
