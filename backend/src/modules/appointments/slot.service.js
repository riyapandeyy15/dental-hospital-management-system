// Central appointment-slot configuration and generation logic. Every place
// that needs to know "what times can a doctor be booked at" (public
// availability lookup, patient booking validation, admin booking) goes
// through this one file, so the slot strategy is never duplicated or
// allowed to drift between call sites.

const DEFAULT_SLOT_DURATION_MINUTES = 30;

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

// Accepts either a Date object or a "YYYY-MM-DD" string and always returns
// a Date at LOCAL midnight for that calendar day. Deliberately avoids
// `new Date("YYYY-MM-DD")`, which the JS spec parses as UTC midnight - in
// any timezone other than UTC, calling .getDay() on that would silently
// shift the day-of-week by one day and miscalculate availability.
function parseDateOnly(dateInput) {
  if (dateInput instanceof Date) {
    const d = new Date(dateInput);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const [year, month, day] = String(dateInput).split('-').map(Number);
  return new Date(year, month - 1, day);
}

// availabilityEntries: Doctor.availability (array of {dayOfWeek, startTime,
// endTime, slotDurationMinutes}). bookedTimes: Set of "HH:MM" strings
// already taken (PENDING/CONFIRMED) for that doctor on that date.
function generateSlotsForDate(availabilityEntries, dateStr, bookedTimes) {
  const date = parseDateOnly(dateStr);
  const dayOfWeek = date.getDay();

  const todaysAvailability = (availabilityEntries || []).filter((entry) => entry.dayOfWeek === dayOfWeek);
  if (todaysAvailability.length === 0) {
    return [];
  }

  const now = new Date();
  const isToday = date.getTime() === parseDateOnly(now).getTime();

  const slots = [];

  for (const entry of todaysAvailability) {
    const duration = entry.slotDurationMinutes || DEFAULT_SLOT_DURATION_MINUTES;
    const startMinutes = timeToMinutes(entry.startTime);
    const endMinutes = timeToMinutes(entry.endTime);

    for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
      const startTime = minutesToTime(m);
      const endTime = minutesToTime(m + duration);

      if (isToday && m <= now.getHours() * 60 + now.getMinutes()) {
        continue; // don't offer slots that have already passed today
      }

      slots.push({
        startTime,
        endTime,
        status: bookedTimes.has(startTime) ? 'booked' : 'available',
      });
    }
  }

  return slots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

// Validates that a requested startTime actually falls on a real slot
// boundary within the doctor's configured availability for that date, and
// returns the matching { endTime } - used so a booking request can't sneak
// in an arbitrary time that was never actually offered.
function findSlotBoundary(availabilityEntries, dateStr, startTime) {
  const date = parseDateOnly(dateStr);
  const dayOfWeek = date.getDay();
  const todaysAvailability = (availabilityEntries || []).filter((entry) => entry.dayOfWeek === dayOfWeek);

  const requestedMinutes = timeToMinutes(startTime);

  for (const entry of todaysAvailability) {
    const duration = entry.slotDurationMinutes || DEFAULT_SLOT_DURATION_MINUTES;
    const startMinutes = timeToMinutes(entry.startTime);
    const endMinutes = timeToMinutes(entry.endTime);

    if (requestedMinutes < startMinutes || requestedMinutes + duration > endMinutes) continue;
    if ((requestedMinutes - startMinutes) % duration !== 0) continue;

    return { endTime: minutesToTime(requestedMinutes + duration) };
  }

  return null;
}

module.exports = {
  DEFAULT_SLOT_DURATION_MINUTES,
  generateSlotsForDate,
  findSlotBoundary,
  parseDateOnly,
};
