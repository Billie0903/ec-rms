/** Vietnamese messages for API error codes. Falls back to the server's message. */
const BY_CODE = {
  NETWORK_ERROR: 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.',
  UNAUTHORIZED: 'Vui lòng đăng nhập.',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
  NOT_FOUND: 'Không tìm thấy dữ liệu.',
  TOO_MANY_REQUESTS: 'Bạn đã thử quá nhiều lần. Vui lòng đợi 15 phút rồi thử lại.',
  VALIDATION_ERROR: 'Một số thông tin chưa hợp lệ.',
  INTERNAL_ERROR: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
};

export function errorMessage(err, overrides = {}) {
  return overrides[err?.code] || BY_CODE[err?.code] || err?.message || BY_CODE.INTERNAL_ERROR;
}

export const ROLE_LABELS = { admin: 'Quản trị viên', operator: 'Nhân viên', relative: 'Người thân' };
