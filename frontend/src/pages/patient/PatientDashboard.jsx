import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext.jsx';
import PatientLayout from '../../layouts/PatientLayout.jsx';
import StatCard from '../../components/shared/StatCard.jsx';
import SectionCard from '../../components/shared/SectionCard.jsx';
import LoadingState from '../../components/shared/LoadingState.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import AppointmentStatusBadge from '../../components/shared/AppointmentStatusBadge.jsx';
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

function PatientDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    patientPortalService
      .getDashboard()
      .then((result) => {
        if (isMounted) setData(result);
      })
      .catch((err) => {
        if (isMounted) setError(err.response?.data?.message || 'Could not load your dashboard.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <PatientLayout>
      <div className="mb-4">
        <h2 className="h4 fw-semibold mb-1">
          {greeting()}, {user?.name}
        </h2>
        <p className="text-muted mb-0">Welcome to your DentiFlow dashboard.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {isLoading ? (
        <LoadingState message="Loading your dashboard..." />
      ) : data ? (
        <>
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <SectionCard title="Upcoming Appointment" className="h-100">
                {data.nextAppointment ? (
                  <div>
                    <h4 className="h5 fw-semibold mb-1">Dr. {data.nextAppointment.doctorName}</h4>
                    <p className="text-muted mb-2">{data.nextAppointment.specialization}</p>
                    <p className="mb-2">
                      <i className="bi bi-calendar-event me-2 text-muted" />
                      {formatDate(data.nextAppointment.appointmentDate)} at {data.nextAppointment.startTime}
                    </p>
                    <AppointmentStatusBadge status={data.nextAppointment.status} />
                  </div>
                ) : (
                  <EmptyState icon="bi-calendar-plus" title="No upcoming appointments" message="Book an appointment with a doctor to get started." />
                )}
              </SectionCard>
            </div>

            <div className="col-md-6">
              <div className="row g-3 h-100">
                <StatCard label="Upcoming" value={data.stats.upcomingAppointments} icon="bi-calendar-check" isPlaceholder={false} />
                <StatCard
                  label="Completed"
                  value={data.stats.completedAppointments}
                  icon="bi-check-circle"
                  iconBg="var(--dhms-success-bg)"
                  iconColor="var(--dhms-success)"
                  isPlaceholder={false}
                />
              </div>
            </div>
          </div>

          <SectionCard title="Quick Actions" className="mb-4">
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

          <SectionCard title="Recent Appointments">
            {data.recentAppointments.length === 0 ? (
              <EmptyState icon="bi-calendar3" title="No appointments yet" message="Your appointment history will appear here." />
            ) : (
              <div className="d-flex flex-column gap-2">
                {data.recentAppointments.map((appt) => (
                  <div key={appt.id} className="d-flex align-items-center justify-content-between py-2 border-bottom">
                    <div>
                      <div className="fw-medium">Dr. {appt.doctorName}</div>
                      <div className="text-muted small">
                        {formatDate(appt.appointmentDate)} &middot; {appt.startTime}
                      </div>
                    </div>
                    <AppointmentStatusBadge status={appt.status} />
                  </div>
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
