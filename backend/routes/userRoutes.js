const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth'); // JWT auth middleware

// ✅ FIXED: Add auth middleware to sub_user routes
// POST: Add a sub_user (requires authentication)
router.post('/add-sub_user', auth, userController.addsub_user);

// GET: Get sub_users for a main user (requires authentication)
router.get('/sub_users', auth, userController.getsub_users);

// POST: Assign device to sub_user
router.post('/assign-device', auth, userController.assignDevice);

// POST: Send OTP email to sub_user (no auth needed for OTP sending)
router.post('/send-subuser-otp', userController.sendSubUserOtp);

module.exports = router;