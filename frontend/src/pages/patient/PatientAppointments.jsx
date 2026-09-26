import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import PatientLayout from '../../layouts/PatientLayout.jsx';
import PageHeader from '../../components/shared/PageHeader.jsx';
import LoadingState from '../../components/shared/LoadingState.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import AppointmentStatusBadge from '../../components/shared/AppointmentStatusBadge.jsx';
import ConfirmDialog from '../../components/shared/ConfirmDialog.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import * as patientPortalService from '../../api/patientPortalService.js';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function PatientAppointments() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const result = await patientPortalService.listMyAppointments({ when: activeTab, limit: 50 });
      setAppointments(result.appointments);
    } catch (err) {
      if (err.request && !err.response) {
        setLoadError('Could not reach the server. Please check your connection and try again.');
      } else {
        setLoadError(err.response?.data?.message || 'Failed to load appointments.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmCancel() {
    if (!cancelTarget) return;
    setIsCancelling(true);
    try {
      await patientPortalService.cancelMyAppointment(cancelTarget.id);
      toast.success('Appointment cancelled successfully.');
      setCancelTarget(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel the appointment.');
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <PatientLayout title="My Appointments" subtitle="View and manage your appointments.">
      <PageHeader title="My Appointments" />

      <ul className="nav nav-pills gap-2 mb-4">
        {TABS.map((tab) => (
          <li className="nav-item" key={tab.key}>
            <button
              type="button"
              className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={activeTab === tab.key}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="dhms-page-transition">
        {isLoading ? (
          <LoadingState message="Loading appointments..." />
        ) : loadError ? (
          <div className="dhms-card p-4">
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
          <div className="dhms-card">
            <EmptyState
              icon="bi-calendar-x"
              title={`No ${activeTab} appointments`}
              message={activeTab === 'upcoming' ? 'Find a doctor to book your first appointment.' : undefined}
            />
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {appointments.map((appt) => (
              <div key={appt.id} className="dhms-card dhms-card--hover p-4">
                <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                  <div>
                    <h3 className="h6 fw-semibold mb-1">Dr. {appt.doctorName}</h3>
                    <p className="text-muted small mb-1">{appt.specialization}</p>
                    <p className="mb-1">
                      <i className="bi bi-calendar-event me-2 text-muted" />
                      {formatDate(appt.appointmentDate)} &middot; {appt.startTime} &ndash; {appt.endTime}
                    </p>
                    {appt.reason && (
                      <p className="text-muted small mb-0">
                        <i className="bi bi-chat-left-text me-2" />
                        {appt.reason}
                      </p>
                    )}
                  </div>
                  <div className="text-end d-flex flex-column align-items-end gap-2">
                    <AppointmentStatusBadge status={appt.status} />
                    <Link to={`/patient/appointments/${appt.id}`} className="btn btn-outline-secondary btn-sm">
                      <i className="bi bi-eye me-1" />
                      View Details
                    </Link>
                    {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && activeTab === 'upcoming' && (
                      <button className="btn btn-outline-danger btn-sm" type="button" onClick={() => setCancelTarget(appt)}>
                        <i className="bi bi-x-circle me-1" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        show={Boolean(cancelTarget)}
        title="Cancel Appointment?"
        message={
          cancelTarget
            ? `Are you sure you want to cancel your appointment with Dr. ${cancelTarget.doctorName} on ${formatDate(cancelTarget.appointmentDate)}?`
            : ''
        }
        confirmLabel="Cancel Appointment"
        confirmVariant="danger"
        onConfirm={confirmCancel}
        onCancel={() => setCancelTarget(null)}
        isSubmitting={isCancelling}
      />
    </PatientLayout>
  );
}

export default PatientAppointments;
