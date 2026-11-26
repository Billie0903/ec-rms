import { ApiError } from '../utils/ApiError.js';
import * as care from '../models/care.model.js';
import * as audit from './audit.service.js';
import { assertEditableResident, assertResident } from './health.service.js';

const log = (actor, action, entityType, entityId, ip) => audit.record({ actorId: actor.id, action, entityType, entityId, ip });

async function loadOwned(find, id) {
  const row = await find(id);
  if (!row) throw ApiError.notFound();
  await assertEditableResident(row.residentId);
  return row;
}

export const medications = {
  async list(residentId, q) { await assertResident(residentId); return care.listMedications(residentId, { includeStopped: q.includeStopped === 'true' }); },
  async create(residentId, data, actor, ip) {
    await assertEditableResident(residentId);
    const id = await care.createMedication(residentId, data);
    await log(actor, 'medication.create', 'medication', id, ip);
    return care.findMedication(id);
  },
  async update(id, data, actor, ip) {
    await loadOwned(care.findMedication, id);
    await care.updateMedication(id, data);
    await log(actor, 'medication.update', 'medication', id, ip);
    return care.findMedication(id);
  },
  async stop(id, actor, ip) {
    const med = await loadOwned(care.findMedication, id);
    if (!med.active) throw ApiError.conflict('This medication is already stopped.');
    await care.stopMedication(id);
    await log(actor, 'medication.stop', 'medication', id, ip);
    return care.findMedication(id);
  },
};

export const vitals = {
  async list(residentId, q) { await assertResident(residentId); return care.listVitals(residentId, q); },
  async create(residentId, data, actor, ip) {
    await assertEditableResident(residentId);
    const id = await care.createVitals(residentId, data, actor.id);
    await log(actor, 'vitals.create', 'vital_signs', id, ip);
    return care.findVitals(id);
  },
};

export const careNotes = {
  async list(residentId, q) { await assertResident(residentId); return care.listCareNotes(residentId, q); },
  async create(residentId, data, actor, ip) {
    await assertEditableResident(residentId);
    const id = await care.createCareNote(residentId, data, actor.id);
    await log(actor, 'care_note.create', 'care_note', id, ip);
    return care.findCareNote(id);
  },
  async update(id, data, actor, ip) {
    const note = await loadOwned(care.findCareNote, id);
    if (actor.role !== 'admin' && note.authorId !== actor.id) throw ApiError.forbidden('Only the author or an Admin can edit this note.');
    await care.updateCareNote(id, data);
    await log(actor, 'care_note.update', 'care_note', id, ip);
    return care.findCareNote(id);
  },
  async remove(id, actor, ip) {
    await loadOwned(care.findCareNote, id);
    await care.deleteCareNote(id);
    await log(actor, 'care_note.delete', 'care_note', id, ip);
  },
};

export const schedules = {
  async list(residentId, q) { await assertResident(residentId); return care.listSchedules(residentId, q); },
  async create(residentId, data, actor, ip) {
    await assertEditableResident(residentId);
    const id = await care.createSchedule(residentId, data);
    await log(actor, 'schedule.create', 'schedule', id, ip);
    return care.findSchedule(id);
  },
  async update(id, data, actor, ip) {
    await loadOwned(care.findSchedule, id);
    await care.updateSchedule(id, data);
    await log(actor, 'schedule.update', 'schedule', id, ip);
    return care.findSchedule(id);
  },
  async remove(id, actor, ip) {
    await loadOwned(care.findSchedule, id);
    await care.deleteSchedule(id);
    await log(actor, 'schedule.delete', 'schedule', id, ip);
  },
};
