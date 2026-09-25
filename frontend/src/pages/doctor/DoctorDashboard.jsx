import { useAuth } from '../../context/AuthContext.jsx';
import DoctorLayout from '../../layouts/DoctorLayout.jsx';
import StatCard from '../../components/shared/StatCard.jsx';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function DoctorDashboard() {
  const { user } = useAuth();

  return (
    <DoctorLayout>
      <div className="mb-4">
        <h2 className="h4 fw-semibold mb-1">
          {greeting()}, Dr. {user?.name}
        </h2>
        <p className="text-muted mb-0">Here's your overview for today.</p>
      </div>

      <div className="row g-3 mb-4">
        <StatCard label="Today's Appointments" value="--" icon="bi-calendar-check" iconBg="var(--dhms-warning-bg)" iconColor="var(--dhms-warning)" />
        <StatCard label="Pending Appointments" value="--" icon="bi-hourglass-split" iconBg="var(--dhms-warning-bg)" iconColor="var(--dhms-warning)" />
        <StatCard label="My Patients" value="--" icon="bi-people" />
      </div>

      <div className="alert alert-warning-subtle border border-warning-subtle mb-0 d-flex align-items-start gap-2">
        <i className="bi bi-info-circle mt-1" />
        <div>Appointments and patient data will appear here once those modules are built in a later phase.</div>
      </div>
    </DoctorLayout>
  );
}

export default DoctorDashboard;
