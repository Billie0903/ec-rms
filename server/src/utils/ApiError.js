/** An error with an HTTP status and a stable code the frontend can rely on. */
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details) { return new ApiError(400, 'VALIDATION_ERROR', message, details); }
  static unauthorized(message = 'Please log in.') { return new ApiError(401, 'UNAUTHORIZED', message); }
  static forbidden(message = 'You do not have permission to do this.') { return new ApiError(403, 'FORBIDDEN', message); }
  static notFound(message = 'Not found.') { return new ApiError(404, 'NOT_FOUND', message); }
  static conflict(message) { return new ApiError(409, 'CONFLICT', message); }
  static gone(message) { return new ApiError(410, 'GONE', message); }
}
