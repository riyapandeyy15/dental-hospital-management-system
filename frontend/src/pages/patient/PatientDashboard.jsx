import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext.jsx';
import PatientLayout from '../../layouts/PatientLayout.jsx';
import StatCard from '../../components/shared/StatCard.jsx';
import SectionCard from '../../components/shared/SectionCard.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import ErrorState from '../../components/shared/ErrorState.jsx';
import AppointmentStatusBadge from '../../components/shared/AppointmentStatusBadge.jsx';
import { SkeletonStatCards, SkeletonCard } from '../../components/shared/Skeletons.jsx';
import * as patientPortalService from '../../api/patientPortalService.js';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function PatientDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setIsLoading(true);
    setError('');
    patientPortalService
      .getDashboard()
      .then(setData)
      .catch((err) => setError(err.response?.data?.message || 'Could not load your dashboard.'))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  return (
    <PatientLayout>
      <div className="dhms-hero-card mb-4 dhms-stagger-in">
        <i className="bi bi-heart-pulse-fill dhms-hero-card__icon" />
        <div className="dhms-hero-eyebrow mb-1">{todayLabel()}</div>
        <h2 className="h4 fw-bold mb-1 position-relative">
          {greeting()}, {user?.name?.split(' ')[0]}
        </h2>
        <p className="mb-0 position-relative" style={{ color: 'rgba(255,255,255,0.8)' }}>
          Welcome to your DentiFlow patient portal.
        </p>
      </div>

      {error ? (
        <div className="dhms-card">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : isLoading ? (
        <>
          <SkeletonStatCards count={2} />
          <div className="mt-4">
            <SkeletonCard height={140} />
          </div>
        </>
      ) : data ? (
        <>
          <div className="row g-4 mb-4">
            <div className="col-12 col-lg-7">
              <SectionCard title="Upcoming Appointment" className="h-100 dhms-stagger-in">
                {data.nextAppointment ? (
                  <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                    <div className="d-flex gap-3">
                      <div
                        className="dhms-stat-icon flex-shrink-0"
                        style={{ width: 52, height: 52, background: 'var(--dhms-primary-light)', color: 'var(--dhms-primary-dark)' }}
                      >
                        <i className="bi bi-calendar-heart" />
                      </div>
                      <div>
                        <h4 className="h6 fw-semibold mb-1">Dr. {data.nextAppointment.doctorName}</h4>
                        <p className="text-muted small mb-2">{data.nextAppointment.specialization}</p>
                        <p className="mb-2 small">
                          <i className="bi bi-calendar-event me-2 text-muted" />
                          {formatDate(data.nextAppointment.appointmentDate)} at {data.nextAppointment.startTime}
                        </p>
                        <AppointmentStatusBadge status={data.nextAppointment.status} />
                      </div>
                    </div>
                    <Link to="/patient/appointments" className="btn btn-outline-secondary btn-sm flex-shrink-0">
                      View All
                    </Link>
                  </div>
                ) : (
                  <EmptyState
                    icon="bi-calendar-plus"
                    title="No upcoming appointments"
                    message="Book an appointment with a doctor to get started."
                    actionLabel="Find a Doctor"
                    actionTo="/patient/find-doctor"
                  />
                )}
              </SectionCard>
            </div>

            <div className="col-12 col-lg-5">
              <div className="row g-3 h-100">
                <StatCard
                  label="Upcoming"
                  value={data.stats.upcomingAppointments}
                  icon="bi-calendar-check"
                  isPlaceholder={false}
                  colClass="col-6"
                />
                <StatCard
                  label="Completed"
                  value={data.stats.completedAppointments}
                  icon="bi-check-circle"
                  iconBg="var(--dhms-success-bg)"
                  iconColor="var(--dhms-success)"
                  isPlaceholder={false}
                  colClass="col-6"
                />
              </div>
            </div>
          </div>

          <SectionCard title="Quick Actions" className="mb-4 dhms-stagger-in">
            <div className="d-flex flex-wrap gap-2">
              <Link to="/patient/find-doctor" className="btn btn-primary d-inline-flex align-items-center gap-2">
                <i className="bi bi-search-heart" />
                Find a Doctor
              </Link>
              <Link to="/patient/appointments" className="btn btn-outline-secondary d-inline-flex align-items-center gap-2">
                <i className="bi bi-calendar-check" />
                My Appointments
              </Link>
              <Link to="/patient/profile" className="btn btn-outline-secondary d-inline-flex align-items-center gap-2">
                <i className="bi bi-person-circle" />
                My Profile
              </Link>
            </div>
          </SectionCard>

          <SectionCard title="Recent Appointments" className="dhms-stagger-in">
            {data.recentAppointments.length === 0 ? (
              <EmptyState
                icon="bi-calendar3"
                title="No appointments yet"
                message="Your appointment history will appear here."
                actionLabel="Find a Doctor"
                actionTo="/patient/find-doctor"
              />
            ) : (
              <div className="d-flex flex-column gap-1">
                {data.recentAppointments.map((appt) => (
                  <Link
                    key={appt.id}
                    to={`/patient/appointments/${appt.id}`}
                    className="d-flex align-items-center justify-content-between py-2 border-bottom text-decoration-none text-reset dhms-recent-appt-row"
                  >
                    <div>
                      <div className="fw-medium">Dr. {appt.doctorName}</div>
                      <div className="text-muted small">
                        {formatDate(appt.appointmentDate)} &middot; {appt.startTime}
                      </div>
                    </div>
                    <AppointmentStatusBadge status={appt.status} />
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </>
      ) : null}
    </PatientLayout>
  );
}

export default PatientDashboard;
