import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import DoctorLayout from '../../layouts/DoctorLayout.jsx';
import Avatar from '../../components/shared/Avatar.jsx';
import LoadingState from '../../components/shared/LoadingState.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import AppointmentStatusBadge from '../../components/shared/AppointmentStatusBadge.jsx';
import DentalRecordFormModal from './DentalRecordFormModal.jsx';
import TreatmentFormModal from './TreatmentFormModal.jsx';
import PrescriptionFormModal from './PrescriptionFormModal.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import * as doctorPortalService from '../../api/doctorPortalService.js';

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'bi-person-lines-fill' },
  { key: 'appointments', label: 'Appointments', icon: 'bi-calendar-check' },
  { key: 'records', label: 'Dental Records', icon: 'bi-file-earmark-medical' },
  { key: 'treatments', label: 'Treatments', icon: 'bi-clipboard2-pulse' },
  { key: 'prescriptions', label: 'Prescriptions', icon: 'bi-file-earmark-text' },
];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function calculateAge(dob) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [formApiError, setFormApiError] = useState('');

  async function loadAll() {
    setIsLoading(true);
    setLoadError('');
    try {
      const [patientResult, appointmentsResult, recordsResult, treatmentsResult, prescriptionsResult] = await Promise.all([
        doctorPortalService.getPatient(id),
        doctorPortalService.listAppointments({ patientId: id, limit: 100 }),
        doctorPortalService.listRecords(id),
        doctorPortalService.listTreatments(id),
        doctorPortalService.listPrescriptions(id),
      ]);
      setPatient(patientResult);
      setAppointments(appointmentsResult.appointments);
      setRecords(recordsResult);
      setTreatments(treatmentsResult);
      setPrescriptions(prescriptionsResult);
    } catch (err) {
      if (err.response?.status === 403) {
        setLoadError('You do not have access to this patient.');
      } else if (err.response?.status === 404) {
        setLoadError('Patient not found.');
      } else if (err.request && !err.response) {
        setLoadError('Could not reach the server. Please check your connection and try again.');
      } else {
        setLoadError(err.response?.data?.message || 'Failed to load patient details.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleCreateRecord(payload) {
    setFormApiError('');
    try {
      await doctorPortalService.createRecord(id, payload);
      setShowRecordModal(false);
      toast.success('Dental record added successfully.');
      await loadAll();
    } catch (err) {
      setFormApiError(err.response?.data?.message || 'Failed to save the dental record.');
      throw err;
    }
  }

  async function handleCreateTreatment(payload) {
    setFormApiError('');
    try {
      await doctorPortalService.createTreatment(id, payload);
      setShowTreatmentModal(false);
      toast.success('Treatment added successfully.');
      await loadAll();
    } catch (err) {
      setFormApiError(err.response?.data?.message || 'Failed to save the treatment.');
      throw err;
    }
  }

  async function handleCreatePrescription(payload) {
    setFormApiError('');
    try {
      await doctorPortalService.createPrescription(id, payload);
      setShowPrescriptionModal(false);
      toast.success('Prescription issued successfully.');
      await loadAll();
    } catch (err) {
      setFormApiError(err.response?.data?.message || 'Failed to issue the prescription.');
      throw err;
    }
  }

  if (isLoading) {
    return (
      <DoctorLayout title="Patient Details">
        <LoadingState message="Loading patient..." />
      </DoctorLayout>
    );
  }

  if (loadError) {
    return (
      <DoctorLayout title="Patient Details">
        <div className="alert alert-danger d-flex align-items-start gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill mt-1" />
          <div>{loadError}</div>
        </div>
        <button className="btn btn-outline-secondary" type="button" onClick={() => navigate('/doctor/patients')}>
          <i className="bi bi-arrow-left me-1" />
          Back to patients
        </button>
      </DoctorLayout>
    );
  }

  const age = calculateAge(patient.dateOfBirth);

  return (
    <DoctorLayout title="Patient Details" subtitle={patient.name}>
      <button className="btn btn-sm btn-outline-secondary mb-3" type="button" onClick={() => navigate('/doctor/patients')}>
        <i className="bi bi-arrow-left me-1" />
        Back to patients
      </button>


      <div className="dhms-card p-4 mb-4">
        <div className="d-flex flex-wrap align-items-center gap-3">
          <Avatar name={patient.name} size="lg" />
          <div className="flex-grow-1">
            <h2 className="h5 fw-semibold mb-1">{patient.name}</h2>
            <p className="text-muted mb-0">
              {age !== null ? `${age} yrs` : '—'}
              {patient.gender ? ` · ${patient.gender.charAt(0).toUpperCase()}${patient.gender.slice(1)}` : ''}
              {patient.phone ? ` · ${patient.phone}` : ''}
            </p>
          </div>
          <span className={`dhms-badge ${patient.isActive ? 'dhms-badge-success' : 'dhms-badge-danger'}`}>
            <span className="dhms-badge-dot" />
            {patient.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <ul className="nav nav-pills gap-2 mb-4 flex-wrap">
        {TABS.map((tab) => (
          <li className="nav-item" key={tab.key}>
            <button
              type="button"
              className={`nav-link d-inline-flex align-items-center gap-2 ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              aria-pressed={activeTab === tab.key}
            >
              <i className={`bi ${tab.icon}`} />
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="dhms-page-transition">
        {activeTab === 'overview' && (
          <div className="row g-4">
            <div className="col-md-6">
              <div className="dhms-card p-4 h-100">
                <h3 className="h6 fw-semibold text-uppercase text-muted mb-3" style={{ letterSpacing: '0.04em' }}>
                  Contact Information
                </h3>
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
            </div>
            <div className="col-md-6">
              <div className="dhms-card p-4 h-100">
                <h3 className="h6 fw-semibold text-uppercase text-muted mb-3" style={{ letterSpacing: '0.04em' }}>
                  Medical History
                </h3>
                <dl className="mb-0">
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <dt className="text-muted fw-normal">Allergies</dt>
                    <dd className="mb-0 text-end">{(patient.medicalHistory?.allergies || []).join(', ') || '—'}</dd>
                  </div>
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <dt className="text-muted fw-normal">Conditions</dt>
                    <dd className="mb-0 text-end">{(patient.medicalHistory?.conditions || []).join(', ') || '—'}</dd>
                  </div>
                  <div className="py-2">
                    <dt className="text-muted fw-normal mb-1">Notes</dt>
                    <dd className="mb-0">{patient.medicalHistory?.notes || '—'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appointments' &&
          (appointments.length === 0 ? (
            <EmptyState icon="bi-calendar-x" title="No appointments" message="You have no appointments with this patient yet." />
          ) : (
            <div className="dhms-card p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 dhms-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appt) => (
                      <tr key={appt.id}>
                        <td>{formatDate(appt.appointmentDate)}</td>
                        <td>
                          {appt.startTime} &ndash; {appt.endTime}
                        </td>
                        <td>{appt.reason || '—'}</td>
                        <td>
                          <AppointmentStatusBadge status={appt.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

        {activeTab === 'records' && (
          <>
            <div className="d-flex justify-content-end mb-3">
              <button
                className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
                type="button"
                onClick={() => {
                  setFormApiError('');
                  setShowRecordModal(true);
                }}
              >
                <i className="bi bi-plus-lg" />
                New Record
              </button>
            </div>
            {records.length === 0 ? (
              <EmptyState icon="bi-file-earmark-medical" title="No dental records" message="Add the first record for this patient." />
            ) : (
              <div className="d-flex flex-column gap-3">
                {records.map((record) => (
                  <div className="dhms-card p-4" key={record.id}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="text-muted small">{formatDate(record.visitDate)}</span>
                    </div>
                    {record.chiefComplaint && (
                      <p className="mb-1">
                        <strong>Chief Complaint:</strong> {record.chiefComplaint}
                      </p>
                    )}
                    {record.diagnosis && (
                      <p className="mb-1">
                        <strong>Diagnosis:</strong> {record.diagnosis}
                      </p>
                    )}
                    {record.clinicalNotes && (
                      <p className="mb-1">
                        <strong>Notes:</strong> {record.clinicalNotes}
                      </p>
                    )}
                    {record.followUp?.required && (
                      <p className="mb-0 text-warning-emphasis">
                        <i className="bi bi-calendar-event me-1" />
                        Follow-up: {formatDate(record.followUp.date)} {record.followUp.notes ? `— ${record.followUp.notes}` : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'treatments' && (
          <>
            <div className="d-flex justify-content-end mb-3">
              <button
                className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
                type="button"
                onClick={() => {
                  setFormApiError('');
                  setShowTreatmentModal(true);
                }}
              >
                <i className="bi bi-plus-lg" />
                New Treatment
              </button>
            </div>
            {treatments.length === 0 ? (
              <EmptyState icon="bi-clipboard2-pulse" title="No treatments" message="Add a treatment linked to a dental record." />
            ) : (
              <div className="dhms-card p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 dhms-table">
                    <thead>
                      <tr>
                        <th>Procedure</th>
                        <th>Tooth</th>
                        <th>Status</th>
                        <th>Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {treatments.map((treatment) => (
                        <tr key={treatment.id}>
                          <td>{treatment.procedureName}</td>
                          <td>{treatment.toothNumber || '—'}</td>
                          <td>
                            <span className="dhms-badge dhms-badge-success">{treatment.status.replace('_', ' ')}</span>
                          </td>
                          <td>{treatment.cost !== null ? `₹${treatment.cost}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'prescriptions' && (
          <>
            <div className="d-flex justify-content-end mb-3">
              <button
                className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
                type="button"
                onClick={() => {
                  setFormApiError('');
                  setShowPrescriptionModal(true);
                }}
              >
                <i className="bi bi-plus-lg" />
                New Prescription
              </button>
            </div>
            {prescriptions.length === 0 ? (
              <EmptyState icon="bi-file-earmark-text" title="No prescriptions" message="Issue a prescription linked to a dental record." />
            ) : (
              <div className="d-flex flex-column gap-3">
                {prescriptions.map((prescription) => (
                  <div className="dhms-card p-4" key={prescription.id}>
                    <div className="text-muted small mb-2">Issued {formatDate(prescription.issuedDate)}</div>
                    <ul className="mb-0 ps-3">
                      {prescription.medicines.map((med, idx) => (
                        <li key={idx}>
                          <strong>{med.name}</strong> &mdash; {med.dosage}, {med.frequency}
                          {med.durationDays ? ` for ${med.durationDays} days` : ''}
                          {med.instructions ? ` (${med.instructions})` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <DentalRecordFormModal
        show={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        onSubmit={handleCreateRecord}
        apiError={formApiError}
      />
      <TreatmentFormModal
        show={showTreatmentModal}
        records={records}
        onClose={() => setShowTreatmentModal(false)}
        onSubmit={handleCreateTreatment}
        apiError={formApiError}
      />
      <PrescriptionFormModal
        show={showPrescriptionModal}
        records={records}
        onClose={() => setShowPrescriptionModal(false)}
        onSubmit={handleCreatePrescription}
        apiError={formApiError}
      />
    </DoctorLayout>
  );
}

export default PatientDetails;
