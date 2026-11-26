import { withTransaction } from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import * as requestModel from '../models/deletionRequest.model.js';
import * as residentModel from '../models/resident.model.js';
import * as audit from './audit.service.js';

export function list(query) {
  return requestModel.list(query);
}

/** Admin approves or rejects. Approving archives the resident in the same transaction. */
export async function review(id, { decision, note }, actor, ip) {
  return withTransaction(async (conn) => {
    const request = await requestModel.findById(id, conn, { forUpdate: true });
    if (!request) throw ApiError.notFound('Archive request not found.');
    if (request.status !== 'pending') throw ApiError.conflict('This request has already been reviewed.');
    if (request.requestedById === actor.id) throw ApiError.forbidden('You cannot review your own request.');

    if (decision === 'approve') {
      await residentModel.setArchived(request.residentId, true, conn);
      await requestModel.review(id, { status: 'approved', reviewedBy: actor.id, note }, conn);
      await audit.record({ actorId: actor.id, action: 'resident.archive', entityType: 'resident', entityId: request.residentId,
        before: { status: request.residentStatus }, after: { status: 'archived', requestId: id }, ip }, conn);
    } else {
      await requestModel.review(id, { status: 'rejected', reviewedBy: actor.id, note }, conn);
      await audit.record({ actorId: actor.id, action: 'resident.archive_reject', entityType: 'resident', entityId: request.residentId,
        after: { requestId: id }, ip }, conn);
    }
    return requestModel.findById(id, conn);
  });
}
