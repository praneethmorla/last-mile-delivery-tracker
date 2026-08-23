import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { calculateOrderCharge } from '../services/rateEngine';
import { autoAssignAgent } from '../services/autoAssignment';
import { sendStatusNotification } from '../services/notificationService';

const router = Router();
const prisma = new PrismaClient();

// Authenticated customer routes
router.use(authenticateJWT);
router.use(requireRole(['CUSTOMER']));

// Get all areas for selection
router.get('/areas', async (req, res) => {
  try {
    const areas = await prisma.area.findMany({
      include: { zone: true },
      orderBy: { postalCode: 'asc' },
    });
    return res.json(areas);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch areas.' });
  }
});

// Preview pricing before placing order
router.post('/orders/preview', async (req, res) => {
  const { pickupAreaId, dropAreaId, length, width, height, actualWeight, orderType, paymentType } = req.body;

  if (!pickupAreaId || !dropAreaId || !length || !width || !height || !actualWeight || !orderType || !paymentType) {
    return res.status(400).json({ error: 'Missing pricing parameters.' });
  }

  try {
    const pricing = await calculateOrderCharge({
      pickupAreaId,
      dropAreaId,
      length: parseFloat(length),
      width: parseFloat(width),
      height: parseFloat(height),
      actualWeight: parseFloat(actualWeight),
      orderType,
      paymentType,
    });
    return res.json(pricing);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Pricing calculation failed.' });
  }
});

// Place a new order
router.post('/orders', async (req: AuthenticatedRequest, res: Response) => {
  const customerId = req.user?.id;
  if (!customerId) return res.status(401).json({ error: 'Unauthorized.' });

  const {
    pickupAddress,
    pickupAreaId,
    dropAddress,
    dropAreaId,
    length,
    width,
    height,
    actualWeight,
    orderType,
    paymentType,
  } = req.body;

  if (
    !pickupAddress ||
    !pickupAreaId ||
    !dropAddress ||
    !dropAreaId ||
    !length ||
    !width ||
    !height ||
    !actualWeight ||
    !orderType ||
    !paymentType
  ) {
    return res.status(400).json({ error: 'Missing required order fields.' });
  }

  try {
    // 1. Calculate final charges
    const pricing = await calculateOrderCharge({
      pickupAreaId,
      dropAreaId,
      length: parseFloat(length),
      width: parseFloat(width),
      height: parseFloat(height),
      actualWeight: parseFloat(actualWeight),
      orderType,
      paymentType,
    });

    // 2. Create the order
    const order = await prisma.order.create({
      data: {
        customerId,
        pickupAddress,
        pickupAreaId,
        dropAddress,
        dropAreaId,
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height),
        actualWeight: parseFloat(actualWeight),
        volumetricWeight: pricing.volumetricWeight,
        chargeableWeight: pricing.chargeableWeight,
        orderType,
        paymentType,
        codSurcharge: pricing.codSurcharge,
        deliveryCharge: pricing.deliveryCharge,
        totalCharge: pricing.totalCharge,
        status: 'PENDING',
      },
    });

    // 3. Create initial timeline log
    await prisma.orderTimeline.create({
      data: {
        orderId: order.id,
        status: 'PENDING',
        actorId: customerId,
        actorRole: 'CUSTOMER',
        notes: 'Order placed by customer.',
      },
    });

    // 4. Trigger auto-assignment of delivery agent
    const assignResult = await autoAssignAgent(order.id);

    // Fetch finalized order with relations
    const finalOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        pickupArea: { include: { zone: true } },
        dropArea: { include: { zone: true } },
        agent: { include: { user: { select: { name: true } } } },
      },
    });

    // 5. Send order placement notification
    await sendStatusNotification(
      order.id,
      'PENDING',
      assignResult.success 
        ? `Order successfully placed and assigned to agent: ${assignResult.agentName}.`
        : 'Order placed. Waiting for agent assignment.'
    );

    return res.status(201).json(finalOrder);
  } catch (error: any) {
    console.error(error);
    return res.status(400).json({ error: error.message || 'Failed to place order.' });
  }
});

// List orders placed by this customer
router.get('/orders', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { customerId: req.user?.id },
      include: {
        pickupArea: { include: { zone: true } },
        dropArea: { include: { zone: true } },
        agent: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// Get customer order status and tracking timeline
router.get('/orders/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        pickupArea: { include: { zone: true } },
        dropArea: { include: { zone: true } },
        agent: { include: { user: { select: { name: true } } } },
        timelines: {
          include: { actor: { select: { name: true } } },
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.customerId !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied: not your order.' });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch order details.' });
  }
});

// Reschedule a failed order
router.post('/orders/:id/reschedule', async (req: AuthenticatedRequest, res: Response) => {
  const { rescheduleDate } = req.body;
  const orderId = req.params.id;

  if (!rescheduleDate) {
    return res.status(400).json({ error: 'Reschedule date is required.' });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { agent: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.customerId !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied: not your order.' });
    }

    if (order.status !== 'FAILED') {
      return res.status(400).json({ error: 'Only orders with FAILED status can be rescheduled.' });
    }

    // 1. Release previous agent availability
    if (order.agentId) {
      await prisma.agentProfile.update({
        where: { id: order.agentId },
        data: { isAvailable: true },
      });
    }

    // 2. Update order for rescheduling
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PENDING',
        agentId: null, // Reset assignment to trigger new assignment
        rescheduleDate: new Date(rescheduleDate),
        rescheduleAttempts: { increment: 1 },
      },
    });

    // 3. Log in timeline
    await prisma.orderTimeline.create({
      data: {
        orderId,
        status: 'PENDING',
        actorId: req.user.id,
        actorRole: 'CUSTOMER',
        notes: `Order rescheduled for ${new Date(rescheduleDate).toLocaleDateString()}. Previous agent unassigned.`,
      },
    });

    // 4. Trigger auto-assignment for new attempt
    const assignResult = await autoAssignAgent(orderId);

    // Fetch the updated order details
    const rescheduledOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        agent: { include: { user: { select: { name: true } } } },
      },
    });

    await sendStatusNotification(
      orderId,
      'PENDING',
      `Order rescheduled for ${new Date(rescheduleDate).toLocaleDateString()}. ` +
      (assignResult.success 
        ? `Reassigned to delivery agent: ${assignResult.agentName}.`
        : 'Waiting for new agent assignment.')
    );

    return res.json({
      message: 'Order rescheduled and agent reassigned.',
      order: rescheduledOrder,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Failed to reschedule order.' });
  }
});

export default router;
