// Mirrors server/src/validators/user.validator.js
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VN_PHONE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

export function validatePerson(f, { requireRole = false } = {}) {
  const e = {};
  if (f.fullName.trim().length < 2) e.fullName = 'Họ tên cần ít nhất 2 ký tự.';
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Vui lòng nhập email hợp lệ.';
  if (f.phone && !VN_PHONE.test(f.phone.replace(/[\s.-]/g, ''))) e.phone = 'Số điện thoại không hợp lệ (VD: 0901234567).';
  if (requireRole && !f.role) e.role = 'Vui lòng chọn vai trò.';
  return e;
}

export function validateLink(f) {
  const e = {};
  if (f.mode === 'existing' && !f.relativeUserId) e.relativeUserId = 'Vui lòng chọn tài khoản người thân.';
  if (f.mode === 'new') Object.assign(e, validatePerson(f));
  if (f.relationship.trim().length < 2) e.relationship = 'Vui lòng nhập quan hệ (VD: Con gái).';
  if (!f.consentConfirmed) e.consentConfirmed = 'Cần xác nhận đã ghi nhận sự đồng ý.';
  return e;
}
