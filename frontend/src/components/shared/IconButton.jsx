// Compact modern icon action button. `title` doubles as the native browser
// tooltip (no extra dependency needed) and `ariaLabel` keeps it accessible
// even when `title` is visually suppressed. `variant` only changes the
// hover tint - never changes what the button does.
function IconButton({ icon, title, ariaLabel, variant = 'view', onClick, disabled = false }) {
  return (
    <button
      type="button"
      className={`dhms-icon-btn dhms-icon-btn-${variant}`}
      title={title}
      aria-label={ariaLabel || title}
      onClick={onClick}
      disabled={disabled}
    >
      <i className={`bi ${icon}`} />
    </button>
  );
}

export default IconButton;
