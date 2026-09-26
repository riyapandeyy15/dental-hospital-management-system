import { useState } from 'react';

function DentalRecordFormModal({ show, onClose, onSubmit, apiError }) {
  const [form, setForm] = useState({ chiefComplaint: '', clinicalNotes: '', diagnosis: '', followUpRequired: false, followUpDate: '', followUpNotes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      chiefComplaint: form.chiefComplaint,
      clinicalNotes: form.clinicalNotes,
      diagnosis: form.diagnosis,
      followUp: {
        required: form.followUpRequired,
        date: form.followUpDate || undefined,
        notes: form.followUpNotes,
      },
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } catch {
      // apiError surfaced via prop
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
                <h5 className="modal-title fw-semibold">New Dental Record</h5>
                <button type="button" className="btn-close" onClick={onClose} disabled={isSubmitting} aria-label="Close" />
              </div>
              <div className="modal-body pt-3">
                {apiError && (
                  <div className="alert alert-danger py-2 d-flex align-items-center gap-2" role="alert">
                    <i className="bi bi-exclamation-triangle-fill flex-shrink-0" />
                    <span>{apiError}</span>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Chief Complaint</label>
                  <input
                    className="form-control"
                    value={form.chiefComplaint}
                    onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Clinical Notes</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={form.clinicalNotes}
                    onChange={(e) => setForm({ ...form, clinicalNotes: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Diagnosis</label>
                  <input
                    className="form-control"
                    value={form.diagnosis}
                    onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-check mb-2">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="followUpRequired"
                    checked={form.followUpRequired}
                    onChange={(e) => setForm({ ...form, followUpRequired: e.target.checked })}
                    disabled={isSubmitting}
                  />
                  <label className="form-check-label" htmlFor="followUpRequired">
                    Follow-up required
                  </label>
                </div>

                {form.followUpRequired && (
                  <div className="row g-3">
                    <div className="col-md-5">
                      <label className="form-label">Follow-up Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.followUpDate}
                        onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="col-md-7">
                      <label className="form-label">Follow-up Notes</label>
                      <input
                        className="form-control"
                        value={form.followUpNotes}
                        onChange={(e) => setForm({ ...form, followUpNotes: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default DentalRecordFormModal;
