export function generateTimeSlots(startTime, endTime, interval = 30) {
  const slots = [];
  let [startHour, startMinute] = startTime.split(":").map(Number);
  let [endHour, endMinute] = endTime.split(":").map(Number);

  let current = new Date();
  current.setHours(startHour, startMinute, 0, 0);

  let end = new Date();
  end.setHours(endHour, endMinute, 0, 0);

  while (current < end) {
    slots.push(current.toTimeString().slice(0, 5)); // "HH:MM"
    current = new Date(current.getTime() + interval * 60000);
  }

  return slots;
}
