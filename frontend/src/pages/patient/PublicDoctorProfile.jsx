import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import PatientLayout from '../../layouts/PatientLayout.jsx';
import Avatar from '../../components/shared/Avatar.jsx';
import LoadingState from '../../components/shared/LoadingState.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import ConfirmDialog from '../../components/shared/ConfirmDialog.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import * as publicDoctorService from '../../api/publicDoctorService.js';
import * as patientPortalService from '../../api/patientPortalService.js';

// Builds a "YYYY-MM-DD" string from LOCAL date components - never
// toISOString(), which converts to UTC and can silently shift the date by
// a day in any timezone ahead of UTC (e.g. IST). Must match the backend's
// own local-date parsing in slot.service.js exactly.
function toLocalDateStr(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTimeDisplay(time) {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function PublicDoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [doctor, setDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [selectedDate, setSelectedDate] = useState(toLocalDateStr(new Date()));
  const [slots, setSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState('');

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setLoadError('');
    publicDoctorService
      .getPublicDoctor(id)
      .then(setDoctor)
      .catch((err) => setLoadError(err.response?.data?.message || 'Doctor not found.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (!doctor) return undefined;
    // Guards against an older request (e.g. for the previously-selected
    // date) resolving after a newer one and overwriting it with stale data.
    let cancelled = false;
    setSelectedSlot(null);
    setIsLoadingSlots(true);
    setSlotsError('');
    publicDoctorService
      .getDoctorAvailability(id, selectedDate)
      .then((result) => {
        if (!cancelled) setSlots(result.slots);
      })
      .catch((err) => {
        if (!cancelled) setSlotsError(err.response?.data?.message || 'Could not load availability.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [doctor, id, selectedDate]);

  async function handleConfirmBooking() {
    setIsBooking(true);
    try {
      const appointment = await patientPortalService.bookAppointment({
        doctorId: id,
        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
        reason,
      });
      setShowConfirm(false);
      setBookingSuccess(appointment);
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('That slot was just booked by someone else. Please choose another slot.');
        setShowConfirm(false);
        // refresh slots so the taken one shows as booked
        publicDoctorService.getDoctorAvailability(id, selectedDate).then((result) => setSlots(result.slots));
      } else {
        toast.error(err.response?.data?.message || 'Failed to book the appointment. Please try again.');
        setShowConfirm(false);
      }
    } finally {
      setIsBooking(false);
    }
  }

  if (isLoading) {
    return (
      <PatientLayout title="Doctor Profile">
        <LoadingState message="Loading doctor profile..." />
      </PatientLayout>
    );
  }

  if (loadError) {
    return (
      <PatientLayout title="Doctor Profile">
        <div className="alert alert-danger d-flex align-items-start gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill mt-1" />
          <div>{loadError}</div>
        </div>
        <button className="btn btn-outline-secondary" type="button" onClick={() => navigate('/patient/find-doctor')}>
          <i className="bi bi-arrow-left me-1" />
          Back to Find a Doctor
        </button>
      </PatientLayout>
    );
  }

  if (bookingSuccess) {
    return (
      <PatientLayout title="Booking Confirmed">
        <div className="dhms-card p-5 text-center dhms-modal-anim" style={{ maxWidth: 520, margin: '0 auto' }}>
          <div
            className="dhms-stat-icon mx-auto mb-3"
            style={{ width: 64, height: 64, fontSize: '1.75rem', background: 'var(--dhms-success-bg)', color: 'var(--dhms-success)' }}
          >
            <i className="bi bi-check-circle-fill" />
          </div>
          <h2 className="h4 fw-bold mb-2">Appointment Requested</h2>
          <p className="text-muted mb-4">
            Your appointment with Dr. {doctor.name} on {formatDateDisplay(selectedDate)} at{' '}
            {formatTimeDisplay(selectedSlot.startTime)} has been booked.
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <button className="btn btn-primary" type="button" onClick={() => navigate('/patient/appointments')}>
              View My Appointments
            </button>
            <button className="btn btn-outline-secondary" type="button" onClick={() => navigate('/patient/find-doctor')}>
              Find Another Doctor
            </button>
          </div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout title="Doctor Profile" subtitle={`Dr. ${doctor.name}`}>
      <button className="btn btn-sm btn-outline-secondary mb-3" type="button" onClick={() => navigate('/patient/find-doctor')}>
        <i className="bi bi-arrow-left me-1" />
        Back to Find a Doctor
      </button>

      <div className="dhms-card p-4 mb-4">
        <div className="d-flex flex-wrap align-items-center gap-3">
          <Avatar name={doctor.name} size="lg" />
          <div>
            <h2 className="h5 fw-semibold mb-1">Dr. {doctor.name}</h2>
            <p className="text-muted mb-1">{doctor.specialization}</p>
            {doctor.qualifications?.length > 0 && <p className="small text-muted mb-0">{doctor.qualifications.join(', ')}</p>}
          </div>
          {doctor.experienceYears !== null && (
            <div className="ms-md-auto text-md-end">
              <div className="fw-semibold">{doctor.experienceYears} years</div>
              <div className="text-muted small">Experience</div>
            </div>
          )}
        </div>
      </div>


      <div className="dhms-card p-4 p-md-5">
        <h3 className="h6 fw-semibold text-uppercase text-muted mb-3" style={{ letterSpacing: '0.04em' }}>
          Book an Appointment
        </h3>

        <div className="row g-4">
          <div className="col-md-5">
            <label htmlFor="appointment-date" className="form-label fw-medium">
              Select Date
            </label>
            <input
              id="appointment-date"
              type="date"
              className="form-control"
              value={selectedDate}
              min={toLocalDateStr(new Date())}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        <hr className="my-4" />

        <label className="form-label fw-medium">Available Time Slots</label>

        {isLoadingSlots ? (
          <LoadingState message="Loading availability..." />
        ) : slotsError ? (
          <div className="alert alert-danger py-2">{slotsError}</div>
        ) : slots.length === 0 ? (
          <EmptyState icon="bi-calendar-x" title="No slots available" message="This doctor has no availability on the selected date. Try another date." />
        ) : (
          <div className="row row-cols-3 row-cols-sm-4 row-cols-md-5 g-2 mb-4">
            {slots.map((slot) => (
              <div className="col" key={slot.startTime}>
                <button
                  type="button"
                  className={`btn w-100 ${
                    slot.status === 'booked'
                      ? 'btn-outline-secondary disabled'
                      : selectedSlot?.startTime === slot.startTime
                        ? 'btn-primary'
                        : 'btn-outline-primary'
                  }`}
                  disabled={slot.status === 'booked'}
                  aria-pressed={selectedSlot?.startTime === slot.startTime}
                  aria-label={`${formatTimeDisplay(slot.startTime)}, ${slot.status}`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {formatTimeDisplay(slot.startTime)}
                  {slot.status === 'booked' && <div className="small">Booked</div>}
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedSlot && (
          <div className="dhms-page-transition border-top pt-4">
            <label htmlFor="reason" className="form-label fw-medium">
              Reason for visit (optional)
            </label>
            <textarea
              id="reason"
              className="form-control mb-4"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Tooth pain, routine check-up..."
            />

            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 dhms-card p-3" style={{ background: 'var(--dhms-primary-light)' }}>
              <div>
                <div className="fw-semibold">
                  {formatDateDisplay(selectedDate)} at {formatTimeDisplay(selectedSlot.startTime)}
                </div>
                <div className="text-muted small">with Dr. {doctor.name}</div>
              </div>
              <button className="btn btn-primary" type="button" onClick={() => setShowConfirm(true)}>
                <i className="bi bi-check-circle me-2" />
                Review &amp; Confirm
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        show={showConfirm}
        title="Confirm Appointment?"
        message={
          selectedSlot
            ? `Book an appointment with Dr. ${doctor.name} on ${formatDateDisplay(selectedDate)} at ${formatTimeDisplay(selectedSlot.startTime)}?`
            : ''
        }
        confirmLabel="Confirm Appointment"
        confirmVariant="success"
        onConfirm={handleConfirmBooking}
        onCancel={() => setShowConfirm(false)}
        isSubmitting={isBooking}
      />
    </PatientLayout>
  );
}

export default PublicDoctorProfile;
