import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext.jsx';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import StatCard from '../../components/shared/StatCard.jsx';
import SectionCard from '../../components/shared/SectionCard.jsx';
import * as doctorService from '../../api/doctorService.js';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

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
      <div className="mb-4">
        <h2 className="h4 fw-semibold mb-1">
          {greeting()}, {user?.name}
        </h2>
        <p className="text-muted mb-0">Here's what's happening in your dental hospital today.</p>
      </div>

      {statsError && (
        <div className="alert alert-warning py-2" role="alert">
          {statsError}
        </div>
      )}

      <div className="row g-3 mb-3">
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
          iconBg="var(--dhms-success-bg)"
          iconColor="var(--dhms-success)"
          isPlaceholder={!doctorStats}
        />
        <StatCard
          label="Inactive Doctors"
          value={doctorStats ? doctorStats.inactive : '--'}
          icon="bi-person-dash"
          iconBg="var(--dhms-danger-bg)"
          iconColor="var(--dhms-danger)"
          isPlaceholder={!doctorStats}
        />
      </div>

      <div className="row g-3 mb-4">
        <StatCard
          label="Today's Appointments"
          value="--"
          icon="bi-calendar-check"
          iconBg="var(--dhms-warning-bg)"
          iconColor="var(--dhms-warning)"
        />
        <StatCard
          label="Pending Appointments"
          value="--"
          icon="bi-hourglass-split"
          iconBg="var(--dhms-warning-bg)"
          iconColor="var(--dhms-warning)"
        />
      </div>

      <SectionCard title="Quick Actions" className="mb-4">
        <div className="d-flex flex-wrap gap-2">
          <Link to="/admin/doctors?new=1" className="btn btn-primary d-inline-flex align-items-center gap-2">
            <i className="bi bi-plus-lg" />
            Add Doctor
          </Link>
          <Link to="/admin/doctors" className="btn btn-outline-secondary d-inline-flex align-items-center gap-2">
            <i className="bi bi-person-badge" />
            Manage Doctors
          </Link>
        </div>
      </SectionCard>

      <div className="alert alert-warning-subtle border border-warning-subtle mb-0 d-flex align-items-start gap-2">
        <i className="bi bi-info-circle mt-1" />
        <div>
          Patient and appointment statistics above are placeholders. They will show real data
          once those modules are built in a later phase.
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
