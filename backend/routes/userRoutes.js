const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// POST: Add a sub_user
router.post('/add-sub_user', userController.addsub_user);

// GET: Get sub_users for a main user
router.get('/sub_users', userController.getsub_users);

// POST: Assign device to sub_user
router.post('/assign-device', userController.assignDevice);

module.exports = router;
