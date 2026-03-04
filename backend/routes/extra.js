const express = require('express');
const router = express.Router();
const extraController = require('../controllers/extraController');
const authorize = require('../middleware/auth');

// Public routes
router.get('/events', extraController.getEvents);
router.post('/newsletter', extraController.subscribeNewsletter);

// Protected routes (Admin only)
router.post('/events', authorize(['Admin']), extraController.createEvent);

module.exports = router;
