import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import PatientLayout from '../../layouts/PatientLayout.jsx';
import Avatar from '../../components/shared/Avatar.jsx';
import ErrorState from '../../components/shared/ErrorState.jsx';
import AppointmentStatusBadge from '../../components/shared/AppointmentStatusBadge.jsx';
import ConfirmDialog from '../../components/shared/ConfirmDialog.jsx';
import { SkeletonCard } from '../../components/shared/Skeletons.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import * as patientPortalService from '../../api/patientPortalService.js';

const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED'];

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="d-flex align-items-start gap-3 py-3 border-bottom">
      <div
        className="dhms-stat-icon flex-shrink-0"
        style={{ width: 38, height: 38, fontSize: '0.95rem', background: 'var(--dhms-primary-light)', color: 'var(--dhms-primary-dark)' }}
      >
        <i className={`bi ${icon}`} />
      </div>
      <div style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
        <div className="text-muted small">{label}</div>
        <div className="fw-medium">{value}</div>
      </div>
    </div>
  );
}

// A patient can only ever land here for their own appointment - the backend
// (GET /patient/appointments/:id) scopes the lookup to req.patientId and
// returns 404 for anything else, which we surface as the same not-found
// state rather than a different "forbidden" message.
function PatientAppointmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [appointment, setAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  function load() {
    setIsLoading(true);
    setLoadError('');
    patientPortalService
      .getMyAppointment(id)
      .then(setAppointment)
      .catch((err) => {
        if (err.response?.status === 404) {
          setLoadError('Appointment not found.');
        } else {
          setLoadError(err.response?.data?.message || 'Failed to load appointment details.');
        }
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [id]);

  async function confirmCancel() {
    setIsCancelling(true);
    try {
      const updated = await patientPortalService.cancelMyAppointment(id);
      setAppointment(updated);
      setShowCancelConfirm(false);
      toast.success('Appointment cancelled successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel the appointment.');
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <PatientLayout title="Appointment Details" subtitle="Full details for this appointment.">
      <button className="btn btn-sm btn-outline-secondary mb-3" type="button" onClick={() => navigate('/patient/appointments')}>
        <i className="bi bi-arrow-left me-1" />
        Back to My Appointments
      </button>

      {isLoading ? (
        <SkeletonCard height={320} />
      ) : loadError ? (
        <div className="dhms-card">
          <ErrorState message={loadError} />
        </div>
      ) : (
        <div className="dhms-card p-4 p-md-5 dhms-stagger-in" style={{ maxWidth: 640 }}>
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
            <div className="d-flex align-items-center gap-3">
              <Avatar name={appointment.doctorName} size="lg" />
              <div>
                <h2 className="h5 fw-semibold mb-1">Dr. {appointment.doctorName}</h2>
                <p className="text-muted mb-0">{appointment.specialization}</p>
              </div>
            </div>
            <AppointmentStatusBadge status={appointment.status} />
          </div>

          <div>
            <InfoRow icon="bi-person" label="Patient" value={user?.name} />
            <InfoRow icon="bi-calendar-event" label="Date" value={formatDate(appointment.appointmentDate)} />
            <InfoRow icon="bi-clock" label="Time" value={`${appointment.startTime} – ${appointment.endTime}`} />
            <InfoRow icon="bi-chat-left-text" label="Reason" value={appointment.reason || '—'} />
            <div className="d-flex align-items-start gap-3 py-3">
              <div
                className="dhms-stat-icon flex-shrink-0"
                style={{ width: 38, height: 38, fontSize: '0.95rem', background: 'var(--dhms-primary-light)', color: 'var(--dhms-primary-dark)' }}
              >
                <i className="bi bi-hourglass-split" />
              </div>
              <div>
                <div className="text-muted small">Booked on</div>
                <div className="fw-medium">{formatDateTime(appointment.createdAt)}</div>
              </div>
            </div>
          </div>

          {CANCELLABLE_STATUSES.includes(appointment.status) && (
            <div className="mt-2 pt-3 border-top">
              <button className="btn btn-outline-danger" type="button" onClick={() => setShowCancelConfirm(true)}>
                <i className="bi bi-x-circle me-2" />
                Cancel Appointment
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        show={showCancelConfirm}
        title="Cancel Appointment?"
        message={appointment ? `Are you sure you want to cancel your appointment with Dr. ${appointment.doctorName}?` : ''}
        confirmLabel="Cancel Appointment"
        confirmVariant="danger"
        onConfirm={confirmCancel}
        onCancel={() => setShowCancelConfirm(false)}
        isSubmitting={isCancelling}
      />
    </PatientLayout>
  );
}

export default PatientAppointmentDetails;
