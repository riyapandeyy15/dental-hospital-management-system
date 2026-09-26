import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import DoctorLayout from '../../layouts/DoctorLayout.jsx';
import PageHeader from '../../components/shared/PageHeader.jsx';
import SearchBar from '../../components/shared/SearchBar.jsx';
import LoadingState from '../../components/shared/LoadingState.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import AppointmentStatusBadge from '../../components/shared/AppointmentStatusBadge.jsx';
import ConfirmDialog from '../../components/shared/ConfirmDialog.jsx';
import * as doctorPortalService from '../../api/doctorPortalService.js';

const PAGE_SIZE = 10;

const WHEN_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
];

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
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [when, setWhen] = useState('today');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [statusChange, setStatusChange] = useState(null); // { appointment, action }
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const result = await doctorPortalService.listAppointments({ when, status, search, page, limit: PAGE_SIZE });
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
  }, [when, status, search, page]);

  useEffect(() => {
    const timeout = setTimeout(loadAppointments, 300);
    return () => clearTimeout(timeout);
  }, [loadAppointments]);

  useEffect(() => {
    setPage(1);
  }, [search, when, status]);

  async function confirmStatusChange() {
    if (!statusChange) return;
    setIsSubmittingStatus(true);
    try {
      await doctorPortalService.updateAppointmentStatus(statusChange.appointment.id, statusChange.action.status);
      setActionMessage(`Appointment marked as ${statusChange.action.status.toLowerCase()}.`);
      setStatusChange(null);
      await loadAppointments();
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Failed to update appointment status.');
    } finally {
      setIsSubmittingStatus(false);
    }
  }

  return (
    <DoctorLayout title="My Appointments" subtitle="View and manage your scheduled appointments.">
      <PageHeader title="My Appointments" subtitle={`${pagination.total} appointment${pagination.total === 1 ? '' : 's'}`} />

      {actionMessage && (
        <div className="alert alert-success alert-dismissible d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-check-circle-fill" />
          <div className="flex-grow-1">{actionMessage}</div>
          <button type="button" className="btn-close" onClick={() => setActionMessage('')} aria-label="Dismiss" />
        </div>
      )}

      <div className="dhms-card mb-4 p-3 p-md-4">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-5">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by patient name or reason" ariaLabel="Search appointments" />
          </div>
          <div className="col-12 col-md-4">
            <div className="btn-group w-100" role="group" aria-label="Filter by time">
              {WHEN_OPTIONS.map((opt) => (
                <button
                  key={opt.value || 'all'}
                  type="button"
                  className={`btn btn-sm ${when === opt.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setWhen(opt.value)}
                  aria-pressed={when === opt.value}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="col-12 col-md-3">
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
              <button className="btn btn-outline-secondary btn-sm" type="button" onClick={loadAppointments}>
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
                    <th>Date</th>
                    <th>Time</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt) => (
                    <tr key={appt.id}>
                      <td>
                        <Link to={`/doctor/patients/${appt.patientId}`} className="fw-medium text-decoration-none">
                          {appt.patientName}
                        </Link>
                      </td>
                      <td>{formatDate(appt.appointmentDate)}</td>
                      <td>
                        {appt.startTime} &ndash; {appt.endTime}
                      </td>
                      <td>{appt.reason || <span className="text-muted">&mdash;</span>}</td>
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
    </DoctorLayout>
  );
}

export default DoctorAppointments;
