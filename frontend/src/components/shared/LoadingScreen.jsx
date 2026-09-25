function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div className="spinner-border text-primary mb-3" role="status">
        <span className="visually-hidden">Loading</span>
      </div>
      <p className="text-muted mb-0">{message}</p>
    </div>
  );
}

export default LoadingScreen;
