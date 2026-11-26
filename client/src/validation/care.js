// Mirrors server/src/validators/care.validator.js. Returns { field: message }.
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateMedication(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Tên thuốc cần ít nhất 2 ký tự.';
  if (!f.dosage.trim()) e.dosage = 'Vui lòng nhập liều dùng.';
  const times = f.timesOfDay.filter(Boolean);
  if (times.length === 0) e.timesOfDay = 'Thêm ít nhất một giờ uống.';
  else if (times.some((t) => !TIME.test(t))) e.timesOfDay = 'Giờ không hợp lệ.';
  if (!f.startDate) e.startDate = 'Vui lòng chọn ngày bắt đầu.';
  if (f.endDate && f.startDate && f.endDate < f.startDate) e.endDate = 'Ngày kết thúc không được trước ngày bắt đầu.';
  return e;
}

const RANGES = {
  bpSystolic: [50, 250, 'Huyết áp tâm thu'], bpDiastolic: [30, 150, 'Huyết áp tâm trương'], pulse: [30, 200, 'Mạch'],
  temperatureC: [34, 42, 'Nhiệt độ'], spo2: [50, 100, 'SpO2'], weightKg: [20, 200, 'Cân nặng'], bloodSugarMmol: [1, 35, 'Đường huyết'],
};

export function validateVitals(f) {
  const e = {};
  for (const [k, [min, max, label]] of Object.entries(RANGES)) {
    if (f[k] === '') continue;
    const n = Number(f[k]);
    if (Number.isNaN(n) || n < min || n > max) e[k] = `${label} phải từ ${min} đến ${max}.`;
  }
  if ((f.bpSystolic === '') !== (f.bpDiastolic === '')) e.bpDiastolic = 'Nhập đủ cả hai chỉ số huyết áp.';
  if (Object.keys(RANGES).every((k) => f[k] === '')) e.form = 'Nhập ít nhất một chỉ số.';
  return e;
}

export function validateCareNote(f) {
  const e = {};
  const n = f.note.trim();
  if (n.length < 5) e.note = 'Ghi chú cần ít nhất 5 ký tự.';
  else if (n.length > 2000) e.note = 'Ghi chú tối đa 2000 ký tự.';
  return e;
}

export function validateSchedule(f) {
  const e = {};
  if (f.title.trim().length < 2) e.title = 'Tiêu đề cần ít nhất 2 ký tự.';
  if (!f.startAt) e.startAt = 'Vui lòng chọn thời gian bắt đầu.';
  if (f.endAt && f.startAt && f.endAt < f.startAt) e.endAt = 'Thời gian kết thúc không được trước thời gian bắt đầu.';
  return e;
}
