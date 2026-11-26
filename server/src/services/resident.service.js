import { withTransaction } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import * as residentModel from '../models/resident.model.js';
import * as requestModel from '../models/deletionRequest.model.js';
import * as audit from './audit.service.js';

export async function list(query) {
  const { rows, total } = await residentModel.list(query);
  return { rows, meta: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) } };
}

export async function getById(id) {
  const resident = await residentModel.findById(id);
  if (!resident) throw ApiError.notFound('Resident not found.');
  const pendingArchiveRequest = await requestModel.findPendingForResident(id);
  return { ...resident, pendingArchiveRequest };
}

export async function create(data, actor, ip) {
  return withTransaction(async (conn) => {
    const id = await residentModel.create(data, actor.id, conn);
    const created = await residentModel.findById(id, conn);
    await audit.record({ actorId: actor.id, action: 'resident.create', entityType: 'resident', entityId: id, ip }, conn);
    return created;
  });
}

export async function update(id, data, actor, ip) {
  return withTransaction(async (conn) => {
    const before = await residentModel.findById(id, conn);
    if (!before) throw ApiError.notFound('Resident not found.');
    if (before.status === 'archived') throw ApiError.conflict('This resident is archived. Restore the record before editing.');

    await residentModel.update(id, data, conn);
    const after = await residentModel.findById(id, conn);
    const changed = diff(before, after);
    if (Object.keys(changed.after).length) {
      await audit.record({ actorId: actor.id, action: 'resident.update', entityType: 'resident', entityId: id, before: changed.before, after: changed.after, ip }, conn);
    }
    return after;
  });
}

/** Operator: ask an Admin to archive. At most one pending request per resident. */
export async function requestArchive(id, reason, actor, ip) {
  return withTransaction(async (conn) => {
    const resident = await residentModel.findById(id, conn);
    if (!resident) throw ApiError.notFound('Resident not found.');
    if (resident.status === 'archived') throw ApiError.conflict('This resident is already archived.');
    if (await requestModel.findPendingForResident(id, conn)) {
      throw ApiError.conflict('An archive request for this resident is already waiting for approval.');
    }
    const requestId = await requestModel.create({ residentId: id, requestedBy: actor.id, reason }, conn);
    await audit.record({ actorId: actor.id, action: 'resident.archive_request', entityType: 'resident', entityId: id, ip }, conn);
    return requestModel.findById(requestId, conn);
  });
}

/** Admin: archive directly with a reason (the single-Admin case). */
export async function archiveDirect(id, reason, actor, ip) {
  return withTransaction(async (conn) => {
    const resident = await residentModel.findById(id, conn);
    if (!resident) throw ApiError.notFound('Resident not found.');
    if (resident.status === 'archived') throw ApiError.conflict('This resident is already archived.');

    await residentModel.setArchived(id, true, conn);
    await requestModel.cancelPendingForResident(id, conn);
    await audit.record({ actorId: actor.id, action: 'resident.archive', entityType: 'resident', entityId: id,
      before: { status: resident.status }, after: { status: 'archived', reason }, ip }, conn);
    return residentModel.findById(id, conn);
  });
}

export async function restore(id, actor, ip) {
  return withTransaction(async (conn) => {
    const resident = await residentModel.findById(id, conn);
    if (!resident) throw ApiError.notFound('Resident not found.');
    if (resident.status !== 'archived') throw ApiError.conflict('This resident is not archived.');

    await residentModel.setArchived(id, false, conn);
    await audit.record({ actorId: actor.id, action: 'resident.restore', entityType: 'resident', entityId: id,
      before: { status: 'archived' }, after: { status: 'active' }, ip }, conn);
    return residentModel.findById(id, conn);
  });
}

function diff(before, after) {
  const out = { before: {}, after: {} };
  for (const key of Object.keys(after)) {
    if (['updatedAt', 'age'].includes(key)) continue;
    if (before[key] !== after[key]) { out.before[key] = before[key]; out.after[key] = after[key]; }
  }
  return out;
}
