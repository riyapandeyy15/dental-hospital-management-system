import { useEffect, useState } from 'react';

import DoctorLayout from '../../layouts/DoctorLayout.jsx';
import Avatar from '../../components/shared/Avatar.jsx';
import StatusBadge from '../../components/shared/StatusBadge.jsx';
import LoadingState from '../../components/shared/LoadingState.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import * as doctorPortalService from '../../api/doctorPortalService.js';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function buildDayState(availability) {
  return DAY_LABELS.map((_, dayOfWeek) => {
    const entry = (availability || []).find((a) => a.dayOfWeek === dayOfWeek);
    return {
      dayOfWeek,
      enabled: Boolean(entry),
      startTime: entry?.startTime || '09:00',
      endTime: entry?.endTime || '17:00',
    };
  });
}

function DoctorProfile() {
  const toast = useToast();

  const [doctor, setDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [dayState, setDayState] = useState(buildDayState([]));
  const [slotDuration, setSlotDuration] = useState(30);
  const [availabilityError, setAvailabilityError] = useState('');
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);

  function load() {
    setIsLoading(true);
    setLoadError('');
    doctorPortalService
      .getMyProfile()
      .then((result) => {
        setDoctor(result);
        setPhoneInput(result.phone || '');
        setDayState(buildDayState(result.availability));
        if (result.availability?.[0]?.slotDurationMinutes) {
          setSlotDuration(result.availability[0].slotDurationMinutes);
        }
      })
      .catch((err) => setLoadError(err.response?.data?.message || 'Could not load your profile.'))
      .finally(() => setIsLoading(false));
  }

  function toggleDay(dayOfWeek) {
    setDayState((prev) => prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, enabled: !d.enabled } : d)));
  }

  function updateDayTime(dayOfWeek, field, value) {
    setDayState((prev) => prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d)));
  }

  async function handleSaveAvailability() {
    const enabledDays = dayState.filter((d) => d.enabled);
    if (enabledDays.some((d) => d.startTime >= d.endTime)) {
      setAvailabilityError('Start time must be before end time for every enabled day.');
      return;
    }
    setAvailabilityError('');
    setIsSavingAvailability(true);
    try {
      const availability = enabledDays.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        startTime: d.startTime,
        endTime: d.endTime,
        slotDurationMinutes: Number(slotDuration),
      }));
      const updated = await doctorPortalService.updateMyAvailability(availability);
      setDoctor(updated);
      toast.success('Weekly availability updated successfully.');
    } catch (err) {
      setAvailabilityError(err.response?.data?.message || 'Failed to update availability.');
    } finally {
      setIsSavingAvailability(false);
    }
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
      toast.success('Phone number updated successfully.');
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

          <div className="dhms-card p-4 mt-4">
            <h3 className="h6 fw-semibold text-uppercase text-muted mb-1" style={{ letterSpacing: '0.04em' }}>
              Weekly Availability
            </h3>
            <p className="text-muted small mb-3">
              Set the days and hours patients can book appointments with you. This directly controls the time
              slots shown when a patient looks for availability.
            </p>

            {availabilityError && <div className="alert alert-danger py-2">{availabilityError}</div>}

            <div className="row g-2 mb-3">
              <div className="col-auto">
                <label className="form-label small text-muted mb-1">Slot duration</label>
                <select
                  className="form-select form-select-sm"
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(e.target.value)}
                  disabled={isSavingAvailability}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>

            <div className="d-flex flex-column gap-2">
              {dayState.map((day) => (
                <div key={day.dayOfWeek} className="row g-2 align-items-center py-2 border-bottom">
                  <div className="col-12 col-sm-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={`day-${day.dayOfWeek}`}
                        checked={day.enabled}
                        onChange={() => toggleDay(day.dayOfWeek)}
                        disabled={isSavingAvailability}
                      />
                      <label className="form-check-label fw-medium" htmlFor={`day-${day.dayOfWeek}`}>
                        {DAY_LABELS[day.dayOfWeek]}
                      </label>
                    </div>
                  </div>
                  <div className="col-6 col-sm-4">
                    <input
                      type="time"
                      className="form-control form-control-sm"
                      value={day.startTime}
                      onChange={(e) => updateDayTime(day.dayOfWeek, 'startTime', e.target.value)}
                      disabled={!day.enabled || isSavingAvailability}
                    />
                  </div>
                  <div className="col-6 col-sm-4">
                    <input
                      type="time"
                      className="form-control form-control-sm"
                      value={day.endTime}
                      onChange={(e) => updateDayTime(day.dayOfWeek, 'endTime', e.target.value)}
                      disabled={!day.enabled || isSavingAvailability}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary mt-3"
              type="button"
              onClick={handleSaveAvailability}
              disabled={isSavingAvailability}
            >
              {isSavingAvailability ? 'Saving...' : 'Save Availability'}
            </button>
          </div>
        </>
      )}
    </DoctorLayout>
  );
}

export default DoctorProfile;
