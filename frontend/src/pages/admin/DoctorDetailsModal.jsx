import Avatar from '../../components/shared/Avatar.jsx';
import StatusBadge from '../../components/shared/StatusBadge.jsx';

// Read-only profile view. Only ever shown fields that toSafeDoctor() on the
// backend returns - passwordHash/JWT are never part of that payload, so
// there is nothing sensitive to accidentally leak here.
function DoctorDetailsModal({ show, doctor, onClose }) {
  if (!show || !doctor) return null;

  return (
    <>
      <div className="dhms-modal-backdrop" onClick={onClose} />
      <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div className="modal-content dhms-modal-anim border-0" style={{ borderRadius: 'var(--dhms-radius)' }}>
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-semibold">Doctor Profile</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>

            <div className="modal-body pt-2">
              <div className="d-flex align-items-center gap-3 mb-4">
                <Avatar name={doctor.name} size="lg" />
                <div>
                  <h4 className="h5 fw-semibold mb-1">{doctor.name}</h4>
                  <p className="text-muted mb-2">{doctor.specialization}</p>
                  <StatusBadge active={doctor.isActive} />
                </div>
              </div>

              <div className="row g-4">
                <div className="col-md-6">
                  <h6 className="text-uppercase text-muted small fw-semibold mb-3" style={{ letterSpacing: '0.04em' }}>
                    Contact Information
                  </h6>
                  <dl className="mb-0">
                    <div className="d-flex justify-content-between py-2 border-bottom">
                      <dt className="text-muted fw-normal">Email</dt>
                      <dd className="mb-0 text-end">{doctor.email}</dd>
                    </div>
                    <div className="d-flex justify-content-between py-2 border-bottom">
                      <dt className="text-muted fw-normal">Phone</dt>
                      <dd className="mb-0 text-end">{doctor.phone || '—'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="col-md-6">
                  <h6 className="text-uppercase text-muted small fw-semibold mb-3" style={{ letterSpacing: '0.04em' }}>
                    Professional Details
                  </h6>
                  <dl className="mb-0">
                    <div className="d-flex justify-content-between py-2 border-bottom">
                      <dt className="text-muted fw-normal">Registration No.</dt>
                      <dd className="mb-0 text-end">{doctor.registrationNumber || '—'}</dd>
                    </div>
                    <div className="d-flex justify-content-between py-2 border-bottom">
                      <dt className="text-muted fw-normal">Experience</dt>
                      <dd className="mb-0 text-end">
                        {doctor.experienceYears !== undefined && doctor.experienceYears !== null
                          ? `${doctor.experienceYears} years`
                          : '—'}
                      </dd>
                    </div>
                    <div className="d-flex justify-content-between py-2 border-bottom">
                      <dt className="text-muted fw-normal">Qualifications</dt>
                      <dd className="mb-0 text-end">{(doctor.qualifications || []).join(', ') || '—'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
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

export default DoctorDetailsModal;
