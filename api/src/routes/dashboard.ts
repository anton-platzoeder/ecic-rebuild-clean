import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate.js';
import { getPendingActionsForRoles, mockActivity, mockDataQuality, mockBatches } from '../data/mock/dashboard.js';

export default async function dashboardRoutes(fastify: FastifyInstance) {
  // GET /dashboard/pending-actions
  fastify.get('/dashboard/pending-actions', { preHandler: [authenticate] }, async (request) => {
    const user = request.user as { roles: string[] };
    return getPendingActionsForRoles(user.roles);
  });

  // GET /dashboard/activity
  fastify.get<{ Querystring: { limit?: string } }>('/dashboard/activity', { preHandler: [authenticate] }, async (request) => {
    const limit = parseInt(request.query.limit || '20', 10);
    return mockActivity.slice(0, limit);
  });

  // GET /dashboard/data-quality-summary
  fastify.get('/dashboard/data-quality-summary', { preHandler: [authenticate] }, async () => {
    return mockDataQuality;
  });

  // GET /report-batches (with optional status filter)
  fastify.get<{ Querystring: { status?: string; page?: string; pageSize?: string } }>(
    '/report-batches',
    { preHandler: [authenticate] },
    async (request) => {
      let batches = [...mockBatches];

      if (request.query.status) {
        batches = batches.filter(b => b.status === request.query.status);
      }

      const page = parseInt(request.query.page || '1', 10);
      const pageSize = parseInt(request.query.pageSize || '20', 10);
      const start = (page - 1) * pageSize;
      const items = batches.slice(start, start + pageSize);

      return {
        items,
        meta: {
          page,
          pageSize,
          totalItems: batches.length,
          totalPages: Math.ceil(batches.length / pageSize),
        },
      };
    },
  );

  // GET /report-batches/:id
  fastify.get<{ Params: { id: string } }>(
    '/report-batches/:id',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      const batch = mockBatches.find(b => b.id === id);
      if (!batch) {
        return reply.status(404).send({ code: 'NOT_FOUND', message: 'Batch not found' });
      }
      return batch;
    },
  );

  // GET /report-batches/:id/status (workflow status)
  fastify.get<{ Params: { id: string } }>(
    '/report-batches/:id/status',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      const batch = mockBatches.find(b => b.id === id);
      if (!batch) {
        return reply.status(404).send({ code: 'NOT_FOUND', message: 'Batch not found' });
      }

      const approvalLevelMap: Record<string, number | null> = {
        DataPreparation: null,
        Level1Pending: 1,
        Level2Pending: 2,
        Level3Pending: 3,
        Approved: null,
      };

      return {
        batchId: batch.id,
        currentStage: batch.status,
        isLocked: batch.status !== 'DataPreparation',
        canConfirm: batch.status === 'DataPreparation',
        canApprove: ['Level1Pending', 'Level2Pending', 'Level3Pending'].includes(batch.status),
        pendingApprovalLevel: approvalLevelMap[batch.status] ?? null,
        lastUpdated: batch.createdAt,
      };
    },
  );
}
