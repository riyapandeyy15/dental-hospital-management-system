import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext.jsx';
import DoctorLayout from '../../layouts/DoctorLayout.jsx';
import StatCard from '../../components/shared/StatCard.jsx';
import SectionCard from '../../components/shared/SectionCard.jsx';
import LoadingState from '../../components/shared/LoadingState.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import AppointmentStatusBadge from '../../components/shared/AppointmentStatusBadge.jsx';
import * as doctorPortalService from '../../api/doctorPortalService.js';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function AppointmentRow({ appointment, showDate }) {
  return (
    <div className="d-flex align-items-center justify-content-between py-2 border-bottom">
      <div>
        <div className="fw-medium">{appointment.patientName}</div>
        <div className="text-muted small">
          {showDate ? `${formatDate(appointment.appointmentDate)} · ` : ''}
          {appointment.startTime} &ndash; {appointment.endTime}
          {appointment.reason ? ` · ${appointment.reason}` : ''}
        </div>
      </div>
      <AppointmentStatusBadge status={appointment.status} />
    </div>
  );
}

function DoctorDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    doctorPortalService
      .getDashboard()
      .then((result) => {
        if (isMounted) setData(result);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.response?.data?.message || 'Could not load your dashboard.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DoctorLayout>
      <div className="mb-4">
        <h2 className="h4 fw-semibold mb-1">
          {greeting()}, Dr. {user?.name}
        </h2>
        <p className="text-muted mb-0">Here's your dental care overview for today.</p>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {isLoading ? (
        <LoadingState message="Loading your dashboard..." />
      ) : data ? (
        <>
          <div className="row g-3 mb-4">
            <StatCard label="Today's Appointments" value={data.stats.todayAppointments} icon="bi-calendar-check" iconBg="var(--dhms-primary-light)" iconColor="var(--dhms-primary-dark)" isPlaceholder={false} />
            <StatCard label="Upcoming Appointments" value={data.stats.upcomingAppointments} icon="bi-calendar-week" iconBg="var(--dhms-warning-bg)" iconColor="var(--dhms-warning)" isPlaceholder={false} />
            <StatCard label="Total Patients" value={data.stats.totalPatients} icon="bi-people" iconBg="var(--dhms-success-bg)" iconColor="var(--dhms-success)" isPlaceholder={false} />
            <StatCard label="Pending Appointments" value={data.stats.pendingAppointments} icon="bi-hourglass-split" iconBg="var(--dhms-danger-bg)" iconColor="var(--dhms-danger)" isPlaceholder={false} />
          </div>

          <div className="row g-3 mb-4">
            <div className="col-12 col-lg-6">
              <SectionCard title="Today's Appointments" bodyClassName="p-4 pt-0">
                {data.todaysAppointments.length === 0 ? (
                  <EmptyState icon="bi-calendar-x" title="No appointments today" message="Enjoy the quiet day." />
                ) : (
                  <div className="mt-3">
                    {data.todaysAppointments.map((appt) => (
                      <AppointmentRow key={appt.id} appointment={appt} />
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            <div className="col-12 col-lg-6">
              <SectionCard title="Upcoming Appointments" bodyClassName="p-4 pt-0">
                {data.upcomingAppointments.length === 0 ? (
                  <EmptyState icon="bi-calendar-plus" title="Nothing upcoming" message="No confirmed or pending appointments ahead yet." />
                ) : (
                  <div className="mt-3">
                    {data.upcomingAppointments.map((appt) => (
                      <AppointmentRow key={appt.id} appointment={appt} showDate />
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          </div>

          <SectionCard title="Quick Actions">
            <div className="d-flex flex-wrap gap-2">
              <Link to="/doctor/appointments" className="btn btn-primary d-inline-flex align-items-center gap-2">
                <i className="bi bi-calendar-check" />
                View Appointments
              </Link>
              <Link to="/doctor/patients" className="btn btn-outline-secondary d-inline-flex align-items-center gap-2">
                <i className="bi bi-people" />
                View Patients
              </Link>
              <Link to="/doctor/profile" className="btn btn-outline-secondary d-inline-flex align-items-center gap-2">
                <i className="bi bi-person-circle" />
                My Profile
              </Link>
            </div>
          </SectionCard>
        </>
      ) : null}
    </DoctorLayout>
  );
}

export default DoctorDashboard;
