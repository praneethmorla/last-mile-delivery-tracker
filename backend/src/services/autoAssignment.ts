import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Coordinates mapping for our seeded postal codes
export const POSTAL_CODE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  '110001': { lat: 28.6304, lng: 77.2177 }, // Connaught Place
  '110021': { lat: 28.5983, lng: 77.1896 }, // Chanakyapuri
  '560001': { lat: 12.9779, lng: 77.5724 }, // Majestic
  '560008': { lat: 12.9719, lng: 77.6412 }, // Indiranagar
  '400001': { lat: 18.9398, lng: 72.8354 }, // Fort
  '400050': { lat: 19.0596, lng: 72.8295 }, // Bandra
};

// Geodesic distance using Haversine formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export async function autoAssignAgent(orderId: string): Promise<{ success: boolean; agentName?: string; error?: string }> {
  try {
    // 1. Fetch order and pickup area details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { pickupArea: true },
    });

    if (!order) {
      return { success: false, error: 'Order not found.' };
    }

    // Get coordinates of the pickup location
    const pickupCoords = POSTAL_CODE_COORDINATES[order.pickupArea.postalCode] || { lat: 28.6139, lng: 77.2090 }; // Default to Delhi center if not found

    // 2. Fetch all available agents with their profiles
    const availableAgents = await prisma.agentProfile.findMany({
      where: {
        isAvailable: true,
        user: { role: 'AGENT' },
      },
      include: { user: true },
    });

    if (availableAgents.length === 0) {
      // Record failure in timeline
      await prisma.orderTimeline.create({
        data: {
          orderId,
          status: order.status,
          actorRole: 'SYSTEM',
          notes: 'Auto-assignment failed: No available agents found in the system.',
        },
      });
      return { success: false, error: 'No available agents found.' };
    }

    // 3. Compute score and sort agents
    // Scoring criteria:
    // - Primary: Same zone as pickup zone gets priority (0 km penalty, else 1000 km penalty)
    // - Secondary: Closest geodesic distance
    const agentsWithDistances = availableAgents.map((agent) => {
      const agentLat = agent.currentLat ?? 0;
      const agentLng = agent.currentLng ?? 0;
      
      const distance = calculateDistance(pickupCoords.lat, pickupCoords.lng, agentLat, agentLng);
      const isSameZone = agent.currentZoneId === order.pickupArea.zoneId;
      
      // Penalty score: lower is better
      const score = (isSameZone ? 0 : 1000) + distance;

      return { agent, distance, isSameZone, score };
    });

    // Sort by score ascending
    agentsWithDistances.sort((a, b) => a.score - b.score);

    const bestFit = agentsWithDistances[0];
    const assignedAgent = bestFit.agent;

    // 4. Update the order and agent availability
    await prisma.$transaction([
      // Assign agent to order and set status to ASSIGNED
      prisma.order.update({
        where: { id: orderId },
        data: {
          agentId: assignedAgent.id,
          status: 'ASSIGNED',
        },
      }),
      // Set agent availability to false
      prisma.agentProfile.update({
        where: { id: assignedAgent.id },
        data: { isAvailable: false },
      }),
      // Log in order timeline
      prisma.orderTimeline.create({
        data: {
          orderId,
          status: 'ASSIGNED',
          actorRole: 'SYSTEM',
          notes: `Auto-assigned to agent ${assignedAgent.user.name} (Distance: ${bestFit.distance.toFixed(2)} km, Same Zone: ${bestFit.isSameZone ? 'Yes' : 'No'}).`,
        },
      }),
    ]);

    return { success: true, agentName: assignedAgent.user.name };
  } catch (error: any) {
    console.error('Error during auto-assignment:', error);
    return { success: false, error: error.message || 'Auto-assignment failed.' };
  }
}
