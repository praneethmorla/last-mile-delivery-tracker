import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { sendStatusNotification } from '../services/notificationService';
import { autoAssignAgent } from '../services/autoAssignment';

const router = Router();
const prisma = new PrismaClient();

async function assignNextPendingOrder() {
  try {
    const oldestPending = await prisma.order.findFirst({
      where: { status: 'PENDING', agentId: null },
      orderBy: { createdAt: 'asc' },
    });
    if (oldestPending) {
      await autoAssignAgent(oldestPending.id);
    }
  } catch (err) {
    console.error('Failed to auto-assign next pending order:', err);
  }
}

// Authenticated agent routes
router.use(authenticateJWT);
router.use(requireRole(['AGENT']));

// Helper to fetch current agent profile for the logged-in user
async function getAgentProfile(userId: string) {
  const profile = await prisma.agentProfile.findUnique({
    where: { userId },
    include: { user: true },
  });
  if (!profile) {
    throw new Error('Agent profile not found.');
  }
  return profile;
}

// Get agent's profile details
router.get('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = await getAgentProfile(req.user!.id);
    return res.json(profile);
  } catch (error: any) {
    return res.status(404).json({ error: error.message });
  }
});

// Update agent profile (availability, lat/lng, zone)
router.put('/profile', async (req: AuthenticatedRequest, res: Response) => {
  const { isAvailable, currentZoneId, currentLat, currentLng } = req.body;

  try {
    const profile = await getAgentProfile(req.user!.id);

    const updated = await prisma.agentProfile.update({
      where: { id: profile.id },
      data: {
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : undefined,
        currentZoneId: currentZoneId !== undefined ? currentZoneId : undefined,
        currentLat: currentLat !== undefined ? parseFloat(currentLat) : undefined,
        currentLng: currentLng !== undefined ? parseFloat(currentLng) : undefined,
      },
      include: { currentZone: true },
    });

    if (updated.isAvailable) {
      assignNextPendingOrder();
    }

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update profile.' });
  }
});

// List all orders assigned to this agent
router.get('/orders', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profile = await getAgentProfile(req.user!.id);

    const orders = await prisma.order.findMany({
      where: { agentId: profile.id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        pickupArea: { include: { zone: true } },
        dropArea: { include: { zone: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json(orders);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch assigned orders.' });
  }
});

// Update order status
router.post('/orders/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  const { status, notes } = req.body;
  const orderId = req.params.id;

  const validStatuses = ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const profile = await getAgentProfile(req.user!.id);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.agentId !== profile.id) {
      return res.status(403).json({ error: 'Access denied: this order is not assigned to you.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status },
      });

      // 2. Log in timeline
      await tx.orderTimeline.create({
        data: {
          orderId,
          status,
          actorId: req.user!.id,
          actorRole: 'AGENT',
          notes: notes || `Order status updated to ${status} by agent.`,
        },
      });

      // 3. If delivery is completed (DELIVERED) or has failed (FAILED), release agent availability
      if (['DELIVERED', 'FAILED'].includes(status)) {
        await tx.agentProfile.update({
          where: { id: profile.id },
          data: { isAvailable: true },
        });
      }

      return updatedOrder;
    });

    // 4. Trigger customer notification
    sendStatusNotification(orderId, status, notes).catch(err => console.error('Notification error:', err));

    if (['DELIVERED', 'FAILED'].includes(status)) {
      assignNextPendingOrder();
    }

    return res.json(result);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Failed to update order status.' });
  }
});

export default router;
