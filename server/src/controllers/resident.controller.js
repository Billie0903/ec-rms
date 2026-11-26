import * as service from '../services/resident.service.js';
import { created, ok } from '../utils/response.js';

export async function list(req, res) {
  const { rows, meta } = await service.list(req.valid.query);
  ok(res, rows, meta);
}

export async function get(req, res) {
  ok(res, await service.getById(req.valid.params.id));
}

export async function create(req, res) {
  created(res, await service.create(req.valid.body, req.user, req.ip));
}

export async function update(req, res) {
  ok(res, await service.update(req.valid.params.id, req.valid.body, req.user, req.ip));
}

export async function requestArchive(req, res) {
  created(res, await service.requestArchive(req.valid.params.id, req.valid.body.reason, req.user, req.ip));
}

export async function archive(req, res) {
  ok(res, await service.archiveDirect(req.valid.params.id, req.valid.body.reason, req.user, req.ip));
}

export async function restore(req, res) {
  ok(res, await service.restore(req.valid.params.id, req.user, req.ip));
}
