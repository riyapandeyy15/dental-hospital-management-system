const mongoose = require('mongoose');

const Appointment = require('../../models/Appointment');

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

async function getDoctorDashboard(doctorId) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [
    todaysAppointments,
    upcomingAppointments,
    totalPatientsResult,
    pendingCount,
    completedCount,
    todayCount,
    upcomingCount,
  ] = await Promise.all([
    Appointment.find({ doctorId, appointmentDate: { $gte: todayStart, $lte: todayEnd } })
      .sort({ startTime: 1 })
      .populate('patientId', 'name phone')
      .lean(),
    Appointment.find({
      doctorId,
      appointmentDate: { $gt: todayEnd },
      status: { $in: ['PENDING', 'CONFIRMED'] },
    })
      .sort({ appointmentDate: 1, startTime: 1 })
      .limit(5)
      .populate('patientId', 'name phone')
      .lean(),
    Appointment.aggregate([
      // $match in a raw aggregation pipeline does not auto-cast strings to
      // ObjectId the way Mongoose's .find()/.countDocuments() do.
      { $match: { doctorId: new mongoose.Types.ObjectId(doctorId) } },
      { $group: { _id: '$patientId' } },
      { $count: 'count' },
    ]),
    Appointment.countDocuments({ doctorId, status: 'PENDING' }),
    Appointment.countDocuments({ doctorId, status: 'COMPLETED' }),
    Appointment.countDocuments({ doctorId, appointmentDate: { $gte: todayStart, $lte: todayEnd } }),
    Appointment.countDocuments({
      doctorId,
      appointmentDate: { $gt: todayEnd },
      status: { $in: ['PENDING', 'CONFIRMED'] },
    }),
  ]);

  const shapeAppointment = (appt) => ({
    id: appt._id.toString(),
    patientName: appt.patientId?.name || 'Unknown patient',
    patientPhone: appt.patientId?.phone || null,
    appointmentDate: appt.appointmentDate,
    startTime: appt.startTime,
    endTime: appt.endTime,
    status: appt.status,
    reason: appt.reason || null,
  });

  return {
    stats: {
      todayAppointments: todayCount,
      upcomingAppointments: upcomingCount,
      totalPatients: totalPatientsResult[0]?.count || 0,
      pendingAppointments: pendingCount,
      completedAppointments: completedCount,
    },
    todaysAppointments: todaysAppointments.map(shapeAppointment),
    upcomingAppointments: upcomingAppointments.map(shapeAppointment),
  };
}

module.exports = { getDoctorDashboard };
