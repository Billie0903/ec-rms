import * as service from '../services/archiveRequest.service.js';
import { ok } from '../utils/response.js';

export async function list(req, res) {
  ok(res, await service.list(req.valid.query));
}

export async function review(req, res) {
  ok(res, await service.review(req.valid.params.id, req.valid.body, req.user, req.ip));
}
