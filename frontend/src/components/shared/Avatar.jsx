function getInitials(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join('') || '?'
  );
}

function Avatar({ name, size = 'md' }) {
  return (
    <div className={`dhms-avatar ${size === 'lg' ? 'dhms-avatar--lg' : ''}`} aria-hidden="true">
      {getInitials(name)}
    </div>
  );
}

export default Avatar;
