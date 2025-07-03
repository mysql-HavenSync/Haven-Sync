const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


// Route to handle feedback email sending
router.post('/send-feedback-email', upload.array('attachments', 5), async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    
    // Prepare email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to || 'feedback@hexahavenintegrations.com',
      subject: subject || 'App Feedback',
      text: body,
      attachments: []
    };

    // Add attachments if any
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        mailOptions.attachments.push({
          filename: file.originalname || `attachment_${index + 1}`,
          content: file.buffer,
          contentType: file.mimetype
        });
      });
    }

    // Send email
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ 
      message: 'Feedback email sent successfully',
      success: true 
    });
  } catch (error) {
    console.error('Error sending feedback email:', error);
    res.status(500).json({ 
      message: 'Failed to send feedback email',
      error: error.message 
    });
  }
});

module.exports = router;