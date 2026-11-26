// Vietnamese labels for values stored in English in the database.
export const STATUS = { active: 'Đang ở', hospital: 'Đang nằm viện', discharged: 'Đã xuất viện', deceased: 'Đã mất', archived: 'Đã lưu trữ' };
export const GENDER = { male: 'Nam', female: 'Nữ', other: 'Khác' };
export const MOBILITY = { independent: 'Tự đi lại', walking_aid: 'Cần dụng cụ hỗ trợ', wheelchair: 'Xe lăn', bedridden: 'Nằm tại giường' };
export const FALL_RISK = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' };
export const ALLERGY_TYPE = { drug: 'Thuốc', food: 'Thực phẩm', other: 'Khác' };
export const SEVERITY = { mild: 'Nhẹ', moderate: 'Trung bình', severe: 'Nặng' };
export const REQUEST_STATUS = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối', cancelled: 'Đã hủy' };

export const options = (map) => Object.entries(map).map(([value, label]) => ({ value, label }));

/** '2026-11-26' or '2026-11-26 10:00:00' → '26/11/2026' (+ time) */
export function formatDate(value, withTime = false) {
  if (!value) return '—';
  const [date, time] = String(value).split(/[ T]/);
  const [y, m, d] = date.split('-');
  return withTime && time ? `${d}/${m}/${y} ${time.slice(0, 5)}` : `${d}/${m}/${y}`;
}

export const ROOM_SORT_LABELS = {
  'name:asc': 'Tên A → Z',
  'name:desc': 'Tên Z → A',
  'room:asc': 'Phòng tăng dần',
  'admissionDate:desc': 'Nhập viện gần đây nhất',
  'admissionDate:asc': 'Nhập viện lâu nhất',
  'age:desc': 'Lớn tuổi nhất',
  'age:asc': 'Ít tuổi nhất',
};

export const ROUTE = { oral: 'Uống', injection: 'Tiêm', topical: 'Bôi ngoài da', inhaled: 'Xịt / hít', other: 'Khác' };
export const NOTE_CATEGORY = { daily: 'Hằng ngày', health: 'Sức khỏe', incident: 'Sự cố', activity: 'Hoạt động' };
export const SCHEDULE_TYPE = { activity: 'Hoạt động', appointment: 'Lịch khám', therapy: 'Trị liệu', visit: 'Thăm viếng' };

/** Flags readings outside the usual range (SPEC §6). */
export const VITAL_FLAGS = {
  bp: (v) => v.bpSystolic != null && (v.bpSystolic >= 140 || v.bpDiastolic >= 90 || v.bpSystolic < 90),
  pulse: (v) => v.pulse != null && (v.pulse < 50 || v.pulse > 110),
  temperatureC: (v) => v.temperatureC != null && (v.temperatureC >= 37.5 || v.temperatureC < 35.5),
  spo2: (v) => v.spo2 != null && v.spo2 < 94,
  bloodSugarMmol: (v) => v.bloodSugarMmol != null && (v.bloodSugarMmol < 4 || v.bloodSugarMmol > 10),
};

/** Group key for schedule lists: 'Hôm nay', 'Ngày mai' or dd/mm/yyyy. */
export function dayLabel(dateTime) {
  const day = String(dateTime).slice(0, 10);
  const today = new Date();
  const fmt = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (day === fmt(today)) return 'Hôm nay';
  if (day === fmt(tomorrow)) return 'Ngày mai';
  return formatDate(day);
}

export const timeOf = (dateTime) => (dateTime ? String(dateTime).slice(11, 16) : '');
