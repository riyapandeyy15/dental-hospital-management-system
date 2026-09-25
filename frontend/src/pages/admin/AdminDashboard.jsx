import { useAuth } from '../../context/AuthContext.jsx';
import AdminLayout from '../../layouts/AdminLayout.jsx';
import StatCard from '../../components/shared/StatCard.jsx';

function AdminDashboard() {
  const { user } = useAuth();

  return (
    <AdminLayout>
      <h2 className="h4 mb-1">Welcome, {user?.name}</h2>
      <p className="text-muted mb-4">Here's an overview of the hospital system.</p>

      <div className="row g-3 mb-4">
        <StatCard label="Total Patients" value="--" icon="bi-people" />
        <StatCard label="Total Doctors" value="--" icon="bi-person-badge" />
        <StatCard label="Today's Appointments" value="--" icon="bi-calendar-check" />
        <StatCard label="Pending Appointments" value="--" icon="bi-hourglass-split" />
      </div>

      <div className="alert alert-warning-subtle border border-warning-subtle mb-0">
        <i className="bi bi-info-circle me-2" />
        Dashboard statistics above are placeholders. They will show real data once the
        reporting API is built in a later phase.
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
