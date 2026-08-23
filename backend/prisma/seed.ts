import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean up existing tables
  await prisma.notificationLog.deleteMany({});
  await prisma.orderTimeline.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.rateCard.deleteMany({});
  await prisma.area.deleteMany({});
  await prisma.agentProfile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.zone.deleteMany({});

  const passwordHash = bcrypt.hashSync('password123', 10);

  // 2. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@lastmile.com',
      passwordHash,
      name: 'System Administrator',
      role: 'ADMIN',
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      passwordHash,
      name: 'John Doe Enterprise',
      role: 'CUSTOMER',
    },
  });

  const agent1 = await prisma.user.create({
    data: {
      email: 'agent1@lastmile.com',
      passwordHash,
      name: 'Agent North (David)',
      role: 'AGENT',
    },
  });

  const agent2 = await prisma.user.create({
    data: {
      email: 'agent2@lastmile.com',
      passwordHash,
      name: 'Agent South (Sarah)',
      role: 'AGENT',
    },
  });

  const agent3 = await prisma.user.create({
    data: {
      email: 'agent3@lastmile.com',
      passwordHash,
      name: 'Agent West (Marcus)',
      role: 'AGENT',
    },
  });

  console.log('Users created.');

  // 3. Create Zones
  const zoneNorth = await prisma.zone.create({
    data: { name: 'Zone North', description: 'Northern sector operations' },
  });

  const zoneSouth = await prisma.zone.create({
    data: { name: 'Zone South', description: 'Southern sector operations' },
  });

  const zoneWest = await prisma.zone.create({
    data: { name: 'Zone West', description: 'Western sector operations' },
  });

  console.log('Zones created.');

  // 4. Create Areas (Postal codes mapped to Zones)
  const areas = [
    { postalCode: '110001', name: 'Connaught Place', zoneId: zoneNorth.id },
    { postalCode: '110021', name: 'Chanakyapuri', zoneId: zoneNorth.id },
    { postalCode: '560001', name: 'Majestic', zoneId: zoneSouth.id },
    { postalCode: '560008', name: 'Indiranagar', zoneId: zoneSouth.id },
    { postalCode: '400001', name: 'Fort', zoneId: zoneWest.id },
    { postalCode: '400050', name: 'Bandra', zoneId: zoneWest.id },
  ];

  for (const area of areas) {
    await prisma.area.create({ data: area });
  }

  console.log('Areas created.');

  // 5. Create Agent Profiles
  // Agent 1 is in Zone North, near Connaught Place (approx lat/lng)
  await prisma.agentProfile.create({
    data: {
      userId: agent1.id,
      currentZoneId: zoneNorth.id,
      currentLat: 28.6304,
      currentLng: 77.2177,
      isAvailable: true,
    },
  });

  // Agent 2 is in Zone South, near Indiranagar
  await prisma.agentProfile.create({
    data: {
      userId: agent2.id,
      currentZoneId: zoneSouth.id,
      currentLat: 12.9716,
      currentLng: 77.5946,
      isAvailable: true,
    },
  });

  // Agent 3 is in Zone West, near Bandra
  await prisma.agentProfile.create({
    data: {
      userId: agent3.id,
      currentZoneId: zoneWest.id,
      currentLat: 19.0760,
      currentLng: 72.8777,
      isAvailable: false, // Starts as unavailable
    },
  });

  console.log('Agent Profiles created.');

  // 6. Create Rate Cards
  // Intra-zone and Inter-zone rates for B2B & B2C
  const zones = [zoneNorth, zoneSouth, zoneWest];
  
  for (const fromZone of zones) {
    for (const toZone of zones) {
      const isIntra = fromZone.id === toZone.id;

      // Rate card for B2C
      await prisma.rateCard.create({
        data: {
          fromZoneId: fromZone.id,
          toZoneId: toZone.id,
          orderType: 'B2C',
          baseCharge: isIntra ? 50.0 : 120.0,
          ratePerKg: isIntra ? 8.0 : 15.0,
          codSurcharge: 15.0,
        },
      });

      // Rate card for B2B
      await prisma.rateCard.create({
        data: {
          fromZoneId: fromZone.id,
          toZoneId: toZone.id,
          orderType: 'B2B',
          baseCharge: isIntra ? 40.0 : 90.0,
          ratePerKg: isIntra ? 6.0 : 12.0,
          codSurcharge: 10.0,
        },
      });
    }
  }

  console.log('Rate Cards created successfully.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
