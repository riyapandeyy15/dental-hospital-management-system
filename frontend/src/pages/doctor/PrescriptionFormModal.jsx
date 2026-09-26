import { useState } from 'react';

const emptyMedicine = { name: '', dosage: '', frequency: '', durationDays: '', instructions: '' };

function PrescriptionFormModal({ show, records, onClose, onSubmit, apiError }) {
  const [dentalRecordId, setDentalRecordId] = useState(records?.[0]?.id || '');
  const [medicines, setMedicines] = useState([{ ...emptyMedicine }]);
  const [fieldError, setFieldError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show) return null;

  function updateMedicine(index, field, value) {
    setMedicines((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }

  function addMedicine() {
    setMedicines((prev) => [...prev, { ...emptyMedicine }]);
  }

  function removeMedicine(index) {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!dentalRecordId) {
      setFieldError('Select a dental record to link this prescription to.');
      return;
    }
    const invalid = medicines.some((m) => !m.name.trim() || !m.dosage.trim() || !m.frequency.trim());
    if (medicines.length === 0 || invalid) {
      setFieldError('Every medicine needs a name, dosage and frequency.');
      return;
    }
    setFieldError('');

    setIsSubmitting(true);
    try {
      await onSubmit({
        dentalRecordId,
        medicines: medicines.map((m) => ({
          name: m.name.trim(),
          dosage: m.dosage.trim(),
          frequency: m.frequency.trim(),
          durationDays: m.durationDays === '' ? undefined : Number(m.durationDays),
          instructions: m.instructions.trim() || undefined,
        })),
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
                <h5 className="modal-title fw-semibold">New Prescription</h5>
                <button type="button" className="btn-close" onClick={onClose} disabled={isSubmitting} aria-label="Close" />
              </div>
              <div className="modal-body pt-3">
                {apiError && (
                  <div className="alert alert-danger py-2 d-flex align-items-center gap-2" role="alert">
                    <i className="bi bi-exclamation-triangle-fill flex-shrink-0" />
                    <span>{apiError}</span>
                  </div>
                )}
                {fieldError && (
                  <div className="alert alert-danger py-2" role="alert">
                    {fieldError}
                  </div>
                )}

                {(!records || records.length === 0) ? (
                  <div className="alert alert-warning-subtle border border-warning-subtle">
                    A prescription must be linked to a dental record. Create a dental record for this patient first.
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <label className="form-label">
                        Dental Record <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={dentalRecordId}
                        onChange={(e) => setDentalRecordId(e.target.value)}
                        disabled={isSubmitting}
                      >
                        {records.map((record) => (
                          <option key={record.id} value={record.id}>
                            {new Date(record.visitDate).toLocaleDateString()} &ndash; {record.diagnosis || record.chiefComplaint || 'Visit'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <h6 className="text-uppercase text-muted small fw-semibold mb-3" style={{ letterSpacing: '0.04em' }}>
                      Medicines
                    </h6>

                    {medicines.map((medicine, index) => (
                      <div key={index} className="border rounded-3 p-3 mb-3">
                        <div className="row g-2">
                          <div className="col-md-4">
                            <label className="form-label small">Name</label>
                            <input
                              className="form-control form-control-sm"
                              value={medicine.name}
                              onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                              disabled={isSubmitting}
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label small">Dosage</label>
                            <input
                              className="form-control form-control-sm"
                              placeholder="e.g. 500mg"
                              value={medicine.dosage}
                              onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                              disabled={isSubmitting}
                            />
                          </div>
                          <div className="col-md-3">
                            <label className="form-label small">Frequency</label>
                            <input
                              className="form-control form-control-sm"
                              placeholder="e.g. Twice a day"
                              value={medicine.frequency}
                              onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                              disabled={isSubmitting}
                            />
                          </div>
                          <div className="col-md-2">
                            <label className="form-label small">Duration (days)</label>
                            <input
                              type="number"
                              min="1"
                              className="form-control form-control-sm"
                              value={medicine.durationDays}
                              onChange={(e) => updateMedicine(index, 'durationDays', e.target.value)}
                              disabled={isSubmitting}
                            />
                          </div>
                          <div className="col-md-10">
                            <label className="form-label small">Instructions</label>
                            <input
                              className="form-control form-control-sm"
                              placeholder="e.g. After meals"
                              value={medicine.instructions}
                              onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                              disabled={isSubmitting}
                            />
                          </div>
                          <div className="col-md-2 d-flex align-items-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger w-100"
                              onClick={() => removeMedicine(index)}
                              disabled={isSubmitting || medicines.length === 1}
                              aria-label="Remove medicine"
                            >
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={addMedicine} disabled={isSubmitting}>
                      <i className="bi bi-plus-lg me-1" />
                      Add another medicine
                    </button>
                  </>
                )}
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || !records || records.length === 0}>
                  {isSubmitting ? 'Saving...' : 'Issue Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default PrescriptionFormModal;
