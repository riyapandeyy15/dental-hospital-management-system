import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext.jsx';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import StatCard from '../../components/shared/StatCard.jsx';
import SectionCard from '../../components/shared/SectionCard.jsx';
import LoadingState from '../../components/shared/LoadingState.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import * as adminReportsService from '../../api/adminReportsService.js';

const STATUS_META = {
  PENDING: { label: 'Pending', color: 'var(--dhms-warning)' },
  CONFIRMED: { label: 'Confirmed', color: 'var(--dhms-success)' },
  COMPLETED: { label: 'Completed', color: 'var(--dhms-navy)' },
  CANCELLED: { label: 'Cancelled', color: 'var(--dhms-danger)' },
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatTrendLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function AdminDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadError('');

    adminReportsService
      .getDashboard()
      .then((data) => {
        if (isMounted) setDashboard(data);
      })
      .catch((err) => {
        if (isMounted) setLoadError(err.response?.data?.message || 'Could not load dashboard statistics.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = dashboard?.stats;
  const maxTrendCount = dashboard ? Math.max(...dashboard.appointmentsTrend.map((d) => d.count), 1) : 1;
  const maxLoadCount = dashboard?.doctorLoad?.length ? Math.max(...dashboard.doctorLoad.map((d) => d.count)) : 1;

  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="h4 fw-semibold mb-1">
          {greeting()}, {user?.name}
        </h2>
        <p className="text-muted mb-0">Here's what's happening in your dental hospital today.</p>
      </div>

      {loadError && (
        <div className="alert alert-warning py-2" role="alert">
          {loadError}
        </div>
      )}

      <div className="row g-3 mb-3">
        <StatCard label="Total Patients" value={stats ? stats.totalPatients : '--'} icon="bi-people" isPlaceholder={!stats} />
        <StatCard
          label="Total Doctors"
          value={stats ? stats.totalDoctors : '--'}
          icon="bi-person-badge"
          isPlaceholder={!stats}
        />
        <StatCard
          label="Active Doctors"
          value={stats ? stats.activeDoctors : '--'}
          icon="bi-person-check"
          iconBg="var(--dhms-success-bg)"
          iconColor="var(--dhms-success)"
          isPlaceholder={!stats}
        />
        <StatCard
          label="Inactive Doctors"
          value={stats ? stats.inactiveDoctors : '--'}
          icon="bi-person-dash"
          iconBg="var(--dhms-danger-bg)"
          iconColor="var(--dhms-danger)"
          isPlaceholder={!stats}
        />
      </div>

      <div className="row g-3 mb-4">
        <StatCard
          label="Today's Appointments"
          value={stats ? stats.todayAppointments : '--'}
          icon="bi-calendar-check"
          iconBg="var(--dhms-warning-bg)"
          iconColor="var(--dhms-warning)"
          isPlaceholder={!stats}
        />
        <StatCard
          label="Pending Appointments"
          value={stats ? stats.pendingAppointments : '--'}
          icon="bi-hourglass-split"
          iconBg="var(--dhms-warning-bg)"
          iconColor="var(--dhms-warning)"
          isPlaceholder={!stats}
        />
        <StatCard
          label="Confirmed Appointments"
          value={stats ? stats.confirmedAppointments : '--'}
          icon="bi-calendar2-check"
          iconBg="var(--dhms-success-bg)"
          iconColor="var(--dhms-success)"
          isPlaceholder={!stats}
        />
        <StatCard
          label="Total Appointments"
          value={stats ? stats.totalAppointments : '--'}
          icon="bi-calendar3"
          isPlaceholder={!stats}
        />
      </div>

      {isLoading ? (
        <SectionCard className="mb-4">
          <LoadingState message="Loading dashboard statistics..." />
        </SectionCard>
      ) : dashboard ? (
        <>
          <div className="row g-3 mb-4">
            <div className="col-12 col-xl-7">
              <SectionCard title="Appointments (last 14 days)" className="h-100">
                {dashboard.appointmentsTrend.every((d) => d.count === 0) ? (
                  <EmptyState icon="bi-bar-chart" title="No appointments yet" message="Trend data will appear once appointments are booked." />
                ) : (
                  <div className="dhms-trend-chart">
                    {dashboard.appointmentsTrend.map((day) => (
                      <div className="dhms-trend-bar-col" key={day.date} title={`${formatTrendLabel(day.date)}: ${day.count} appointment${day.count === 1 ? '' : 's'}`}>
                        <div className="dhms-trend-bar-track">
                          <div
                            className="dhms-trend-bar"
                            style={{ height: `${Math.max((day.count / maxTrendCount) * 100, day.count > 0 ? 6 : 2)}%` }}
                          />
                        </div>
                        <div className="dhms-trend-bar-label">{formatTrendLabel(day.date)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            <div className="col-12 col-xl-5">
              <SectionCard title="Appointment Status Breakdown" className="h-100">
                {stats.totalAppointments === 0 ? (
                  <EmptyState icon="bi-pie-chart" title="No appointments yet" message="Status breakdown will appear once appointments exist." />
                ) : (
                  <>
                    <div className="dhms-status-bar">
                      {Object.entries(dashboard.statusBreakdown).map(([status, count]) =>
                        count > 0 ? (
                          <div
                            key={status}
                            className="dhms-status-bar-segment"
                            style={{ width: `${(count / stats.totalAppointments) * 100}%`, background: STATUS_META[status]?.color }}
                          />
                        ) : null
                      )}
                    </div>
                    <div className="dhms-status-legend">
                      {Object.entries(dashboard.statusBreakdown).map(([status, count]) => (
                        <div className="dhms-status-legend-item" key={status}>
                          <span className="dhms-status-legend-dot" style={{ background: STATUS_META[status]?.color }} />
                          <span>
                            {STATUS_META[status]?.label || status}: <strong>{count}</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </SectionCard>
            </div>
          </div>

          <SectionCard title="Busiest Doctors" subtitle="By total appointments booked" className="mb-4">
            {dashboard.doctorLoad.length === 0 ? (
              <EmptyState icon="bi-person-badge" title="No appointments yet" message="Doctor workload will appear once appointments are booked." />
            ) : (
              <div>
                {dashboard.doctorLoad.map((doc) => (
                  <div className="dhms-load-row" key={doc.doctorId}>
                    <div className="dhms-load-name text-truncate">
                      <div className="fw-medium text-truncate">Dr. {doc.name}</div>
                      <div className="text-muted small text-truncate">{doc.specialization}</div>
                    </div>
                    <div className="dhms-load-track">
                      <div className="dhms-load-fill" style={{ width: `${(doc.count / maxLoadCount) * 100}%` }} />
                    </div>
                    <div className="dhms-load-count">{doc.count}</div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </>
      ) : null}

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
          <Link to="/admin/patients" className="btn btn-outline-secondary d-inline-flex align-items-center gap-2">
            <i className="bi bi-people" />
            Manage Patients
          </Link>
          <Link to="/admin/appointments" className="btn btn-outline-secondary d-inline-flex align-items-center gap-2">
            <i className="bi bi-calendar3" />
            Manage Appointments
          </Link>
        </div>
      </SectionCard>
    </AdminLayout>
  );
}

export default AdminDashboard;
