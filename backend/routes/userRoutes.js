const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth'); // JWT auth middleware

// ✅ FIXED: Add auth middleware to subusers routes
// POST: Add a subusers (requires authentication)
router.post('/add-subusers', auth, userController.addsubusers);

// GET: Get subuserss for a main user (requires authentication)
// CHANGED: From '/subuserss' to '/subusers' to match frontend call
router.get('/subusers', auth, userController.getsubuserss);

// ✅ NEW: Get user details by user_id
router.get('/user-details/:userId', auth, userController.getUserDetails);

// POST: Assign device to subusers
router.post('/assign-device', auth, userController.assignDevice);

// POST: Send OTP email to subusers (no auth needed for OTP sending)
router.post('/send-subusers-otp', userController.sendsubusersOtp);

module.exports = router;