import DashboardLayout from './DashboardLayout.jsx';

const PATIENT_NAV_ITEMS = [
  { label: 'Dashboard', icon: 'bi-speedometer2', to: '/patient/dashboard' },
  { label: 'Find a Doctor', icon: 'bi-search-heart', to: '/patient/find-doctor' },
  { label: 'My Appointments', icon: 'bi-calendar-check', to: '/patient/appointments' },
  { label: 'My Profile', icon: 'bi-person-circle', to: '/patient/profile' },
];

function PatientLayout({ children, title = 'Patient Dashboard', subtitle }) {
  return (
    <DashboardLayout title={title} subtitle={subtitle} navItems={PATIENT_NAV_ITEMS} offcanvasId="patientSidebar">
      {children}
    </DashboardLayout>
  );
}

export default PatientLayout;
