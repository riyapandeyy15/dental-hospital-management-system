import { useEffect, useState } from 'react';

import PatientLayout from '../../layouts/PatientLayout.jsx';
import Avatar from '../../components/shared/Avatar.jsx';
import ErrorState from '../../components/shared/ErrorState.jsx';
import { SkeletonCard } from '../../components/shared/Skeletons.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import * as patientPortalService from '../../api/patientPortalService.js';

const emptyForm = { name: '', phone: '', email: '', address: '', emergencyName: '', emergencyPhone: '', emergencyRelation: '' };

function InfoRow({ icon, label, value }) {
  return (
    <div className="d-flex align-items-start gap-3 py-2 border-bottom">
      <i className={`bi ${icon} text-muted mt-1 flex-shrink-0`} style={{ width: 18 }} />
      <div className="flex-grow-1 d-flex justify-content-between gap-2" style={{ minWidth: 0 }}>
        <span className="text-muted flex-shrink-0">{label}</span>
        <span className="fw-medium text-end" style={{ overflowWrap: 'anywhere' }}>
          {value || '—'}
        </span>
      </div>
    </div>
  );
}

function PatientProfile() {
  const toast = useToast();

  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function load() {
    setIsLoading(true);
    setLoadError('');
    patientPortalService
      .getMyProfile()
      .then((result) => {
        setPatient(result);
        setForm({
          name: result.name || '',
          phone: result.phone || '',
          email: result.email || '',
          address: result.address || '',
          emergencyName: result.emergencyContact?.name || '',
          emergencyPhone: result.emergencyContact?.phone || '',
          emergencyRelation: result.emergencyContact?.relation || '',
        });
      })
      .catch((err) => setLoadError(err.response?.data?.message || 'Could not load your profile.'))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required.';
    if (!form.phone.trim()) errors.phone = 'Phone is required.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address.';
    return errors;
  }

  async function handleSave(event) {
    event.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setApiError('');
    setIsSaving(true);
    try {
      const updated = await patientPortalService.updateMyProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim(),
        emergencyContact: {
          name: form.emergencyName.trim(),
          phone: form.emergencyPhone.trim(),
          relation: form.emergencyRelation.trim(),
        },
      });
      setPatient(updated);
      setIsEditing(false);
      toast.success('Profile updated successfully.');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PatientLayout title="My Profile" subtitle="View and manage your personal information.">
      {isLoading ? (
        <SkeletonCard height={300} />
      ) : loadError ? (
        <div className="dhms-card">
          <ErrorState message={loadError} onRetry={load} />
        </div>
      ) : (
        <div className="dhms-page-transition">
          <div className="dhms-card p-4 mb-4">
            <div className="d-flex flex-wrap align-items-center gap-3">
              <Avatar name={patient.name} size="lg" />
              <div className="flex-grow-1">
                <h2 className="h5 fw-semibold mb-1">{patient.name}</h2>
                <p className="text-muted mb-0">{patient.phone}</p>
              </div>
              {!isEditing && (
                <button className="btn btn-outline-primary" type="button" onClick={() => setIsEditing(true)}>
                  <i className="bi bi-pencil me-1" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="dhms-card p-4 p-md-5 dhms-stagger-in">
              {apiError && (
                <div className="alert alert-danger py-2 d-flex align-items-center gap-2" role="alert">
                  <i className="bi bi-exclamation-triangle-fill flex-shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${fieldErrors.name ? 'is-invalid' : ''}`}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={isSaving}
                  />
                  {fieldErrors.name && <div className="invalid-feedback">{fieldErrors.name}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">
                    Phone <span className="text-danger">*</span>
                  </label>
                  <input
                    className={`form-control ${fieldErrors.phone ? 'is-invalid' : ''}`}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    disabled={isSaving}
                  />
                  {fieldErrors.phone && <div className="invalid-feedback">{fieldErrors.phone}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    disabled={isSaving}
                  />
                  {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Address</label>
                  <input
                    className="form-control"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <h3 className="h6 fw-semibold text-uppercase text-muted mb-3" style={{ letterSpacing: '0.04em' }}>
                Emergency Contact
              </h3>
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    value={form.emergencyName}
                    onChange={(e) => setForm({ ...form, emergencyName: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Phone</label>
                  <input
                    className="form-control"
                    value={form.emergencyPhone}
                    onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Relation</label>
                  <input
                    className="form-control"
                    value={form.emergencyRelation}
                    onChange={(e) => setForm({ ...form, emergencyRelation: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button type="button" className="btn btn-outline-secondary" disabled={isSaving} onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="row g-4 dhms-stagger-in">
              <div className="col-md-6">
                <div className="dhms-card p-4 h-100">
                  <h3 className="h6 fw-semibold text-uppercase text-muted mb-3" style={{ letterSpacing: '0.04em' }}>
                    Contact Information
                  </h3>
                  <div>
                    <InfoRow icon="bi-telephone" label="Phone" value={patient.phone} />
                    <InfoRow icon="bi-envelope" label="Email" value={patient.email} />
                    <div className="d-flex align-items-start gap-3 py-2">
                      <i className="bi bi-geo-alt text-muted mt-1 flex-shrink-0" style={{ width: 18 }} />
                      <div className="flex-grow-1 d-flex justify-content-between gap-2" style={{ minWidth: 0 }}>
                        <span className="text-muted flex-shrink-0">Address</span>
                        <span className="fw-medium text-end" style={{ overflowWrap: 'anywhere' }}>
                          {patient.address || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="dhms-card p-4 h-100">
                  <h3 className="h6 fw-semibold text-uppercase text-muted mb-3" style={{ letterSpacing: '0.04em' }}>
                    Emergency Contact
                  </h3>
                  <div>
                    <InfoRow icon="bi-person-heart" label="Name" value={patient.emergencyContact?.name} />
                    <InfoRow icon="bi-telephone" label="Phone" value={patient.emergencyContact?.phone} />
                    <div className="d-flex align-items-start gap-3 py-2">
                      <i className="bi bi-people text-muted mt-1 flex-shrink-0" style={{ width: 18 }} />
                      <div className="flex-grow-1 d-flex justify-content-between gap-2" style={{ minWidth: 0 }}>
                        <span className="text-muted flex-shrink-0">Relation</span>
                        <span className="fw-medium text-end" style={{ overflowWrap: 'anywhere' }}>
                          {patient.emergencyContact?.relation || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </PatientLayout>
  );
}

export default PatientProfile;
