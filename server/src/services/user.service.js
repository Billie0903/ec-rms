import { withTransaction } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import * as userModel from '../models/user.model.js';
import * as audit from './audit.service.js';
import { createInvite, deliverInvite } from './invite.service.js';

export function list(query) {
  return userModel.list(query);
}

/** Create any account (staff or relative) and issue an activation link. */
export async function create(data, actor, ip) {
  const { user, link } = await withTransaction(async (conn) => {
    const id = await userModel.create(data, conn);
    const u = await userModel.findById(id, conn);
    const l = await createInvite(u, actor.id, conn);
    await audit.record({ actorId: actor.id, action: 'user.create', entityType: 'user', entityId: id, after: { role: data.role }, ip }, conn);
    return { user: u, link: l };
  });
  return { user, ...(await deliverInvite(user, link)) };
}

export async function update(id, data, actor, ip) {
  return withTransaction(async (conn) => {
    const before = await userModel.findById(id, conn);
    if (!before) throw ApiError.notFound('User not found.');

    if (data.status === 'invited' && before.status !== 'invited') throw ApiError.badRequest('An activated account cannot go back to invited.');
    if (data.status === 'active' && before.status === 'invited') throw ApiError.badRequest('The user must activate the account from their link.');

    const losesAdmin = before.role === 'admin' && before.status === 'active'
      && ((data.role && data.role !== 'admin') || data.status === 'disabled');
    if (losesAdmin && (await userModel.countActiveAdmins(conn)) <= 1) {
      throw ApiError.conflict('This is the last active Admin. Promote another user to Admin first.');
    }
    if (id === actor.id && data.status === 'disabled') throw ApiError.conflict('You cannot disable your own account.');

    await userModel.update(id, data, conn);
    const after = await userModel.findById(id, conn);

    if (data.role && data.role !== before.role) {
      await audit.record({ actorId: actor.id, action: data.role === 'admin' ? 'user.promote_admin' : 'user.role_change', entityType: 'user', entityId: id,
        before: { role: before.role }, after: { role: after.role }, ip }, conn);
    }
    if (data.status && data.status !== before.status) {
      await audit.record({ actorId: actor.id, action: `user.${data.status === 'disabled' ? 'disable' : 'enable'}`, entityType: 'user', entityId: id, ip }, conn);
    }
    if ((data.fullName && data.fullName !== before.full_name) || (data.phone !== undefined && data.phone !== before.phone)) {
      await audit.record({ actorId: actor.id, action: 'user.update', entityType: 'user', entityId: id, ip }, conn);
    }
    return after;
  });
}

export async function resendInvite(id, actor, ip) {
  const { user, link } = await withTransaction(async (conn) => {
    const u = await userModel.findById(id, conn);
    if (!u) throw ApiError.notFound('User not found.');
    if (u.status !== 'invited') throw ApiError.conflict('This account is already activated.');
    const l = await createInvite(u, actor.id, conn);
    await audit.record({ actorId: actor.id, action: 'user.resend_invite', entityType: 'user', entityId: id, ip }, conn);
    return { user: u, link: l };
  });
  return deliverInvite(user, link);
}
