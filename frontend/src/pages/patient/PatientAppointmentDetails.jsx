import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import PatientLayout from '../../layouts/PatientLayout.jsx';
import LoadingState from '../../components/shared/LoadingState.jsx';
import AppointmentStatusBadge from '../../components/shared/AppointmentStatusBadge.jsx';
import ConfirmDialog from '../../components/shared/ConfirmDialog.jsx';
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
        <LoadingState message="Loading appointment..." />
      ) : loadError ? (
        <div className="alert alert-danger d-flex align-items-start gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill mt-1" />
          <div>{loadError}</div>
        </div>
      ) : (
        <div className="dhms-card p-4 p-md-5" style={{ maxWidth: 640 }}>
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div>
              <h2 className="h5 fw-semibold mb-1">Dr. {appointment.doctorName}</h2>
              <p className="text-muted mb-0">{appointment.specialization}</p>
            </div>
            <AppointmentStatusBadge status={appointment.status} />
          </div>

          <dl className="mb-0">
            <div className="d-flex justify-content-between py-2 border-bottom">
              <dt className="text-muted fw-normal">Patient</dt>
              <dd className="mb-0">{user?.name}</dd>
            </div>
            <div className="d-flex justify-content-between py-2 border-bottom">
              <dt className="text-muted fw-normal">Date</dt>
              <dd className="mb-0 text-end">{formatDate(appointment.appointmentDate)}</dd>
            </div>
            <div className="d-flex justify-content-between py-2 border-bottom">
              <dt className="text-muted fw-normal">Time</dt>
              <dd className="mb-0">
                {appointment.startTime} &ndash; {appointment.endTime}
              </dd>
            </div>
            <div className="d-flex justify-content-between py-2 border-bottom">
              <dt className="text-muted fw-normal">Reason</dt>
              <dd className="mb-0 text-end">{appointment.reason || '—'}</dd>
            </div>
            <div className="d-flex justify-content-between py-2">
              <dt className="text-muted fw-normal">Booked on</dt>
              <dd className="mb-0">{formatDateTime(appointment.createdAt)}</dd>
            </div>
          </dl>

          {CANCELLABLE_STATUSES.includes(appointment.status) && (
            <div className="mt-4 pt-3 border-top">
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
