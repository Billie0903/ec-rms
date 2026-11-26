import { ApiError } from '../utils/ApiError.js';
import * as health from '../models/health.model.js';
import * as residentModel from '../models/resident.model.js';
import * as audit from './audit.service.js';

export async function assertEditableResident(residentId) {
  const resident = await residentModel.findById(residentId);
  if (!resident) throw ApiError.notFound('Resident not found.');
  if (resident.status === 'archived') throw ApiError.conflict('This resident is archived. Restore the record before editing.');
  return resident;
}

export async function assertResident(residentId) {
  const resident = await residentModel.findById(residentId);
  if (!resident) throw ApiError.notFound('Resident not found.');
}

// Generic CRUD for a child record type, with audit entries that hold ids only.
function crud({ kind, list, find, create, update, remove }) {
  return {
    async list(residentId) { await assertResident(residentId); return list(residentId); },
    async create(residentId, data, actor, ip) {
      await assertEditableResident(residentId);
      const id = await create(residentId, data);
      await audit.record({ actorId: actor.id, action: `${kind}.create`, entityType: kind, entityId: id, ip });
      return find(id);
    },
    async update(id, data, actor, ip) {
      const existing = await find(id);
      if (!existing) throw ApiError.notFound();
      await assertEditableResident(existing.residentId);
      await update(id, data);
      await audit.record({ actorId: actor.id, action: `${kind}.update`, entityType: kind, entityId: id, ip });
      return find(id);
    },
    async remove(id, actor, ip) {
      const existing = await find(id);
      if (!existing) throw ApiError.notFound();
      await assertEditableResident(existing.residentId);
      await remove(id);
      await audit.record({ actorId: actor.id, action: `${kind}.delete`, entityType: kind, entityId: id, ip });
    },
  };
}

export const allergies = crud({
  kind: 'allergy', list: health.listAllergies, find: health.findAllergy,
  create: health.createAllergy, update: health.updateAllergy, remove: health.deleteAllergy,
});

export const conditions = crud({
  kind: 'condition', list: health.listConditions, find: health.findCondition,
  create: health.createCondition, update: health.updateCondition, remove: health.deleteCondition,
});
