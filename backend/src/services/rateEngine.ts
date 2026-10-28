import { PrismaClient } from '@prisma/client';
import { POSTAL_CODE_COORDINATES, calculateDistance } from './autoAssignment';

const prisma = new PrismaClient();

export interface RateCalculationInput {
  pickupAreaId: string;
  dropAreaId: string;
  length: number;
  width: number;
  height: number;
  actualWeight: number;
  orderType: 'B2B' | 'B2C';
  paymentType: 'PREPAID' | 'COD';
}

export interface RateCalculationResult {
  volumetricWeight: number;
  chargeableWeight: number;
  pickupZoneId: string;
  dropZoneId: string;
  distanceKm: number;
  distanceCharge: number;
  ratePerKm: number;
  baseCharge: number;
  weightCharge: number;
  ratePerKg: number;
  codSurcharge: number;
  deliveryCharge: number;
  totalCharge: number;
}

export async function calculateOrderCharge(input: RateCalculationInput): Promise<RateCalculationResult> {
  const { pickupAreaId, dropAreaId, length, width, height, actualWeight, orderType, paymentType } = input;

  // 1. Fetch pickup and drop areas to detect zones
  const pickupArea = await prisma.area.findUnique({
    where: { id: pickupAreaId },
    include: { zone: true },
  });

  const dropArea = await prisma.area.findUnique({
    where: { id: dropAreaId },
    include: { zone: true },
  });

  if (!pickupArea || !dropArea) {
    throw new Error('Invalid pickup or drop area specified.');
  }

  // 2. Calculate geodesic distance between source and destination
  const pickupCoords = POSTAL_CODE_COORDINATES[pickupArea.postalCode] || { lat: 28.6304, lng: 77.2177 };
  const dropCoords = POSTAL_CODE_COORDINATES[dropArea.postalCode] || { lat: 28.6304, lng: 77.2177 };

  let rawDistance = calculateDistance(pickupCoords.lat, pickupCoords.lng, dropCoords.lat, dropCoords.lng);
  
  // If same postal hub, assign realistic intra-precinct delivery distance
  if (pickupArea.postalCode === dropArea.postalCode || rawDistance < 1.0) {
    rawDistance = 2.5;
  }
  const distanceKm = Math.round(rawDistance * 10) / 10;

  // 3. Calculate volumetric weight (L * W * H / 5000)
  const volumetricWeight = (length * width * height) / 5000;

  // 4. Determine chargeable weight (higher of actual vs volumetric)
  const chargeableWeight = Math.max(actualWeight, volumetricWeight);

  // 5. Look up rate card
  const rateCard = await prisma.rateCard.findFirst({
    where: {
      fromZoneId: pickupArea.zoneId,
      toZoneId: dropArea.zoneId,
      orderType,
    },
  });

  if (!rateCard) {
    throw new Error(
      `No rate card configured for route from ${pickupArea.zone.name} to ${dropArea.zone.name} for type ${orderType}.`
    );
  }

  // 6. Calculate distance-based pricing
  const isIntraZone = pickupArea.zoneId === dropArea.zoneId;
  const ratePerKm = orderType === 'B2B' ? 6.0 : 5.0; // ₹5/km for B2C, ₹6/km for B2B

  const distanceCharge = isIntraZone
    ? Math.round(distanceKm * ratePerKm * 100) / 100
    : Math.round(Math.min(distanceKm * 0.15, 120) * 100) / 100;

  // Base charge and weight charge
  const baseCharge = rateCard.baseCharge;
  const ratePerKg = rateCard.ratePerKg;
  const weightCharge = Math.round(ratePerKg * chargeableWeight * 100) / 100;

  // Total delivery charge = Base Charge + Distance Charge + Weight Charge
  const deliveryCharge = Math.round((baseCharge + distanceCharge + weightCharge) * 100) / 100;

  // Add COD surcharge if applicable
  const codSurcharge = paymentType === 'COD' ? rateCard.codSurcharge : 0.0;
  const totalCharge = Math.round((deliveryCharge + codSurcharge) * 100) / 100;

  return {
    volumetricWeight: Math.round(volumetricWeight * 100) / 100,
    chargeableWeight: Math.round(chargeableWeight * 100) / 100,
    pickupZoneId: pickupArea.zoneId,
    dropZoneId: dropArea.zoneId,
    distanceKm,
    distanceCharge,
    ratePerKm,
    baseCharge,
    weightCharge,
    ratePerKg,
    codSurcharge,
    deliveryCharge,
    totalCharge,
  };
}
