// Mirrors server/src/validators/resident.validator.js. Returns { field: message }.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const todayStr = () => new Date().toISOString().slice(0, 10);

function age(dob) {
  const [y, m, d] = dob.split('-').map(Number);
  const [ty, tm, td] = todayStr().split('-').map(Number);
  return ty - y - (tm < m || (tm === m && td < d) ? 1 : 0);
}

export function validateResident(f) {
  const e = {};
  const name = f.fullName.trim();
  if (name.length < 2) e.fullName = 'Họ tên cần ít nhất 2 ký tự.';
  else if (name.length > 100) e.fullName = 'Họ tên tối đa 100 ký tự.';

  if (!DATE_RE.test(f.dateOfBirth)) e.dateOfBirth = 'Vui lòng chọn ngày sinh.';
  else if (age(f.dateOfBirth) < 50 || age(f.dateOfBirth) > 120) e.dateOfBirth = 'Tuổi phải từ 50 đến 120.';

  if (!f.gender) e.gender = 'Vui lòng chọn giới tính.';

  if (!DATE_RE.test(f.admissionDate)) e.admissionDate = 'Vui lòng chọn ngày nhập viện.';
  else if (f.admissionDate > todayStr()) e.admissionDate = 'Ngày nhập viện không được ở tương lai.';
  else if (DATE_RE.test(f.dateOfBirth) && f.admissionDate < f.dateOfBirth) e.admissionDate = 'Ngày nhập viện phải sau ngày sinh.';

  if (f.room && f.room.length > 20) e.room = 'Số phòng tối đa 20 ký tự.';
  for (const [k, max] of [['dietNotes', 255], ['cognitiveStatus', 255], ['primaryDoctor', 100], ['preferredHospital', 150]]) {
    if (f[k] && f[k].length > max) e[k] = `Tối đa ${max} ký tự.`;
  }
  return e;
}

export function validateReason(reason) {
  const r = reason.trim();
  if (r.length < 10) return 'Lý do cần ít nhất 10 ký tự.';
  if (r.length > 500) return 'Lý do tối đa 500 ký tự.';
  return '';
}

export function validateAllergy(f) {
  const e = {};
  if (f.allergen.trim().length < 2) e.allergen = 'Tên chất gây dị ứng cần ít nhất 2 ký tự.';
  if (!f.type) e.type = 'Vui lòng chọn loại.';
  return e;
}

export function validateCondition(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Tên bệnh cần ít nhất 2 ký tự.';
  if (f.sinceDate && f.sinceDate > todayStr()) e.sinceDate = 'Ngày không được ở tương lai.';
  return e;
}
