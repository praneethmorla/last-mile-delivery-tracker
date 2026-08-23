import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateOrderCharge } from './rateEngine';
import { calculateDistance } from './autoAssignment';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient() as any;

vi.mock('@prisma/client', () => {
  const mPrisma = {
    area: {
      findUnique: vi.fn(),
    },
    rateCard: {
      findFirst: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    agentProfile: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    orderTimeline: {
      create: vi.fn(),
    },
    $transaction: vi.fn((cmds) => Promise.all(cmds)),
  };
  return {
    PrismaClient: vi.fn(() => mPrisma),
  };
});

describe('Services Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rate Calculation Engine', () => {
    it('should calculate volumetric weight and retrieve correct charges', async () => {
      // Mock area lookup
      prisma.area.findUnique
        .mockResolvedValueOnce({ id: 'area-1', name: 'Connaught Place', zoneId: 'zone-north', postalCode: '110001' }) // pickup
        .mockResolvedValueOnce({ id: 'area-2', name: 'Indiranagar', zoneId: 'zone-south', postalCode: '560008' }); // drop

      // Mock rate card lookup
      prisma.rateCard.findFirst.mockResolvedValue({
        id: 'rate-card-1',
        fromZoneId: 'zone-north',
        toZoneId: 'zone-south',
        orderType: 'B2C',
        baseCharge: 120.0,
        ratePerKg: 15.0,
        codSurcharge: 20.0,
      });

      // Package dimensions: 50x40x30 cm -> Volumetric Weight: (50*40*30)/5000 = 12kg
      // Actual weight: 5kg -> Chargeable weight: 12kg
      const result = await calculateOrderCharge({
        pickupAreaId: 'area-1',
        dropAreaId: 'area-2',
        length: 50,
        width: 40,
        height: 30,
        actualWeight: 5,
        orderType: 'B2C',
        paymentType: 'COD',
      });

      expect(result.volumetricWeight).toBe(12);
      expect(result.chargeableWeight).toBe(12);
      expect(result.baseCharge).toBe(120.0);
      expect(result.ratePerKg).toBe(15.0);
      expect(result.codSurcharge).toBe(20.0);
      // Total = Base (120) + PerKg (15 * 12) + COD (20) = 120 + 180 + 20 = 320
      expect(result.totalCharge).toBe(320);
    });

    it('should charge on actual weight if actual weight is greater than volumetric', async () => {
      prisma.area.findUnique
        .mockResolvedValueOnce({ id: 'area-1', name: 'Connaught Place', zoneId: 'zone-north', postalCode: '110001' })
        .mockResolvedValueOnce({ id: 'area-1', name: 'Connaught Place', zoneId: 'zone-north', postalCode: '110001' });

      prisma.rateCard.findFirst.mockResolvedValue({
        id: 'rate-card-2',
        fromZoneId: 'zone-north',
        toZoneId: 'zone-north',
        orderType: 'B2B',
        baseCharge: 40.0,
        ratePerKg: 6.0,
        codSurcharge: 10.0,
      });

      // Package dimensions: 10x10x10 cm -> Volumetric Weight: 1000 / 5000 = 0.2kg
      // Actual weight: 10kg -> Chargeable weight: 10kg
      const result = await calculateOrderCharge({
        pickupAreaId: 'area-1',
        dropAreaId: 'area-1',
        length: 10,
        width: 10,
        height: 10,
        actualWeight: 10,
        orderType: 'B2B',
        paymentType: 'PREPAID',
      });

      expect(result.volumetricWeight).toBe(0.2);
      expect(result.chargeableWeight).toBe(10);
      expect(result.codSurcharge).toBe(0.0); // Prepaid has no COD surcharge
      // Total = Base (40) + PerKg (6 * 10) = 40 + 60 = 100
      expect(result.totalCharge).toBe(100);
    });
  });

  describe('Geodesic Distance & Agent Matching Helper', () => {
    it('should correctly compute distance between two GPS coordinates', () => {
      // Coordinates of Connaught Place (28.6304, 77.2177) and Bandra (19.0596, 72.8295)
      // Distance is approximately 1150-1160 km
      const distance = calculateDistance(28.6304, 77.2177, 19.0596, 72.8295);
      expect(distance).toBeGreaterThan(1140);
      expect(distance).toBeLessThan(1170);
    });
  });
});
