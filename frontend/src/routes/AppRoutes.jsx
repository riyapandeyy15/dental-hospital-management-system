import { Routes, Route, Navigate } from 'react-router-dom';

import Home from '../pages/patient/Home.jsx';
import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import Unauthorized from '../pages/Unauthorized.jsx';
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import DoctorManagement from '../pages/admin/DoctorManagement.jsx';
import AdminPatients from '../pages/admin/AdminPatients.jsx';
import AdminAppointments from '../pages/admin/AdminAppointments.jsx';
import DoctorDashboard from '../pages/doctor/DoctorDashboard.jsx';
import DoctorProfile from '../pages/doctor/DoctorProfile.jsx';
import DoctorPatients from '../pages/doctor/DoctorPatients.jsx';
import PatientDetails from '../pages/doctor/PatientDetails.jsx';
import DoctorAppointments from '../pages/doctor/DoctorAppointments.jsx';
import PatientDashboard from '../pages/patient/PatientDashboard.jsx';
import FindDoctor from '../pages/patient/FindDoctor.jsx';
import PublicDoctorProfile from '../pages/patient/PublicDoctorProfile.jsx';
import PatientAppointments from '../pages/patient/PatientAppointments.jsx';
import PatientAppointmentDetails from '../pages/patient/PatientAppointmentDetails.jsx';
import PatientProfile from '../pages/patient/PatientProfile.jsx';
import PublicLayout from '../layouts/PublicLayout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import { ROLES } from '../utils/constants.js';

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicLayout>
            <Home />
          </PublicLayout>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/doctors"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <DoctorManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/profile"
        element={
          <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
            <DoctorProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/patients"
        element={
          <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
            <DoctorPatients />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/patients/:id"
        element={
          <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
            <PatientDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor/appointments"
        element={
          <ProtectedRoute allowedRoles={[ROLES.DOCTOR]}>
            <DoctorAppointments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/patients"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminPatients />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/appointments"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <AdminAppointments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
            <PatientDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/find-doctor"
        element={
          <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
            <FindDoctor />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/doctors/:id"
        element={
          <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
            <PublicDoctorProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/appointments"
        element={
          <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
            <PatientAppointments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/appointments/:id"
        element={
          <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
            <PatientAppointmentDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/profile"
        element={
          <ProtectedRoute allowedRoles={[ROLES.PATIENT]}>
            <PatientProfile />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
