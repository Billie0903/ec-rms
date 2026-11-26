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
