// controllers/feedbackController.js
const Feedback = require('../models/Feedback'); // Adjust path as needed
const User = require('../models/User'); // If you want to associate with users

const feedbackController = {
  // Submit feedback
  submitFeedback: async (req, res) => {
    try {
      const { rating, feedback, platform, version, hasAttachments, attachmentCount } = req.body;
      
      // Validate required fields
      if (!feedback || feedback.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'Feedback text is required' 
        });
      }

      // Optional: Get user ID if authenticated
      const userId = req.user?.id || null;

      // Create feedback record
      const newFeedback = new Feedback({
        userId,
        rating: rating || 0,
        feedback: feedback.trim(),
        platform,
        version,
        hasAttachments,
        attachmentCount,
        timestamp: new Date(),
        status: 'pending', // pending, reviewed, resolved
      });

      const savedFeedback = await newFeedback.save();

      // Optional: Send notification email to admin
      // await sendFeedbackNotification(savedFeedback);

      res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully',
        feedbackId: savedFeedback._id
      });

    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit feedback',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get all feedback (admin only)
  getAllFeedback: async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;
      
      const query = status ? { status } : {};
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { timestamp: -1 },
        populate: 'userId', // If you want user details
      };

      const feedback = await Feedback.paginate(query, options);
      
      res.json({
        success: true,
        data: feedback
      });
    } catch (error) {
      console.error('Error fetching feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback'
      });
    }
  },

  // Get feedback by user (if authenticated)
  getUserFeedback: async (req, res) => {
    try {
      const userId = req.user.id;
      const feedback = await Feedback.find({ userId }).sort({ timestamp: -1 });
      
      res.json({
        success: true,
        data: feedback
      });
    } catch (error) {
      console.error('Error fetching user feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback'
      });
    }
  },

  // Update feedback status (admin only)
  updateFeedbackStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const feedback = await Feedback.findByIdAndUpdate(
        id,
        { status, adminNotes, updatedAt: new Date() },
        { new: true }
      );

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }

      res.json({
        success: true,
        message: 'Feedback status updated',
        data: feedback
      });
    } catch (error) {
      console.error('Error updating feedback:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update feedback'
      });
    }
  }
};

module.exports = feedbackController;

// ============================================

// routes/feedbackRoutes.js
const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middleware/authMiddleware'); // Adjust path
const adminMiddleware = require('../middleware/adminMiddleware'); // If you have admin middleware

// Public route - submit feedback (can be used without auth)
router.post('/submit', feedbackController.submitFeedback);

// Protected routes - require authentication
router.get('/my-feedback', authMiddleware, feedbackController.getUserFeedback);

// Admin routes - require admin privileges
router.get('/all', authMiddleware, adminMiddleware, feedbackController.getAllFeedback);
router.patch('/:id/status', authMiddleware, adminMiddleware, feedbackController.updateFeedbackStatus);

module.exports = router;

// ============================================

// models/Feedback.js (MongoDB/Mongoose example)
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous feedback
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  feedback: {
    type: String,
    required: true,
    trim: true
  },
  platform: {
    type: String,
    enum: ['ios', 'android', 'web'],
    required: true
  },
  version: {
    type: String,
    required: true
  },
  hasAttachments: {
    type: Boolean,
    default: false
  },
  attachmentCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

feedbackSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Feedback', feedbackSchema);

// ============================================

// Add to your main app.js or server.js
// const feedbackRoutes = require('./routes/feedbackRoutes');
// app.use('/api/feedback', feedbackRoutes);

// ============================================

// middleware/adminMiddleware.js (if you don't have it)
const adminMiddleware = (req, res, next) => {
  try {
    // Check if user is admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = adminMiddleware;

// ============================================

// Example usage in your main server file
/*
const express = require('express');
const feedbackRoutes = require('./routes/feedbackRoutes');

const app = express();

// Your existing middleware
app.use(express.json());

// Your existing routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Add feedback routes
app.use('/api/feedback', feedbackRoutes);
*/