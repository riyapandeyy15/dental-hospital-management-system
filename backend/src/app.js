const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

const env = require('./config/env');
const authRoutes = require('./modules/auth/auth.routes');
const doctorRoutes = require('./modules/doctors/doctor.routes');
const doctorSelfRoutes = require('./modules/doctors/doctorSelf.routes');
const doctorPublicRoutes = require('./modules/doctors/doctorPublic.routes');
const doctorDashboardRoutes = require('./modules/reports/doctorDashboard.routes');
const doctorPatientRoutes = require('./modules/patients/patient.routes');
const doctorAppointmentRoutes = require('./modules/appointments/appointment.routes');
const dentalRecordRoutes = require('./modules/dentalRecords/dentalRecord.routes');
const treatmentRoutes = require('./modules/treatments/treatment.routes');
const prescriptionRoutes = require('./modules/prescriptions/prescription.routes');

// Phase 7 - patient portal
const patientSelfRoutes = require('./modules/patients/patientSelf.routes');
const patientDashboardRoutes = require('./modules/reports/patientDashboard.routes');
const patientAppointmentRoutes = require('./modules/appointments/patientAppointment.routes');
const adminPatientRoutes = require('./modules/patients/adminPatient.routes');
const adminAppointmentRoutes = require('./modules/appointments/adminAppointment.routes');

// Phase 8 - admin reports/dashboard
const adminDashboardRoutes = require('./modules/reports/adminDashboard.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

app.use('/api/v1/auth', authRoutes);

// Public doctor browsing (Phase 7) - mounted BEFORE the admin-only
// /api/v1/doctors router below, so /api/v1/doctors/public/* resolves here
// first and never hits the ADMIN-only middleware on that router.
app.use('/api/v1/doctors/public', doctorPublicRoutes);

// Admin-only doctor management (Phase 5).
app.use('/api/v1/doctors', doctorRoutes);

// Doctor-portal routes (Phase 6) - all require the DOCTOR role and are
// always scoped to the authenticated doctor, never a client-supplied id.
app.use('/api/v1/doctor/profile', doctorSelfRoutes);
app.use('/api/v1/doctor/dashboard', doctorDashboardRoutes);
app.use('/api/v1/doctor/patients', doctorPatientRoutes);
app.use('/api/v1/doctor/appointments', doctorAppointmentRoutes);
app.use('/api/v1/doctor', dentalRecordRoutes);
app.use('/api/v1/doctor', treatmentRoutes);
app.use('/api/v1/doctor', prescriptionRoutes);

// Patient-portal routes (Phase 7) - all require the PATIENT role and are
// always scoped to the authenticated patient, never a client-supplied id.
app.use('/api/v1/patient/profile', patientSelfRoutes);
app.use('/api/v1/patient/dashboard', patientDashboardRoutes);
app.use('/api/v1/patient/appointments', patientAppointmentRoutes);

// Admin-only patient and appointment management (Phase 7).
app.use('/api/v1/patients', adminPatientRoutes);
app.use('/api/v1/appointments', adminAppointmentRoutes);

// Admin dashboard/reports (Phase 8) - aggregate statistics only, no
// per-record management lives here.
app.use('/api/v1/admin/dashboard', adminDashboardRoutes);

// Health check endpoint - confirms the API process is running and reports
// whether the MongoDB connection is currently up.
app.get('/api/v1/health', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];

  res.status(200).json({
    status: 'ok',
    service: 'dental-hms-backend',
    database: dbStates[mongoose.connection.readyState] || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler for unknown routes.
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// Central error handler.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
  });
});

module.exports = app;
