const Appointment = require('../../models/Appointment');
const { parseDateOnly } = require('../appointments/slot.service');

async function getPatientDashboard(patientId) {
  const today = parseDateOnly(new Date());

  const [nextAppointment, upcomingCount, pastCount, recentAppointments] = await Promise.all([
    Appointment.findOne({
      patientId,
      appointmentDate: { $gte: today },
      status: { $in: ['PENDING', 'CONFIRMED'] },
    })
      .sort({ appointmentDate: 1, startTime: 1 })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } }),
    Appointment.countDocuments({
      patientId,
      appointmentDate: { $gte: today },
      status: { $in: ['PENDING', 'CONFIRMED'] },
    }),
    Appointment.countDocuments({ patientId, status: 'COMPLETED' }),
    Appointment.find({ patientId })
      .sort({ appointmentDate: -1, startTime: -1 })
      .limit(5)
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .lean(),
  ]);

  function shape(appt) {
    return {
      id: appt._id.toString(),
      doctorName: appt.doctorId?.userId?.name || 'Doctor',
      specialization: appt.doctorId?.specialization || null,
      appointmentDate: appt.appointmentDate,
      startTime: appt.startTime,
      endTime: appt.endTime,
      status: appt.status,
      reason: appt.reason || null,
    };
  }

  return {
    nextAppointment: nextAppointment ? shape(nextAppointment.toObject()) : null,
    stats: { upcomingAppointments: upcomingCount, completedAppointments: pastCount },
    recentAppointments: recentAppointments.map(shape),
  };
}

module.exports = { getPatientDashboard };
