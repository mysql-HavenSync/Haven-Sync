const nodemailer = require('nodemailer');

module.exports = async function sendMail(to, message) {
  console.log('📧 Preparing to send mail to:', to);
  console.log('📝 Message:', message);

  const otpCode = message.match(/\d{6}/)?.[0] || '------';

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    const result = await transporter.sendMail({
      from: `"HavenSync" <${process.env.SMTP_USER}>`,
      to,
      subject: '🔐 Your HavenSync Verification Code',
      text: `Your OTP is: ${otpCode}. This code expires in 5 minutes. If you didn’t request this, please ignore the email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="text-align: center; color: #333;">🔐 HavenSync OTP Verification</h2>
          <p style="font-size: 16px; color: #444;">Your OTP is:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: bold; color: #007BFF; background: #f0f0f0; padding: 15px 30px; border-radius: 8px; letter-spacing: 4px;">
              ${otpCode}
            </span>
          </div>
          <p style="font-size: 14px; color: #666;">⏰ This code expires in <strong>10 minutes</strong>.</p>
          <p style="font-size: 13px; color: #999;">If you didn’t request this, just ignore it.</p>
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #ccc; text-align: center;">© 2025 HavenSync • Powered by HexaHaven Integrations</p>
        </div>
      `
    });

    console.log('✅ Email sent:', result.messageId);
    console.log('📨 Server response:', result.response);
  } catch (err) {
    console.error('❌ Email sending failed:', err.message);
    console.error('❌ Full error:', err);
    throw err;
  }
};
