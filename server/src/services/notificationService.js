const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// ── Transporter ───────────────────────────────────────────

const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// ── Base send ─────────────────────────────────────────────

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'StayNest <noreply@staynest.com>',
      to,
      subject,
      html,
    });
    logger.info({ to, subject, messageId: info.messageId }, 'Email sent');
    return info;
  } catch (err) {
    logger.error({ err, to, subject }, 'Email send failed');
    // Don't throw — email failures shouldn't break the core flow
  }
};

// ── SMS via Twilio ────────────────────────────────────────

const sendSms = async (to, message) => {
  try {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token || sid.startsWith('ACxxxx') || token === 'your_twilio_auth_token') {
      logger.warn({ to }, 'Twilio credentials not configured in .env — SMS skipped');
      return;
    }

    // Auto-format phone number to E.164 (e.g. 6263893959 -> +916263893959)
    let formattedPhone = to.trim().replace(/[\s-]/g, '');
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.length === 10) {
        formattedPhone = `+91${formattedPhone}`;
      } else {
        formattedPhone = `+${formattedPhone}`;
      }
    }

    const twilio = require('twilio')(sid, token);
    const res = await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });
    logger.info({ to: formattedPhone, sid: res.sid }, 'SMS sent successfully via Twilio');
  } catch (err) {
    logger.error({ err, to }, 'Twilio SMS send failed');
  }
};

// ── In-app notification ───────────────────────────────────

const createInAppNotification = async (prisma, { userId, type, title, message, metadata }) => {
  try {
    await prisma.notification.create({
      data: { userId, type, title, message, metadata },
    });
  } catch (err) {
    logger.error({ err, userId }, 'Failed to create in-app notification');
  }
};

// ── Email Templates ───────────────────────────────────────

const emailBase = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; margin: 0; padding: 0; background: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 40px; }
    .otp-box { background: #f0f0ff; border: 2px dashed #6366f1; border-radius: 12px; text-align: center; padding: 24px; margin: 24px 0; }
    .otp-code { font-size: 42px; font-weight: 800; letter-spacing: 8px; color: #4338ca; font-family: monospace; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .footer { background: #f9fafb; padding: 24px 40px; text-align: center; color: #6b7280; font-size: 12px; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    h2 { color: #111827; font-size: 20px; }
    p { color: #374151; line-height: 1.6; }
    .highlight { color: #6366f1; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏨 StayNest</h1>
      <p>Your trusted stay booking platform</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} StayNest. All rights reserved.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>`;

const sendOtpEmail = (to, name, otp) =>
  sendEmail({
    to,
    subject: `${otp} is your StayNest verification code`,
    html: emailBase(`
      <h2>Verify your account, ${name}! 👋</h2>
      <p>Thanks for signing up with StayNest. Use the code below to verify your account:</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <p style="color:#6b7280;font-size:13px;margin:8px 0 0">Valid for ${parseInt(process.env.OTP_EXPIRY_MINUTES) || 10} minutes</p>
      </div>
      <hr class="divider">
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `),
  });

const sendPasswordResetEmail = (to, name, otp) =>
  sendEmail({
    to,
    subject: `Reset your StayNest password`,
    html: emailBase(`
      <h2>Password Reset Request</h2>
      <p>Hi ${name}, we received a request to reset your StayNest password. Use this OTP:</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <p style="color:#6b7280;font-size:13px;margin:8px 0 0">Valid for ${parseInt(process.env.OTP_EXPIRY_MINUTES) || 10} minutes</p>
      </div>
      <p>If you didn't request a password reset, please secure your account immediately.</p>
    `),
  });

const sendBookingConfirmationEmail = (to, name, booking) =>
  sendEmail({
    to,
    subject: `Booking Confirmed — ${booking.propertyName}`,
    html: emailBase(`
      <h2>Your booking is confirmed! 🎉</h2>
      <p>Hi ${name}, great news! Your stay at <span class="highlight">${booking.propertyName}</span> is confirmed.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;color:#6b7280">Room</td><td style="padding:8px;font-weight:600">${booking.roomName}</td></tr>
        <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">Check-in</td><td style="padding:8px;font-weight:600">${booking.checkIn}</td></tr>
        <tr><td style="padding:8px;color:#6b7280">Check-out</td><td style="padding:8px;font-weight:600">${booking.checkOut}</td></tr>
        <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">Guests</td><td style="padding:8px;font-weight:600">${booking.guestsCount}</td></tr>
        <tr><td style="padding:8px;color:#6b7280">Total Paid</td><td style="padding:8px;font-weight:600;color:#6366f1">₹${booking.totalAmount}</td></tr>
        <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">Booking ID</td><td style="padding:8px;font-family:monospace;font-size:12px">${booking.id}</td></tr>
      </table>
      <p>Have a wonderful stay! 🏨</p>
    `),
  });

const sendCancellationEmail = (to, name, booking, refundAmount) =>
  sendEmail({
    to,
    subject: `Booking Cancelled — ${booking.propertyName}`,
    html: emailBase(`
      <h2>Booking Cancelled</h2>
      <p>Hi ${name}, your booking at <span class="highlight">${booking.propertyName}</span> has been cancelled.</p>
      <p>Booking ID: <code>${booking.id}</code></p>
      ${refundAmount > 0 ? `<p>Refund of <span class="highlight">₹${refundAmount}</span> will be processed within 5–7 business days.</p>` : '<p>This booking was not eligible for a refund per the cancellation policy.</p>'}
    `),
  });

const sendPaymentReceiptEmail = (to, name, payment) =>
  sendEmail({
    to,
    subject: `Payment Receipt — StayNest #${payment.id}`,
    html: emailBase(`
      <h2>Payment Receipt 🧾</h2>
      <p>Hi ${name}, we've received your payment. Here's your receipt:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;color:#6b7280">Amount</td><td style="padding:8px;font-weight:600;color:#6366f1">₹${payment.amount}</td></tr>
        <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">Payment ID</td><td style="padding:8px;font-family:monospace;font-size:12px">${payment.razorpayPaymentId}</td></tr>
        <tr><td style="padding:8px;color:#6b7280">Status</td><td style="padding:8px;font-weight:600;color:#10b981">Success</td></tr>
      </table>
    `),
  });

module.exports = {
  sendEmail,
  sendSms,
  createInAppNotification,
  sendOtpEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendCancellationEmail,
  sendPaymentReceiptEmail,
};
