function StatusBadge({ active }) {
  return (
    <span className={`dhms-badge ${active ? 'dhms-badge-success' : 'dhms-badge-danger'}`}>
      <span className="dhms-badge-dot" />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

export default StatusBadge;
