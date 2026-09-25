const ICON_BY_VARIANT = {
  danger: 'bi-exclamation-triangle-fill',
  success: 'bi-check-circle-fill',
  primary: 'bi-question-circle-fill',
};

const COLORS_BY_VARIANT = {
  danger: { bg: 'var(--dhms-danger-bg)', color: 'var(--dhms-danger)' },
  success: { bg: 'var(--dhms-success-bg)', color: 'var(--dhms-success)' },
  primary: { bg: 'var(--dhms-primary-light)', color: 'var(--dhms-primary-dark)' },
};

// A controlled confirm modal (not Bootstrap's data-bs-toggle API) so its
// visibility and the pending action stay in React state.
function ConfirmDialog({ show, title, message, confirmLabel = 'Confirm', confirmVariant = 'primary', onConfirm, onCancel, isSubmitting }) {
  if (!show) return null;

  const colors = COLORS_BY_VARIANT[confirmVariant] || COLORS_BY_VARIANT.primary;

  return (
    <>
      <div className="dhms-modal-backdrop" onClick={isSubmitting ? undefined : onCancel} />
      <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div
            className="modal-content dhms-modal-anim border-0 text-center"
            style={{ borderRadius: 'var(--dhms-radius)' }}
          >
            <div className="modal-body pt-4">
              <div
                className="dhms-stat-icon mx-auto mb-3"
                style={{ width: 56, height: 56, fontSize: '1.5rem', background: colors.bg, color: colors.color }}
              >
                <i className={`bi ${ICON_BY_VARIANT[confirmVariant] || ICON_BY_VARIANT.primary}`} />
              </div>
              <h5 className="fw-semibold mb-2">{title}</h5>
              <p className="text-muted mb-0">{message}</p>
            </div>
            <div className="modal-footer border-0 justify-content-center pb-4">
              <button type="button" className="btn btn-outline-secondary px-4" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="button" className={`btn btn-${confirmVariant} px-4`} onClick={onConfirm} disabled={isSubmitting}>
                {isSubmitting ? 'Please wait...' : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ConfirmDialog;
