import * as users from '../services/user.service.js';
import * as relatives from '../services/relative.service.js';
import * as audit from '../services/audit.service.js';
import * as family from '../services/family.service.js';
import { created, ok } from '../utils/response.js';

export const userController = {
  list: async (req, res) => ok(res, await users.list(req.valid.query)),
  create: async (req, res) => created(res, await users.create(req.valid.body, req.user, req.ip)),
  update: async (req, res) => ok(res, await users.update(req.valid.params.id, req.valid.body, req.user, req.ip)),
  resendInvite: async (req, res) => ok(res, await users.resendInvite(req.valid.params.id, req.user, req.ip)),
};

export const relativeController = {
  list: async (req, res) => ok(res, await relatives.list(req.valid.params.id)),
  link: async (req, res) => created(res, await relatives.link(req.valid.params.id, req.valid.body, req.user, req.ip)),
  update: async (req, res) => ok(res, await relatives.update(req.valid.params.id, req.valid.body, req.user, req.ip)),
};

export const auditController = {
  list: async (req, res) => { const { rows, meta } = await audit.list(req.valid.query); ok(res, rows, meta); },
};

export const familyController = {
  list: async (req, res) => ok(res, await family.listResidents(req.user)),
  get: async (req, res) => ok(res, await family.getResident(req.valid.params.id, req.user)),
};
