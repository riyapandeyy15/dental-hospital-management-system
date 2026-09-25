function DoctorDetailsModal({ show, doctor, onClose }) {
  if (!show || !doctor) return null;

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Doctor Details</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <dl className="row mb-0">
                <dt className="col-5">Name</dt>
                <dd className="col-7">{doctor.name}</dd>

                <dt className="col-5">Email</dt>
                <dd className="col-7">{doctor.email}</dd>

                <dt className="col-5">Phone</dt>
                <dd className="col-7">{doctor.phone || '-'}</dd>

                <dt className="col-5">Specialization</dt>
                <dd className="col-7">{doctor.specialization}</dd>

                <dt className="col-5">Qualifications</dt>
                <dd className="col-7">{(doctor.qualifications || []).join(', ') || '-'}</dd>

                <dt className="col-5">Experience</dt>
                <dd className="col-7">
                  {doctor.experienceYears !== undefined && doctor.experienceYears !== null
                    ? `${doctor.experienceYears} years`
                    : '-'}
                </dd>

                <dt className="col-5">Registration No.</dt>
                <dd className="col-7">{doctor.registrationNumber || '-'}</dd>

                <dt className="col-5">Status</dt>
                <dd className="col-7">
                  <span className={`badge ${doctor.isActive ? 'bg-success' : 'bg-secondary'}`}>
                    {doctor.isActive ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </dl>
            </div>
            <div className="modal-footer">
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
