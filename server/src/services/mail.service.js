import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = env.smtp.host
  ? nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
  })
  : null;

/**
 * Send the activation link by email. Without SMTP settings (development),
 * the link is printed to the server console instead. Never throws: the Admin
 * can always copy the link from the screen and send it by Zalo.
 */
export async function sendActivationEmail({ to, fullName, link }) {
  if (!transporter) {
    console.log(`[mail disabled] Activation link for ${to}: ${link}`);
    return { sent: false };
  }
  try {
    await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject: 'Kích hoạt tài khoản EC-RMS',
      text: `Xin chào ${fullName},\n\nTrung tâm đã tạo tài khoản cho bạn. Vui lòng mở đường dẫn sau để đặt mật khẩu (hiệu lực ${env.inviteTtlHours} giờ):\n\n${link}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`,
    });
    return { sent: true };
  } catch (err) {
    console.error('Failed to send activation email:', err.message);
    return { sent: false };
  }
}
