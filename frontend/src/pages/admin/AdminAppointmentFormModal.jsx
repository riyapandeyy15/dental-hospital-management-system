import { useEffect, useState } from 'react';

import * as adminPatientService from '../../api/adminPatientService.js';
import * as publicDoctorService from '../../api/publicDoctorService.js';
import * as adminAppointmentService from '../../api/adminAppointmentService.js';

function toLocalDateStr(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTimeDisplay(time) {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function AdminAppointmentFormModal({ show, onClose, onCreated }) {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(toLocalDateStr(new Date()));
  const [reason, setReason] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!show) return;
    setPatientId('');
    setDoctorId('');
    setDate(toLocalDateStr(new Date()));
    setReason('');
    setSlots([]);
    setSelectedSlot(null);
    setFieldError('');
    setApiError('');

    adminPatientService.listPatients({ limit: 100 }).then((res) => setPatients(res.patients));
    publicDoctorService.listPublicDoctors({ limit: 100 }).then((res) => setDoctors(res.doctors));
  }, [show]);

  useEffect(() => {
    if (!doctorId || !date) {
      setSlots([]);
      return undefined;
    }
    // Guards against an older request (e.g. for the previously-selected
    // date) resolving after a newer one and overwriting it with stale data.
    let cancelled = false;
    setIsLoadingSlots(true);
    setSelectedSlot(null);
    publicDoctorService
      .getDoctorAvailability(doctorId, date)
      .then((result) => {
        if (!cancelled) setSlots(result.slots);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [doctorId, date]);

  if (!show) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!patientId || !doctorId || !selectedSlot) {
      setFieldError('Please select a patient, doctor and time slot.');
      return;
    }
    setFieldError('');
    setApiError('');
    setIsSubmitting(true);
    try {
      const appointment = await adminAppointmentService.createAppointment({
        patientId,
        doctorId,
        appointmentDate: date,
        startTime: selectedSlot.startTime,
        reason,
      });
      onCreated(appointment);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to book the appointment.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="dhms-modal-backdrop" onClick={isSubmitting ? undefined : onClose} />
      <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div className="modal-content dhms-modal-anim border-0" style={{ borderRadius: 'var(--dhms-radius)' }}>
            <form onSubmit={handleSubmit} noValidate>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-semibold">Book Appointment</h5>
                <button type="button" className="btn-close" onClick={onClose} disabled={isSubmitting} aria-label="Close" />
              </div>
              <div className="modal-body pt-3">
                {apiError && <div className="alert alert-danger py-2">{apiError}</div>}
                {fieldError && <div className="alert alert-danger py-2">{fieldError}</div>}

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label">
                      Patient <span className="text-danger">*</span>
                    </label>
                    <select className="form-select" value={patientId} onChange={(e) => setPatientId(e.target.value)} disabled={isSubmitting}>
                      <option value="">Select a patient</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">
                      Doctor <span className="text-danger">*</span>
                    </label>
                    <select className="form-select" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} disabled={isSubmitting}>
                      <option value="">Select a doctor</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          Dr. {d.name} ({d.specialization})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">
                      Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={date}
                      min={toLocalDateStr(new Date())}
                      onChange={(e) => setDate(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {doctorId && (
                  <div className="mb-3">
                    <label className="form-label">Available Time Slots</label>
                    {isLoadingSlots ? (
                      <div className="text-muted small">Loading availability...</div>
                    ) : slots.length === 0 ? (
                      <div className="text-muted small">No slots available on this date.</div>
                    ) : (
                      <div className="row row-cols-3 row-cols-md-4 g-2">
                        {slots.map((slot) => (
                          <div className="col" key={slot.startTime}>
                            <button
                              type="button"
                              className={`btn btn-sm w-100 ${
                                slot.status === 'booked'
                                  ? 'btn-outline-secondary disabled'
                                  : selectedSlot?.startTime === slot.startTime
                                    ? 'btn-primary'
                                    : 'btn-outline-primary'
                              }`}
                              disabled={slot.status === 'booked'}
                              onClick={() => setSelectedSlot(slot)}
                            >
                              {formatTimeDisplay(slot.startTime)}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="form-label">Reason</label>
                  <input className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} disabled={isSubmitting} />
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminAppointmentFormModal;
