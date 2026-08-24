import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { calculateOrderCharge } from '../services/rateEngine';
import { autoAssignAgent } from '../services/autoAssignment';
import { sendStatusNotification } from '../services/notificationService';

const router = Router();
const prisma = new PrismaClient();

// Apply auth and admin role middlewares to all routes here
router.use(authenticateJWT);
router.use(requireRole(['ADMIN']));

// ----------------------------------------------------
// ZONES MANAGEMENT
// ----------------------------------------------------

router.get('/zones', async (req, res) => {
  try {
    const zones = await prisma.zone.findMany({
      include: {
        _count: {
          select: { areas: true, agentProfiles: true },
        },
      },
    });
    return res.json(zones);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch zones.' });
  }
});

router.post('/zones', async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Zone name is required.' });

  try {
    const existing = await prisma.zone.findUnique({ where: { name } });
    if (existing) return res.status(400).json({ error: 'Zone name already exists.' });

    const zone = await prisma.zone.create({ data: { name, description } });
    return res.status(201).json(zone);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create zone.' });
  }
});

router.put('/zones/:id', async (req, res) => {
  const { name, description } = req.body;
  try {
    const zone = await prisma.zone.update({
      where: { id: req.params.id },
      data: { name, description },
    });
    return res.json(zone);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update zone.' });
  }
});

router.delete('/zones/:id', async (req, res) => {
  try {
    await prisma.zone.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Zone deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete zone.' });
  }
});

// ----------------------------------------------------
// AREAS MANAGEMENT (Postal Codes)
// ----------------------------------------------------

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

router.post('/areas', async (req, res) => {
  const { postalCode, name, zoneId } = req.body;
  if (!postalCode || !name || !zoneId) {
    return res.status(400).json({ error: 'Missing postal code, name, or zoneId.' });
  }

  try {
    const existing = await prisma.area.findUnique({ where: { postalCode } });
    if (existing) return res.status(400).json({ error: 'Postal code already mapped.' });

    const area = await prisma.area.create({
      data: { postalCode, name, zoneId },
      include: { zone: true },
    });
    return res.status(201).json(area);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create area.' });
  }
});

router.put('/areas/:id', async (req, res) => {
  const { postalCode, name, zoneId } = req.body;
  try {
    const area = await prisma.area.update({
      where: { id: req.params.id },
      data: { postalCode, name, zoneId },
      include: { zone: true },
    });
    return res.json(area);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update area.' });
  }
});

router.delete('/areas/:id', async (req, res) => {
  try {
    await prisma.area.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Area mapping deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete area.' });
  }
});

// ----------------------------------------------------
// RATE CARDS MANAGEMENT
// ----------------------------------------------------

router.get('/ratecards', async (req, res) => {
  try {
    const rateCards = await prisma.rateCard.findMany({
      include: {
        fromZone: true,
        toZone: true,
      },
    });
    return res.json(rateCards);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch rate cards.' });
  }
});

router.post('/ratecards', async (req, res) => {
  const { fromZoneId, toZoneId, orderType, baseCharge, ratePerKg, codSurcharge } = req.body;
  if (!fromZoneId || !toZoneId || !orderType || baseCharge === undefined || ratePerKg === undefined || codSurcharge === undefined) {
    return res.status(400).json({ error: 'All rate card parameters are required.' });
  }

  try {
    const existing = await prisma.rateCard.findFirst({
      where: { fromZoneId, toZoneId, orderType },
    });

    if (existing) {
      return res.status(400).json({ error: 'Rate card for this route and order type already exists.' });
    }

    const rateCard = await prisma.rateCard.create({
      data: {
        fromZoneId,
        toZoneId,
        orderType,
        baseCharge: parseFloat(baseCharge),
        ratePerKg: parseFloat(ratePerKg),
        codSurcharge: parseFloat(codSurcharge),
      },
      include: { fromZone: true, toZone: true },
    });
    return res.status(201).json(rateCard);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create rate card.' });
  }
});

router.put('/ratecards/:id', async (req, res) => {
  const { baseCharge, ratePerKg, codSurcharge } = req.body;
  try {
    const rateCard = await prisma.rateCard.update({
      where: { id: req.params.id },
      data: {
        baseCharge: baseCharge !== undefined ? parseFloat(baseCharge) : undefined,
        ratePerKg: ratePerKg !== undefined ? parseFloat(ratePerKg) : undefined,
        codSurcharge: codSurcharge !== undefined ? parseFloat(codSurcharge) : undefined,
      },
      include: { fromZone: true, toZone: true },
    });
    return res.json(rateCard);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update rate card.' });
  }
});

router.delete('/ratecards/:id', async (req, res) => {
  try {
    await prisma.rateCard.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Rate card deleted.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete rate card.' });
  }
});

// ----------------------------------------------------
// AGENT PROFILES & LIST
// ----------------------------------------------------

router.get('/agents', async (req, res) => {
  try {
    const agents = await prisma.agentProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        currentZone: true,
      },
    });
    return res.json(agents);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch agents.' });
  }
});

router.put('/agents/:id', async (req, res) => {
  const { currentZoneId, currentLat, currentLng, isAvailable } = req.body;
  try {
    const profile = await prisma.agentProfile.update({
      where: { id: req.params.id },
      data: {
        currentZoneId,
        currentLat: currentLat !== undefined ? parseFloat(currentLat) : undefined,
        currentLng: currentLng !== undefined ? parseFloat(currentLng) : undefined,
        isAvailable,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        currentZone: true,
      },
    });
    return res.json(profile);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update agent profile.' });
  }
});

// ----------------------------------------------------
// ORDERS MANAGEMENT
// ----------------------------------------------------

