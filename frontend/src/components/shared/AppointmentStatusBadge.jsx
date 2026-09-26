const STYLES = {
  PENDING: 'dhms-badge-warning',
  CONFIRMED: 'dhms-badge-success',
  COMPLETED: 'dhms-badge-success',
  CANCELLED: 'dhms-badge-danger',
};

const LABELS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

function AppointmentStatusBadge({ status }) {
  return (
    <span className={`dhms-badge ${STYLES[status] || 'dhms-badge-warning'}`}>
      <span className="dhms-badge-dot" />
      {LABELS[status] || status}
    </span>
  );
}

export default AppointmentStatusBadge;
