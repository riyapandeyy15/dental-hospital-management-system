// Inline loading indicator for a section of a page (a table, a card body).
// For a full-page loader (e.g. while auth is being restored), use
// LoadingScreen instead.
function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">{message}</span>
      </div>
      <p className="text-muted small mt-2 mb-0">{message}</p>
    </div>
  );
}

export default LoadingState;
