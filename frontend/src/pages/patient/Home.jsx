import { useEffect, useState } from 'react';

import axiosClient from '../../api/axiosClient';

function Home() {
  const [status, setStatus] = useState('checking');
  const [details, setDetails] = useState(null);

  useEffect(() => {
    axiosClient
      .get('/health')
      .then((response) => {
        setStatus('connected');
        setDetails(response.data);
      })
      .catch(() => {
        setStatus('error');
      });
  }, []);

  return (
    <div className="container py-5">
      <h1 className="mb-3">Dental Hospital Management System</h1>
      <p className="text-muted">Frontend scaffolding is running.</p>

      <div className="card mt-4" style={{ maxWidth: '480px' }}>
        <div className="card-body">
          <h5 className="card-title">Backend connection check</h5>

          {status === 'checking' && (
            <p className="card-text text-secondary">Checking backend health endpoint...</p>
          )}

          {status === 'connected' && (
            <>
              <p className="card-text text-success mb-1">Backend is reachable.</p>
              <pre className="bg-light p-2 rounded small mb-0">
                {JSON.stringify(details, null, 2)}
              </pre>
            </>
          )}

          {status === 'error' && (
            <p className="card-text text-danger mb-0">
              Could not reach the backend. Make sure the backend server is running on port 5000.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