// List all orders with advanced filtering (status, zone, agent)
router.get('/orders', async (req, res) => {
  const { status, zoneId, agentId } = req.query;

  const where: any = {};
  if (status) where.status = String(status);
  if (agentId) where.agentId = String(agentId);
  
  if (zoneId) {
    // Orders matching pickup zone OR drop zone
    where.OR = [
      { pickupArea: { zoneId: String(zoneId) } },
      { dropArea: { zoneId: String(zoneId) } },
    ];
  }

  try {
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
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

// Admin creates order on behalf of customer
router.post('/orders', async (req: AuthenticatedRequest, res: Response) => {
  const {
    customerEmail,
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
    !customerEmail ||
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
    return res.status(400).json({ error: 'Missing required order placement fields.' });
  }

  try {
    // Find or create customer
    let customer = await prisma.user.findUnique({ where: { email: customerEmail } });
    if (!customer) {
      // Create user with default random password for them
      customer = await prisma.user.create({
        data: {
          email: customerEmail,
          passwordHash: '$2a$10$wN1dYly60y7gWlY26mN/IeWd59hlyR38P1bYg8N5p0pG/Q7t.O6l.', // placeholder
          name: customerEmail.split('@')[0],
          role: 'CUSTOMER',
        },
      });
    }

    // Run rate calculation
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

    const newOrder = await prisma.order.create({
      data: {
        customerId: customer.id,
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
      include: {
        pickupArea: true,
        dropArea: true,
      },
    });

    // Create initial timeline log
    await prisma.orderTimeline.create({
      data: {
        orderId: newOrder.id,
        status: 'PENDING',
        actorId: req.user?.id,
        actorRole: 'ADMIN',
        notes: 'Order placed by admin on behalf of customer.',
      },
    });

    // Run auto assignment
    await autoAssignAgent(newOrder.id);

    // Fetch the updated order (with agent details)
    const finalOrder = await prisma.order.findUnique({
      where: { id: newOrder.id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        pickupArea: { include: { zone: true } },
        dropArea: { include: { zone: true } },
        agent: { include: { user: { select: { name: true } } } },
        timelines: true,
      },
    });

    // Send order confirmation notification
    sendStatusNotification(newOrder.id, 'PENDING', 'Order placed by Administrator.').catch(err => console.error('Notification error:', err));

    return res.status(201).json(finalOrder);
  } catch (error: any) {
    console.error(error);
    return res.status(400).json({ error: error.message || 'Failed to place order.' });
  }
});

// Get specific order with timeline and notifications
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        pickupArea: { include: { zone: true } },
        dropArea: { include: { zone: true } },
        agent: { include: { user: { select: { id: true, name: true } } } },
        timelines: {
          include: { actor: { select: { name: true } } },
          orderBy: { timestamp: 'desc' },
        },
        notifications: {
          orderBy: { sentAt: 'desc' },
        },
      },
    });

    if (!order) return res.status(404).json({ error: 'Order not found.' });
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch order details.' });
  }
});

// Admin manual or auto assignment trigger
router.post('/orders/:id/assign', async (req: AuthenticatedRequest, res: Response) => {
  const { agentId, auto } = req.body;
  const orderId = req.params.id;

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    // Handle Auto-assignment
    if (auto) {
      const result = await autoAssignAgent(orderId);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      return res.json({ message: `Agent auto-assigned successfully: ${result.agentName}` });
    }

    // Handle Manual-assignment
    if (!agentId) {
      return res.status(400).json({ error: 'agentId is required for manual assignment.' });
    }

    const agent = await prisma.agentProfile.findUnique({
      where: { id: agentId },
      include: { user: true },
    });

    if (!agent) return res.status(404).json({ error: 'Agent not found.' });

    // If order already had an agent, release the old one
    if (order.agentId) {
      await prisma.agentProfile.update({
        where: { id: order.agentId },
        data: { isAvailable: true },
      });
    }

    // Update order with new agent and mark new agent as unavailable
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          agentId: agent.id,
          status: 'ASSIGNED',
        },
      }),
      prisma.agentProfile.update({
        where: { id: agent.id },
        data: { isAvailable: false },
      }),
      prisma.orderTimeline.create({
        data: {
          orderId,
          status: 'ASSIGNED',
          actorId: req.user?.id,
          actorRole: 'ADMIN',
          notes: `Manually assigned to agent ${agent.user.name} by administrator.`,
        },
      }),
    ]);

    sendStatusNotification(orderId, 'ASSIGNED', `Assigned to delivery executive: ${agent.user.name}`).catch(err => console.error('Notification error:', err));

    return res.json({ message: `Manually assigned to agent ${agent.user.name}` });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Failed to assign agent.' });
  }
});

// Admin status override
router.post('/orders/:id/override-status', async (req: AuthenticatedRequest, res: Response) => {
  const { status, notes } = req.body;
  const orderId = req.params.id;

  if (!status) return res.status(400).json({ error: 'New status is required.' });

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    // If status is overridden to DELIVERED or FAILED, and the order has an agent, free the agent
    if (['DELIVERED', 'FAILED'].includes(status) && order.agentId) {
      await prisma.agentProfile.update({
        where: { id: order.agentId },
        data: { isAvailable: true },
      });
    }

    await prisma.orderTimeline.create({
      data: {
        orderId,
        status,
        actorId: req.user?.id,
        actorRole: 'ADMIN',
        notes: notes || 'Status overridden by Administrator.',
      },
    });

    sendStatusNotification(orderId, status, notes || 'Order status updated by administrator override.').catch(err => console.error('Notification error:', err));

    return res.json(updatedOrder);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to override order status.' });
  }
});

export default router;
