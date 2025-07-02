const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth'); // JWT auth middleware


// POST: Add a sub_user
router.post('/add-sub_user', userController.addsub_user);

// GET: Get sub_users for a main user
router.get('/sub_users', userController.getsub_users);

// POST: Assign device to sub_user
router.post('/assign-device', userController.assignDevice);

// ✅ POST: Send OTP email to sub_user
router.post('/send-subuser-otp', userController.sendSubUserOtp);  // 👈 Add this line

module.exports = router;
