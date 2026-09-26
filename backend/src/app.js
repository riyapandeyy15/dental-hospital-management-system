const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

const env = require('./config/env');
const authRoutes = require('./modules/auth/auth.routes');
const doctorRoutes = require('./modules/doctors/doctor.routes');
const doctorSelfRoutes = require('./modules/doctors/doctorSelf.routes');
const doctorDashboardRoutes = require('./modules/reports/doctorDashboard.routes');
const doctorPatientRoutes = require('./modules/patients/patient.routes');
const doctorAppointmentRoutes = require('./modules/appointments/appointment.routes');
const dentalRecordRoutes = require('./modules/dentalRecords/dentalRecord.routes');
const treatmentRoutes = require('./modules/treatments/treatment.routes');
const prescriptionRoutes = require('./modules/prescriptions/prescription.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

app.use('/api/v1/auth', authRoutes);

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
