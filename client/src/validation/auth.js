// Mirrors server/src/validators/auth.validator.js. Returns { field: message } (empty when valid).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin({ email, password }) {
  const errors = {};
  if (!EMAIL_RE.test(email.trim())) errors.email = 'Vui lòng nhập email hợp lệ.';
  if (!password) errors.password = 'Vui lòng nhập mật khẩu.';
  return errors;
}

export function validateActivation({ password, confirmPassword, acceptPrivacy }) {
  const errors = {};
  if (password.length < 8) errors.password = 'Mật khẩu cần ít nhất 8 ký tự.';
  else if (password.length > 72) errors.password = 'Mật khẩu tối đa 72 ký tự.';
  else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) errors.password = 'Mật khẩu cần có cả chữ và số.';
  if (confirmPassword !== password) errors.confirmPassword = 'Mật khẩu nhập lại không khớp.';
  if (!acceptPrivacy) errors.acceptPrivacy = 'Bạn cần đồng ý với thông báo bảo mật để tiếp tục.';
  return errors;
}
