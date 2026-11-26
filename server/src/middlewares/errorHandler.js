import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { isProduction } from '../config/env.js';

export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} does not exist.`));
}

// Central error handler: every error leaves the API in the same shape.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    err = ApiError.badRequest('Some fields are invalid.', formatZodIssues(err));
  }

  if (err?.code === 'ER_DUP_ENTRY') {
    err = ApiError.conflict('This record already exists.');
  }

  if (err?.type === 'entity.parse.failed') {
    err = ApiError.badRequest('Request body is not valid JSON.');
  }

  if (!(err instanceof ApiError)) {
    console.error(err);
    err = new ApiError(500, 'INTERNAL_ERROR', isProduction ? 'Something went wrong. Please try again.' : err.message);
  }

  const body = { success: false, error: { code: err.code, message: err.message } };
  if (err.details) body.error.details = err.details;
  res.status(err.status).json(body);
}

export function formatZodIssues(zodError) {
  return zodError.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
}
