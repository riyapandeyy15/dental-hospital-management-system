import { useState } from 'react';

function TreatmentFormModal({ show, records, onClose, onSubmit, apiError }) {
  const [form, setForm] = useState({
    dentalRecordId: records?.[0]?.id || '',
    procedureName: '',
    toothNumber: '',
    description: '',
    status: 'PLANNED',
    cost: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show) return null;

  function validate() {
    const errors = {};
    if (!form.dentalRecordId) errors.dentalRecordId = 'Select a dental record to link this treatment to.';
    if (!form.procedureName.trim()) errors.procedureName = 'Procedure name is required.';
    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        dentalRecordId: form.dentalRecordId,
        procedureName: form.procedureName.trim(),
        toothNumber: form.toothNumber.trim() || undefined,
        description: form.description.trim() || undefined,
        status: form.status,
        cost: form.cost === '' ? undefined : Number(form.cost),
      });
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
                <h5 className="modal-title fw-semibold">New Treatment</h5>
                <button type="button" className="btn-close" onClick={onClose} disabled={isSubmitting} aria-label="Close" />
              </div>
              <div className="modal-body pt-3">
                {apiError && (
                  <div className="alert alert-danger py-2 d-flex align-items-center gap-2" role="alert">
                    <i className="bi bi-exclamation-triangle-fill flex-shrink-0" />
                    <span>{apiError}</span>
                  </div>
                )}

                {(!records || records.length === 0) ? (
                  <div className="alert alert-warning-subtle border border-warning-subtle">
                    A treatment must be linked to a dental record. Create a dental record for this patient first.
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <label className="form-label">
                        Dental Record <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${fieldErrors.dentalRecordId ? 'is-invalid' : ''}`}
                        value={form.dentalRecordId}
                        onChange={(e) => setForm({ ...form, dentalRecordId: e.target.value })}
                        disabled={isSubmitting}
                      >
                        {records.map((record) => (
                          <option key={record.id} value={record.id}>
                            {new Date(record.visitDate).toLocaleDateString()} &ndash; {record.diagnosis || record.chiefComplaint || 'Visit'}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.dentalRecordId && <div className="invalid-feedback">{fieldErrors.dentalRecordId}</div>}
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-md-8">
                        <label className="form-label">
                          Procedure Name <span className="text-danger">*</span>
                        </label>
                        <input
                          className={`form-control ${fieldErrors.procedureName ? 'is-invalid' : ''}`}
                          value={form.procedureName}
                          onChange={(e) => setForm({ ...form, procedureName: e.target.value })}
                          disabled={isSubmitting}
                        />
                        {fieldErrors.procedureName && <div className="invalid-feedback">{fieldErrors.procedureName}</div>}
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Tooth Number</label>
                        <input
                          className="form-control"
                          value={form.toothNumber}
                          onChange={(e) => setForm({ ...form, toothNumber: e.target.value })}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={form.status}
                          onChange={(e) => setForm({ ...form, status: e.target.value })}
                          disabled={isSubmitting}
                        >
                          <option value="PLANNED">Planned</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Cost</label>
                        <input
                          type="number"
                          min="0"
                          className="form-control"
                          value={form.cost}
                          onChange={(e) => setForm({ ...form, cost: e.target.value })}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || !records || records.length === 0}>
                  {isSubmitting ? 'Saving...' : 'Save Treatment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default TreatmentFormModal;
