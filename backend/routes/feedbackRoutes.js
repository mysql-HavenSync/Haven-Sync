const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const multer = require('multer');

// Storage for attachments
const storage = multer.memoryStorage();
const upload = multer({ storage });

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP connection failed:', error);
  } else {
    console.log('✅ SMTP server is ready to take messages');
  }
});

// ✅ SMTP config using existing feedback sender
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com', // or use a valid SMTP host
  port: 465,
  secure: true, // upgrade later with STARTTLS
  auth: {
    user: process.env.EMAIL_USER, // SMTP_USER
    pass: process.env.EMAIL_PASS  // SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// ✅ Feedback route
router.post('/send-feedback-email', upload.array('attachments', 5), async (req, res) => {
  try {
    const { to, subject, body, user } = req.body;

    if (!user || !user.email || !user.name) {
      return res.status(400).json({ message: 'Missing user details' });
    }

    const message = `
📝 Feedback from HavenSync App

👤 User Details:
- Name: ${user.name}
- Email: ${user.email}
- User ID: ${user.user_id || 'N/A'}
- Role: ${user.role || 'N/A'}

⭐ Rating: ${user.rating || 'Not rated'}
📝 Feedback:
${body}

📱 Device Info:
- Platform: ${user.platform || 'unknown'}
- Version: ${user.version || 'unknown'}
- Time: ${new Date().toISOString()}
`;

    const mailOptions = {
      from: `"HavenSync App" <${process.env.EMAIL_USER}>`,
      to: to || 'feedback@hexahavenintegrations.com',
      subject: subject || 'New Feedback Submission',
      text: message,
      replyTo: user.email,
      attachments: []
    };

    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        mailOptions.attachments.push({
          filename: file.originalname || `attachment_${index + 1}`,
          content: file.buffer,
          contentType: file.mimetype
        });
      });
    }

    await transporter.sendMail(mailOptions);

    console.log('✅ Feedback email sent from:', user.email);
    res.status(200).json({ success: true, message: 'Feedback sent successfully' });

  } catch (error) {
    console.error('❌ Error sending feedback:', error.message);
    res.status(500).json({ success: false, message: 'Failed to send feedback', error: error.message });
  }
});

module.exports = router;
