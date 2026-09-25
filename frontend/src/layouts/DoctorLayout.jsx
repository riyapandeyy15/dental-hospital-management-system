import DashboardLayout from './DashboardLayout.jsx';

const DOCTOR_NAV_ITEMS = [
  { label: 'Dashboard', icon: 'bi-speedometer2', to: '/doctor/dashboard' },
  { label: 'My Appointments', icon: 'bi-calendar-check', disabled: true },
  { label: 'My Patients', icon: 'bi-people', disabled: true },
  { label: 'Dental Records', icon: 'bi-file-earmark-medical', disabled: true },
  { label: 'Prescriptions', icon: 'bi-file-earmark-text', disabled: true },
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
