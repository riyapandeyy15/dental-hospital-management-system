import { useEffect, useState } from 'react';

import { useAuth } from '../../context/AuthContext.jsx';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import StatCard from '../../components/shared/StatCard.jsx';
import * as doctorService from '../../api/doctorService.js';

function AdminDashboard() {
  const { user } = useAuth();
  const [doctorStats, setDoctorStats] = useState(null);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    let isMounted = true;

    doctorService
      .listDoctors({ page: 1, limit: 1 })
      .then((result) => {
        if (isMounted) setDoctorStats(result.stats);
      })
      .catch(() => {
        if (isMounted) setStatsError('Could not load doctor statistics.');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AdminLayout>
      <h2 className="h4 mb-1">Welcome, {user?.name}</h2>
      <p className="text-muted mb-4">Here's an overview of the hospital system.</p>

      {statsError && (
        <div className="alert alert-warning py-2" role="alert">
          {statsError}
        </div>
      )}

      <div className="row g-3 mb-4">
        <StatCard label="Total Patients" value="--" icon="bi-people" />
        <StatCard
          label="Total Doctors"
          value={doctorStats ? doctorStats.total : '--'}
          icon="bi-person-badge"
          isPlaceholder={!doctorStats}
        />
        <StatCard
          label="Active Doctors"
          value={doctorStats ? doctorStats.active : '--'}
          icon="bi-person-check"
          isPlaceholder={!doctorStats}
        />
        <StatCard
          label="Inactive Doctors"
          value={doctorStats ? doctorStats.inactive : '--'}
          icon="bi-person-dash"
          isPlaceholder={!doctorStats}
        />
        <StatCard label="Today's Appointments" value="--" icon="bi-calendar-check" />
        <StatCard label="Pending Appointments" value="--" icon="bi-hourglass-split" />
      </div>

      <div className="alert alert-warning-subtle border border-warning-subtle mb-0">
        <i className="bi bi-info-circle me-2" />
        Patient and appointment statistics above are placeholders. They will show real data
        once those modules are built in a later phase.
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
