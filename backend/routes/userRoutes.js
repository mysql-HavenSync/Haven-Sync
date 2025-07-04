const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth'); // JWT auth middleware

// ✅ FIXED: Add auth middleware to subusers routes
// POST: Add a subusers (requires authentication)
router.post('/add-subusers', auth, userController.addsubusers);

// GET: Get subusers for a main user (requires authentication)
// CHANGED: From '/subusers' to '/subusers' to match frontend call
router.get('/subusers', auth, userController.getsubusers);

// ✅ NEW: Delete/Remove subuser endpoint
router.delete('/subusers/:userId', auth, userController.removeSubuser);

// ✅ NEW: Get user details by user_id
console.log('🧪 typeof auth:', typeof auth); // should be 'function'
console.log('🧪 typeof getUserDetails:', typeof userController.getUserDetails); // should be 'function'
router.get('/user-details/:userId', auth, userController.getUserDetails);

// POST: Assign device to subusers
router.post('/assign-device', auth, userController.assignDevice);

// POST: Send OTP email to subusers (no auth needed for OTP sending)
router.post('/send-subusers-otp', userController.sendsubusersOtp);

module.exports = router;