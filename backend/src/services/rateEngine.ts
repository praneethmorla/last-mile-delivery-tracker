import { PrismaClient } from '@prisma/client';

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
  baseCharge: number;
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

  // 2. Calculate volumetric weight (L * W * H / 5000)
  const volumetricWeight = (length * width * height) / 5000;

  // 3. Determine chargeable weight (higher of actual vs volumetric)
  const chargeableWeight = Math.max(actualWeight, volumetricWeight);

  // 4. Look up rate card
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

  // 5. Calculate charges
  // Formula: Base Charge + (Rate Per Kg * Chargeable Weight)
  const baseCharge = rateCard.baseCharge;
  const ratePerKg = rateCard.ratePerKg;
  const deliveryCharge = baseCharge + (ratePerKg * chargeableWeight);

  // Add COD surcharge if applicable
  const codSurcharge = paymentType === 'COD' ? rateCard.codSurcharge : 0.0;
  const totalCharge = deliveryCharge + codSurcharge;

  return {
    volumetricWeight,
    chargeableWeight,
    pickupZoneId: pickupArea.zoneId,
    dropZoneId: dropArea.zoneId,
    baseCharge,
    ratePerKg,
    codSurcharge,
    deliveryCharge,
    totalCharge: Math.round(totalCharge * 100) / 100, // round to 2 decimal places
  };
}
