import { allergies, conditions } from '../services/health.service.js';
import { created, noContent, ok } from '../utils/response.js';

function handlers(service) {
  return {
    list: async (req, res) => ok(res, await service.list(req.valid.params.id)),
    create: async (req, res) => created(res, await service.create(req.valid.params.id, req.valid.body, req.user, req.ip)),
    update: async (req, res) => ok(res, await service.update(req.valid.params.id, req.valid.body, req.user, req.ip)),
    remove: async (req, res) => { await service.remove(req.valid.params.id, req.user, req.ip); noContent(res); },
  };
}

export const allergyController = handlers(allergies);
export const conditionController = handlers(conditions);
