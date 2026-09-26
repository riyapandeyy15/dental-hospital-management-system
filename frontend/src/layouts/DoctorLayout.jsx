import DashboardLayout from './DashboardLayout.jsx';

const DOCTOR_NAV_ITEMS = [
  { label: 'Dashboard', icon: 'bi-speedometer2', to: '/doctor/dashboard' },
  { label: 'My Appointments', icon: 'bi-calendar-check', to: '/doctor/appointments' },
  { label: 'My Patients', icon: 'bi-people', to: '/doctor/patients' },
  { label: 'My Profile', icon: 'bi-person-circle', to: '/doctor/profile' },
  { label: 'Settings', icon: 'bi-gear', disabled: true },
];

function DoctorLayout({ children, title = 'Doctor Dashboard', subtitle }) {
  return (
    <DashboardLayout title={title} subtitle={subtitle} navItems={DOCTOR_NAV_ITEMS} offcanvasId="doctorSidebar">
      {children}
    </DashboardLayout>
  );
}

export default DoctorLayout;
