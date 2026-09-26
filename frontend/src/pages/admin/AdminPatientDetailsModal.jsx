import { useEffect, useState } from 'react';

import Avatar from '../../components/shared/Avatar.jsx';
import StatusBadge from '../../components/shared/StatusBadge.jsx';
import LoadingState from '../../components/shared/LoadingState.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import AppointmentStatusBadge from '../../components/shared/AppointmentStatusBadge.jsx';
import * as adminPatientService from '../../api/adminPatientService.js';
import * as adminAppointmentService from '../../api/adminAppointmentService.js';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function calculateAge(dob) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

// Admin-only read view of a patient - basic info plus appointment history.
// Never displays password/passwordHash or any internal auth fields; the
// backend's toSafePatient() projection already excludes them.
function AdminPatientDetailsModal({ show, patientId, onClose }) {
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!show || !patientId) return;
    setIsLoading(true);
    setLoadError('');
    Promise.all([
      adminPatientService.getPatient(patientId),
      adminAppointmentService.listAppointments({ patientId, limit: 50 }),
    ])
      .then(([patientResult, appointmentsResult]) => {
        setPatient(patientResult);
        setAppointments(appointmentsResult.appointments);
      })
      .catch((err) => setLoadError(err.response?.data?.message || 'Failed to load patient details.'))
      .finally(() => setIsLoading(false));
  }, [show, patientId]);

  if (!show) return null;

  const age = patient ? calculateAge(patient.dateOfBirth) : null;

  return (
    <>
      <div className="dhms-modal-backdrop" onClick={onClose} />
      <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div className="modal-content dhms-modal-anim border-0" style={{ borderRadius: 'var(--dhms-radius)' }}>
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-semibold">Patient Profile</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <div className="modal-body pt-2">
              {isLoading ? (
                <LoadingState message="Loading patient..." />
              ) : loadError ? (
                <div className="alert alert-danger d-flex align-items-start gap-2" role="alert">
                  <i className="bi bi-exclamation-triangle-fill mt-1" />
                  <div>{loadError}</div>
                </div>
              ) : (
                <>
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <Avatar name={patient.name} size="lg" />
                    <div>
                      <h4 className="h5 fw-semibold mb-1">{patient.name}</h4>
                      <p className="text-muted mb-2">
                        {age !== null ? `${age} yrs` : '—'}
                        {patient.gender ? ` · ${patient.gender.charAt(0).toUpperCase()}${patient.gender.slice(1)}` : ''}
                      </p>
                      <StatusBadge active={patient.isActive} />
                    </div>
                  </div>

                  <div className="row g-4 mb-4">
                    <div className="col-md-6">
                      <h6 className="text-uppercase text-muted small fw-semibold mb-3" style={{ letterSpacing: '0.04em' }}>
                        Contact Information
                      </h6>
                      <dl className="mb-0">
                        <div className="d-flex justify-content-between py-2 border-bottom">
                          <dt className="text-muted fw-normal">Phone</dt>
                          <dd className="mb-0">{patient.phone}</dd>
                        </div>
                        <div className="d-flex justify-content-between py-2 border-bottom">
                          <dt className="text-muted fw-normal">Email</dt>
                          <dd className="mb-0">{patient.email || '—'}</dd>
                        </div>
                        <div className="d-flex justify-content-between py-2">
                          <dt className="text-muted fw-normal">Address</dt>
                          <dd className="mb-0 text-end">{patient.address || '—'}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="col-md-6">
                      <h6 className="text-uppercase text-muted small fw-semibold mb-3" style={{ letterSpacing: '0.04em' }}>
                        Emergency Contact
                      </h6>
                      <dl className="mb-0">
                        <div className="d-flex justify-content-between py-2 border-bottom">
                          <dt className="text-muted fw-normal">Name</dt>
                          <dd className="mb-0">{patient.emergencyContact?.name || '—'}</dd>
                        </div>
                        <div className="d-flex justify-content-between py-2 border-bottom">
                          <dt className="text-muted fw-normal">Phone</dt>
                          <dd className="mb-0">{patient.emergencyContact?.phone || '—'}</dd>
                        </div>
                        <div className="d-flex justify-content-between py-2">
                          <dt className="text-muted fw-normal">Relation</dt>
                          <dd className="mb-0">{patient.emergencyContact?.relation || '—'}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <h6 className="text-uppercase text-muted small fw-semibold mb-3" style={{ letterSpacing: '0.04em' }}>
                    Appointment History
                  </h6>
                  {appointments.length === 0 ? (
                    <EmptyState icon="bi-calendar-x" title="No appointments yet" />
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm table-hover align-middle mb-0 dhms-table">
                        <thead>
                          <tr>
                            <th>Doctor</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appointments.map((appt) => (
                            <tr key={appt.id}>
                              <td>Dr. {appt.doctorName}</td>
                              <td>{formatDate(appt.appointmentDate)}</td>
                              <td>
                                {appt.startTime} &ndash; {appt.endTime}
                              </td>
                              <td>
                                <AppointmentStatusBadge status={appt.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer border-0 pt-0">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminPatientDetailsModal;
