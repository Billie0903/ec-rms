import { withTransaction } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import * as relativeModel from '../models/relative.model.js';
import * as userModel from '../models/user.model.js';
import * as audit from './audit.service.js';
import { assertEditableResident, assertResident } from './health.service.js';
import { createInvite, deliverInvite } from './invite.service.js';

export async function list(residentId) {
  await assertResident(residentId);
  return relativeModel.listForResident(residentId);
}

/**
 * Admin links a relative to a resident and records consent.
 * Either picks an existing relative account or creates a new one (with an activation link).
 */
export async function link(residentId, data, actor, ip) {
  await assertEditableResident(residentId);

  const result = await withTransaction(async (conn) => {
    let user;
    let invite = null;

    if (data.newRelative) {
      const id = await userModel.create({ ...data.newRelative, role: 'relative' }, conn);
      user = await userModel.findById(id, conn);
      invite = await createInvite(user, actor.id, conn);
      await audit.record({ actorId: actor.id, action: 'user.create', entityType: 'user', entityId: id, after: { role: 'relative' }, ip }, conn);
    } else {
      user = await userModel.findById(data.relativeUserId, conn);
      if (!user) throw ApiError.notFound('Relative account not found.');
      if (user.role !== 'relative') throw ApiError.badRequest('Only accounts with the Relative role can be linked.');
    }

    const existing = await relativeModel.findByPair(residentId, user.id, conn);
    let linkId;
    if (existing?.active) throw ApiError.conflict('This relative is already linked to this resident.');
    if (existing) {
      await relativeModel.reactivate(existing.id, data, actor.id, conn);
      linkId = existing.id;
    } else {
      linkId = await relativeModel.create(residentId, user.id, data, actor.id, conn);
    }

    await audit.record({ actorId: actor.id, action: 'relative.link', entityType: 'resident', entityId: Number(residentId),
      after: { relativeUserId: user.id, accessLevel: data.accessLevel }, ip }, conn);
    return { link: await relativeModel.findById(linkId, conn), user, invite };
  });

  const delivery = result.invite ? await deliverInvite(result.user, result.invite) : {};
  return { link: result.link, ...delivery };
}

export async function update(linkId, data, actor, ip) {
  const existing = await relativeModel.findById(linkId);
  if (!existing) throw ApiError.notFound('Link not found.');
  await assertEditableResident(existing.residentId);
  await relativeModel.update(linkId, data);

  const action = data.active === false ? 'relative.unlink' : data.active === true && !existing.active ? 'relative.relink' : 'relative.update';
  await audit.record({ actorId: actor.id, action, entityType: 'resident', entityId: existing.residentId,
    before: { accessLevel: existing.accessLevel, active: existing.active },
    after: { accessLevel: data.accessLevel ?? existing.accessLevel, active: data.active ?? existing.active, relativeUserId: existing.relativeUserId }, ip });
  return relativeModel.findById(linkId);
}
