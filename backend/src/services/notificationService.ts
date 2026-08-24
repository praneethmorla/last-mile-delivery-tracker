import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      family: 4, // Force IPv4 to bypass Windows DNS query timeouts
      secure: false,
      tls: {
        rejectUnauthorized: false // Bypasses certificate name mismatches when using direct SMTP IP addresses
      },
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    } as any);
  } else {
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
      console.log('[Notification Service] Failed to configure Ethereal SMTP. Falling back to Console logs.');
    }
  }

  return transporter;
}

// Helper to log and send a single email
async function sendMail(to: string, subject: string, body: string, orderId: string) {
  try {
    // 1. Log to DB
    await prisma.notificationLog.create({
      data: {
        orderId,
        recipientEmail: to,
        type: 'EMAIL',
        status: 'SENT',
        subject,
        body,
      },
    });

    console.log(`\n======================================================`);
    console.log(`[NOTIFICATION DISPATCH] to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message:\n${body}`);
    console.log(`======================================================\n`);

    // 2. Try sending real email (mocked or actual)
    const mailTransporter = await getTransporter();
    if (mailTransporter) {
      const info = await mailTransporter.sendMail({
        from: '"DashMile Logistics" <noreply@dashmile.com>',
        to,
        subject,
        text: body,
      });

      console.log(`[Notification Service] Email successfully sent to ${to} | Message ID: ${info.messageId}`);

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[Notification Service] Live Email Link: ${previewUrl}`);
      }
    }
  } catch (error) {
    console.error(`[Notification Service] Failed to send email to ${to}:`, error);
  }
}

export async function sendStatusNotification(
  orderId: string,
  status: string,
  notes?: string
): Promise<void> {
  try {
    // Fetch full order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        pickupArea: { include: { zone: true } },
        dropArea: { include: { zone: true } },
        agent: { include: { user: true } },
      },
    });

    if (!order) {
      console.error(`[Notification Service] Order ${orderId} not found for notification.`);
      return;
    }

    const orderIdShort = order.id.split('-')[0];

    const emailPromises: Promise<any>[] = [];

    // 1. Customer Notification
    const customerEmail = order.customer.email;
    const customerSubject = `[DashMile] Shipment Booking Update for Order #${orderIdShort}: ${status}`;
    let customerBody = `Dear customer (${order.customer.name}),\n\nYour order status has been updated to: **${status}**.\n\n`;
    
    if (notes) {
      customerBody += `Updates & Details: ${notes}\n\n`;
    }

    customerBody += `Shipment Details:\n`;
    customerBody += `- Order ID: ${order.id}\n`;
    customerBody += `- Pickup Location: ${order.pickupAddress} (${order.pickupArea.postalCode} - ${order.pickupArea.name})\n`;
    customerBody += `- Destination Location: ${order.dropAddress} (${order.dropArea.postalCode} - ${order.dropArea.name})\n`;
    customerBody += `- Dimensions: ${order.length} x ${order.width} x ${order.height} cm\n`;
    customerBody += `- Weight: ${order.actualWeight} kg (Volumetric: ${order.volumetricWeight.toFixed(2)} kg)\n`;
    customerBody += `- Billable Charge: ₹${order.totalCharge.toFixed(2)} (${order.paymentType})\n`;
    customerBody += `- Assigned Courier Agent: ${order.agent ? `${order.agent.user.name} (${order.agent.user.email})` : 'Awaiting assignment...'}\n\n`;

    if (status === 'FAILED') {
      customerBody += `Unfortunately, our delivery attempt was unsuccessful. Please log in to your dashboard to reschedule the delivery for a convenient date.\n\n`;
    } else if (status === 'DELIVERED') {
      customerBody += `Thank you for choosing DashMile! Your shipment was delivered successfully.\n\n`;
    }

    customerBody += `Best regards,\nDashMile Logistics Team`;
    
    emailPromises.push(sendMail(customerEmail, customerSubject, customerBody, orderId));

    // 2. Agent Notification (if assigned)
    if (order.agent) {
      const agentEmail = order.agent.user.email;
      const agentSubject = `[DashMile] New Task Assignment: Order #${orderIdShort} (${status})`;
      let agentBody = `Dear Courier Executive (${order.agent.user.name}),\n\n`;
      agentBody += `You have been assigned to handle Order #${orderIdShort}. Please find the dispatch details below:\n\n`;
      agentBody += `Journey Stage: **${status}**\n`;
      agentBody += `- Order ID: ${order.id}\n`;
      agentBody += `- Customer / Recipient: ${order.customer.name} (${order.customer.email})\n`;
      agentBody += `- Pickup Point: ${order.pickupAddress} (${order.pickupArea.postalCode} - ${order.pickupArea.name})\n`;
      agentBody += `- Drop Point: ${order.dropAddress} (${order.dropArea.postalCode} - ${order.dropArea.name})\n`;
      agentBody += `- Box Dimensions: ${order.length} x ${order.width} x ${order.height} cm\n`;
      agentBody += `- Package Weight: ${order.actualWeight} kg\n`;
      agentBody += `- Payment Collection: ₹${order.totalCharge.toFixed(2)} (${order.paymentType})\n\n`;
      agentBody += `Please log in to your Agent Console to manage coordinates and update status milestones.\n\n`;
      agentBody += `Best regards,\nDashMile Dispatch Grid`;

      emailPromises.push(sendMail(agentEmail, agentSubject, agentBody, orderId));
    }

    // 3. Admin Notification
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
      const adminSubject = `[DashMile Admin Alert] Order #${orderIdShort} Status Updated to ${status}`;
      let adminBody = `Hello Admin (${admin.name}),\n\n`;
      adminBody += `A shipment status change has been registered in the system:\n\n`;
      adminBody += `- Order ID: ${order.id}\n`;
      adminBody += `- Customer: ${order.customer.name} (${order.customer.email})\n`;
      adminBody += `- Route: ${order.pickupArea.name} → ${order.dropArea.name}\n`;
      adminBody += `- Assigned Courier Agent: ${order.agent ? `${order.agent.user.name} (${order.agent.user.email})` : 'None'}\n`;
      adminBody += `- Weight: ${order.chargeableWeight.toFixed(2)} kg (Total Bill: ₹${order.totalCharge.toFixed(2)})\n`;
      adminBody += `- Payment Method: ${order.paymentType}\n`;
      adminBody += `- New Status: **${status}**\n`;
      adminBody += `- Update Reason/Notes: ${notes || 'None'}\n\n`;
      adminBody += `You can review and manage this order in the Admin Control Panel.\n\n`;
      adminBody += `Best regards,\nDashMile System Audit`;

      emailPromises.push(sendMail(admin.email, adminSubject, adminBody, orderId));
    }

    // Await all parallel mail dispatches
    await Promise.all(emailPromises);

  } catch (error) {
    console.error('[Notification Service] Error sending notifications:', error);
  }
}
