import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// Configure local test transporter (using Ethereal/mock mailer, or fallback to console log)
let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  // Use SMTP configs if provided in environment variables, else configure Ethereal
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Fallback: Create ethereal account for testing if none configured
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[Notification Service] Ethereal SMTP configured: ${testAccount.user}`);
    } catch (e) {
      console.log('[Notification Service] Failed to configure Ethereal SMTP. Falling back to Console logs only.');
    }
  }

  return transporter;
}

export async function sendStatusNotification(
  orderId: string,
  status: string,
  notes?: string
): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      console.error(`[Notification Service] Order ${orderId} not found for notification.`);
      return;
    }

    const email = order.customer.email;
    const orderIdShort = order.id.split('-')[0];

    // Notification Content
    let subject = `Update on your Order #${orderIdShort}: ${status}`;
    let body = `Dear ${order.customer.name},\n\nYour order (ID: ${order.id}) status has been updated to: **${status}**.\n`;
    
    if (notes) {
      body += `Details: ${notes}\n`;
    }

    if (status === 'FAILED') {
      body += `\nUnfortunately, our delivery attempt failed. Please log in to your dashboard to reschedule the delivery for a convenient date.\n`;
    } else if (status === 'DELIVERED') {
      body += `\nThank you for choosing Last-Mile Delivery Tracker!\n`;
    } else {
      body += `\nWe will keep you updated as the delivery progresses.\n`;
    }

    body += `\nBest regards,\nLast-Mile Logistics Team`;

    console.log(`\n======================================================`);
    console.log(`[NOTIFICATION OUT] Email & SMS to: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message:\n${body}`);
    console.log(`======================================================\n`);

    // 1. Log to DB
    await prisma.notificationLog.create({
      data: {
        orderId,
        recipientEmail: email,
        type: 'EMAIL',
        status: 'SENT',
        subject,
        body,
      },
    });

    // 2. Try sending real email (mocked or actual)
    const mailTransporter = await getTransporter();
    if (mailTransporter) {
      const info = await mailTransporter.sendMail({
        from: '"Last-Mile Logistics" <noreply@lastmile.com>',
        to: email,
        subject,
        text: body,
      });

      // If Ethereal mailer is used, log URL
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[Notification Service] Preview Email Sent: ${previewUrl}`);
      }
    }
  } catch (error) {
    console.error('[Notification Service] Error sending notification:', error);
  }
}
