const nodemailer = require('nodemailer');

module.exports = async function sendMail(to, message) {
  if (process.env.NODE_ENV === 'production') {
    // ✅ Real email sending
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: 'HavenSync OTP',
      text: message,
    });

    console.log(`✅ Email sent to ${to}`);
  } else {
    // 🧪 Development mode (mock only)
    console.log(`📩 MOCK EMAIL → ${to}`);
    console.log(`📝 Message: ${message}`);
  }
};
