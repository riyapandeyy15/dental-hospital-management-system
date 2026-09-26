import { useCallback, useEffect, useState } from 'react';

import AdminLayout from '../../layouts/AdminLayout.jsx';
import PageHeader from '../../components/shared/PageHeader.jsx';
import SearchBar from '../../components/shared/SearchBar.jsx';
import LoadingState from '../../components/shared/LoadingState.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import AppointmentStatusBadge from '../../components/shared/AppointmentStatusBadge.jsx';
import ConfirmDialog from '../../components/shared/ConfirmDialog.jsx';
import AdminAppointmentFormModal from './AdminAppointmentFormModal.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import * as adminAppointmentService from '../../api/adminAppointmentService.js';
import * as adminPatientService from '../../api/adminPatientService.js';
import * as publicDoctorService from '../../api/publicDoctorService.js';

const PAGE_SIZE = 10;
const STATUS_OPTIONS = ['', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

const NEXT_STATUS_ACTIONS = {
  PENDING: [
    { status: 'CONFIRMED', label: 'Confirm', icon: 'bi-check-circle', variant: 'success' },
    { status: 'CANCELLED', label: 'Cancel', icon: 'bi-x-circle', variant: 'danger' },
  ],
  CONFIRMED: [
    { status: 'COMPLETED', label: 'Mark Completed', icon: 'bi-check2-circle', variant: 'success' },
    { status: 'CANCELLED', label: 'Cancel', icon: 'bi-x-circle', variant: 'danger' },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function AdminAppointments() {
  const toast = useToast();

  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [page, setPage] = useState(1);

  const [showBookModal, setShowBookModal] = useState(false);
  const [statusChange, setStatusChange] = useState(null);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Filter dropdown options - real doctors/patients from the database, not
  // hardcoded lists.
  useEffect(() => {
    publicDoctorService.listPublicDoctors({ limit: 100 }).then((res) => setDoctors(res.doctors));
    adminPatientService.listPatients({ limit: 100 }).then((res) => setPatients(res.patients));
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const result = await adminAppointmentService.listAppointments({
        search,
        status,
        date,
        doctorId,
        patientId,
        page,
        limit: PAGE_SIZE,
      });
      setAppointments(result.appointments);
      setPagination(result.pagination);
    } catch (err) {
      if (err.request && !err.response) {
        setLoadError('Could not reach the server. Please check your connection and try again.');
      } else {
        setLoadError(err.response?.data?.message || 'Failed to load appointments.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [search, status, date, doctorId, patientId, page]);

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, status, date, doctorId, patientId]);

  async function confirmStatusChange() {
    if (!statusChange) return;
    setIsSubmittingStatus(true);
    try {
      await adminAppointmentService.updateAppointmentStatus(statusChange.appointment.id, statusChange.action.status);
      toast.success(`Appointment marked as ${statusChange.action.status.toLowerCase()}.`);
      setStatusChange(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update appointment status.');
    } finally {
      setIsSubmittingStatus(false);
    }
  }

  function handleBooked() {
    setShowBookModal(false);
    toast.success('Appointment booked successfully.');
    load();
  }

  return (
    <AdminLayout title="Appointment Management" subtitle="View and manage all appointments.">
      <PageHeader
        title="Appointment Management"
        subtitle={`${pagination.total} appointment${pagination.total === 1 ? '' : 's'}`}
        actions={
          <button className="btn btn-primary d-inline-flex align-items-center gap-2" type="button" onClick={() => setShowBookModal(true)}>
            <i className="bi bi-plus-lg" />
            Book Appointment
          </button>
        }
      />

      <div className="dhms-card mb-4 p-3 p-md-4">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-6 col-xl-4">
            <label className="form-label small text-muted mb-1">Search</label>
            <SearchBar value={search} onChange={setSearch} placeholder="Search by patient or doctor name" ariaLabel="Search appointments" />
          </div>
          <div className="col-6 col-md-6 col-xl-2">
            <label className="form-label small text-muted mb-1">Doctor</label>
            <select className="form-select" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} aria-label="Filter by doctor">
              <option value="">All doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-6 col-xl-2">
            <label className="form-label small text-muted mb-1">Patient</label>
            <select className="form-select" value={patientId} onChange={(e) => setPatientId(e.target.value)} aria-label="Filter by patient">
              <option value="">All patients</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-6 col-xl-2">
            <label className="form-label small text-muted mb-1">Date</label>
            <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Filter by date" />
          </div>
          <div className="col-6 col-md-6 col-xl-2">
            <label className="form-label small text-muted mb-1">Status</label>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt || 'any'} value={opt}>
                  {opt ? opt.charAt(0) + opt.slice(1).toLowerCase() : 'Any status'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="dhms-card">
        <div className="p-0">
          {isLoading ? (
            <LoadingState message="Loading appointments..." />
          ) : loadError ? (
            <div className="p-4">
              <div className="alert alert-danger d-flex align-items-start gap-2 mb-3" role="alert">
                <i className="bi bi-exclamation-triangle-fill mt-1" />
                <div>{loadError}</div>
              </div>
              <button className="btn btn-outline-secondary btn-sm" type="button" onClick={load}>
                <i className="bi bi-arrow-clockwise me-1" />
                Retry
              </button>
            </div>
          ) : appointments.length === 0 ? (
            <EmptyState icon="bi-calendar-x" title="No appointments found" message="Try adjusting your filters." />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 dhms-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt) => (
                    <tr key={appt.id}>
                      <td>
                        <div className="fw-medium">{appt.patientName}</div>
                        <div className="text-muted small">{appt.patientPhone}</div>
                      </td>
                      <td>
                        Dr. {appt.doctorName}
                        <div className="text-muted small">{appt.specialization}</div>
                      </td>
                      <td>{formatDate(appt.appointmentDate)}</td>
                      <td>
                        {appt.startTime} &ndash; {appt.endTime}
                      </td>
                      <td>
                        <AppointmentStatusBadge status={appt.status} />
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {(NEXT_STATUS_ACTIONS[appt.status] || []).map((action) => (
                            <button
                              key={action.status}
                              type="button"
                              className={`btn btn-outline-${action.variant}`}
                              title={action.label}
                              aria-label={`${action.label} appointment for ${appt.patientName}`}
                              onClick={() => setStatusChange({ appointment: appt, action })}
                            >
                              <i className={`bi ${action.icon}`} />
                            </button>
                          ))}
                          {(NEXT_STATUS_ACTIONS[appt.status] || []).length === 0 && (
                            <span className="text-muted small">No actions</span>
                          )}
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

      <AdminAppointmentFormModal show={showBookModal} onClose={() => setShowBookModal(false)} onCreated={handleBooked} />

      <ConfirmDialog
        show={Boolean(statusChange)}
        title={statusChange ? `${statusChange.action.label}?` : ''}
        message={
          statusChange
            ? `Are you sure you want to mark this appointment with ${statusChange.appointment.patientName} as ${statusChange.action.status.toLowerCase()}?`
            : ''
        }
        confirmLabel={statusChange?.action.label}
        confirmVariant={statusChange?.action.variant}
        onConfirm={confirmStatusChange}
        onCancel={() => setStatusChange(null)}
        isSubmitting={isSubmittingStatus}
      />
    </AdminLayout>
  );
}

export default AdminAppointments;
