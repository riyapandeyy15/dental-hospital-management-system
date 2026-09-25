import { useAuth } from '../../context/AuthContext.jsx';
import DoctorLayout from '../../layouts/DoctorLayout.jsx';
import StatCard from '../../components/shared/StatCard.jsx';

function DoctorDashboard() {
  const { user } = useAuth();

  return (
    <DoctorLayout>
      <h2 className="h4 mb-1">Welcome, Dr. {user?.name}</h2>
      <p className="text-muted mb-4">Here's your overview for today.</p>

      <div className="row g-3 mb-4">
        <StatCard label="Today's Appointments" value="--" icon="bi-calendar-check" />
        <StatCard label="Pending Appointments" value="--" icon="bi-hourglass-split" />
        <StatCard label="My Patients" value="--" icon="bi-people" />
      </div>

      <div className="alert alert-warning-subtle border border-warning-subtle mb-0">
        <i className="bi bi-info-circle me-2" />
        Appointments and patient data will appear here once those modules are built in a
        later phase.
      </div>
    </DoctorLayout>
  );
}

export default DoctorDashboard;
