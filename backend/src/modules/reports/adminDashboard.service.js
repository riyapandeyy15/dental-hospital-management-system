const mongoose = require('mongoose');

const Appointment = require('../../models/Appointment');
const Doctor = require('../../models/Doctor');
const Patient = require('../../models/Patient');
const { APPOINTMENT_STATUSES } = require('../../models/Appointment');

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

// Builds a "YYYY-MM-DD" key from LOCAL date components - matches the
// frontend's own local-date parsing so a trend day never appears shifted by
// a timezone offset.
function toLocalDateStr(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const TREND_DAYS = 14;
const DOCTOR_LOAD_LIMIT = 5;

async function getAdminDashboard() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const trendStart = startOfDay(new Date(now));
  trendStart.setDate(trendStart.getDate() - (TREND_DAYS - 1));

  const [
    totalPatients,
    totalDoctors,
    activeDoctors,
    todayAppointments,
    statusCounts,
    trendDocs,
    doctorLoadRows,
  ] = await Promise.all([
    Patient.countDocuments({}),
    Doctor.countDocuments({}),
    Doctor.countDocuments({ isActive: true }),
    Appointment.countDocuments({ appointmentDate: { $gte: todayStart, $lte: todayEnd } }),
    Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    // Grouped in JS on the LOCAL date, not via $dateToString (which formats
    // in UTC by default) - otherwise appointments would silently shift to
    // the wrong trend day in any timezone ahead of UTC (e.g. IST).
    Appointment.find({ appointmentDate: { $gte: trendStart, $lte: todayEnd } })
      .select('appointmentDate')
      .lean(),
    Appointment.aggregate([
      { $group: { _id: '$doctorId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: DOCTOR_LOAD_LIMIT },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor',
        },
      },
      { $unwind: '$doctor' },
      {
        $lookup: {
          from: 'users',
          localField: 'doctor.userId',
          foreignField: '_id',
          as: 'doctorUser',
        },
      },
      { $unwind: '$doctorUser' },
      {
        $project: {
          _id: 0,
          doctorId: '$_id',
          count: 1,
          name: '$doctorUser.name',
          specialization: '$doctor.specialization',
        },
      },
    ]),
  ]);

  const statusBreakdown = APPOINTMENT_STATUSES.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});
  statusCounts.forEach((row) => {
    statusBreakdown[row._id] = row.count;
  });

  const trendByDay = new Map();
  trendDocs.forEach((doc) => {
    const key = toLocalDateStr(new Date(doc.appointmentDate));
    trendByDay.set(key, (trendByDay.get(key) || 0) + 1);
  });
  const appointmentsTrend = [];
  for (let i = 0; i < TREND_DAYS; i += 1) {
    const day = new Date(trendStart);
    day.setDate(day.getDate() + i);
    const key = toLocalDateStr(day);
    appointmentsTrend.push({ date: key, count: trendByDay.get(key) || 0 });
  }

  const totalAppointments = APPOINTMENT_STATUSES.reduce((sum, status) => sum + statusBreakdown[status], 0);

  return {
    stats: {
      totalPatients,
      totalDoctors,
      activeDoctors,
      inactiveDoctors: totalDoctors - activeDoctors,
      todayAppointments,
      totalAppointments,
      pendingAppointments: statusBreakdown.PENDING,
      confirmedAppointments: statusBreakdown.CONFIRMED,
      completedAppointments: statusBreakdown.COMPLETED,
      cancelledAppointments: statusBreakdown.CANCELLED,
    },
    statusBreakdown,
    appointmentsTrend,
    doctorLoad: doctorLoadRows,
  };
}

module.exports = { getAdminDashboard };
