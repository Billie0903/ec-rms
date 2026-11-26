/** Error thrown for any non-2xx API response. */
export class ApiError extends Error {
  constructor(status, code, message, details = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Field errors as { fieldName: message } for forms. */
  get fieldErrors() {
    return Object.fromEntries(this.details.map((d) => [d.field, d.message]));
  }
}

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng và thử lại.');
  }

  if (res.status === 204) return null;

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const err = json?.error || {};
    throw new ApiError(res.status, err.code || 'UNKNOWN', err.message || 'Đã có lỗi xảy ra.', err.details);
  }
  return json;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body ?? {}),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};
