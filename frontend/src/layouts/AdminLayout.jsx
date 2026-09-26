import DashboardLayout from './DashboardLayout.jsx';

const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', icon: 'bi-speedometer2', to: '/admin/dashboard' },
  { label: 'Patients', icon: 'bi-people', to: '/admin/patients' },
  { label: 'Doctors', icon: 'bi-person-badge', to: '/admin/doctors' },
  { label: 'Appointments', icon: 'bi-calendar-check', to: '/admin/appointments' },
  { label: 'Dental Records', icon: 'bi-file-earmark-medical', disabled: true },
  { label: 'Treatments', icon: 'bi-clipboard2-pulse', disabled: true },
  { label: 'Prescriptions', icon: 'bi-file-earmark-text', disabled: true },
  { label: 'AI Assistant', icon: 'bi-robot', disabled: true },
  { label: 'Settings', icon: 'bi-gear', disabled: true },
];

function AdminLayout({ children, title = 'Admin Dashboard', subtitle }) {
  return (
    <DashboardLayout title={title} subtitle={subtitle} navItems={ADMIN_NAV_ITEMS} offcanvasId="adminSidebar">
      {children}
    </DashboardLayout>
  );
}

export default AdminLayout;
