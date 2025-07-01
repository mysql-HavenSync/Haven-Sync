const nodemailer = require('nodemailer');

module.exports = async function sendMail(to, message) {
  console.log('📧 Preparing to send mail to:', to);
  console.log('📝 Message:', message);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true, // for port 465
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
      subject: 'Your OTP',
      text: message
    });

    console.log('✅ Email sent:', result.messageId);
    console.log('📨 Server response:', result.response);
  } catch (err) {
    console.error('❌ Email sending failed:', err.message);
    console.error('❌ Full error:', err);
    throw err;
  }
};
