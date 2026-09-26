import { useEffect, useState } from 'react';

import DoctorLayout from '../../layouts/DoctorLayout.jsx';
import Avatar from '../../components/shared/Avatar.jsx';
import StatusBadge from '../../components/shared/StatusBadge.jsx';
import LoadingState from '../../components/shared/LoadingState.jsx';
import * as doctorPortalService from '../../api/doctorPortalService.js';

function DoctorProfile() {
  const [doctor, setDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  function load() {
    setIsLoading(true);
    setLoadError('');
    doctorPortalService
      .getMyProfile()
      .then((result) => {
        setDoctor(result);
        setPhoneInput(result.phone || '');
      })
      .catch((err) => setLoadError(err.response?.data?.message || 'Could not load your profile.'))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  async function handleSavePhone(event) {
    event.preventDefault();
    if (!phoneInput.trim()) {
      setPhoneError('Phone number is required.');
      return;
    }
    setPhoneError('');
    setIsSaving(true);
    try {
      const updated = await doctorPortalService.updateMyProfile({ phone: phoneInput.trim() });
      setDoctor(updated);
      setIsEditingPhone(false);
      setSaveMessage('Phone number updated successfully.');
    } catch (err) {
      setPhoneError(err.response?.data?.message || 'Failed to update phone number.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <DoctorLayout title="My Profile" subtitle="View and manage your professional profile.">
      {isLoading ? (
        <LoadingState message="Loading your profile..." />
      ) : loadError ? (
        <div className="alert alert-danger d-flex align-items-start gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill mt-1" />
          <div>{loadError}</div>
        </div>
      ) : (
        <>
          {saveMessage && (
            <div className="alert alert-success alert-dismissible d-flex align-items-center gap-2" role="alert">
              <i className="bi bi-check-circle-fill" />
              <div className="flex-grow-1">{saveMessage}</div>
              <button type="button" className="btn-close" onClick={() => setSaveMessage('')} aria-label="Dismiss" />
            </div>
          )}

          <div className="dhms-card p-4 mb-4">
            <div className="d-flex align-items-center gap-3">
              <Avatar name={doctor.name} size="lg" />
              <div>
                <h2 className="h5 fw-semibold mb-1">Dr. {doctor.name}</h2>
                <p className="text-muted mb-2">{doctor.specialization}</p>
                <StatusBadge active={doctor.isActive} />
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-md-6">
              <div className="dhms-card p-4 h-100">
                <h3 className="h6 fw-semibold text-uppercase text-muted mb-3" style={{ letterSpacing: '0.04em' }}>
                  Professional Information
                </h3>
                <dl className="mb-0">
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <dt className="text-muted fw-normal">Specialization</dt>
                    <dd className="mb-0 text-end">{doctor.specialization}</dd>
                  </div>
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <dt className="text-muted fw-normal">Qualifications</dt>
                    <dd className="mb-0 text-end">{(doctor.qualifications || []).join(', ') || '—'}</dd>
                  </div>
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <dt className="text-muted fw-normal">Registration No.</dt>
                    <dd className="mb-0 text-end">{doctor.registrationNumber || '—'}</dd>
                  </div>
                  <div className="d-flex justify-content-between py-2">
                    <dt className="text-muted fw-normal">Experience</dt>
                    <dd className="mb-0 text-end">
                      {doctor.experienceYears !== undefined && doctor.experienceYears !== null
                        ? `${doctor.experienceYears} years`
                        : '—'}
                    </dd>
                  </div>
                </dl>
                <p className="text-muted small mt-3 mb-0">
                  <i className="bi bi-info-circle me-1" />
                  Professional details are managed by your hospital administrator.
                </p>
              </div>
            </div>

            <div className="col-md-6">
              <div className="dhms-card p-4 h-100">
                <h3 className="h6 fw-semibold text-uppercase text-muted mb-3" style={{ letterSpacing: '0.04em' }}>
                  Contact Information
                </h3>
                <dl className="mb-0">
                  <div className="d-flex justify-content-between py-2 border-bottom">
                    <dt className="text-muted fw-normal">Email</dt>
                    <dd className="mb-0 text-end">{doctor.email}</dd>
                  </div>
                  <div className="py-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <dt className="text-muted fw-normal">Phone</dt>
                      {!isEditingPhone && (
                        <div className="d-flex align-items-center gap-2">
                          <dd className="mb-0">{doctor.phone || '—'}</dd>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setIsEditingPhone(true)}
                            aria-label="Edit phone number"
                            title="Edit phone number"
                          >
                            <i className="bi bi-pencil" />
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditingPhone && (
                      <form onSubmit={handleSavePhone} className="mt-2">
                        <div className="input-group input-group-sm">
                          <input
                            className={`form-control ${phoneError ? 'is-invalid' : ''}`}
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            disabled={isSaving}
                            aria-label="Phone number"
                          />
                          <button type="submit" className="btn btn-primary" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            disabled={isSaving}
                            onClick={() => {
                              setIsEditingPhone(false);
                              setPhoneInput(doctor.phone || '');
                              setPhoneError('');
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                        {phoneError && <div className="text-danger small mt-1">{phoneError}</div>}
                      </form>
                    )}
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </>
      )}
    </DoctorLayout>
  );
}

export default DoctorProfile;
